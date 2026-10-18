"use client";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { getSecurityAudit } from "./actions";
import "./access.css";
const actionNames = { "user_roles.changed": "تغيير أدوار مستخدم", "user_roles.bootstrap": "تهيئة مدير النظام", "prices.changed": "تعديل الأسعار", "system_license.activated": "تفعيل ترخيص المنظومة" };
export default function SecurityAudit() {
  const [rows, setRows] = useState([]), [page, setPage] = useState(0), [message, setMessage] = useState("");
  useEffect(() => { let active = true; getSecurityAudit(page).then((data) => { if (active) { setRows(data); setMessage(""); } }).catch(() => { if (active) setMessage("تعذر تحميل سجل الصلاحيات"); }); return () => { active = false; }; }, [page]);
  return <section className="access-admin" dir="rtl"><h1>سجل الصلاحيات</h1>{message && <p role="alert">{message}</p>}<div className="access-scroll"><table><thead><tr><th>التوقيت</th><th>المستخدم المنفذ</th><th>العملية</th><th>المستهدف</th><th>قبل</th><th>بعد</th><th>السبب</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</td><td>{row.actor || "تهيئة محلية"}</td><td>{actionNames[row.action] || row.action}</td><td>{row.target_name || row.target_id || "-"}</td><td>{JSON.stringify(row.before_value)}</td><td>{JSON.stringify(row.after_value)}</td><td>{row.reason}</td></tr>)}{!rows.length && <tr><td colSpan="7">لا توجد عمليات مسجلة</td></tr>}</tbody></table></div><div className="access-pages"><Button icon="pi pi-angle-right" aria-label="السابق" disabled={!page} onClick={() => setPage(page - 1)} /><span>{page + 1}</span><Button icon="pi pi-angle-left" aria-label="التالي" disabled={rows.length < 25} onClick={() => setPage(page + 1)} /></div></section>;
}
