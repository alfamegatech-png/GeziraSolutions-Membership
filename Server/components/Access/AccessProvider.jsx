"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { currentAccess } from "./actions";
import { routePrivilege } from "@lib/privilegeCatalog";
import "./access.css";
const AccessContext = createContext({ ready: false, can: () => false, user: null, roles: [] });
export const useAccess = () => useContext(AccessContext);
export function Can({ permission, children }) { return useAccess().can(permission) ? children : null; }
export default function AccessProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null, roles: [], privileges: [], message: "" });
  const router = useRouter(), pathname = usePathname();
  useEffect(() => {
    let active = true;
    let expiryTimer;
    async function load() {
      try {
        const response = await currentAccess();
        if (!active) return;
        clearTimeout(expiryTimer);
        if (response.ok) {
          setState({ ready: true, ...response.data, licenseRequired: false, message: "" });
          if (Number.isFinite(response.data.licenseRemainingMs)) expiryTimer = setTimeout(() => {
            if (response.data.licenseRemainingMs > 2147483647) { load(); return; }
            if (active) { setState({ ready: true, user: null, roles: [], privileges: [], licenseRequired: true, message: "برجاء تحديث المنظومة. يُرجى تسجيل الدخول بحساب الشركة لإعادة التفعيل." }); load(); }
          }, Math.max(0, Math.min(response.data.licenseRemainingMs, 2147483647)));
        }
        else { setState({ ready: true, user: null, roles: [], privileges: [], licenseRequired: response.licenseRequired, message: response.message }); if (response.status === 401) router.replace("/login"); }
      } catch { if (active) setState({ ready: true, user: null, roles: [], privileges: [], message: "تعذر تحميل الصلاحيات" }); }
    }
    load();
    const interval = setInterval(load, 60000);
    window.addEventListener("focus", load);
    window.addEventListener("access-refresh", load);
    return () => { active = false; clearInterval(interval); clearTimeout(expiryTimer); window.removeEventListener("focus", load); window.removeEventListener("access-refresh", load); };
  }, [pathname, router]);
  const can = (permission) => state.privileges.includes(permission);
  const allowed = can(routePrivilege(pathname));
  return <AccessContext.Provider value={{ ...state, can }}>
    {!state.ready ? <div role="status" className="p-4" dir="rtl">جارٍ تحميل صلاحيات المستخدم...</div> : !allowed ? <section className={state.licenseRequired ? "access-license-lock" : "p-4"} dir="rtl"><h2>{state.licenseRequired ? "برجاء تحديث المنظومة" : "غير مصرح بالدخول"}</h2><p>{state.message || "ليس لديك صلاحية لهذه الشاشة. راجع مدير النظام لإسناد دور مناسب."}</p><Button label="تسجيل الدخول" icon="pi pi-sign-in" onClick={() => router.replace("/login")} />{state.licenseRequired && <Button label="تفعيل المنظومة" icon="pi pi-key" className="mr-2" onClick={() => router.replace("/activation")} />}</section> : children}
  </AccessContext.Provider>;
}
