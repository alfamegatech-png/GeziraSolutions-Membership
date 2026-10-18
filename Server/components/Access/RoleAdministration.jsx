"use client";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { getRoleAdministration, updateUserRoles } from "./actions";
import { resolvePrivileges, togglePrivilegeOverride, COMPANY_PRICE_PRIVILEGES } from "@lib/userPrivilegeOverrides";
import "./access.css";
export default function RoleAdministration() {
  const [data, setData] = useState({ users: [], roles: [] }), [search, setSearch] = useState(""), [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null), [roles, setRoles] = useState([]), [reason, setReason] = useState("");
  const [overrides, setOverrides] = useState([]);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function load(targetPage = page) {
    setBusy(true); setMessage("");
    try { setData(await getRoleAdministration(search, targetPage)); }
    catch { setMessage("تعذر تحميل المستخدمين؛ راجع صلاحية إدارة الأدوار"); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, [page]);
  async function save() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await updateUserRoles({ userId: selected.id, roles, expectedRoles: selected.roles, overrides, expectedOverrides: selected.overrides, reason });
      if (!result.ok) { setMessage(result.message); return; }
      setSelected(null); window.dispatchEvent(new Event("access-refresh")); await load();
    } catch { setMessage("تعذر حفظ الأدوار؛ حدّث الصفحة وراجع صلاحيتك"); }
    finally { setBusy(false); }
  }
  const names = (codes) => codes.map((code) => data.roles.find((role) => role.code === code)?.name || code).join("، ") || "بدون دور";
  const rolePrivileges = [...new Set(data.roles.filter((role) => roles.includes(role.code)).flatMap((role) => role.privileges.map((item) => item.code)))];
  const ownsPrices = selected?.id === data.priceOwnerId;
  const granted = resolvePrivileges(rolePrivileges, overrides, ownsPrices);
  const categories = [...new Set((data.privileges || []).map((item) => item.category))];
  return <section className="access-admin" dir="rtl"><h1>أدوار المستخدمين</h1>
    <form className="access-search" onSubmit={(event) => { event.preventDefault(); setPage(0); load(0); }}><label>اسم المستخدم / البريد<input aria-label="بحث المستخدمين" value={search} onChange={(event) => setSearch(event.target.value)} /></label><Button label="بحث" icon="pi pi-search" type="submit" loading={busy} /></form>
    {message && <p role="alert" className="access-error">{message}</p>}
    <div className="access-scroll"><table><thead><tr><th>اسم المستخدم</th><th>الاسم</th><th>البريد</th><th>الخزينة</th><th>الأدوار</th><th></th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.fullname}</td><td dir="ltr">{user.email}</td><td>{user.safe_no ?? "غير مرتبط"}</td><td>{names(user.roles)}{user.overrides?.length > 0 && <small className="access-customized">صلاحيات مخصصة ({user.overrides.length})</small>}</td><td><Button icon="pi pi-user-edit" aria-label={`تعديل أدوار ${user.name}`} tooltip="تعديل الأدوار" outlined disabled={busy} onClick={() => { setSelected(user); setRoles(user.roles); setOverrides(user.overrides || []); setReason(""); setMessage(""); }} /></td></tr>)}{!data.users.length && <tr><td colSpan="6">لا توجد نتائج</td></tr>}</tbody></table></div>
    <div className="access-pages"><Button icon="pi pi-angle-right" aria-label="السابق" disabled={busy || page === 0} onClick={() => setPage(page - 1)} /><span>{page + 1}</span><Button icon="pi pi-angle-left" aria-label="التالي" disabled={busy || data.users.length < 25} onClick={() => setPage(page + 1)} /></div>
    <Dialog header={`أدوار ${selected?.fullname || selected?.name || ""}`} visible={Boolean(selected)} onHide={() => !busy && setSelected(null)} className="access-dialog" modal>
      <div dir="rtl"><p>الأدوار الحالية: {selected ? names(selected.roles) : ""}</p>
        <fieldset disabled={busy}><legend>الأدوار الجديدة</legend>{data.roles.map((role) => <label className="access-role" key={role.code}><input type="checkbox" checked={roles.includes(role.code)} onChange={(event) => setRoles((old) => event.target.checked ? [...old, role.code] : old.filter((code) => code !== role.code))} />{role.name}</label>)}</fieldset>
        <div className="access-permission-heading"><h2>الصلاحيات الناتجة ({granted.length})</h2><Button label="استعادة صلاحيات الأدوار" icon="pi pi-refresh" outlined disabled={busy || !overrides.length} onClick={() => setOverrides([])} /></div>
        <div className="access-permissions">{categories.map((category) => <fieldset key={category} disabled={busy}><legend>{category}</legend>{data.privileges.filter((item) => item.category === category).map((item) => {
          const locked = !ownsPrices && COMPANY_PRICE_PRIVILEGES.includes(item.code);
          const custom = overrides.find((entry) => entry.code === item.code);
          return <label className="access-role" key={item.code}><input type="checkbox" aria-label={item.name} disabled={locked} checked={granted.includes(item.code)} onChange={(event) => setOverrides((old) => togglePrivilegeOverride(rolePrivileges, old, item.code, event.target.checked))} /><span>{item.name}{custom && !locked && <small className="access-customized">{custom.effect === "allow" ? "إضافة خاصة" : "مستبعدة لهذا المستخدم"}</small>}{locked && <small className="access-customized">حساب الشركة فقط</small>}</span></label>;
        })}</fieldset>)}</div>
        <label>سبب التغيير<textarea aria-label="سبب تغيير الأدوار" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} /></label>
        {!granted.length && <p className="access-error">بدون صلاحيات، لن يستطيع هذا المستخدم فتح شاشات المنظومة.</p>}
        {message && <p role="alert" className="access-error">{message}</p>}
        <Button label="تأكيد تغيير الأدوار" icon="pi pi-check" loading={busy} disabled={reason.trim().length < 5} onClick={save} />
      </div>
    </Dialog>
  </section>;
}
