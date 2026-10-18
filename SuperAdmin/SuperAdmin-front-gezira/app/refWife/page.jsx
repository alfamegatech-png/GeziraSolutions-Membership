// "use client";
// import {
//   Box,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Button,
//   CircularProgress,
//   Pagination,
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import style from "./page.module.css";
// import Swal from "sweetalert2";

// const Page = () => {
//   const [responseData, setResponseData] = useState([]);
//   const [selectedValue, setSelectedValue] = useState("");
//   const [responseValue, setResponseValue] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalCount, setTotalCount] = useState(1);
//   const PageLimit = 10;

//   const handlePageChange = (event, newPage) => {
//     setCurrentPage(newPage);
//     getRefMember({ currentPage: newPage, PageLimit });
//   };

//   const GetAllMemberShips = async () => {
//     try {
//       const response = await axios.get(
//         `http://10.1.1.115:5000/api/GetAlllookup_ref`
//       );
//       setResponseData(response.data.rows.rows);
//     } catch (error) {
//       console.log(error);
//       setError("Failed to fetch data");
//     }
//   };

//   const getRefMember = async ({ currentPage, PageLimit }) => {
//     try {
//       setLoading(true);
//       const response = await axios.post(
//         `http://10.1.1.115:5000/api/RefMembersFilterV2?PageNumber=${currentPage}&PageLimit=${PageLimit}`,
//         {
//           tableName: "member_ref",
//           filters: [
//             {
//               table: "member_ref",
//               columnName: "ref",
//               value: selectedValue,
//             },
//           ],
//         }
//       );
//       console.log(response.data.count);
//       if (response.data.count.count === 0) {
//         Swal.fire({
//           icon: "warning",
//           title: "لا يوجد بيانات",
//           text: "لا يوجد بيانات.",
//         });
//         setResponseValue([]);
//       } else {
//         setTotalCount(response.data.count.count);
//         setResponseValue(response.data.count.rows);
//       }
//     } catch (error) {
//       console.log(error);
//       setError("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     GetAllMemberShips();
//   }, []);

//   const handleChange = (event) => {
//     setSelectedValue(event.target.value);
//   };

//   const handleButtonClick = () => {
//     if (selectedValue) {

//       getRefMember({ currentPage, PageLimit });
//     }
//   };

//   return (
//     <Box>
//       <Box
//         display="flex"
//         justifyContent="center"
//         alignItems="center"
//         marginTop="10px"
//         padding="10px"
//       >
//         <FormControl size="small" sx={{ width: "30%", marginRight: "10px" }}>
//           <InputLabel sx={{ textAlign: "center" }} id="membership-select-label">
//             أختر نوع التابعية
//           </InputLabel>
//           <Select
//             labelId="membership-select-label"
//             value={selectedValue}
//             onChange={handleChange}
//           >
//             {responseData.map((item) => (
//               <MenuItem key={item.code} value={item.code}>
//                 {item.name}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <button
//           className="btn btn-success ml-10 mr-20"
//           onClick={handleButtonClick}
//         >
//           {loading ? "جاري التحميل..." : "بحث"}
//         </button>
//       </Box>
//       {loading ? (
//         <Box display="flex" justifyContent="center" alignItems="center">
//           <CircularProgress />
//         </Box>
//       ) : (
//         responseValue.length > 0 && (
//           <Box>
//           <h3>عدد الأعضاء: {totalCount}</h3>
//             <table className={`${style.tableStyle}`}>
//               <thead>
//                 <tr>
//                   <th className="text-xl">رقم العضوية</th>
//                   <th className="text-xl">الاسم</th>
//                   <th className="text-xl">تاريخ الميلاد</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {responseValue.map((data, index) => (
//                   <tr key={index}>
//                     <td>
//                       {data && data.member_code ? data.member_code : "---"}
//                     </td>
//                     <td>{data && data.name ? data.name : "---"}</td>
//                     <td>{data && data.birth_date ? data.birth_date : "---"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Box>
//         )
//       )}
//       {responseValue.length > 0 && (
//         <Box className="d-flex justify-content-center mt-3">
//           <Pagination
//             dir="ltr"
//             count={Math.ceil(totalCount / PageLimit)}
//             page={currentPage}
//             onChange={handlePageChange}
//             variant="outlined"
//             shape="rounded"
//             size="large"
//           />
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default Page;
"use client";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Pagination,
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import style from "./page.module.css";
import Swal from "sweetalert2";

const Page = () => {
  const [responseData, setResponseData] = useState([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [responseValue, setResponseValue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const PageLimit = 10;

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    getRefMember({ currentPage: newPage, PageLimit });
  };

  const GetAllMemberShips = async () => {
    try {
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetAlllookup_ref`
      );
      setResponseData(response.data.rows.rows);
    } catch (error) {
      console.log(error);
      setError("Failed to fetch data");
    }
  };

  const getRefMember = async ({ currentPage, PageLimit }) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `http://10.1.1.115:5000/api/RefMembersFilterV2?PageNumber=${currentPage}&PageLimit=${PageLimit}`,
        {
          tableName: "member_ref",
          filters: [
            {
              table: "member_ref",
              columnName: "ref",
              value: selectedValue,
            },
          ],
        }
      );
      console.log(response.data.count);
      if (response.data.count.count === 0) {
        Swal.fire({
          icon: "warning",
          title: "لا يوجد بيانات",
          text: "لا يوجد بيانات.",
        });
        setResponseValue([]);
      } else {
        setTotalCount(response.data.count.count);
        setResponseValue(response.data.count.rows);
      }
    } catch (error) {
      console.log(error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetAllMemberShips();
  }, []);

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleButtonClick = () => {
    if (selectedValue) {
      setCurrentPage(1);
      getRefMember({ currentPage: 1, PageLimit });
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        marginTop="10px"
        padding="10px"
      >
        <FormControl size="small" sx={{ width: "30%", marginRight: "10px" }}>
          <InputLabel sx={{ textAlign: "center" }} id="membership-select-label">
            أختر نوع التابعية
          </InputLabel>
          <Select
            labelId="membership-select-label"
            value={selectedValue}
            onChange={handleChange}
          >
            {responseData.map((item) => (
              <MenuItem key={item.code} value={item.code}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <button
          className="btn btn-success ml-10 mr-20"
          onClick={handleButtonClick}
        >
          {loading ? "جاري التحميل..." : "بحث"}
        </button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : (
        responseValue.length > 0 && (
          <Box>
            <h3>عدد الأعضاء: {totalCount}</h3>
            <table className={`${style.tableStyle}`}>
              <thead>
                <tr>
                  <th className="text-xl">رقم العضوية</th>
                  <th className="text-xl">الاسم</th>
                  <th className="text-xl">تاريخ الميلاد</th>
                </tr>
              </thead>
              <tbody>
                {responseValue.map((data, index) => (
                  <tr key={index}>
                    <td>
                      {data && data.member_code ? data.member_code : "---"}
                    </td>
                    <td>{data && data.name ? data.name : "---"}</td>
                    <td>{data && data.birth_date ? data.birth_date : "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )
      )}
      {responseValue.length > 0 && (
        <Box className="d-flex justify-content-center mt-3">
          <Pagination
            dir="ltr"
            count={Math.ceil(totalCount / PageLimit)}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default Page;
