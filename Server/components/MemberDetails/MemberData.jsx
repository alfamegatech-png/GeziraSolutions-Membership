import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { getImage } from "@components/Members/member";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
const MemberData = ({ selectedMember }) => {
  const [image, setImage] = useState();

  const {
    image_name,
    rel_member_type,
    name,
    national_id,
    member_code,
    birth_date,
    address,
    rel_area,
    rel_city,
    rel_job,
    rel_marital_status,

    rel_nationality,
    rel_qual,
    rel_ref,
    rel_religion,
    rel_section,
    rel_sex,
    rel_trans,
    job_address,
    job_tel,
    suspended,
    tel,
    remark,
    member_order_date,
    join_date,
    birth_place,
  } = selectedMember;

  useEffect(() => {
    (async () => {
      setImage(await getImage("members", member_code));
    })();
  }, []);

  const calculateAge = (birthdate) => {
    // Convert the birthdate string into a Date object
    const birthDate = new Date(birthdate);
    const currentDate = new Date(); // Get the current date
  
    // Calculate the difference in years
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    
  
    // Check if the current month is less than the birth month or
    // if the current month is the same as the birth month but the current day is less than the birth day
    // If so, decrement the age by 1 because the birthday hasn't occurred yet this year
    if (currentDate.getMonth() < birthDate.getMonth() || 
       (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  const formattedBirthDate = new Date(birth_date).toLocaleDateString();
  const age = calculateAge(birth_date);

  return (
    <div
      dir="rtl"
      style={{
        border: "5px solid var(--mainColor)",
        borderRadius: "12px",
        background: "var(--gardientMinColor)",
      }}
    >
      <div className="card flex justify-content-center">
        <img
          alt="photo"
          style={{
            maxHeight: "15rem",
            height: "15rem",
            width: "auto",
            borderRadius: "12px",
            marginTop: "1rem",
            marginBottom: "1rem",
            border: "5px solid var(--mainColor)",
          }}
          src={image}
        />
      </div>
      <div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الاسم</span>
            <InputText disabled value={name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الهاتف</span>
            <InputText disabled value={tel || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">رقم العضوية</span>
            <InputText disabled value={member_code || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">نوع العضوية</span>
            <InputText disabled value={rel_member_type?.name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">تاريخ الإلتحاق</span>
            <InputText
              disabled
              value={new Date(join_date).toLocaleDateString()}
            />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">القطاع</span>
            <InputText disabled value={rel_section?.name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الرقم القومي</span>
            <InputText disabled value={national_id || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">تاريخ الميلاد</span>
            <InputText
              disabled
              value={`${formattedBirthDate} (${age} سنة)`}
            />
          </div>
        </div>

        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">المنطقة</span>
            <InputText disabled value={rel_area?.name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">المدينة</span>
            <InputText disabled value={rel_city?.name || ""} />
          </div>
        </div>

        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">العنوان</span>
            <InputText disabled value={address || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">محل الميلاد</span>
            <InputText disabled value={birth_place || ""} />
          </div>
        </div>

        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الجنسية</span>
            <InputText disabled value={rel_nationality?.name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الديانة</span>
            <InputText disabled value={rel_religion?.name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الجنس</span>
            <InputText disabled value={rel_sex?.name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الحالة الإجتماعية</span>
            <InputText disabled value={rel_marital_status?.name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">المؤهل الدراسي</span>
            <InputText disabled value={rel_qual?.name || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الوظيفة</span>
            <InputText disabled value={rel_job?.name || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">عنوان العمل</span>
            <InputText disabled value={job_address || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">هاتف العمل</span>
            <InputText disabled value={job_tel || ""} />
          </div>
        </div>
        <div className="card flex flex-column md:flex-row">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">الحالة</span>
            <InputText disabled value={suspended || ""} />
          </div>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">ملاحظات</span>
            <InputText disabled value={remark || ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberData;
