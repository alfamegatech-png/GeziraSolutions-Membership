"use client";
import React, { useEffect, useState } from "react";
import LazyTable from "@components/LazyTable/LazyTable.jsx";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { getStoredUser, getStoredValue } from "@lib/browserStorage";
import { useAccess } from "@components/Access/AccessProvider";
import { getSafeOptions } from "@components/Access/actions";

const MembershipsPage = () => {
  const { user, can } = useAccess();
  const [safeOptions, setSafeOptions] = useState([]);
  const [user_id, setUser_id] = useState(null);
  const [safe_no, setSafe_id] = useState(null);
  const [member_order_date, setOrderDate] = useState(null);
  const [isReady, setIsReady] = useState(false);
  // let date = new Date(localStorage.getItem("filterDate"));

  function handleSafeId() {
    const clubUser = user;
    if (!clubUser.id) return;
    setUser_id(clubUser?.id ?? null);
    setSafe_id(can("reports.all_safes") ? undefined : clubUser?.safe_no ?? -1);
  }
  useEffect(() => {
    handleSafeId();
    if (can("reports.all_safes")) getSafeOptions().then(setSafeOptions).catch(() => setSafeOptions([]));
    const storedDate = getStoredValue("filterDate");
    const date = storedDate ? new Date(storedDate) : null;
    setOrderDate(date && !Number.isNaN(date.getTime()) ? date : null);
    setIsReady(true);
  }, []);

  if (!isReady || safe_no === null) return null;

  // useEffect(() => {
  //   // setUser_id(JSON.parse(localStorage.clubUser).id);
  // }, []);

  return (
    <>
      {can("reports.all_safes") && <label className="flex align-items-center gap-2 mb-3" dir="rtl">الخزينة<select aria-label="خزينة التقرير" value={safe_no ?? ""} onChange={(event) => setSafe_id(event.target.value ? Number(event.target.value) : undefined)}><option value="">كل الخزائن</option>{safeOptions.map((safe) => <option value={safe} key={safe}>{safe}</option>)}</select></label>}
      <LazyTable
        key={`safe-${safe_no ?? "all"}`}
        // exportName="memberships"
        table="memberships"
        id="id"
        tableHeader="report"
        paginator={true}
        rows={10}
        // member_order_date: new Date()
        filter={{ member_order_date, safe_no }}
        orderBy={{ serial_no: "desc" }}
        include={{
          member: {
            include: { rel_member_type: { select: { name: true } } },
          },
          bookingLockersLinks: {
            include: {
              bookingLocker: {
                select: {
                  Id: true,
                  Price: true,
                  PaymentDate: true,
                  ReceiptNumber: true,
                },
              },
            },
          },
          rel_canceled: true,
          rel_status: true,
          rel_secondary: true,
        }}
        columns={[
          {
            field: "member_code",
            header: "رقم العضوية",
            filter: true,
            filterElement: "filterInputNumber",
            filterMode: "equals",

            dataType: "number",
          },

          {
            field: "member.name",
            header: "الاسم",
            //  filter: true,
            filterMode: "contains",

            dataType: "string",
          },
          {
            field: "rel_secondary.name",

            header: "نوع الإيصال",

            dataType: "string",
          },
          {
            field: "serial_no",

            header: "رقم الإيصال",

            dataType: "number",
          },
          {
            field: "safe_no",

            header: "رقم الخزينة",

            dataType: "number",
          },
          {
            field: "member_order_date",

            header: "تاريخ الإيصال",
            filter: true,
            filterMode: "equals",
            filterElement: "filterDate",
            dataType: "date",
          },
          {
            field: "start_date",

            header: "تاريخ البدء",
            filter: true,

            filterMode: "equals",
            filterElement: "filterDate",
            dataType: "date",
          },
          {
            field: "end_date",

            header: "تاريخ الإنتهاء",
            filter: true,

            filterMode: "equals",
            filterElement: "filterDate",
            dataType: "date",
          },
          {
  field: "bookingLockersLinks",
  header: "إجمالي رسوم الدواليب",
  dataType: "price",

},
          {
            field: "transfer_separation_fee",
            header: "رسوم التحويل والفصل",
            dataType: "number",
          },
          {
            field: "total_amount",

            header: "الإجمالي",

            dataType: "number",
       
          },
          {
            field: "member.rel_member_type.name",

            header: "نوع العضوية",
            filter: false,

            dataType: "string",
          },
          {
            field: "member.member_type",
            // filter: true,

            // filterMode: "equals",
            header: "كود",

            dataType: "number",
          },
          {
            field: "rel_canceled.name",

            header: "الحالة",
            filter: false,

            dataType: "string",
          },
          // {
          //   field: "Actions",

          //   header: "",
          //   frozen: true,
          //   alignFrozen: "left",
          //   dataType: "custom",
          //   url: "members/",
          //   btnText: "المزيد",
          // },
        ]}
      />
    </>
  );
};

export default MembershipsPage;
