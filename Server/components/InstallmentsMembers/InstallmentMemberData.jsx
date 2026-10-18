import React, { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";

const InstallmentMemberData = ({ memberData }) => {
    const {
      ClientBank,
      ClubBank,
        installment,
        is_deleted,
        member_code,
        member_name,
        name_check_holder,
        paymentTerm,
        paymentFrequency
      } = memberData;
  return (
   <div>
    {memberData ? ( <div
      dir="rtl"
      style={{
        border: "5px solid var(--mainColor)",
        borderRadius: "12px",
        background: "var(--gardientMinColor)",
      }}
    >
      <div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">الاسم</span>
            <InputText disabled value={member_name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">بنك النادي</span>
            <InputText disabled value={ClubBank?.bank_name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">رقم العضوية</span>
            <InputText disabled value={member_code || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">بنك العميل</span>
            <InputText disabled value={ClientBank?.bank_name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">قيمة تحصيل الشيك</span>
            <InputText
              disabled
              value={ClubBank?.bank_fee_collection}
            />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">القسط</span>
            <InputText disabled value={installment} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">فائدة البنك </span>
            <InputText disabled value={ClubBank?.bank_interest} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">اسم حامل الشيك</span>
            <InputText
              disabled
              value={name_check_holder}
            />
          </div>
        </div>

        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">فترة التقسيط</span>
            <InputText disabled value={paymentTerm?.term_name} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">الشيكات الحالية</span>
            <InputText disabled value={is_deleted?"تم الإنتهاء من التسديد":"لم يتم الإنتهاء من التسديد"} /> 
          </div>
        </div>

        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon text-white">طريقة التقسيط</span>
            <InputText disabled value={paymentFrequency?.name} />
          </div>
        </div>
      </div>
    </div> ) : ""}
   </div> )
}

export default InstallmentMemberData