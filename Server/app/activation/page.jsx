"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import "./activation.css";
export default function Activation() {
  const [status, setStatus] = useState(null), [message, setMessage] = useState("");
  const [license, setLicense] = useState(""), [password, setPassword] = useState(""), [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/system-license", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.message); setStatus(null); return; }
    setStatus(data);
  }
  useEffect(() => { load().catch(() => setMessage("تعذر الاتصال بالخادم")); }, []);
  async function activate(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/system-license", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ license, password }) });
      const result = await response.json();
      setMessage(response.ok ? "تم تفعيل المنظومة بنجاح" : result.message);
      setPassword("");
      if (response.ok) { setLicense(""); await load(); }
    } catch { setMessage("تعذر الاتصال بالخادم؛ حدّث الحالة قبل إعادة التفعيل"); }
    finally { setBusy(false); }
  }
  return <main className="activation-page" dir="rtl"><h1>تفعيل المنظومة</h1>
    <p role="status">{message}</p>
    {status && <><dl><dt>حالة الترخيص</dt><dd>{status.active ? "مفعّل" : "غير مفعّل"}</dd>{status.expiresOn && <><dt>تاريخ انتهاء التفعيل</dt><dd>{status.expiresOn} — بداية اليوم بتوقيت القاهرة</dd></>}</dl>
      <label>بصمة السيرفر<input aria-label="بصمة السيرفر" readOnly dir="ltr" value={status.fingerprint || ""} /></label>
      <Button label="نسخ البصمة" icon="pi pi-copy" outlined onClick={() => navigator.clipboard.writeText(status.fingerprint).then(() => setMessage("تم نسخ البصمة")).catch(() => setMessage("تعذر النسخ؛ حدد البصمة وانسخها يدويًا"))} />
      <form onSubmit={activate}><label>ملف الترخيص<input aria-label="ملف الترخيص" type="file" accept=".json,.license" disabled={busy} onChange={async event => { const file = event.target.files?.[0]; setLicense(""); if (!file) return; if (file.size > 16000) { setMessage("ملف الترخيص أكبر من المسموح"); return; } try { setLicense(await file.text()); } catch { setMessage("تعذر قراءة الملف"); } }} /></label>
        <label>كلمة مرور حساب الشركة<input aria-label="كلمة مرور حساب الشركة" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required /></label>
        <Button label="تأكيد التفعيل" icon="pi pi-key" type="submit" loading={busy} disabled={!license || !password} />
      </form></>}
    <nav><Link href="/login">تسجيل الدخول بحساب الشركة</Link>{status?.active && <Link href="/club/landing">الدخول للمنظومة</Link>}<Button label="تحديث الحالة" icon="pi pi-refresh" outlined onClick={() => load().catch(() => setMessage("تعذر الاتصال بالخادم"))} /></nav>
  </main>;
}
