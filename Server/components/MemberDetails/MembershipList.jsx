// import React, { useState } from "react";
// import LazyTable from "@components/LazyTable/LazyTable.jsx";
// const MembershipList = ({ selectedMember, handleReload, reload, isRef }) => {
//   if (isRef) {
//     return (
//       <LazyTable
//         table="memberships"
//         paginator={true}
//         key={reload}
//         handleReload={handleReload}
//         orderBy={{ serial_no: "desc" }}
//         id="id"
//         rows={10}
//         include={{
//           rel_status: true,
//           rel_secondary: true,
//           member: { select: { name: true } },
//         }}
//         filter={{
//           ref_member_id: selectedMember.id,
//           canceled: 0,
//           // secondary: 0,
//         }}
//         columns={[
//           {
//             field: "rel_secondary.name",

//             header: "نوع الإيصال",

//             dataType: "string",
//           },
//           {
//             field: "serial_no",

//             header: "رقم الإيصال",

//             dataType: "number",
//           },
//           {
//             field: "safe_no",

//             header: "رقم الخزينة",

//             dataType: "number",
//           },
//           {
//             field: "start_date",
//             header: "تاريخ البدء",
//             filter: false,
//             filterMode: "contains",

//             dataType: "date",
//           },
//           {
//             field: "end_date",
//             header: "تاريخ الإنتهاء",
//             filter: false,
//             filterMode: "contains",

//             dataType: "date",
//           },
//           {
//             field: "total_amount",

//             header: "الإجمالي",

//             dataType: "number",
//           },
//           {
//             field: "rel_status.name",

//             header: "الحالة",
//             filter: false,
//             filterMode: "contains",

//             dataType: "string",

//             tag: "rel_status.tag",
//           },
//           {
//             field: "Actions",

//             header: "",
//             frozen: true,
//             alignFrozen: "left",
//             dataType: "cancel",

//             btnText: "إلغاء",
//           },
//         ]}
//       />
//     );
//   } else {
//     return (
//       <LazyTable
//         table="memberships"
//         paginator={true}
//         key={reload}
//         handleReload={handleReload}
//         orderBy={{ serial_no: "desc" }}
//         id="id"
//         rows={10}
//         include={{
//           rel_status: true,
//           rel_secondary: true,
//           member: { select: { name: true } },
//         }}
//         filter={{
//           member_code: selectedMember.member_code,
//           canceled: 0,
//           // secondary: 0,
//         }}
//         columns={[
//           {
//             field: "rel_secondary.name",

//             header: "نوع الإيصال",

//             dataType: "string",
//           },
//           {
//             field: "serial_no",

//             header: "رقم الإيصال",

//             dataType: "number",
//           },
//           {
//             field: "safe_no",

//             header: "رقم الخزينة",

//             dataType: "number",
//           },
//           {
//             field: "start_date",
//             header: "تاريخ البدء",
//             filter: false,
//             filterMode: "contains",

//             dataType: "date",
//           },
//           {
//             field: "end_date",
//             header: "تاريخ الإنتهاء",
//             filter: false,
//             filterMode: "contains",

//             dataType: "date",
//           },
//           {
//             field: "total_amount",

//             header: "الإجمالي",

//             dataType: "number",
//           },
//           {
//             field: "rel_status.name",

//             header: "الحالة",
//             filter: false,
//             filterMode: "contains",

//             dataType: "string",

//             tag: "rel_status.tag",
//           },
//           {
//             field: "Actions",

//             header: "",
//             frozen: true,
//             alignFrozen: "left",
//             dataType: "cancel",

//             btnText: "إلغاء",
//           },
//         ]}
//       />
//     );
//   }
// };

// export default MembershipList;
import React, { useState } from "react";
import LazyTable from "@components/LazyTable/LazyTable.jsx";

const MembershipList = ({
  selectedMember,
  handleReload,
  reload,
  isRef,
  safe_no,
}) => {
  const commonFilter = { total_amount: { not: 0 } }; // Filtering condition for canceled not equal to 0

  const refFilter = {
    ref_member_id: selectedMember.id,
    canceled: 0,
    ...commonFilter,
  };

  const memberFilter = {
    member_code: selectedMember.member_code,
    ...commonFilter,
  };

  const columns = [
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
      header: "تاريخ الايصال",
      filter: false,
      filterMode: "contains",
      dataType: "date",
    },
    {
      field: "start_date",
      header: "تاريخ البدء",
      filter: false,
      filterMode: "contains",
      dataType: "date",
    },
    {
      field: "end_date",
      header: "تاريخ الإنتهاء",
      filter: false,
      filterMode: "contains",
      dataType: "date",
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
      field: "rel_status.name",
      header: "الحالة",
      filter: false,
      filterMode: "contains",
      dataType: "string",
      tag: "rel_status.tag",
    },
    ...(safe_no !== 0
      ? [
          {
            field: "Actions",
            header: "",
            frozen: true,
            alignFrozen: "left",
            dataType: "cancel",
            btnText: "إلغاء",
          },
        ]
      : []),
  ];

  return (
    <LazyTable
      table="memberships"
      paginator={true}
      key={reload}
      handleReload={handleReload}
      orderBy={{ serial_no: "desc" }}
      id="id"
      rows={10}
      include={{
        rel_status: true,
        rel_secondary: true,
        member: { select: { name: true } },
        bookingLockersLinks: {          
          include: {
            bookingLocker: {            
              select: {
                Id: true,
                Price: true,
                PaymentDate: true,
                ReceiptNumber:true
              },
            },
          },
        },
      }}
      filter={isRef ? refFilter : memberFilter}
      columns={columns}
    />
  );
};

export default MembershipList;
