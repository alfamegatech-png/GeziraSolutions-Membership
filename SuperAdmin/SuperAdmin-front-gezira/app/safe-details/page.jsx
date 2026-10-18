"use client";

import React, { useRef, useState } from "react";
import style from "./page.module.css";
import axios from "axios";
import ReactToPrint from "react-to-print";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";
import Swal from "sweetalert2";

const SafeDetails = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState("");
  const componentRef = useRef();
  // const { onDownload } = useDownloadExcel({
  //   currentTableRef: componentRef.current,
  //   filename: `تقرير الاعضاء المنتهي عضويتهم`,
  //   sheet: "Users",
  // });

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    if (e.target.value) {
      document.getElementById("end_date").removeAttribute("required");
    } else {
      document.getElementById("end_date").setAttribute("required", "required");
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetTotalAmountOfAllFields?endDate=${endDate}&startDate=${startDate}`
      );
      setResponseData(response.data.result);
      setError("");
    } catch (error) {
      setResponseData([]);
      setError("Error fetching data");
      console.log(error);
    }
  };

  // const exportsheet = async () => {
  //   await fetchData();
  //   onDownload(responseData);
  //   Swal.fire({
  //     icon: "success",
  //     title: "Excel file downloaded successfully!",
  //   });
  // };

  return (
    <div className={style.tableContainer}>
      <h1 className="text-center mt-1">إجماليات الخزن</h1>
      <div className={`${style.datePage}`}>
        <div className={`${style.labelsStyle}`}>
          <label htmlFor="start_date" className={`${style.lapelTitle}`}>
            من:
          </label>
          <input
            type="date"
            id="start_date"
            className={`${style.inputStyle}`}
            onChange={handleStartDateChange}
            value={startDate}
          />
        </div>
        <div className={`${style.labelsStyle}`}>
          <label htmlFor="end_date" className={`${style.lapelTitle}`}>
            إلي:
          </label>
          <input
            type="date"
            id="end_date"
            className={`${style.inputStyle}`}
            onChange={handleEndDateChange}
            value={endDate}
            required
          />
        </div>
      </div>
      <div className={`${style.buttonStyle}`}>
        <button
          type="button"
          className="btn btn-success bg-[#15803D] hover:bg-[#166534]"
          onClick={fetchData}
          // style={{ backgroundColor: "#157347" }}
        >
          بحث
        </button>
        {responseData && (
          <ReactToPrint
            trigger={() => (
              <IconButton aria-label="home">
                <FontAwesomeIcon
                  title="Print"
                  icon={faFilePdf}
                  style={{ fontSize: "35px", color: "#D10000" }}
                />
              </IconButton>
            )}
            content={() => componentRef.current}
          />
        )}
        {/* {responseData && (
          <IconButton aria-label="home">
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={exportsheet}
              title="Export Excel Sheet"
              style={{ color: "#21A366", fontSize: "35px" }}
            />
          </IconButton>
        )} */}
      </div>
      <div dir="rtl">
        <table className={`${style.styleTable}`} ref={componentRef}>
          <thead className={`${style.tableStyle}`}>
            <tr>
              <th>الخزينة</th>
              <th>غرامة تأخير</th>
              <th>غرامات سابقة</th>
              <th>رسوم صيانة وانشاء</th>
              <th>رسوم كارنيه</th>
              <th>صندوق الزمالة</th>
              <th>رسوم التحويل والفصل</th>
              <th>رسوم تجديد</th>
              <th>ضريبة القيمة المضافة</th>
              <th>رسوم سباحة</th>
              <th>رسوم اشتراك اول مره</th>
              <th>رسوم انضمام</th>
              <th>تقسيط</th>
              <th>رسوم اضافة تابع</th>
              <th>رسوم سنوات سابقة</th>
              <th>فصل عضوية</th>
              <th>الاجمالي</th>
            </tr>
          </thead>
          <tbody className={`${style.textTable}`}>
            {responseData.map((data, index) => (
              <tr key={index}>
                <td>{data.safe_no ? data.safe_no : "خزينة الأدمن"}</td>
                <td>{data.penalty}</td>
                <td>{data.previousPenalties}</td>
                <td>{data.maintainance}</td>
                <td>{data.card}</td>
                <td>{data.fellowshipFund}</td>
                <td>{data.transferSeparation}</td>
                <td>{data.renew}</td>
                <td>{data.tax}</td>
                <td>{data.swimming}</td>
                <td>{data.firsttime}</td>
                <td>{data.joinfees}</td>
                <td>{data.install}</td>
                <td>{data.newref}</td>
                <td>{data.prev}</td>
                <td>{data.seperate}</td>
                <td>{data.totalamount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SafeDetails;
