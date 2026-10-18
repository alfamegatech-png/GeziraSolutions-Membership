import React from "react";
import LazyTable from "@components/LazyTable/LazyTable.jsx";
const SuspendedMembersList =()=>{
    return( <LazyTable
        exportName="members"
        tableHeader
        where={{ is_deleted: false  }} // This line is the key addition
        table="members"
        id="id"
        orderBy={{ member_code: "asc" }}
        paginator={true}
        rows={10}
        include={{
          membership: {
            where: { canceled: 0, secondary: 0 },
            orderBy: {
              end_date: "desc",
            },
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
            },  {
              field: "suspended",
              header: "حاله ايقاف العضو",
              filter: false, // Disable filter UI for this column
              dataType: "string",
              defaultValue: "-" // Assuming this is to display when there's no value
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
            field: "membership.InstallmentType",
            header: "نوع الدفع",
            filter: false,
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
        defaultConditions={{ suspended: "موقوف" }} 
  
      />
    );
}
export default SuspendedMembersList