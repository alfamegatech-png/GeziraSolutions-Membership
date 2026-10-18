"use client";
import { IconButton } from "@mui/material";
import style from "./page.module.css";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ReactToPrint from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";
import Swal from "sweetalert2";

const MoneyFamilies = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);
  console.log(selectedCodes);
  const [responseValue, setResponseValue] = useState([]);
  const [codeValue, setCodeValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  var componentRef = useRef(null);

  // const { onDownload } = useDownloadExcel({
  //   filename: `تقرير الاعضاء المنتهي عضويتهم`,
  //   sheet: "Users",
  // });

  const handleYearChange = (e) => {
    setYear(e.target.value);
  };

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    setYear(currentYear);
    setStartDate(`${currentYear}-06-30`);
    setEndDate(`${currentYear}-06-30`);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetAllMemberType`
      );
      console.log(response.data.rows.rows);
      setResponseData(response.data.rows.rows);
      setError("");
      setLoading(false);
    } catch (error) {
      setResponseData([]);
      setError("error fetching data");
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const parsedValue = parseInt(value, 10); // or use parseFloat if the value can be a floating-point number

    const code = responseData.find((data) => data.code === parsedValue)?.code;

    if (checked && code !== undefined) {
      setSelectedCodes((prevCodes) => [...prevCodes, code]);
    } else {
      setSelectedCodes((prevCodes) =>
        prevCodes.filter((selectedCode) => selectedCode !== code)
      );
    }
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    console.log(e.target.value);
    if (e.target.value) {
      document.getElementById("end_date").removeAttribute("required");
    } else {
      document.getElementById("end_date").setAttribute("required", "required");
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    console.log(e.target.value);
  };

  const fetchDataFromAPI = async () => {
    try {
      setLoading(true);
      if (
        !startDate ||
        !endDate
        // || selectedCodes.length === 0
      ) {
        console.error(
          "Please select start date, end date, and at least one checkbox before fetching data"
        );
        setLoading(false);
        return;
      }

      const params = {
        endDate: `${endDate}`,
        startDate: `${startDate}`,
        PageNumber: `${currentPage}`,
        PageLimit: 10,
      };

      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetFamiliesMembers`,
        { params }
      );
      console.log(response.data);
      if (response.data.FilteredMemberships.rows.length === 0) {
        Swal.fire({
          icon: "info",
          title: " لا يوجد بيانات",
          text: ".لا يوجد بيانات",
        });
        setLoading(false);
        return;
      }
      setResponseValue(response.data.FilteredMemberships);
      setCodeValue(response.data);
      setLoading(false);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setDataLoaded(false);
    fetchDataFromAPI();
  };

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  // const exportsheet = async () => {
  //   await fetchDataFromAPI();
  //   onDownload(responseValue);
  //   Swal.fire({
  //     icon: "success",
  //     title: "تم تنزيل ملف Excel بنجاح!",
  //   });
  // };

  return (
    <div>
      <h1 className="text-center mt-1">
        {" "}
        العضويات العائلية خلال العام المالي{" "}
      </h1>
      <div className={`${style.datePage}`}>
        <div>
          <label htmlFor="datepicker">من :</label>
          <input
            type="date"
            id="datepicker"
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              const selectedYear = selectedDate.getFullYear().toString();
              setYear(selectedYear);
              setMonth("06");
              setDay(30);
              setStartDate(`${year}-${month}-${day}`);
              console.log(`${year}-${month}-${day}`);
            }}
            value={startDate}
          />
        </div>
        <div className={`${style.labelsStyle}`}>
          <label htmlFor="end_date" className={`${style.lapelTitle}`}>
            إلي :
          </label>
          <input
            type="date"
            id="datepicker"
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              const selectedYear = selectedDate.getFullYear().toString();
              setYear(selectedYear);
              setMonth("06");
              setDay(30);
              setEndDate(`${year}-${month}-${day}`);
              console.log(`${year}-${month}-${day}`);
            }}
            value={endDate}
          />
        </div>
      </div>

      {/* <div className={`${style.pageContainer}`}>
        <div className={`${style.checkBoxContainer}`}>
          <div className={`${style.checkBoxColumn1}`}>
            {responseData.slice(0, 5).map((data, index) => (
              <div key={index} className={`${style.checkBox}`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="checkboxNoLabel"
                  name={data.name}
                  value={data.code}

                  onChange={handleCheckboxChange}
                />
                {data.name}({data.code})
                <span className={`${style.checkmark}`}></span>
              </div>
            ))}
          </div>
          <div className={`${style.checkBoxColumn2}`}>
            {responseData.slice(5).map((data, index) => (
              <div key={index} className={`${style.checkBox}`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="checkboxNoLabel"
                  name={data.name}
                  value={data.code}

                  onChange={handleCheckboxChange}
                />
                {data.name}({data.code})
                <span className={`${style.checkmark}`}></span>
              </div>
            ))}
          </div>
        </div>
      </div> */}
      <div className={`${style.buttonStyle}`}>
        <button className="btn btn-success ml-10" onClick={handleSearch}>
          {loading ? "جاري التحميل..." : "بحث"}
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
            content={() => componentRef}
          />
        )}
      </div>
      {dataLoaded && responseData.length > 0 && (
        <div>
          {/* {responseData && (
            <ReactToPrint
              trigger={() => (
                <IconButton aria-label="home">
                  <FontAwesomeIcon
                    icon={faFileExcel}
                    onClick={exportsheet}
                    title="Export Excel Sheet"
                    style={{ color: "#21A366", fontSize: "35px" }}
                  />
                </IconButton>
              )}
              content={() => componentRef}
            />
          )} */}
          <div>
            <div dir="rtl" ref={(el) => (componentRef = el)}>
              <div className={`${style.codeStyle}`}>
                <h2> العضويات العائلية خلال العام المالي </h2>
                <h2> الأعضاء : {codeValue.FilteredMemberships.count}</h2>
                <h2></h2>
              </div>
              <div>
                <table className={`${style.tableStyle}`}>
                  <thead>
                    <tr>
                      <th className="text-xl">رقم العضوية</th>
                      <th className="text-xl">الاسم</th>
                      <th className="text-xl">تاريخ الجدبد</th>
                      <th className="text-xl">انتهاء العضوية </th>
                      <th className="text-xl"> تاريخ الايصال </th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseValue.rows.map((data, index) => (
                      <tr key={index}>
                        <td>
                          {data && data.member_code ? data.member_code : "---"}
                        </td>
                        <td>
                          {data && data.membersRef && data.membersRef.name
                            ? data.membersRef.name
                            : "---"}
                        </td>
                        <td>
                          {data && data.start_date ? data.start_date : "---"}
                        </td>
                        <td>{data && data.end_date ? data.end_date : "---"}</td>
                        <td>
                          {data && data.member_order_date
                            ? data.member_order_date
                            : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${style.pagination}`}>
              <button
                className="btn btn-success"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                {" "}
                الصفحة السابقة
              </button>
              <span className={`${style.spanStyle}`}>
                الصفحة: {currentPage}
              </span>
              <button
                className="btn btn-success"
                onClick={nextPage}
                disabled={currentPage * 10 >= responseValue.rows.length}
              >
                الصفحة التالية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyFamilies;
