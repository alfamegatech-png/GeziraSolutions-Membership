"use client";
import React, { useEffect, useRef, useState, forwardRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { Dialog } from "primereact/dialog";
import { useReactToPrint } from "react-to-print";
import { installmentReceiptColumns } from "@lib/installmentReceiptLayout";
import { previewAgreement, saveAgreement, searchAgreements, getAgreement, getPaymentQuote, postPayment, cancelPayment, closeAgreement } from "./actions";
import "./installments.css";

const modes = { monthly: "شهري", quarterly: "ربع سنوي", semiannual: "نصف سنوي" };
const statuses = { awaiting_deposit: "بانتظار المقدم - غير مفعلة", pending: "تحت التقسيط - غير مفعلة", active: "مفعلة - مكتملة السداد", cancelled: "عقد ملغي" };
const money = (cents) => (Number(cents || 0) / 100).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (date) => date ? new Date(date).toLocaleDateString("ar-EG", { timeZone: "UTC" }) : "-";
const feeNames = { renew_fee: "تجديد العضو والتابعين", maintenance_fee: "الصيانة", membership_card_fee: "الكارنيهات", fellowship_fund_fee: "صندوق الزمالة", membership_vat_cents: "ضريبة ثمن العضوية", annual_vat_cents: "ضريبة الصيانة والكارنيهات" };

function Schedule({ rows, printable = false }) {
  return <div className="nmi-table-scroll"><table><thead><tr><th>القسط</th><th>الاستحقاق</th><th>قيمة القسط</th>{!printable && <><th>أيام الغرامة</th><th>الغرامة</th><th>الحالة</th></>}</tr></thead>
    <tbody>{rows.map((row) => <tr key={row.number}><td>{row.number}</td><td>{day(row.due_date)}</td><td>{money(row.principal_cents)}</td>{!printable && <><td>{row.paid_payment_id ? "-" : row.penalty?.days || 0}</td><td>{money(row.paid_payment_id ? row.paid_penalty_cents : row.penalty?.cents)}</td><td>{row.paid_payment_id ? "مسدد" : row.penalty?.days ? "متأخر" : "غير مسدد"}</td></>}</tr>)}</tbody></table></div>;
}

const Paper = forwardRef(function Paper({ contract, payment }, ref) {
  if (payment) {
    const columns = installmentReceiptColumns(contract, payment);
    const vat = columns.find((column) => column.label === "قيمة مضافة").cents;
    return <article ref={ref} className="nmi-paper nmi-receipt-paper" dir="rtl">
      {[0, 1, 2].map((copy) => <section className="nmi-receipt-copy" key={copy}>
        <div className="nmi-receipt-heading"><div>محافظة القاهرة<br />وزارة الشباب والرياضة<br />مركز التنمية الشبابية بالجزيرة</div><img src="/logo.png" width="48" height="48" alt="شعار المركز" /></div>
        <div className="nmi-receipt-title">إذن دفع رقم <bdi>{`${payment.safe_no ?? ""}${payment.serial_no}`}</bdi></div>
        <div className="nmi-receipt-title">إيصال تحصيل تقسيط عضوية جديدة — {payment.kind === "deposit" ? "مقدم العضوية" : "سداد أقساط"}</div>
        {payment.status === "void" && <strong className="nmi-void">إيصال ملغي</strong>}
        <div className="nmi-receipt-meta"><span>الاسم / {contract.member.name}</span><span>رقم العضوية / {contract.member.member_code}</span></div>
        <div className="nmi-receipt-grid"><table><thead><tr><th>البيان</th>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody><tr><th>القيمة</th>{columns.map((column) => <td key={column.label}>{money(column.cents)}</td>)}</tr></tbody></table></div>
        <div className="nmi-receipt-meta"><span>إجمالي قبل القيمة المضافة: {money(payment.amount_cents - vat)}</span><span>ضريبة قيمة مضافة: {money(vat)}</span><span>توقيع مسئول العضوية: ................</span></div>
        <div className="nmi-receipt-meta"><strong>الإجمالي العام: {money(payment.amount_cents)} جنيه</strong><span>توقيع المراجع: ................</span></div>
        <div className="nmi-receipt-meta"><span>تاريخ الإيصال: {day(payment.payment_date)}</span><span>الخزينة: {payment.safe_no ?? "-"}</span><span>المحصل: {payment.cashier_name || "-"}</span></div>
        {payment.allocations.length > 0 && <p className="nmi-receipt-allocation">الأقساط المسددة: {payment.allocations.map((row) => `${row.number} (استحقاق ${day(row.due_date)}، أيام التأخير ${row.penalty_days})`).join(" — ")}</p>}
        {payment.void_reason && <p>سبب الإلغاء: {payment.void_reason}</p>}
      </section>)}
    </article>;
  }
  return <article ref={ref} className="nmi-paper" dir="rtl">
    <header><img src="/logo.png" width="64" height="64" alt="شعار المركز" /><div><h2>مركز التنمية الشبابية بالجزيرة</h2><h3>{payment ? "إيصال تحصيل تقسيط عضوية جديدة" : "عقد وجدول تقسيط عضوية جديدة"}</h3></div></header>
    {payment?.status === "void" && <h2 className="nmi-void">إيصال ملغي</h2>}
    <p>العضو: {contract.member.name} | رقم العضوية: {contract.member.member_code}</p>
    <p className="nmi-id">العقد: {contract.id}</p>
    {payment ? <>
      <p>رقم الإيصال: {payment.serial_no} | الخزينة: {payment.safe_no} | التاريخ: {day(payment.payment_date)}</p>
      <p>المحصل: {payment.cashier_name || "-"}</p>
      <table><tbody><tr><th>{payment.kind === "deposit" ? "مقدم ثمن العضوية" : "أصل الأقساط"}</th><td>{money(payment.principal_cents)}</td></tr>
        {payment.kind === "deposit" && Object.entries(feeNames).map(([key, label]) => <tr key={key}><th>{label}</th><td>{money(contract.fee_snapshot[key])}</td></tr>)}
        <tr><th>غرامة التأخير</th><td>{money(payment.penalty_cents)}</td></tr><tr><th>الإجمالي المحصل</th><td>{money(payment.amount_cents)} جنيه</td></tr></tbody></table>
      {payment.allocations.length > 0 && <table><thead><tr><th>القسط</th><th>الاستحقاق</th><th>القيمة</th><th>أيام الغرامة</th><th>الغرامة</th></tr></thead><tbody>{payment.allocations.map((row) => <tr key={row.number}><td>{row.number}</td><td>{day(row.due_date)}</td><td>{money(row.principal_cents)}</td><td>{row.penalty_days}</td><td>{money(row.penalty_cents)}</td></tr>)}</tbody></table>}
      {payment.void_reason && <p>سبب الإلغاء: {payment.void_reason}</p>}
    </> : <>
      <p>تاريخ التقديم: {day(contract.application_date)} | النظام: {modes[contract.frequency]}</p>
      <p>ثمن العضوية قبل الضريبة: {money(contract.price_cents)} | المقدم: {money(contract.deposit_cents)}</p>
      <p>الرسوم والضريبة مع المقدم: {money(contract.extras_cents)}</p>
      <Schedule rows={contract.items} printable />
      <p>استحقاق القسط حتى يوم 10 من الشهر، بعد ذلك يتم احتساب غرامة يومية من تاريخ الاستحقاق.</p>
      <p>توقيع العضو: .......................... توقيع الموظف: ..........................</p>
    </>}
  </article>;
});

export default function InstallmentCycle({ contractId }) {
  const router = useRouter();
  const [rows, setRows] = useState([]), [detail, setDetail] = useState(null);
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [newDialog, setNewDialog] = useState(false), [preview, setPreview] = useState(null);
  const [draft, setDraft] = useState({ memberCode: "", price: "", deposit: "20000", frequency: "monthly" });
  const [count, setCount] = useState(1), [quote, setQuote] = useState(null), [requestKey, setRequestKey] = useState("");
  const [paymentKind, setPaymentKind] = useState("installment"), [voidId, setVoidId] = useState(null), [reason, setReason] = useState("");
  const [cancelDialog, setCancelDialog] = useState(false), [paper, setPaper] = useState(null);
  const paperRef = useRef(null), inFlight = useRef(false);
  const print = useReactToPrint({ content: () => paperRef.current, pageStyle: paper?.payment ? "@page { size: A4 landscape; margin: 8mm; }" : "@page { size: A4 portrait; margin: 8mm; }" });
  const loadVersion = useRef(0);
  async function execute(operation, done) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { const result = await operation(); if (!result.ok) setMessage(result.message); else if (done) await done(result.data); }
    catch { setMessage("تعذر الاتصال بالخادم، حاول مرة أخرى"); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function load() {
    const version = ++loadVersion.current;
    const result = contractId ? await getAgreement(contractId) : await searchAgreements(search, status, page);
    if (version !== loadVersion.current) return { ok: true };
    if (!result.ok) { setMessage(result.message); return result; }
    if (contractId) { setDetail(result.data); setCount(1); } else setRows(result.data);
    return result;
  }
  async function showCollectedReceipt(paymentResult) {
    setQuote(null);
    setNotice("تم تسجيل التحصيل بنجاح");
    try {
      const result = await load();
      const payment = result.ok && result.data?.payments.find((row) => row.id === paymentResult.paymentId);
      if (payment) setPaper({ payment });
      else setMessage("تم تسجيل التحصيل، لكن تعذر عرض الإيصال. حدّث الجدول وافتحه من التحصيلات والإيصالات، ولا تعِد الدفع.");
    } catch {
      setMessage("تم تسجيل التحصيل، لكن تعذر تحميل الإيصال. حدّث الجدول وافتحه من التحصيلات والإيصالات، ولا تعِد الدفع.");
    }
  }
  useEffect(() => { load().catch(() => setMessage("تعذر تحميل البيانات")); return () => { loadVersion.current++; }; }, [contractId, page]);
  function change(event) { setDraft((old) => ({ ...old, [event.target.name]: event.target.value })); setPreview(null); }
  function startQuote(kind) { setNotice(""); setPaymentKind(kind); execute(() => getPaymentQuote(contractId, kind, Number(count)), (data) => { setQuote(data); setRequestKey(crypto.randomUUID()); }); }
  const unpaid = detail?.items.filter((item) => !item.paid_payment_id) || [];
  const latestPayment = detail?.payments.find((payment) => payment.status === "posted");
  return <section className="nmi" dir="rtl">
    <div className="nmi-toolbar"><h1>{contractId ? "عقد تقسيط العضوية" : "تقسيط العضوية الجديدة"}</h1><div>
      {contractId ? <Button icon="pi pi-arrow-right" outlined tooltip="رجوع للعقود" aria-label="رجوع للعقود" onClick={() => router.push("/club/new-membership-installments")} /> : <Button permission="installments.create" label="عقد جديد" icon="pi pi-plus" onClick={() => { setPreview(null); setNewDialog(true); }} />}
      <Button icon="pi pi-refresh" outlined tooltip="تحديث" aria-label="تحديث" disabled={busy} onClick={() => execute(load)} />
    </div></div>
    {message && <div className="nmi-error" role="alert">{message}{message.includes("سجل الدخول") && <Link href="/login"> تسجيل الدخول</Link>}</div>}
    {notice && <p role="status">{notice}</p>}
    {!contractId ? <>
      <form className="nmi-search" onSubmit={(event) => { event.preventDefault(); setPage(0); execute(() => searchAgreements(search, status, 0), setRows); }}>
        <label>الاسم / رقم العضوية<input aria-label="بحث عقود التقسيط" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>الحالة<select aria-label="حالة عقد التقسيط" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">الكل</option>{Object.entries(statuses).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
        <Button type="submit" icon="pi pi-search" label="بحث" loading={busy} />
      </form>
      <div className="nmi-table-scroll"><table><thead><tr><th>العضوية</th><th>الاسم</th><th>التقديم</th><th>النظام</th><th>الثمن</th><th>المقدم</th><th>متبقي الأقساط</th><th>الحالة</th><th></th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><td>{row.member_code}</td><td>{row.name}</td><td>{day(row.application_date)}</td><td>{modes[row.frequency]}</td><td>{money(row.price_cents)}</td><td>{money(row.deposit_cents)}</td><td>{money(row.remaining_cents)}</td><td><span className={`nmi-state nmi-${row.status}`}>{statuses[row.status]}</span></td><td><Button icon="pi pi-folder-open" outlined tooltip="فتح العقد" aria-label={`فتح عقد العضوية ${row.member_code}`} onClick={() => router.push(`/club/new-membership-installments/${row.id}`)} /></td></tr>)}{rows.length === 0 && <tr><td colSpan="9">لا توجد عقود مطابقة</td></tr>}</tbody></table></div>
      <div className="nmi-pages"><Button icon="pi pi-angle-right" aria-label="الصفحة السابقة" outlined disabled={page === 0 || busy} onClick={() => setPage(page - 1)} /><span>{page + 1}</span><Button icon="pi pi-angle-left" aria-label="الصفحة التالية" outlined disabled={rows.length < 20 || busy} onClick={() => setPage(page + 1)} /></div>
    </> : detail && <>
      <div className="nmi-member"><strong>{detail.member.name}</strong><Link href={`/club/members/${encodeURIComponent(detail.member.id)}`}>عضوية {detail.member.member_code}</Link><span className={`nmi-state nmi-${detail.status}`}>{statuses[detail.status]}</span><Button permission="receipts.print" icon="pi pi-print" outlined tooltip="طباعة العقد والجدول" aria-label="طباعة العقد والجدول" onClick={() => setPaper({})} /></div>
      <dl className="nmi-summary"><div><dt>الثمن قبل الضريبة</dt><dd>{money(detail.price_cents)}</dd></div><div><dt>المقدم</dt><dd>{money(detail.deposit_cents)}</dd></div><div><dt>رسوم وضريبة مع المقدم</dt><dd>{money(detail.extras_cents)}</dd></div><div><dt>متبقي الأقساط</dt><dd>{money(detail.outstanding_cents)}</dd></div><div><dt>غرامات مستحقة اليوم</dt><dd>{money(detail.outstanding_penalty_cents)}</dd></div></dl>
      <div className="nmi-collect">
        {detail.status === "awaiting_deposit" && <Button permission="installments.collect_deposit" label="تحصيل المقدم والرسوم" icon="pi pi-wallet" loading={busy} onClick={() => startQuote("deposit")} />}
        {detail.status === "pending" && <><label>عدد الأقساط بالترتيب<input aria-label="عدد الأقساط المطلوب سدادها" type="number" min="1" max={unpaid.length} value={count} onChange={(event) => setCount(event.target.value)} /></label><Button permission="installments.collect" label="معاينة التحصيل" icon="pi pi-wallet" loading={busy} onClick={() => startQuote("installment")} /></>}
        {detail.status === "awaiting_deposit" && !latestPayment && <Button permission="installments.cancel_contract" label="إلغاء العقد" icon="pi pi-times" severity="danger" outlined onClick={() => setCancelDialog(true)} />}
      </div>
      <h2>جدول الأقساط</h2><Schedule rows={detail.items} />
      <h2>التحصيلات والإيصالات</h2><div className="nmi-table-scroll"><table><thead><tr><th>الإيصال</th><th>تاريخ السداد</th><th>النوع</th><th>أصل الثمن</th><th>الرسوم والضريبة</th><th>الغرامة</th><th>المحصل</th><th>الحالة</th><th>عرض / طباعة</th></tr></thead><tbody>{detail.payments.map((payment) => <tr key={payment.id}><td>{payment.serial_no}</td><td>{day(payment.payment_date)}</td><td>{payment.kind === "deposit" ? "مقدم" : "أقساط"}</td><td>{money(payment.principal_cents)}</td><td>{money(payment.extras_cents)}</td><td>{money(payment.penalty_cents)}</td><td>{money(payment.amount_cents)}</td><td>{payment.status === "void" ? "ملغي" : "مسدد"}</td><td className="nmi-actions"><Button permission="receipts.print" label="عرض الإيصال" icon="pi pi-file" outlined aria-label={`إيصال ${payment.serial_no}`} tooltip="عرض الإيصال وطباعته" onClick={() => setPaper({ payment })} />{latestPayment?.id === payment.id && <Button permission="installments.cancel_payment" icon="pi pi-undo" severity="danger" outlined aria-label="إلغاء آخر تحصيل" tooltip="إلغاء آخر تحصيل" onClick={() => { setVoidId(payment.id); setReason(""); }} />}</td></tr>)}{detail.payments.length === 0 && <tr><td colSpan="9">لا توجد تحصيلات</td></tr>}</tbody></table></div>
    </>}
    <Dialog header="عقد تقسيط عضوية جديدة" visible={newDialog} onHide={() => !busy && setNewDialog(false)} className="nmi-dialog" modal>
      <form className="nmi-form" onSubmit={(event) => { event.preventDefault(); execute(() => previewAgreement(draft), setPreview); }}>
        <label>رقم العضوية<input name="memberCode" aria-label="رقم العضوية للتعاقد" inputMode="numeric" value={draft.memberCode} onChange={change} required /></label>
        <label>ثمن العضوية قبل الضريبة<input name="price" aria-label="ثمن العضوية قبل الضريبة" type="number" step="0.01" min="20000.01" value={draft.price} onChange={change} required /></label>
        <label>مقدم ثمن العضوية<input name="deposit" aria-label="مقدم ثمن العضوية" type="number" step="0.01" min="20000" value={draft.deposit} onChange={change} required /></label>
        <label>نظام التقسيط<select name="frequency" aria-label="نظام التقسيط" value={draft.frequency} onChange={change}>{Object.entries(modes).map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>
        <Button permission="installments.create" type="submit" label="معاينة العقد" icon="pi pi-eye" loading={busy} />
      </form>
      {preview && <div className="nmi-preview"><h2>{preview.member.name} - عضوية {preview.member.member_code}</h2><table><tbody><tr><th>ثمن العضوية</th><td>{money(preview.price_cents)}</td></tr><tr><th>المقدم</th><td>{money(preview.deposit_cents)}</td></tr>{Object.entries(feeNames).map(([key, label]) => <tr key={key}><th>{label}</th><td>{money(preview.fees[key])}</td></tr>)}<tr><th>المطلوب مع المقدم</th><td>{money(preview.upfront_cents)}</td></tr><tr><th>متبقي الأقساط فقط</th><td>{money(preview.balance_cents)}</td></tr></tbody></table><Schedule rows={preview.schedule} printable /><Button permission="installments.create" label="حفظ العقد بدون تحصيل" icon="pi pi-check" loading={busy} onClick={() => execute(() => saveAgreement({ ...draft, expectedUpfrontCents: preview.upfront_cents }), (data) => { setNewDialog(false); router.push(`/club/new-membership-installments/${data.id}`); })} /></div>}
      {message && <p role="alert" className="nmi-error">{message}</p>}
    </Dialog>
    <Dialog header="تأكيد تحصيل التقسيط" visible={Boolean(quote)} onHide={() => !busy && setQuote(null)} className="nmi-dialog" modal>
      {quote && <><table><tbody><tr><th>أصل ثمن العضوية</th><td>{money(quote.principal_cents)}</td></tr><tr><th>الرسوم والضريبة</th><td>{money(quote.extras_cents)}</td></tr><tr><th>غرامة التأخير</th><td>{money(quote.penalty_cents)}</td></tr><tr><th>المطلوب تحصيله</th><td>{money(quote.total_cents)} جنيه</td></tr></tbody></table>{quote.items.length > 0 && <table><thead><tr><th>القسط</th><th>الاستحقاق</th><th>الأيام</th><th>الغرامة</th></tr></thead><tbody>{quote.items.map((item) => <tr key={item.id}><td>{item.number}</td><td>{day(item.due_date)}</td><td>{item.penalty.days}</td><td>{money(item.penalty.cents)}</td></tr>)}</tbody></table>}<Button permission={paymentKind === "deposit" ? "installments.collect_deposit" : "installments.collect"} label="تأكيد استلام المبلغ وإصدار الإيصال" icon="pi pi-check" loading={busy} onClick={() => execute(() => postPayment({ contractId, kind: paymentKind, count: Number(count), expectedTotalCents: quote.total_cents, expectedNumbers: quote.items.map((item) => item.number), requestKey }), showCollectedReceipt)} />{message && <p role="alert" className="nmi-error">{message}</p>}</>}
    </Dialog>
    <Dialog header="إلغاء آخر تحصيل" visible={Boolean(voidId)} onHide={() => !busy && setVoidId(null)} className="nmi-dialog" modal>
      <label>سبب الإلغاء<textarea aria-label="سبب إلغاء التحصيل" value={reason} onChange={(event) => setReason(event.target.value)} maxLength="500" /></label>
      <Button label="تأكيد إلغاء التحصيل والقيد" severity="danger" icon="pi pi-undo" loading={busy} disabled={reason.trim().length < 5} onClick={() => execute(() => cancelPayment(contractId, voidId, reason), async () => { setVoidId(null); await load(); })} />{message && <p role="alert" className="nmi-error">{message}</p>}
    </Dialog>
    <Dialog header="إلغاء العقد غير المحصل" visible={cancelDialog} onHide={() => !busy && setCancelDialog(false)} className="nmi-dialog" modal><Button label="تأكيد إلغاء العقد" severity="danger" icon="pi pi-times" loading={busy} onClick={() => execute(() => closeAgreement(contractId), async () => { setCancelDialog(false); await load(); })} />{message && <p role="alert" className="nmi-error">{message}</p>}</Dialog>
    <Dialog header="مستند التقسيط" visible={Boolean(paper)} onHide={() => setPaper(null)} className="nmi-dialog nmi-paper-dialog" modal>{paper && detail && <><Button permission="receipts.print" label="طباعة" icon="pi pi-print" onClick={print} /><Paper ref={paperRef} contract={detail} payment={paper.payment} /></>}</Dialog>
  </section>;
}
