// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import style from "./page.module.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
// import { useDownloadExcel } from "react-export-table-to-excel";
// import { IconButton } from "@mui/material";
// import { useReactToPrint } from "react-to-print";
// import Swal from "sweetalert2";

// const NewMember = () => {
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [responseData, setResponseData] = useState([]);
//   const [error, setError] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [tableVisible, setTableVisible] = useState(true);
//   const componentRef = useRef();
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [totalCount, setTotalCount] = useState(0);
//   const size = 15;

//   const fetchData = async (PageNumber, pageSize) => {
//     try {
//       const params = {
//         endDate: endDate,
//         PageNumber: PageNumber,
//         PageLimit: pageSize,
//         isFirstTime: true,
//         isSeperatefee: true,
//         startDate: startDate,
//       };

//       const response = await axios.get(
//         "http://10.1.1.115:5000/api/FilterWithFirstTimeAndSeperatefee",
//         { params }
//       );

//       if (response.data.FilteredMembersDetails.length === 0) {
//         Swal.fire({
//           icon: "warning",
//           title: "No Data Available",
//           text: "There are no records available for the selected date range.",
//         });
//         return;
//       }

//       setResponseData(response.data.FilteredMembersDetails.rows);
//       setTotalCount(response.data.FilteredMembersDetails.count);
//       setError("");
//     } catch (error) {
//       setError("Error fetching data");
//       console.error("Error fetching data:", error);
//     }
//   };

//   const nextPage = () => {
//     setCurrentPage(currentPage + 1);
//   };

//   const prevPage = () => {
//     setCurrentPage(currentPage - 1);
//   };

//   useEffect(() => {
//     fetchData(currentPage, size);
//   }, [currentPage]);

//   const handleStartDateChange = (e) => {
//     setStartDate(e.target.value);
//   };

//   const handleEndDateChange = (e) => {
//     setEndDate(e.target.value);
//   };
//   const handlePrint = useReactToPrint({
//     content: () => {
//       return componentRef.current;
//     },
//     onAfterPrint: () => {

//       setCurrentPage(1);
//       setDataLoaded(false);
//     },
//   });
//   const handlePrintAllData = async () => {
//     await fetchData(1, totalCount);
//     Swal.showLoading();
//     setTimeout(() => {
//       handlePrint();
//     });
//     Swal.close();
//     // setDataLoaded(true);

//   };

//   const { onDownload } = useDownloadExcel({
//     currentTableRef: componentRef.current,
//     filename: ` تقرير الاعضاء المنتهي عضويتهم ${currentPage}`,
//     sheet: "Users",
//   });
//   // print for excel sheet

//   const exportsheet = async () => {
//     await fetchData(1, totalCount);

//     Swal.showLoading();
//     setTimeout(() => {
//       onDownload(responseData);
//     });
//     Swal.close();
//     setDataLoaded(true);

//     // settable(false);
//   };

//   return (
//     <div>
//       <h1 className="text-center mt-1">بيان بمتحصلات فترة - العضوية الجديدة</h1>
//       <div className={`${style.datePage}`}>
//         <div className={`${style.labelsStyle}`}>
//           <label htmlFor="start_date" className={`${style.lapelTitle}`}>
//             من:
//           </label>
//           <input
//             type="date"
//             id="start_date"
//             className={`${style.inputStyle}`}
//             onChange={handleStartDateChange}
//             value={startDate}
//           />
//         </div>
//         <div className={`${style.labelsStyle}`}>
//           <label htmlFor="end_date" className={`${style.lapelTitle}`}>
//             إلي:
//           </label>
//           <input
//             type="date"
//             id="end_date"
//             className={`${style.inputStyle}`}
//             onChange={handleEndDateChange}
//             value={endDate}
//             required
//           />

