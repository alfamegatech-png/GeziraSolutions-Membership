"use client";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { View } from "./View";
import { getStoredUser } from "@lib/browserStorage";

export default function Page({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const clubUser = getStoredUser();
      if (!clubUser.id) {
        router.replace("/login");
      } else {
        setUser(clubUser);
      }
      setIsClient(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("clubUser");
    localStorage.removeItem("lockerToken");
    router.replace("/login");
  };

  const footer = (
    <div className="flex flex-wrap justify-content-end gap-2">
      <Button label="تسجيل خروج" icon="pi pi-sign-out" onClick={handleLogout} />
    </div>
  );

  return (
    <>
      {/* <Card
        title={user ? user.fullname : ""}
        subTitle="مرحبا بك"
        footer={footer}
        dir="rtl"
      >
        <div className="flex flex-col">
          <Button
            label="قائمة الأعضاء"
            outlined
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.replace("club/members");
              setLoading(false);
            }}
          />
          <Button
            label="قائمة الاعضاء الموقوفين"
            outlined
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.replace("/club/suspendedMembers");
              setLoading(false);
            }}
          />
          <Button
            label="قائمة الأعضاء التابعين"
            outlined
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.replace("club/members-ref");
              setLoading(false);
            }}
          />
          <Button
            label="  قائمة الأعضاء التابعين الموقوفين"
            outlined
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.replace("club/suspendedMembersRef");
              setLoading(false);
            }}
          />
          <Button
            label="قائمة تجديدات العضويات"
            outlined
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.replace("club/memberships");
              setLoading(false);
            }}
          />
        </div>
      </Card> */}
      <View />
    </>
  );
}
