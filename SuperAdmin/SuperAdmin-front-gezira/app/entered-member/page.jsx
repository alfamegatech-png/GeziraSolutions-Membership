// export default EnteredMember;
"use client";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import style from "./page.module.css";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";

const EnteredMember = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  var componentRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tableVisible, setTableVisible] = useState(true); // State variable to control table visibility
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSum, setTotalSum] = useState(0);
  const [trigger, setTrigger] = useState(0);

  const size = 15;

  // const { onDownload } = useDownloadExcel({
  //   currentTableRef: componentRef.current,
  //   filename: ` تقرير الاعضاء المنتهي عضويتهم ${currentPage}`,
  //   sheet: "Users",
  // });
  // const exportsheet = async () => {
  //   await fetchData(0, totalCount);
  //   setDataLoaded(true);
  //   Swal.showLoading();
  //   setTimeout(() => {
  //     handlePrint();
  //     onDownload(responseData);
  //   });

  //   Swal.close();
  //   // setTable(false);
  // };

  const handleStartDateChange = (e) => {
    setCurrentPage(1);

    setStartDate(e.target.value);
    if (e.target.value) {
      document.getElementById("end_date").removeAttribute("required");
    } else {
      document.getElementById("end_date").setAttribute("required", "required");
    }
  };

  const handleEndDateChange = (e) => {
    setCurrentPage(1);
    setEndDate(e.target.value);
  };

  const fetchData = async (PageNumber, pageSize) => {
    try {
      const params = {
        endDate: endDate,
        PageNumber: PageNumber,
        PageLimit: pageSize,
        startDate: startDate,
      };
      console.log(params);
      const response = await axios.get(
        "http://10.1.1.115:5000/api/GetAllAddedRefMempership",
        { params }
      );
      console.log(response.data);
      if (response?.data.members.length === 0) {
        Swal.fire({
          icon: "error",
          title: "No Data Found",
          text: "No data available for the selected date range",
        });
        return;
      }

      setResponseData(response.data);
      setTotalCount(response.data.totalRecords);
      setTotalPages(response.data.totalPages);
      // setTotalSum(response.data.totalAmountSum);
      // console.log(responseData);

      setError("");
    } catch (error) {
      setError("Error fetching data");
      console.error("Error fetching data:", error);
    }
  };
  // console.log(responseData);

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
    setTrigger((pre) => pre + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
    setTrigger((pre) => pre + 1);
  };

  useEffect(() => {
    fetchData(currentPage, size);
  }, [trigger]);

  const handlePrint = useReactToPrint({
    content: () => {
      return componentRef.current;
    },
    onAfterPrint: async () => {
      setTableVisible(true); // Disable the table after printing
      setCurrentPage(1); // Reset currentPage to 1
      setDataLoaded(false); // Reset dataLoaded to false
      setTableVisible(true);
      await fetchData(currentPage, size);
    },
  });

  const handlePrintAllData = async () => {
    if (startDate === "" || endDate === "") {
      Swal.fire({
        icon: "error",
        title: "No Data Found",
        text: "No data available for the selected date range",
      });
      return;
    }
    await fetchData(1, totalCount);
    setDataLoaded(true);
    setTableVisible(false);
    Swal.showLoading();
    setTimeout(() => {
      handlePrint();
    });

    Swal.close();
    // settable(false);
  };

  return (
    <div>
      <h1 className="text-center mt-1">
        {" "}
        تقرير المنضمين جدد للاعضاء التابعين في الفترة من{" "}
      </h1>
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
          <button
            type="button"
            className="btn btn-success mr-20 bg-[#15803D] hover:bg-[#166534]"
            // style={{ backgroundColor: "#157347" }}
            onClick={() => {
              fetchData(currentPage, size);
            }}
          >
            بحث
          </button>
          <IconButton aria-label="home">
            <FontAwesomeIcon
              onClick={handlePrintAllData}
              title="Print"
              icon={faFilePdf}
              style={{ fontSize: "35px", color: "#D10000" }}
            />
          </IconButton>
          {responseData && (
            <div>
              {/* <IconButton aria-label="home">
                <FontAwesomeIcon
                  icon={faFileExcel}
                  onClick={exportsheet}
                  title="Export Excel Sheet"
                  style={{ color: "#21A366", fontSize: "35px" }}
                />
              </IconButton> */}
            </div>
          )}
        </div>
      </div>
      {tableVisible && responseData.members && (
        <div>
          <div className="me-3">
            <h3>عدد الأعضاء الجدد : {totalCount}</h3>
            <h4>عددالصفحات : {totalPages}</h4>
          </div>
          {/* <h1>عدد الأعضاء الجدد :{totalCount}</h1> */}
          {/* <h1>الإجمالي : {totalSum} </h1> */}
          <table dir="rtl" className={`${style.tableStyle}`}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                <th>الاسم</th>
                <th>الجنس</th>
                <th>تاريخ الميلاد</th>
                <th>تاريخ الانضمام</th>
                <th>درجة القرابة </th>
              </tr>
            </thead>
            <tbody>
              {responseData.members.map((member, index) => (
                <tr key={index}>
                  <td>{member.member_code ? member.member_code : "--"}</td>
                  <td>{member ? member.name : "--"}</td>
                  <td>
                    {member.sex
                      ? member.sex == 1
                        ? "ذكر"
                        : member.sex == 2 && "انثي"
                      : "--"}
                  </td>
                  <td>{member.birth_date ? member.birth_date : "--"}</td>
                  <td>{member.join_date ? member.join_date : "--"}</td>
                  <td>{member.lookup_ref ? member.lookup_ref?.name : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`${style.pagination}`}>
            <button
              className="btn btn-success"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              الصفحة السابقة
            </button>
            <span className="font-medium"> الصفحة: {currentPage}</span>
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
          <div className="me-3">
            <h3>عدد الأعضاء الجدد : {totalCount}</h3>
            <h4>عددالصفحات : {totalPages}</h4>
          </div>
          <table className={`${style.tableStyle}`}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                <th>الاسم</th>
                <th>الجنس</th>
                <th>تاريخ الميلاد</th>
                <th>تاريخ الانضمام</th>
                <th>درجة القرابة </th>
              </tr>
            </thead>

            <tbody>
              {responseData &&
                responseData.members?.map((member, index) => (
                  <tr key={index}>
                    <td>{member.member_code ? member.member_code : "--"}</td>
                    <td>{member.name ? member.name : "-- "}</td>
                    <td>
                      {member.sex
                        ? member.sex == 1
                          ? "ذكر"
                          : member.sex == 2 && "انثي"
                        : "--"}
                    </td>
                    <td>{member.birth_date ? member.birth_date : "-- "}</td>
                    <td>{member.join_date ? member.join_date : "--"}</td>
                    <td>
                      {member.lookup_ref ? member.lookup_ref?.name : "--"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EnteredMember;