//           <button
//             type="button"
//             className="btn btn-success mr-20"
//             onClick={() => {
//               setDataLoaded(true);
//               fetchData(currentPage, size);
//             }}
//           >
//             بحث
//           </button>
//           {responseData && (
//             <div>
//               <IconButton aria-label="home">
//                 <FontAwesomeIcon
//                   onClick={handlePrintAllData}
//                   title="Print"
//                   icon={faFilePdf}
//                   style={{ fontSize: "35px", color: "#D10000" }}
//                 />
//               </IconButton>
//               <IconButton aria-label="home">
//                 <FontAwesomeIcon
//                   icon={faFileExcel}
//                   onClick={exportsheet}
//                   title="Export Excel Sheet"
//                   style={{ color: "#21A366", fontSize: "35px" }}
//                 />
//               </IconButton>
//             </div>
//           )}
//         </div>
//       </div>
//       {responseData.length > 0 && (
//         <div>
//           <table className={`${style.tableStyle}`}>
//             <thead>
//               <tr>
//                 <th>رقم العضوية</th>
//                 <th>الاسم</th>
//                 <th>تاريخ الايصال</th>
//                 <th>رقم الايصال</th>
//                 <th>الملاحظات</th>
//               </tr>
//             </thead>
//             <tbody>
//               {responseData.map((member, index) => (
//                 <tr key={index}>
//                   <td>
//                     {member && member.member_code ? member.member_code : "---"}
//                   </td>
//                   <td>
//                     {member && member.members && member.members.name
//                       ? member.members.name
//                       : "---"}
//                   </td>
//                   <td>
//                     {member && member.member_order_date
//                       ? member.member_order_date
//                       : "---"}
//                   </td>
//                   <td>
//                     {member && member.serial_no ? member.serial_no : "---"}
//                   </td>
//                   <td>
//                     {member && member.members && member.members.remark
//                       ? member.members.remark
//                       : "---"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <div className={`${style.pagination}`}>
//             <button
//               className="btn btn-success"
//               onClick={prevPage}
//               disabled={currentPage == 1}
//             >
//               الصفحة السابقة
//             </button>
//             <span className="text-red"> الصفحة: {currentPage}</span>
//             <button className="btn btn-success" onClick={nextPage}>
//               الصفحة التالية
//             </button>
//           </div>
//         </div>
//       )}
//       {dataLoaded && (
//         <div dir="rtl" ref={componentRef}>
//           <table className={`${style.tableStyle}`}>
//             <thead>
//               <tr>
//                 <th>رقم العضوية</th>
//                 <th>الاسم</th>
//                 <th>تاريخ الايصال</th>
//                 <th>رقم الايصال</th>
//                 <th>الملاحظات</th>
//               </tr>
//             </thead>
//             <tbody>
//               {responseData.map((member, index) => (
//                 <tr key={index}>
//                   <td>
//                     {member && member.member_code ? member.member_code : "---"}
//                   </td>
//                   <td>
//                     {member && member.members && member.members.name
//                       ? member.members.name
//                       : "---"}
//                   </td>
//                   <td>
//                     {member && member.member_order_date
//                       ? member.member_order_date
//                       : "---"}
//                   </td>
//                   <td>
//                     {member && member.serial_no ? member.serial_no : "---"}
//                   </td>
//                   <td>
//                     {member && member.members && member.members.remark
//                       ? member.members.remark
//                       : "---"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NewMember;
"use client";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import style from "./page.module.css";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";

const NewMember = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  var componentRef = useRef();
  const [loading, setLoading] = useState(false);
  const [table, settable] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  // const [totalSum, setTotalSum] = useState(0);
  const size = 15;

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

  const fetchData = async (PageNumber, pageSize) => {
    try {
      const params = {
        endDate: endDate,
        PageNumber: PageNumber,
        PageLimit: pageSize,
        isFirstTime: true,
        isSeperatefee: true,
        startDate: startDate,
      };

      const response = await axios.get(
        "http://10.1.1.115:5000/api/GetNewJoinedMembers",

        { params }
      );

      console.log(response.data);
      setResponseData(response.data.FilteredMemberships.rows);
      setTotalCount(response.data.FilteredMemberships.count);
      setError("");
    } catch (error) {
      setError("Error fetching data");
      console.error("Error fetching data:", error);
    }
  };
  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };
  useEffect(() => {
    fetchData(currentPage, size);
  }, [currentPage]);

  const handlePrint = useReactToPrint({
    content: () => {
      return componentRef.current;
    },
    onAfterPrint: () => {
      settable(false); // Disable the table after printing
      setCurrentPage(1); // Reset currentPage to 1
      setDataLoaded(false); // Reset dataLoaded to false
    },
  });
  const handlePrintAllData = async () => {
    await fetchData(1, totalCount);
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
      <h1 className="text-center mt-1">
        {" "}
        بيان بمتحصلات فترة - العضوية الجديدة لأول مرة
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
            className="btn btn-success bg-[#15803D] hover:bg-[#166534] mr-20"
            // style={{ backgroundColor: "#157347" }}
            onClick={() => {
              fetchData(currentPage, size);
            }}
          >
            بحث
          </button>
          {responseData && (
            <Button
              variant="success"
              // style={{ backgroundColor: "#157347" }}
              className="btn btn-success mr-20 bg-[#15803D] hover:bg-[#166534]"
              onClick={handlePrintAllData}
            >
              طباعة التقرير
            </Button>
          )}
        </div>
      </div>

      {responseData.length > 0 && (
        <div>
          <h1>عدد الاعضاء: {totalCount}</h1>
          <table className={`${style.tableStyle}`}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                <th>الاسم</th>
                <th>تاريخ الايصال</th>
                <th>رقم الايصال</th>
                <th>الملاحظات</th>
                <th>القيمه</th>
              </tr>
            </thead>
            <tbody>
              {responseData.map((member, index) => (
                <tr key={index}>
                  <td>{member.member_code}</td>
                  <td>{member.members ? member.members.name : "---"}</td>
                  <td>{member.member_order_date}</td>
                  <td>{member.serial_no}</td>
                  <td>{member.members ? member.members.remark : "---"}</td>
                  <td>{member.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`${style.pagination}`}>
            <button
              className="btn btn-success"
              onClick={prevPage}
              disabled={currentPage == 1}
            >
              الصفحة السابقة
            </button>
            <span className="text-red"> الصفحة: {currentPage}</span>
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
          <h1 className="text-center mt-1">
            بيان بمتحصلات فترة - العضوية الجديدة لأول مرة
          </h1>

          <table className={`${style.tableStyle}`}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                <th>الاسم</th>
                <th>تاريخ الايصال</th>
                <th>رقم الايصال</th>
                <th>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {responseData.map((member, index) => (
                <tr key={index}>
                  <td>{member.member_code}</td>
                  <td>{member.members ? member.members.name : "---"}</td>
                  <td>{member.member_order_date}</td>
                  <td>{member.serial_no}</td>
                  <td>{member.members ? member.members.remark : "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NewMember;
