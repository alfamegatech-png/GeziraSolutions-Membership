"use client";
import React, { useEffect, useRef, useState } from "react";
import style from "./page.module.css";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";

const EndDateMember = () => {
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [table, setTable] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const componentRef = useRef(null);
  const size = 10;

  const handleDateChange = (e) => {
    setEndDate(e.target.value);
  };

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    setYear(currentYear);
    setEndDate(`${currentYear}-06-30`);
    fetchData(1, size);
  }, []);

  const fetchData = async (PageNumber, pageSize) => {
    try {
      const params = {
        PageNumber: PageNumber,
        PageLimit: pageSize,
        end_date: endDate,
      };

      const response = await axios.get(
        "http://10.1.1.115:5000/api/GetAllEndedMemberships",
        { params }
      );
      console.log(response);

      setResponseData(response.data);
      setTotalCount(response.data.count);
      setError("");
    } catch (error) {
      setResponseData(null);
      setError("Error fetching data");
    }
  };

  const nextPage = () => {
    const nextPageNumber = currentPage + 1;
    if (currentPage * size < totalCount) {
      setCurrentPage(nextPageNumber);
      fetchData(nextPageNumber, size);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const prevPageNumber = currentPage - 1;
      setCurrentPage(prevPageNumber);
      fetchData(prevPageNumber, size);
    }
  };

  useEffect(() => {
    fetchData(currentPage, size);
  }, [currentPage]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      setTable(false);
      setDataLoaded(false);
    },
  });

  const handlePrintAllData = async () => {
    await fetchData(1, totalCount);
    setDataLoaded(true);
    Swal.showLoading();
    handlePrint();
    setDataLoaded(false);
    Swal.close();
    setTable(false);
  };

  return (
    <div>
      <div className={style.parentDiv}>
        <label htmlFor="end_date" className={style.lapelTitle}>
          تقرير الاعضاء المنتهي عضويتهم بتاريخ :{" "}
        </label>
        <input
          type="date"
          id="datepicker"
          onChange={handleDateChange}
          value={endDate}
        />
        <button
          type="button"
          // style={{ backgroundColor: "#365D3E" }}
          className="btn btn-success bg-[#15803D] hover:bg-[#166534] mr-5"
          onClick={() => {
            setCurrentPage(1);
            fetchData(1, size);
          }}
        >
          بحث
        </button>
        {responseData && (
          <div>
            <IconButton aria-label="home">
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

      {responseData && !dataLoaded && (
        <div>
          <div className={style.titlePrint}>
            <h1>تقرير الاعضاء المنتهي عضويتهم</h1>
            <h2>عدد الأعضاء : {totalCount}</h2>
          </div>
          <div className={style.parent}>
            <table className={style.table} ref={componentRef}>
              <thead>
                <tr>
                  <th>رقم العضوية</th>
                  <th> الاسم</th>
                  <th>نوع العضوية </th>
                  <th> تاريخ التجديد</th>
                  <th> نهاية العضوية</th>
                  <th> تاريخ الميلاد</th>
                </tr>
              </thead>
              <tbody>
                {responseData.members.map((member, index) => (
                  <tr key={index}>
                    <td>{member.member_code || "---"}</td>
                    <td>{member.name || "---"}</td>
                    <td>
                      {member.memberType ? member.memberType.name : "---"}
                    </td>
                    <td>{member.memberships[0].member_order_date || "---"}</td>
                    <td>{member.memberships[0].end_date || "---"}</td>
                    <td>{member.birth_date || "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={style.pagination}>
            <button
              className="btn btn-success"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              الصفحة السابقة
            </button>
            <span className={style.spanStyle}>الصفحة: {currentPage}</span>
            <button
              className="btn btn-success"
              onClick={nextPage}
              disabled={currentPage * size >= totalCount}
            >
              الصفحة التالية
            </button>
          </div>
        </div>
      )}

      {dataLoaded && (
        <div dir="rtl" ref={componentRef}>
          <div className={style.titlePrint}>
            <h1>تقرير الاعضاء المنتهي عضويتهم</h1>
            <h2>عدد الأعضاء : {totalCount}</h2>
          </div>
          <table className={style.table}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                <th> الاسم</th>
                <th>نوع العضوية </th>
                <th> تاريخ التجديد</th>
                <th> نهاية العضوية</th>
                <th> تاريخ الميلاد</th>
              </tr>
            </thead>
            <tbody>
              {responseData.members.map((member, index) => (
                <tr key={index}>
                  <td>{member.member_code || "---"}</td>
                  <td>{member.name || "---"}</td>
                  <td>{member.memberType ? member.memberType.name : "---"}</td>
                  <td>{member.memberships[0].member_order_date || "---"}</td>
                  <td>{member.memberships[0].end_date || "---"}</td>
                  <td>{member.birth_date || "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EndDateMember;
