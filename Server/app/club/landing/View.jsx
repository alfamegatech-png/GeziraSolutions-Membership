"use client";
import { getStoredValue } from "@lib/browserStorage";
import { getMemberByReceiptNumber } from "@components/Members/memberReceiptLookup";
import {
  getMemberByMemberCode,
  getMemberByPhoneNumber,
} from "@components/Members/member";
import { useRouter } from "next/navigation";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";

export const View = () => {
  const router = useRouter();
  const [memberCode, setMemberCode] = React.useState(null);
  const [memberPhone, setmemberPhone] = React.useState(null);
  const [fontSize,setFontSize] = useState(42);
  useEffect(() => { setFontSize(Number(getStoredValue("fontSize")) || 42); }, []);

  function handleFontSize() {
    if (fontSize) {
      localStorage.setItem('fontSize',fontSize)
    }
  }

  const toast = useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState("");

  const showError = () => {
    toast.current?.show({
      severity: "error",
      summary: "خطأ",
      detail: "البيانات غير صحيحة",
      life: 3000,
    });
  };
  const showWarn = () => {
    toast.current.show({
      severity: "warn",
      summary: "تحذير",
      detail: "لا توجد اعضاء بهذه البيانات",
      life: 3000,
    });
  };

  const memberData = async () => {
    if (!memberCode && !memberPhone && !receipt) {
      showError();
      return;
    }
    try {
      setLoading(true);
      let res = null;
      if (memberCode) {
        res = await getMemberByMemberCode(Number(memberCode));
      } else if (memberPhone) {
        res = await getMemberByPhoneNumber(memberPhone);
      } else if (receipt) {
        res = await getMemberByReceiptNumber(receipt);
      }
      
      if (res?.status === "ambiguous") {
        toast.current?.show({ severity: "warn", summary: "تحذير", detail: "رقم الإيصال مرتبط بأكثر من عضو، ابحث برقم العضوية", life: 5000 });
      } else if (res?.id) {
        router.push(`/club/members/${res.id}`);
      } else {
        showWarn();
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "خطأ",
        detail: "تعذر البحث الآن، حاول مرة أخرى",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberCodeKeyDown = (event) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    if (!loading && !event.repeat) return memberData();
  };

  return (
    <div
      className="member-search"
    >
      <Toast ref={toast} />
      <div className="member-search-heading">
        <i className="pi pi-search" aria-hidden="true" />
        <h1>البحث عن عضو</h1>
      </div>
      <div
        dir="rtl"
        className="member-search-fields"
      >
        <div dir="rtl">
          <label
            htmlFor="memberCode"
            className="member-search-field"
          >
            <span>
              {" "}
              رقم العضوية{" "}
            </span>

            <input
              type="number"
              id="memberCode"
              placeholder="رقم العضوية"
              aria-label="رقم العضوية"
              onKeyDown={handleMemberCodeKeyDown}
              value={memberCode || ""}
              onChange={(e) => {
                setReceipt(null);
                setmemberPhone(null);
                setMemberCode(e.target.value);
              }}
              className="mt-1  w-full border-none focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm no-spinner"
            />
          </label>
        </div>
        <div dir="rtl">
          <label
            htmlFor="memberPhone"
            className="member-search-field"
          >
            <span>
              {" "}
              رقم التيليفون
            </span>

            <input
              type="tel"
              inputMode="tel"
              value={memberPhone || ""}
              id="memberPhone"
              placeholder="رقم التيليفون"
              aria-label="رقم التيليفون"
              onKeyDown={handleMemberCodeKeyDown}
              onChange={(e) => {
                setReceipt(null);
                setMemberCode(null);
                setmemberPhone(e.target.value);
              }}
              className="mt-1 w-full border-none focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm no-spinner"
            />
          </label>
        </div>
        <div dir="rtl">
          <label htmlFor="memberReceipt" className="member-search-field">
            <span>رقم الإيصال</span>
            <input
              type="text"
              inputMode="numeric"
              id="memberReceipt"
              placeholder="رقم الإيصال"
              aria-label="رقم الإيصال"
              value={receipt || ""}
              onKeyDown={handleMemberCodeKeyDown}
              onChange={(event) => {
                setMemberCode(null);
                setmemberPhone(null);
                setReceipt(event.target.value);
              }}
              className="mt-1 w-full border-none focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm no-spinner"
            />
          </label>
        </div>
      </div>

      <div className="member-search-submit">
        <button
          disabled={loading}
          onClick={memberData}
          className="member-search-button"
        >
          {!loading ? (
            "بحث"
          ) : (
            <ProgressSpinner
              style={{ width: "30px", height: "30px" }}
              strokeWidth="6"
              fill="var(--surface-ground)"
              animationDuration=".5s"
            />
          )}
        </button>
      </div>
      <div className="member-print-settings">
        <p className="shrink-0 w-full text-right">حجم خط الكارنية</p>
        <div className="member-print-controls">
          <button onClick={handleFontSize} className="member-print-confirm">
            تأكيد حجم الخط
          </button>
          <input aria-label="حجم خط الكارنية" value={fontSize} onChange={e=>setFontSize(e.target.value)} placeholder="42" type="number" />
        </div>
      </div>
    </div>
  );
};
