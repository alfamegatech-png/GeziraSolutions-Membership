export const FREQUENCIES = { monthly: { count: 12, months: 1 }, quarterly: { count: 4, months: 3 }, semiannual: { count: 2, months: 6 } };

export function moneyCents(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("أدخل مبلغًا صحيحًا بحد أقصى منزلتين عشريتين");
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 1000000000000) throw new Error("المبلغ خارج الحدود المسموحة");
  return cents;
}

export function dateOnly(value) {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("تاريخ غير صحيح");
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new Error("تاريخ غير صحيح");
  return text;
}

export function installmentSchedule(priceCents, depositCents, frequency, applicationDate) {
  const policy = Object.hasOwn(FREQUENCIES, frequency) ? FREQUENCIES[frequency] : null;
  if (!policy) throw new Error("نوع التقسيط غير صحيح");
  if (!Number.isSafeInteger(priceCents) || !Number.isSafeInteger(depositCents) || depositCents < 2000000 || depositCents >= priceCents) throw new Error("المقدم لا يقل عن 20,000 جنيه ويجب أن يكون أقل من ثمن العضوية");
  const date = new Date(`${dateOnly(applicationDate)}T00:00:00.000Z`);
  const balance = priceCents - depositCents;
  if (balance < policy.count) throw new Error("المتبقي لا يكفي لتوزيع الأقساط بالجنيه والقرش");
  const base = Math.floor(balance / policy.count);
  return Array.from({ length: policy.count }, (_, index) => ({
    number: index + 1,
    due_date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1 + index * policy.months, 1)).toISOString().slice(0, 10),
    principal_cents: index === policy.count - 1 ? balance - base * index : base,
  }));
}

export function latePenalty(item, paymentDate) {
  if (item.paid_payment_id) return { days: 0, cents: 0 };
  const difference = Math.floor((new Date(`${dateOnly(paymentDate)}T00:00:00Z`) - new Date(`${dateOnly(item.due_date)}T00:00:00Z`)) / 86400000) + 1;
  const days = difference > 10 ? difference : 0;
  const cents = Number((BigInt(item.principal_cents) * 20n * BigInt(days) + 18000n) / 36000n);
  return { days, cents };
}

export function quoteInstallments(items, count, paymentDate) {
  const unpaid = items.filter((item) => !item.paid_payment_id).sort((a, b) => a.number - b.number);
  if (!Number.isInteger(count) || count < 1 || count > unpaid.length) throw new Error("عدد الأقساط المطلوب سدادها غير صحيح");
  const selected = unpaid.slice(0, count).map((item) => ({ ...item, penalty: latePenalty(item, paymentDate) }));
  const principal_cents = selected.reduce((sum, item) => sum + Number(item.principal_cents), 0);
  const penalty_cents = selected.reduce((sum, item) => sum + item.penalty.cents, 0);
  return { items: selected, principal_cents, penalty_cents, total_cents: principal_cents + penalty_cents };
}

export function activationPeriod(paymentDate) {
  const date = new Date(`${dateOnly(paymentDate)}T00:00:00Z`);
  return { start_date: date, end_date: new Date(Date.UTC(date.getUTCFullYear() + (date.getUTCMonth() >= 6 ? 1 : 0), 5, 30)) };
}

export function splitVat(grossCents, rate) {
  const net_cents = Math.round(grossCents / (1 + Number(rate)));
  return { net_cents, vat_cents: grossCents - net_cents };
}
