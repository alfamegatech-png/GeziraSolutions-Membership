"use client";
import React, { useState, useEffect, useRef } from "react";
import style from "./page.module.css";
import axios from "axios";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useDownloadExcel } from "react-export-table-to-excel";
import { IconButton } from "@mui/material";

const RenewDate = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  console.log(responseData);
  const [error, setError] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [responseValue, setResponseValue] = useState([]);
  const [codeValue, setCodeValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [dataLoaded, setDataLoaded] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const size = 15;
  const [isPrinted, setIsPrinted] = useState(false);
  const [table, settable] = useState(false);
  const [loading, setLoading] = useState(false);

  const componentRef = useRef(null);
  // const { onDownload } = useDownloadExcel({
  //   currentTableRef: componentRef.current,
  //   filename: ` تجديد العضوية ${currentPage}`,
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
  const [obj, setObj] = useState({
    tableName: "Member",
    filters: [
      {
        table: "Member",
        columnName: "member_type",
        value: selectedCodes,
      },
      {
        table: "memberships",
        columnName: "member_order_date",
        value: `${startDate},${endDate}`,
        type: "date",
      },
    ],
  });
  console.log(obj);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetAllMemberType`
      );
      setResponseData(response.data.rows.rows);
      setError("");
      setLoading(false);
    } catch (error) {
      setResponseData([]);
      setError("Error fetching data");
      console.log(error);
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const { checked, value } = e.target;
    const parsedValue = parseInt(value, 10); // or use parseFloat if the value can be a floating-point number

    // Debugging: log parsedValue to verify
    console.log("Parsed value:", parsedValue);

    // Find the code in responseData
    const code = responseData.find((data) => data.code === parsedValue)?.code;

    // Debugging: log the code to verify if it's found or undefined
    console.log("Found code:", code);

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

  const fetchDataFromAPI = async (currentPage, size) => {
    try {
      if (!startDate || !endDate || selectedCodes.length === 0) {
        console.error(
          "Please select start date, end date, and at least one checkbox before fetching data"
        );
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `http://10.1.1.115:5000/api/MembersFilterv2?PageNumber=${currentPage}&PageLimit=${size}&Range=true`,
        obj
      );

      setResponseValue(response.data.count.rows);
      setCodeValue(response.data.count);
      console.log(codeValue.count);
      settable(true);
      setTotalCount(response.data.count.count);
      console.log(response.data.count);
      console.log(obj);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.log(obj);
    }
  };

  const handleSearchClick = () => {
    fetchDataFromAPI();
  };

  useEffect(() => {
    fetchDataFromAPI(currentPage, size);
  }, [currentPage, selectedCodes]);

  useEffect(() => {
    setObj((prevObj) => ({
      ...prevObj,
      filters: prevObj.filters.map((filter) => {
        if (filter.columnName === "member_type") {
          return {
            ...filter,
            value: selectedCodes,
          };
        }
        return filter;
      }),
    }));
  }, [selectedCodes]);

  useEffect(() => {
    setObj((prevObj) => ({
      ...prevObj,
      filters: prevObj.filters.map((filter) => {
        if (filter.columnName === "member_order_date") {
          return {
            ...filter,
            value: `${startDate},${endDate}`,
          };
        }
        return filter;
      }),
    }));
  }, [startDate, endDate]);

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };
  useEffect(() => {
    fetchDataFromAPI(currentPage, size);
  }, [currentPage]);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      settable(false); // Disable the table after printing
      setCurrentPage(1); // Reset currentPage to 1
      setDataLoaded(false); // Reset dataLoaded to false
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
      <div className={`${style.headStyle}`}>بيانات بمتحصلات فترة </div>
      <div className={`${style.datePage}`}>
        <div className={`${style.labelsStyle}`}>
          <label htmlFor="start_date" className={`${style.lapelTitle}`}>
            من :
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
            إلي :
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
      <div className={`${style.pageContainer}`}>
        <div className={`${style.checkBoxContainer}`}>
          <div className={`${style.checkBoxColumn1}`}>
            {responseData.slice(0, 5).map((data, index) => (
              <div key={index} className={`${style.checkBox}`}>
                <input
                  type="checkbox"
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
                  type="checkbox"
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
          className="btn btn-success ml-10"
          onClick={() => {
            fetchDataFromAPI(currentPage, size);
          }}
        >
          {" "}
          بحث
        </button>
      </div>
      {dataLoaded && responseData && (
        <div>
          <div className={`${style.printStyle}`}>
            <IconButton aria-label="home">
              <FontAwesomeIcon
                onClick={handlePrintAllData}
                title="Print"
                icon={faFilePdf}
                style={{ fontSize: "35px", color: "#D10000" }}
              />
            </IconButton>
            {/* <IconButton aria-label="home">
              <FontAwesomeIcon
                icon={faFileExcel}
                onClick={exportsheet}
                title="Export Excel Sheet"
                style={{ color: "#21A366", fontSize: "35px" }}
              />
            </IconButton> */}
          </div>
          <div ref={componentRef}>
            <div dir="rtl" className={`${style.codeStyle}`}>
              <div className={`${style.titlePrint}`}>
                <h1>تقرير تجديد العضوية</h1>
                <h2>إحصائيات الأعضاء: {codeValue.count}</h2>
              </div>
            </div>
            <div>
              <table className={`${style.tableStyle}`}>
                <thead>
                  <tr>
                    <th className="text-xl">رقم العضوية</th>
                    <th className="text-xl">الاسم</th>
                    <th className="text-xl">تاريخ الايصال</th>
                    <th className="text-xl">رقم الايصال</th>
                    <th className="text-xl">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {responseValue.map((data, index) => (
                    <tr key={index}>
                      <td>
                        {data && data.member_code ? data.member_code : "------"}
                      </td>
                      <td>{data && data.name ? data.name : "------"}</td>
                      <td>
                        {data &&
                        data.memberships &&
                        data.memberships[0] &&
                        data.memberships[0].member_order_date
                          ? data.memberships[0].member_order_date
                          : "------"}
                      </td>
                      <td>
                        {data &&
                        data.memberships &&
                        data.memberships[0] &&
                        data.memberships[0].serial_no
                          ? data.memberships[0].serial_no
                          : "------"}
                      </td>

                      <td>
                        {data &&
                        data.memberships &&
                        data.memberships[0] &&
                        data.memberships[0].total_amount !== null
                          ? data.memberships[0].total_amount
                          : "------"}
                      </td>
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
                  {" "}
                  الصفحة السابقة
                </button>
                <span className={`${style.spanStyle}`}>
                  الصفحة: {currentPage}
                </span>
                {/* <span className={`${style.spanStyle}`}>
                  عدد البيانات: {totalCount}
                </span> */}
                <button
                  className="btn btn-success"
                  onClick={nextPage}
                  disabled={currentPage * size >= totalCount}
                >
                  الصفحة التالية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {dataLoaded && (
        <div ref={componentRef}>
          <div className={`${style.codeStyle}`}>
            <h2>إحصائيات الأعضاء:</h2>
            <h3>{codeValue.count}</h3>
          </div>
          <div>
            <table className={`${style.tableStyle}`}>
              <thead>
                <tr>
                  <th className="text-xl">رقم العضوية</th>
                  <th className="text-xl">الاسم</th>
                  <th className="text-xl">تاريخ الايصال</th>
                  <th className="text-xl">رقم الايصال</th>
                  <th className="text-xl">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {responseValue.map((data, index) => (
                  <tr key={index}>
                    <td>
                      {data && data.member_code ? data.member_code : "------"}
                    </td>
                    <td>{data && data.name ? data.name : "------"}</td>
                    <td>
                      {data &&
                      data.memberships &&
                      data.memberships[0] &&
                      data.memberships[0].member_order_date
                        ? data.memberships[0].member_order_date
                        : "------"}
                    </td>
                    <td>
                      {data &&
                      data.memberships &&
                      data.memberships[0] &&
                      data.memberships[0].serial_no
                        ? data.memberships[0].serial_no
                        : "------"}
                    </td>

                    <td>
                      {data &&
                      data.memberships &&
                      data.memberships[0] &&
                      data.memberships[0].total_amount !== null
                        ? data.memberships[0].total_amount
                        : "------"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default RenewDate;
