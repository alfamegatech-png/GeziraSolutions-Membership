"use client";
import React, { useRef, useState } from "react";
import style from "./page.module.css";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { IconButton } from "@mui/material";
import PrintView from "../print/Print";

const MemberRegister = () => {
  const [memberNumber, setMemberNumber] = useState(0);
  const [responseData, setResponseData] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(true);
  const printRef = useRef();

  const handleMemberNumberChange = (e) => {
    setMemberNumber(e.target.value);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setDataLoaded(true); // Reset dataLoaded to true before fetching new data
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetMemberDetails?member_code=${memberNumber}`
      );

      if (response.data.members.length === 0) {
        Swal.fire({
          icon: "error",
          title: "لا يوجد بيانات",
          text: "لا يوجد بيانات متاحة للعضو",
        });
        setDataLoaded(false); // Set dataLoaded to false if there's no data
      } else {
        setResponseData(response.data.members[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setDataLoaded(false), // Hide data after printing
  });

  const handlePrintAllData = async () => {
    await fetchData();
    setDataLoaded(true);
    Swal.showLoading();
    setTimeout(() => {
      handlePrint();
      Swal.close();
    });
  };

  return (
    <div>
      <div className={`${style.headStyle}`}>
        <div className={`{style.labelName}`}>
          <label htmlFor="member_register" className={style.labelStyle}>
            رقم العضويه:{" "}
          </label>
        </div>
        <input
          type="number"
          id="member_register"
          className={`${style.inputStyle}`}
          placeholder="أدخل رقم العضوية"
          value={memberNumber}
          onChange={handleMemberNumberChange}
        />
        <button
          type="button"
          className="btn btn-success bg-[#15803D] hover:bg-[#166534]"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? "جاري التحميل... " : "بحث"}
        </button>
        {responseData && (
          <div>
            <IconButton aria-label="print">
              <FontAwesomeIcon
                onClick={handlePrintAllData}
                title="Print"
                icon={faFilePdf}
                style={{ fontSize: "35px", color: "#D10000" }}
              />
            </IconButton>
          </div>
        )}
      </div>

      {dataLoaded && responseData && (
        <>
          <div dir="rtl">
            <div className={style.headStyle1}> سجل الاعضاء</div>
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
                <table className={`${style.table}`}>
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
                        <td>
                          {member.lookupRef ? member.lookupRef.name : "---"}
                        </td>
                        <td>{member ? member.join_date : "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className={`${style.headName}`}> السجلات :</h3>
              <div className={`${style.parent}`}>
                <table className={`${style.table}`}>
                  <thead>
                    <tr>
                      <th className="text-xl">رقم الايصال</th>
                      <th className="text-xl">تاريخ الايصال</th>
                      <th className="text-xl">القيمة </th>
                      <th className="text-xl">الملاحظات </th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData.memberships.map((member, index) => (
                      <tr key={index}>
                        <td>{member ? member.serial_no : "---"}</td>
                        <td>{member ? member.member_order_date : "---"}</td>
                        <td>{member ? member.total_amount : "---"}</td>
                        <td>{member ? member.remark : "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Print Component */}
          <div style={{ display: "none" }}>
            <PrintView ref={printRef} responseData={responseData} />
          </div>
        </>
      )}
    </div>
  );
};

export default MemberRegister;
