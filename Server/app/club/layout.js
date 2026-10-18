"use client";
import { AccessButton as Button } from "@components/Access/AccessButton";
import AccessProvider, { useAccess } from "@components/Access/AccessProvider";
import { Sidebar } from "primereact/sidebar";
import { Card } from "primereact/card";
import { useRouter } from "next/navigation";
import { Toolbar } from "primereact/toolbar";
import { useState, useEffect } from "react";
import { getStoredUser, getStoredValue } from "@lib/browserStorage";
import { closeInstallmentSession } from "@app/login/installmentSession";

export default function ClubLayout({ children }) {
  return <AccessProvider><ClubFrame>{children}</ClubFrame></AccessProvider>;
}
function ClubFrame({ children }) {
  const { user: authenticatedUser, can } = useAccess();
  const router = useRouter();
  const [tokenLocker, setTokenLocker] = useState(null);
  const [safe_no, setSafe_no] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clubUser, setClubUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getStoredValue("lockerToken");
      const clubUser = authenticatedUser;

      setTokenLocker(token);
      if (!clubUser?.id) {
        router.replace("/login");
      } else {
        setClubUser(clubUser);
        setSafe_no(clubUser.safe_no || 0);
      }
    }
  }, [router, authenticatedUser]);

  const handleLogout = async () => {
    setVisible(false);
    try { await closeInstallmentSession(); } catch { /* Local sign-out must still complete. */ }
    if (typeof window !== "undefined") {
      localStorage.removeItem("clubUser");
      localStorage.removeItem("fromWeb");
      localStorage.removeItem("lockerToken");
    }
    router.replace("/login");
  };

  const rightToolbarTemplate = (
    <Button
      icon="pi pi-bars"
      aria-label="القائمة الرئيسية"
      tooltip="القائمة الرئيسية"
      outlined
      onClick={() => {
        setVisible(true);
      }}
    />
  );

  const footer = (
    <div className="flex flex-wrap justify-content-end gap-2">
      <Button label="تسجيل خروج" icon="pi pi-sign-out" onClick={handleLogout} />
    </div>
  );

  return (
    <>
      <Toolbar className="workspace-toolbar" right={rightToolbarTemplate}
        left={<span className="workspace-user"><i className="pi pi-user" aria-hidden="true" />{clubUser?.fullname || ""}</span>}></Toolbar>
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        dir="rtl"
        position="right"
        maskClassName="membership-navigation-mask"
        className="h-screen membership-navigation"
      >
        <Card
          title={clubUser?.fullname || ""}
          className="font-bold"
          subTitle="مرحبا بك"
          footer={footer}
          dir="rtl"
        >
          <div className="flex flex-col">
            <Button
              permission="members.view"
              label="القائمة الرئيسية"
              outlined
              loading={loading}
              onClick={() => {
                setVisible(false);
                setLoading(true);
                router.replace("/club/landing");
                setLoading(false);
              }}
            />
            {clubUser && (
              <>
                <Button
                  permission="members.view"
                  label="قائمة الأعضاء"
                  outlined
                  loading={loading}
                  onClick={() => {
                    setVisible(false);
                    setLoading(true);
                    router.replace("/club/members");
                    setLoading(false);
                  }}
                />
                <Button
                  permission="members.view"
                  label="قائمة الاعضاء الموقوفين"
                  outlined
                  loading={loading}
                  onClick={() => {
                    setVisible(false);
                    setLoading(true);
                    router.replace("/club/suspendedMembers");
                    setLoading(false);
                  }}
                />
                <Button
                  permission="refs.view"
                  label="قائمة الاعضاء التابعين الموقوفين"
                  outlined
                  loading={loading}
                  onClick={() => {
                    setVisible(false);
                    setLoading(true);
                    router.replace("/club/suspendedMembersRef");
                    setLoading(false);
                  }}
                />
                <Button
                  permission="refs.view"
                  label="قائمة الأعضاء التابعين"
                  outlined
                  loading={loading}
                  onClick={() => {
                    setVisible(false);
                    setLoading(true);
                    router.replace("/club/members-ref");
                    setLoading(false);
                  }}
                />
                <Button
                  permission="receipts.view"
                  label="قائمة تجديدات العضويات"
                  outlined
                  loading={loading}
                  onClick={() => {
                    setVisible(false);
                    setLoading(true);
                    router.replace("/club/memberships");
                    setLoading(false);
                  }}
                />
                {can("lockers.view") && (
                  <Button
                    permission="lockers.view"
                    label="ايرادات الدواليب للحساب"
                    outlined
                    loading={loading}
                    onClick={() => {
                      setVisible(false);
                      setLoading(true);
                      router.replace("/club/dailyLockersRevenues");
                      setLoading(false);
                    }}
                  />
                )}
                <Button permission="installments.view" label="تقسيط العضوية الجديدة" icon="pi pi-wallet" outlined onClick={() => {
                  setVisible(false);
                  router.replace("/club/new-membership-installments");
                }} />
                <Button permission="prices.manage" label="إعدادات الأسعار" icon="pi pi-money-bill" outlined onClick={() => { setVisible(false); router.replace("/club/membership-prices"); }} />
                {authenticatedUser?.email?.trim().toLowerCase() === "admin@gmail.com" && <Button label="تفعيل المنظومة" icon="pi pi-key" outlined onClick={() => { setVisible(false); router.replace("/activation"); }} />}
                <Button permission="users.roles.manage" label="أدوار المستخدمين" icon="pi pi-users" outlined onClick={() => { setVisible(false); router.replace("/club/user-roles"); }} />
                <Button permission="audit.view" label="سجل الصلاحيات" icon="pi pi-history" outlined onClick={() => { setVisible(false); router.replace("/club/security-audit"); }} />
                <Button permission="legacy_installments.view" label="التقسيط القديم" icon="pi pi-clock" outlined onClick={() => { setVisible(false); router.replace("/club/installments"); }} />
              </>
            )}
          </div>
        </Card>
      </Sidebar>
      <main className="workspace-content">{children}</main>
    </>
  );
}
