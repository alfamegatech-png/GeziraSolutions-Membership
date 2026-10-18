import React from "react";
import LazyTable from "@components/LazyTable/LazyTable.jsx";

const MembersList = ({ reloadKey }) => {
  function getValueFromNestedObject(obj, key) {
    const keys = key.split(".");
    let value = obj;
    for (const k of keys) {
      if (value && k in value) {
        value = value[k];
        if (Array.isArray(value) && value.length === 1) {
          value = value[0];
        }
      } else {
        value = undefined;
        break;
      }
    }
    return value;
  }
  return (
    <LazyTable
      key={reloadKey}
      exportName="members"
      tableHeader
      table="members"
      id="id"
      orderBy={{ member_code: "asc" }}
      paginator={true}
      rows={10}
      include={{
        membership: {
          where: {
            canceled: 0,
            secondary: 0,
            start_date: {
              not: null,
            },
            end_date: {
              not: null,
            },
            member_order_time: { not: null },
          },
          orderBy: [{ member_order_time: "desc" }],
          take: 1,
          include: { rel_status: true },
        },
        rel_member_type: { select: { name: true } },
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
          field: "name",
          header: "الاسم",
          filter: true,
          filterMode: "contains",
          dataType: "string",
        },

        {
          field: "suspended",
          header: "حاله ايقاف العضو",
          filter: false, 
          dataType: "string",
          defaultValue: "-", 
        },

        {
          field: "birth_date",
          header: "تاريخ الميلاد",
          filter: true,
          filterMode: "equals",
          filterElement: "filterDate",
          dataType: "date",
        },

        {
          field: "join_date",
          header: "تاريخ الإلتحاق",
          filter: true,
          filterMode: "equals",
          filterElement: "filterDate",
          dataType: "date",
        },

        {
          field: "membership.start_date",
          header: "تاريخ البدء",
          filter: false,
          dataType: "date",
        },

        {
          field: "membership.end_date",
          header: "تاريخ الإنتهاء",
          filter: false,
          dataType: "date",
        },

        {
          field: "rel_member_type.name",
          header: "نوع العضوية",
          filter: false,
          dataType: "string",
        },

        {
          field: "member_type",
          header: "كود",
          filter: true,
          filterMode: "equals",
          filterElement: "filterInputNumber",
          dataType: "string",
        },

        {
          field: "membership.rel_status.name",
          header: "الحالة",
          filter: false,
          dataType: "string",
          tag: "membership.rel_status.tag",
          defaultName: "منتهي",
          defaultTag: "label",
          body: (rowData) => {
            let value = getValueFromNestedObject(rowData, "membership.rel_status.name");
            return value ? value : "منتهي"; 
          }
        },
        {
          field: "Actions",
          header: "",
          frozen: true,
          alignFrozen: "left",
          dataType: "custom",
          url: "club/members/",
          btnText: "المزيد",
        },
      ]}
      defaultConditions={{ suspended: "-" }}
    />
  );
};

export default MembersList;
