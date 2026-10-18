import React from "react";
import LazyTableInstallments from "@components/LazyTableInstallments/LazyTableInstallments.jsx";
const InstallmentsMembersList = ({ reloadKey }) => {

  return (
    <LazyTableInstallments
      key={reloadKey}
      exportName="InstallmentsMembers"
      tableHeader
      table="InstallmentsMembers"
      id="id"
      paginator={true}
      rows={10}
      columns={[
        {
          field: "member_code",
          header: "رقم العضوية",
          filterElement: "filterInputNumber",
          filterMode: "equals",
          dataType: "number",
        },

        {
          field: "member_name",
          header: "الاسم",
          // filter: false,
          filterMode: "contains",
          dataType: "string",
        },

        {
          field: "client_bank",
          header: "بنك العميل",
          filter: false,
          filterMode: "equals",
        },

        {
          field: "club_bank",
          header: "بنك النادي",
          // filter: true,
          filterMode: "equals",
        },
        {
          field: "installment",
          header: "القسط",
          filter: false,
          dataType: "string",
        },

        {
          field: "Actions",
          header: "",
          frozen: true,
          alignFrozen: "left",
          dataType: "custom",
          url: "club/installments_member/",
          btnText: "المزيد",
        },
      ]}
    />
  );
};

export default InstallmentsMembersList;
