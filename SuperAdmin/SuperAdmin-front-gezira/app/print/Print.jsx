import React, { forwardRef } from "react";
import style from "./style.module.css";

const PrintView =forwardRef(({ responseData }, ref) => {
  const splitMemberships = (memberships, chunkSize = 10) => {
    const result = [];
    for (let i = 0; i < memberships.length; i += chunkSize) {
      result.push(memberships.slice(i, i + chunkSize));
    }
    return result;
  };

  return (
    <div ref={ref} dir="rtl">
      <div className={style.headStyle}> سجل الاعضاء</div>
      <div className={`${style.parent}`}>
        <div className={`${style.paragraph}`}>
          <p>نوع العضويه: {responseData?.memberType?.name || "---"}</p>
          <p>اسم العضو: {responseData?.name || "---"}</p>
          <p>الرقم القومي: {responseData?.national_id || "---"}</p>
          <p>الوظيفة: {responseData?.memberJob?.name || "---"}</p>
        </div>
        <div className={`${style.para}`}>
          <p>تاريخ الميلاد: {responseData?.birth_date || "---"}</p>
          <p>الفئة: {responseData?.memberSection?.name || "---"}</p>
          <p>المؤهل العالي: {responseData?.memberQual?.name || "---"}</p>
          <p>العنوان: {responseData?.address || "---"}</p>
        </div>
      </div>
      <div>
        <h3 className={`${style.headName}`}>الأعضاء التابعين :</h3>
        <div className={`${style.parent}`}>
          <table className={`${style.tableRef}`}>
            <thead>
              <tr>
                <th className="text-xl">الاسم</th>
                <th className="text-xl">تاريخ الميلاد</th>
                <th className="text-xl">نوع التبعيه</th>
                <th className="text-xl">تاريخ الالتحاق</th>
              </tr>
            </thead>
            <tbody>
              {responseData.memberRefs.map((member, index) => (
                <tr key={index}>
                  <td>{member ? member.name : "---"}</td>
                  <td>{member ? member.birth_date : "---"}</td>
                  <td>{member.lookupRef ? member.lookupRef.name : "---"}</td>
                  <td>{member ? member.join_date : "---"}</td>

                </tr>
                
              ))}
              <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr> <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr> <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr> <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr> <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className={`${style.headName}`}> السجلات :</h3>
        <div className={style.tableContainer}>
          {splitMemberships(responseData.memberships).map(
            (membershipChunk, chunkIndex) => (
              <table className={`${style.table}`} key={chunkIndex}>
                <thead>
                  <tr>
                    <th className="text-xl">رقم الايصال</th>
                    <th className="text-xl">تاريخ الايصال</th>
                    <th className="text-xl">القيمة </th>
                    <th className="text-xl">الملاحظات </th>
                  </tr>
                </thead>
                <tbody>
                  {membershipChunk.map((member, index) => (
                    <tr key={index}>
                      <td>{member ? member.serial_no : "---"}</td>
                      <td>{member ? member.member_order_date : "---"}</td>
                      <td>{member ? member.total_amount : "---"}</td>
                      <td>{member ? member.remark : "---"}</td>
                    </tr>
                  ))}
                  <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr><tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr><tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr><tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr><tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
});
PrintView.displayName = 'PrintView';
export default PrintView;
