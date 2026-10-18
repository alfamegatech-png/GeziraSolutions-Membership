"use client";
import style from "./page.module.css";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";

const MoneyDetails = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);
  console.log(selectedCodes);
  const [responseValue, setResponseValue] = useState([]);
  const [codeValue, setCodeValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const size = 15;
  const [loading, setLoading] = useState(false);
  const [table, settable] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const componentRef = useRef();

  // const { onDownload } = useDownloadExcel({
  //   currentTableRef: componentRef.current,
  //   filename: ` تقرير الاعضاء المنتهي عضويتهم ${currentPage}`,
  //   sheet: "Users",
  // });
  // print for excel sheet

  // const exportsheet = async () => {
  //   await fetchDataFromAPI(1, totalCount);

  //   setDataLoaded(true);
  //   Swal.showLoading();
  //   setTimeout(() => {
  //     onDownload(responseValue);
  //   });
  //   Swal.close();

  //   settable(false);
  // };

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
      setResponseData(response.data.rows.rows);
      // console.log(response.data.rows.rows);
      setError("");
      setLoading(false);
    } catch (error) {
      setResponseData([]);
      setError("error fetching data");
      console.log(error);
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
    if (e.target.value) {
      document.getElementById("end_date").removeAttribute("required");
    } else {
      document.getElementById("end_date").setAttribute("required", "required");
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const fetchDataFromAPI = async (PageNumber, pageSize) => {
    try {
      setLoading(true);
      if (!startDate || !endDate || selectedCodes.length === 0) {
        console.error(
          "Please select start date, end date, and at least one checkbox before fetching data"
        );
        setLoading(false);
        return;
      }

      const params = {
        member_type: selectedCodes.join(","),
        endDate: endDate,
        PageNumber: PageNumber,
        PageLimit: pageSize,
        startDate: startDate,
      };

      const response = await axios.get(
        `http://10.1.1.115:5000/api/FilterWithEndDateAndType`,
        { params }
      );

      if (response.data.FilteredMembersDetails.length === 0) {
        Swal.fire({
          icon: "info",
          title: " لا يوجد بيانات",
          text: ".لا يوجد بيانات",
        });
        setLoading(false);
        return;
      }

      setResponseValue(response.data.FilteredMembersDetails);
      setCodeValue(response.data);
      settable(true);
      setTotalCount(response.data.count);
      setLoading(false);
      console.log("Filtered Members Details");
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };
  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };
  useEffect(() => {
    fetchDataFromAPI(currentPage, size);
  }, [currentPage]);

  // for print pdf files
  const handlePrint = useReactToPrint({
    content: () => {
      return componentRef.current;
    },
    onAfterPrint: () => {
      settable(false);
      setCurrentPage(1);
      // setDataLoaded(false);
    },
  });
  const handlePrintAllData = async () => {
    await fetchDataFromAPI(1, totalCount);
    setDataLoaded(true);
    Swal.showLoading();
    setTimeout(() => {
      handlePrint();
    });

    Swal.close();
    settable(false);
  };

  return (
    <div>
      <h1 className="text-center mt-1">احصائيات الاعضاء خلال العالم المالي </h1>
      <div className={`${style.datePage}`}>
        <div className={`${style.labelsStyle}`}>
          <label htmlFor="start_date" className={`${style.lapelTitle}`}>
            من :
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
      <div className={`${style.pageContainer}`}>
        <div className={`${style.checkBoxContainer}`}>
          <div className={`${style.checkBoxColumn1}`}>
            {responseData.slice(0, 5).map((data, index) => (
              <div key={index} className={`${style.checkBox}`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="checkboxNoLabel"
                  value={data.code}
                  name={data.name}
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
      </div>
      <div className={`${style.buttonStyle}`}>
        <button
          className="btn btn-success"
          onClick={() => {
            fetchDataFromAPI(currentPage, size);
          }}
        >
          {loading ? "جاري التحميل..." : "بحث"}
        </button>
        <IconButton aria-label="home">
          <FontAwesomeIcon
            onClick={handlePrintAllData}
            title="Print"
            icon={faFilePdf}
            style={{ fontSize: "35px", color: "#D10000" }}
          />
        </IconButton>
      </div>
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
      {dataLoaded && responseData && (
        <div>
          <div dir="rtl" ref={componentRef}>
            <div className={`${style.titlePrint}`}>
              <h3> تقرير احصائيات الاعضاء خلال العالم المالي</h3>
              <h4> الأعضاء:{codeValue.count}</h4>
            </div>
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
                {responseValue.map((data, index) => (
                  <tr key={index}>
                    <td>
                      {data && data.member_code ? data.member_code : "---"}
                    </td>
                    <td>
                      {data && data.members && data.members.name
                        ? data.members.name
                        : "---"}
                    </td>
                    <td>{data && data.start_date ? data.start_date : "---"}</td>
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
          <div className={`${style.pagination}`}>
            <button
              className="btn btn-success"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              {" "}
              الصفحة السابقة
            </button>
            <span className={`${style.spanStyle}`}>الصفحة: {currentPage}</span>
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
    </div>
  );
};
export default MoneyDetails;
