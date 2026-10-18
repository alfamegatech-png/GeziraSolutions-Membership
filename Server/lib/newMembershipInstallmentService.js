import crypto from "crypto";
import { getPaymentClock } from "./paymentClock";
import { moneyCents, installmentSchedule, quoteInstallments, activationPeriod, latePenalty } from "./newMembershipInstallments";
import { newMembershipFees } from "./newMembershipInstallmentFees";
import { DEFAULT_PRICE_SETTINGS_MAP } from "@components/MembershipPrices/priceSettingsConfig";
import { InvoiceWithTransaction } from "@components/Members/member";

const PENDING = ["awaiting_deposit", "pending"];
function plain(value) { return JSON.parse(JSON.stringify(value, (key, item) => typeof item === "bigint" ? Number(item) : item)); }
function validId(value) { if (typeof value !== "string" || !/^[a-f0-9-]{36}$/i.test(value)) throw new Error("رقم العملية غير صحيح"); return value; }
function actorCheck(actor) { if (!actor?.id || !Number.isInteger(actor.safe_no) || actor.safe_no <= 0) throw new Error("المستخدم غير مصرح له بالتحصيل"); }
async function prices(db) {
  const rows = await db.$queryRaw`SELECT setting_key, value FROM public.membership_price_settings`;
  return { ...DEFAULT_PRICE_SETTINGS_MAP, ...Object.fromEntries(rows.map((row) => [row.setting_key, Number(row.value)])) };
}
async function eligibleMember(db, memberCode) {
  if (!Number.isInteger(memberCode) || memberCode <= 0) throw new Error("رقم العضوية غير صحيح");
  const member = await db.members.findUnique({ where: { member_code: memberCode }, include: {
    rel_member_type: { select: { name: true, price: true } }, rel_members: { include: { rel_ref: true } },
    membership: { where: { canceled: 0 }, select: { start_date: true, end_date: true, join_fee: true, first_time_fee: true, installment: true } },
  } });
  if (!member) throw new Error("العضو غير موجود؛ أضف بيانات العضو والتابعين أولًا");
  if (member.suspended !== "-") throw new Error("راجع حالة إيقاف العضو قبل التعاقد");
  if (member.membership.some((row) => (row.start_date && row.end_date) || row.join_fee > 0 || row.first_time_fee > 0 || row.installment > 0)) throw new Error("هذه الدورة للعضوية الجديدة غير المسددة فقط وليست لتقسيط التجديد");
  const contracts = await db.$queryRaw`SELECT id FROM public.membership_installment_contracts WHERE member_id = ${member.id} AND status <> 'cancelled' LIMIT 1`;
  if (contracts.length) throw new Error("للعضو عقد تقسيط قائم بالفعل");
  return member;
}
export async function previewContract(db, input, now = new Date()) {
  const clock = getPaymentClock(now);
  const applicationDate = clock.receiptDate.toISOString().slice(0, 10);
  const price = moneyCents(input.price), deposit = moneyCents(input.deposit);
  const schedule = installmentSchedule(price, deposit, input.frequency, applicationDate);
  const member = await eligibleMember(db, Number(input.memberCode));
  const fees = newMembershipFees(member, await prices(db), applicationDate, price);
  return { member: { id: member.id, member_code: member.member_code, name: member.name }, price_cents: price,
    deposit_cents: deposit, balance_cents: price - deposit, fees: { ...fees, original_member_type: member.member_type },
    upfront_cents: deposit + fees.total_cents, application_date: applicationDate, frequency: input.frequency, schedule };
}
export async function createContract(db, actor, input, now = new Date()) {
  if (!actor?.id) throw new Error("المستخدم غير مصرح له بالتعاقد");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM public.members WHERE member_code = ${Number(input.memberCode)} FOR UPDATE`;
    const preview = await previewContract(tx, input, now);
    if (preview.upfront_cents !== input.expectedUpfrontCents) throw new Error("تغيرت رسوم التعاقد؛ راجع المعاينة قبل الحفظ");
    const id = crypto.randomUUID();
    await tx.$executeRaw`
      INSERT INTO public.membership_installment_contracts
      (id, member_id, price_cents, deposit_cents, extras_cents, fee_snapshot, frequency, application_date, created_by)
      VALUES (${id}, ${preview.member.id}, ${preview.price_cents}, ${preview.deposit_cents}, ${preview.fees.total_cents},
      ${JSON.stringify(preview.fees)}::jsonb, ${input.frequency}, ${preview.application_date}::date, ${actor.id})
    `;
    for (const item of preview.schedule) await tx.$executeRaw`
      INSERT INTO public.membership_installment_items (id, contract_id, number, due_date, principal_cents)
      VALUES (${crypto.randomUUID()}, ${id}, ${item.number}, ${item.due_date}::date, ${item.principal_cents})
    `;
    return { id };
  });
}
async function contractRow(db, id, lock = false) {
  validId(id);
  const rows = lock ? await db.$queryRaw`SELECT * FROM public.membership_installment_contracts WHERE id = ${id} FOR UPDATE`
    : await db.$queryRaw`SELECT * FROM public.membership_installment_contracts WHERE id = ${id}`;
  if (!rows[0]) throw new Error("عقد التقسيط غير موجود");
  return plain(rows[0]);
}
async function itemsFor(db, id) {
  return plain(await db.$queryRaw`SELECT * FROM public.membership_installment_items WHERE contract_id = ${id} ORDER BY number`)
    .map((row) => ({ ...row, due_date: row.due_date.slice(0, 10) }));
}
export async function contractDetail(db, id, now = new Date()) {
  const contract = await contractRow(db, id);
  const member = await db.members.findUnique({ where: { id: contract.member_id }, select: { id: true, member_code: true, name: true } });
  const items = await itemsFor(db, id);
  const paymentDate = getPaymentClock(now).receiptDate.toISOString().slice(0, 10);
  const payments = plain(await db.$queryRaw`
    SELECT p.*, r.serial_no, u.fullname AS cashier_name FROM public.membership_installment_payments p
    JOIN public.memberships r ON r.id = p.receipt_id JOIN public.users u ON u.id = p.user_id
    WHERE p.contract_id = ${id} ORDER BY p.paid_at DESC, r.serial_no DESC
  `);
  return { ...contract, member, items: items.map((item) => ({ ...item, penalty: latePenalty(item, paymentDate) })), payments,
    payment_date: paymentDate, outstanding_cents: items.filter((item) => !item.paid_payment_id).reduce((sum, item) => sum + item.principal_cents, 0),
    outstanding_penalty_cents: items.reduce((sum, item) => sum + latePenalty(item, paymentDate).cents, 0) };
}
export async function listContracts(db, search = "", status = "", page = 0) {
  const term = String(search).trim().slice(0, 100);
  if (!["", "awaiting_deposit", "pending", "active", "cancelled"].includes(status)) throw new Error("حالة غير صحيحة");
  const offset = Math.max(0, Math.min(1000000, Math.floor(Number(page) || 0))) * 20;
  return plain(await db.$queryRaw`
    SELECT c.id, c.status, c.frequency, c.application_date, c.price_cents, c.deposit_cents, c.extras_cents,
      m.member_code, m.name,
      (SELECT COALESCE(SUM(i.principal_cents),0) FROM public.membership_installment_items i WHERE i.contract_id = c.id AND i.paid_payment_id IS NULL) AS remaining_cents
    FROM public.membership_installment_contracts c JOIN public.members m ON m.id = c.member_id
    WHERE (${term} = '' OR m.member_code::text = ${term} OR m.name ILIKE ${'%' + term + '%'})
      AND (${status} = '' OR c.status = ${status})
    ORDER BY c.created_at DESC, c.id LIMIT 20 OFFSET ${offset}
  `);
}
function paymentQuote(contract, items, kind, count, paymentDate) {
  if (kind === "deposit") {
    if (contract.status !== "awaiting_deposit") throw new Error("المقدم مسدد بالفعل أو العقد غير متاح");
    return { principal_cents: contract.deposit_cents, extras_cents: contract.extras_cents, penalty_cents: 0,
      total_cents: contract.deposit_cents + contract.extras_cents, items: [] };
  }
  if (kind !== "installment" || contract.status !== "pending") throw new Error("سدد المقدم أولًا أو راجع حالة العقد");
  return { ...quoteInstallments(items, Number(count), paymentDate), extras_cents: 0 };
}
export async function quotePayment(db, id, kind, count, now = new Date()) {
  const contract = await contractRow(db, id);
  return paymentQuote(contract, await itemsFor(db, id), kind, count, getPaymentClock(now).receiptDate.toISOString().slice(0, 10));
}
async function receipt(db, actor, member, contract, quote, kind, clock) {
  const extras = kind === "deposit" ? contract.fee_snapshot : {};
  const values = {
    member_code: member.member_code, user_id: actor.id, safe_no: actor.safe_no,
    member_order_date: clock.receiptDate, member_order_time: clock.instant, status: 5, secondary: 0,
    remark: `[NMI:${contract.id}] ${kind === "deposit" ? "مقدم عضوية جديدة" : "أقساط عضوية جديدة"}`,
    installment: quote.principal_cents / 100, delay_penalty: quote.penalty_cents / 100,
    renew_fee: Number(extras.renew_fee || 0) / 100, maintenance_fee: Number(extras.maintenance_fee || 0) / 100,
    membership_card_fee: Number(extras.membership_card_fee || 0) / 100,
    fellowship_fund_fee: Number(extras.fellowship_fund_fee || 0) / 100,
    value_added_tax: Number(extras.value_added_tax || 0) / 100,
    total_amount: quote.total_cents / 100,
  };
  const row = await db.memberships.create({ data: values });
  const entries = [
    ["installment_ACCOUNT", values.installment], ["delay_penalty_ACCOUNT", values.delay_penalty],
    ["renew_fee_ACCOUNT", values.renew_fee], ["maintenance_fee_ACCOUNT", values.maintenance_fee],
    ["membership_card_fee_ACCOUNT", values.membership_card_fee],
    [process.env.fellowship_fund_ACCOUNT ? "fellowship_fund_ACCOUNT" : "renew_fee_ACCOUNT", values.fellowship_fund_fee],
    ["value_added_tax_ACCOUNT", values.value_added_tax],
  ];
  const invoice = await InvoiceWithTransaction({ safeNumber: String(actor.safe_no), receiptNumber: row.serial_no,
    debit: { totalPrice: values.total_amount }, Credits: entries.map(([key, money]) => ({ accountNumberId: process.env[key], money })),
  }, actor.id, db, clock.instant);
  if (invoice.status !== "success") throw new Error("تعذر إنشاء القيد المحاسبي؛ لم يتم تسجيل التحصيل");
  return row;
}
export async function collectPayment(db, actor, input, now = new Date()) {
  actorCheck(actor); validId(input.requestKey);
  return db.$transaction(async (tx) => {
    const contract = await contractRow(tx, input.contractId, true);
    const repeated = await tx.$queryRaw`SELECT contract_id, user_id, id FROM public.membership_installment_payments WHERE request_key = ${input.requestKey}`;
    if (repeated.length) {
      if (repeated[0].contract_id !== contract.id || repeated[0].user_id !== actor.id) throw new Error("رقم طلب التحصيل مستخدم بالفعل");
      return { id: contract.id, paymentId: repeated[0].id };
    }
    const clock = getPaymentClock(now);
    const items = await itemsFor(tx, contract.id);
    const quote = paymentQuote(contract, items, input.kind, input.count, clock.receiptDate.toISOString().slice(0, 10));
    if (input.kind === "installment" && JSON.stringify(input.expectedNumbers) !== JSON.stringify(quote.items.map((item) => item.number))) throw new Error("تغيرت الأقساط المطلوب تحصيلها؛ حدّث المعاينة قبل السداد");
    if (!Number.isSafeInteger(input.expectedTotalCents) || input.expectedTotalCents !== quote.total_cents) throw new Error("تغير مبلغ التحصيل أو غرامة اليوم؛ حدّث المعاينة ثم أكد السداد");
    const member = await tx.members.findUnique({ where: { id: contract.member_id }, select: { id: true, member_code: true, member_type: true, suspended: true } });
    if (!member || member.suspended !== "-") throw new Error("راجع حالة إيقاف العضو قبل التحصيل");
    const paymentId = crypto.randomUUID();
    const paymentReceipt = await receipt(tx, actor, member, contract, quote, input.kind, clock);
    const allocations = quote.items.map((item) => ({ number: item.number, principal_cents: item.principal_cents, penalty_days: item.penalty.days, penalty_cents: item.penalty.cents, due_date: item.due_date }));
    await tx.$executeRaw`
      INSERT INTO public.membership_installment_payments
      (id, contract_id, receipt_id, kind, principal_cents, extras_cents, penalty_cents, amount_cents, allocations, payment_date, paid_at, user_id, safe_no, request_key)
      VALUES (${paymentId}, ${contract.id}, ${paymentReceipt.id}, ${input.kind}, ${quote.principal_cents}, ${quote.extras_cents}, ${quote.penalty_cents}, ${quote.total_cents},
      ${JSON.stringify(allocations)}::jsonb, ${clock.receiptDate}::date, ${clock.instant}, ${actor.id}, ${actor.safe_no}, ${input.requestKey})
    `;
    for (const item of quote.items) await tx.$executeRaw`
      UPDATE public.membership_installment_items SET paid_payment_id = ${paymentId}, paid_at = ${clock.instant}, paid_penalty_cents = ${item.penalty.cents}
      WHERE id = ${item.id} AND paid_payment_id IS NULL
    `;
    const remaining = items.filter((item) => !item.paid_payment_id).length - quote.items.length;
    const activate = input.kind === "installment" && remaining === 0;
    if (activate) {
      await tx.memberships.update({ where: { id: paymentReceipt.id }, data: { status: 1, ...activationPeriod(clock.receiptDate.toISOString().slice(0, 10)), renew_years: 1 } });
      if (member.member_type === 9) await tx.members.update({ where: { id: member.id }, data: { member_type: 5 } });
    }
    await tx.$executeRaw`UPDATE public.membership_installment_contracts SET status = ${activate ? 'active' : 'pending'}, activated_at = ${activate ? clock.instant : null} WHERE id = ${contract.id}`;
    return { id: contract.id, paymentId };
  });
}
export async function voidPayment(db, actor, contractId, paymentId, reason, now = new Date()) {
  actorCheck(actor); validId(paymentId);
  if (typeof reason !== "string" || reason.trim().length < 5 || reason.length > 500) throw new Error("اكتب سبب الإلغاء بوضوح");
  return db.$transaction(async (tx) => {
    const contract = await contractRow(tx, contractId, true);
    const payments = plain(await tx.$queryRaw`
      SELECT p.*, r.serial_no FROM public.membership_installment_payments p JOIN public.memberships r ON r.id = p.receipt_id
      WHERE p.contract_id = ${contractId} AND p.status = 'posted' ORDER BY p.paid_at DESC, r.serial_no DESC
    `);
    const payment = payments.find((row) => row.id === paymentId);
    if (!payment) throw new Error("الدفعة غير موجودة أو ملغاة");
    if (payments[0].id !== payment.id) throw new Error("يجب إلغاء أحدث دفعة أولًا");
    if (payment.safe_no !== actor.safe_no) throw new Error("إلغاء التحصيل من نفس الخزينة فقط");
    if (contract.status === "active") {
      const member = await tx.members.findUnique({ where: { id: contract.member_id }, select: { member_code: true } });
      const later = await tx.memberships.findFirst({ where: { member_code: member.member_code, id: { not: payment.receipt_id }, canceled: 0, status: 1, start_date: { not: null }, end_date: { not: null } }, select: { id: true } });
      if (later) throw new Error("يوجد تجديد مستقل بعد التفعيل؛ راجع الحسابات قبل إلغاء هذا التحصيل");
      if (contract.fee_snapshot.original_member_type === 9) await tx.members.update({ where: { id: contract.member_id }, data: { member_type: 9 } });
    }
    const clock = getPaymentClock(now);
    const reversed = await tx.transactions.updateMany({ where: { ReceiptNumber: payment.serial_no, Canceled: false }, data: { Canceled: true, CancelByMembershipUser: actor.id, CancelAt: clock.instant } });
    if (reversed.count !== 1) throw new Error("القيد المالي غير متاح للإلغاء الآمن");
    await tx.memberships.update({ where: { id: payment.receipt_id }, data: { canceled: 1, status: 4, start_date: null, end_date: null, remark: `إلغاء تحصيل تقسيط: ${reason.trim()}` } });
    await tx.$executeRaw`UPDATE public.membership_installment_items SET paid_payment_id = NULL, paid_at = NULL, paid_penalty_cents = 0 WHERE paid_payment_id = ${payment.id}`;
    await tx.$executeRaw`UPDATE public.membership_installment_payments SET status = 'void', void_by = ${actor.id}, void_at = ${clock.instant}, void_reason = ${reason.trim()} WHERE id = ${payment.id}`;
    await tx.$executeRaw`UPDATE public.membership_installment_contracts SET status = ${payment.kind === 'deposit' ? 'awaiting_deposit' : 'pending'}, activated_at = NULL WHERE id = ${contract.id}`;
    return { id: contract.id };
  });
}
export async function cancelContract(db, actor, id, now = new Date()) {
  if (!actor?.id) throw new Error("المستخدم غير مصرح له بإلغاء العقد");
  return db.$transaction(async (tx) => {
    const contract = await contractRow(tx, id, true);
    if (!PENDING.includes(contract.status)) throw new Error("العقد غير متاح للإلغاء");
    const paid = await tx.$queryRaw`SELECT id FROM public.membership_installment_payments WHERE contract_id = ${id} AND status = 'posted' LIMIT 1`;
    if (paid.length) throw new Error("ألغ التحصيلات من الأحدث للأقدم قبل إلغاء العقد");
    await tx.$executeRaw`UPDATE public.membership_installment_contracts SET status = 'cancelled', cancelled_at = ${getPaymentClock(now).instant}, cancelled_by = ${actor.id} WHERE id = ${id}`;
    return { id };
  });
}
