import React from "react";
import LazyTable from "@components/LazyTable/LazyTable.jsx";
const RelatedMembersList = ({
  reloadKey,
  member_code,
  selectedRefMember,
  setSelectedRefMember,
}) => {
  return (
    <LazyTable
      key={reloadKey}
      table="members_ref"
      id="id"
      selectionMode="single"
      selection={selectedRefMember}
      onSelectionChange={(e) => setSelectedRefMember(e.value)}
      tableHeader={
        <div
          style={{
            background: "red",
            color: "white",
            borderRadius: "12px",
            padding: 2,
          }}
        >
          الأعضاء فوق 21 سنة{" "}
        </div>
      }
      paginator={true}
      rows={5}
      include={{
        rel_member_type: { select: { name: true } },
        rel_ref: true,
      }}
      filter={{
        member_code: member_code,
        deleted: 0,
      }}
      columns={[
        {
          field: "member_code",
          header: "رقم العضوية",
          filter: false,
          filterMode: "contains",
          dataType: "number",
        },

        {
          field: "name",
          header: "الاسم",
          filter: false,
          filterMode: "contains",
          dataType: "string",
        },
        {
          field: "rel_ref.name",
          header: "صلة القرابة",
          filter: false,
          dataType: "string",
        },
        {
          field: "birth_date",
          header: "تاريخ الميلاد",
          filter: false,
          condition: true,
          dataType: "date",
        },
        {
          field: "rel_ref.member_type",
          header: "نوع العضوية",
          filter: false,
          dataType: "string",
        },

        {
          field: "Actions",
          header: "",
          frozen: true,
          alignFrozen: "left",
          dataType: "custom",
          url: "club/members/ref/",
          btnText: "المزيد",
        },
      ]}
    />
  );
};

export default RelatedMembersList;
