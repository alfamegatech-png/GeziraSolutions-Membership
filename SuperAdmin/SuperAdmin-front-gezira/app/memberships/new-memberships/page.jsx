
"use client";
import { formik, Form, Field } from "formik";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMembership,
  addedMembership,
  notAddedMembership,
} from "@/app/state-management/slices/memberships";
import { Container, Row, Col } from "react-bootstrap";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

export default function NewMembership() {
  const [decoded, setDecoded] = useState(null);
  const [commonDat, setcommonData] = useState({
    member_code: 0,
    value_added_tax: 0,
    installment: 0,
    form_no: 0,
    join_fee: 0,
    first_time_fee: 0,
    remark: "",
  });
  const [installment, setInstallment] = useState(0); 

const bigTotal =
  (Number(commonDat.value_added_tax || 0) || 0) +
  (Number(installment || 0) || 0) + 
  (Number(commonDat.join_fee || 0) || 0) +
  (Number(commonDat.first_time_fee || 0) || 0);

  const [commonDataa, setcommonDataa] = useState({
    total_amount: bigTotal,
    serial_no: 0,
    start_date: "",
    end_date: "",
    member_order_date: "",
    status: "",
    installment: installment,
  });
  

useEffect(() => {
  setcommonDataa((prev) => ({
    ...prev,
    total_amount: bigTotal, 
    installment: installment, 
  }));
}, [installment, commonDat, bigTotal]);

  const [membershipsList, setmembershipsList] = useState([]);
  const dropdownStyle = {
    backgroundColor: "white",
    color: "black",
    border: "2px solid black",
    borderRadius: "5px",
  
  };
  const dropdownOptions = [
    { value: "1", label: "نشط" },
    { value: "2", label: "منتهي" },
    { value: "3", label: "متوقف" },
  ];
  const { memberships, isAdded, isNotAdded } = useSelector(
    (state) => state.memberships
  );
  const dispatch = useDispatch();
  useEffect(() => {
    setTimeout(() => {
      dispatch(addedMembership());
      dispatch(notAddedMembership());
    }, 5000);
  }, [isAdded, isNotAdded]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setDecoded(jwtDecode(token));
    }
    // const decoded = jwtDecode(token);
  }, []);

  const join = async (e) => {
    e.preventDefault();

    if (!decoded?.id) {
      Swal.fire("فشل بعملية الاضافة", "برجاء تسجيل الدخول مرة أخرى", "error");
      return;
    }

    const commonData = {
      ...commonDat,
      first_time_fee: Number(commonDat.first_time_fee),
      join_fee: Number(commonDat.join_fee),
      installment: Number(installment),
      value_added_tax: Number(commonDat.value_added_tax),
    };
    const membershipsListrt = `membershipsList: ${JSON.stringify(
      membershipsList
    )}`;
    let data = { commonData, membershipsList };
    try {
      const response = await axios.post(
        `http://10.1.1.115:5000/api/AddMultipleMemberships?user_id=${decoded.id}`,
        data
      );
      console.log(response);
      Swal.fire("تم الاشتراك بنجاح");
      setmembershipsList([]);
      setcommonData({
        member_code: 0,
        value_added_tax: 0,
        installment: 0,
        form_no: 0,
        join_fee: 0,
        first_time_fee: 0,
        remark: "",
      });
    } catch (e) {
      console.error(e);
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "برجاء الفحص واعادة المحاولة";
      Swal.fire("فشل بعملية الاضافة", message, "error");
    }
  };
  const append = (e) => {
    e.preventDefault();
  
    if (!commonDataa.status) {
      Swal.fire("برجاء اختيار الحالة");
      return;
    }
  
    const dataToAppend = { ...commonDataa, total_amount: bigTotal, installment };
  
    if (dataToAppend.serial_no === 0) {
      delete dataToAppend.serial_no;
    }
  
    setmembershipsList([...membershipsList, dataToAppend]);
  
    setcommonDataa({
      total_amount: 0,
      serial_no: 0,
      start_date: "",
      end_date: "",
      member_order_date: "",
      status: "",
    });
  };
  const deleteRow = (index) => {
  
    const updatedList = membershipsList.filter((_, idx) => idx !== index);
    console.log(updatedList); 
    setmembershipsList(updatedList); 
  };

  return (
    <>
      <div>
        <Container>
          <Row>
            <Col>
              {isAdded && (
                <div>
                  <div className="w-50 mx-auto mt-5" role="alert">
                    <div className="bg-green-500 text-white font-bold rounded-t px-4 py-2">
                      نجاح
                    </div>
                    <div className="border border-t-0 border-green-400 rounded-b bg-green-100 px-4 py-3 text-green-700">
                      <p>تم الاشتراك بنجاح</p>
                    </div>
                  </div>
                </div>
              )}
              {isNotAdded && (
                <div>
                  <div className="w-50 mx-auto mt-5" role="alert">
                    <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                      فشل
                    </div>
                    <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                      <p>فشل بعملية الاضافة برجاء الفحص واعادة المحاولة</p>
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Container>
        <form className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto">
          <div className="grid gap-2 mb-6 md:grid-cols-1 w-100">
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="member_code"
                  className="text-xl  font-bold text-gray-500 dark:text-black mr-2"
                >
                  رقم العضوية
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="member_code"
                  id="member_code"
                  className="bg-gray-50 border  border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رقم العضوية"
                  required
                  value={commonDat.member_code}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      member_code: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="w-100">
                <label
                  htmlFor="first_time_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  مقدم اشتراك اول مرة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="first_time_fee"
                  id="first_time_fee"
                  className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="مقدم اشتراك اول مرة"
                  required
                  value={commonDat.first_time_fee}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      first_time_fee: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="join_fee"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  رسم اشتراك
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="join_fee"
                  id="join_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسم الاشتراك"
                  required
                  value={commonDat.join_fee}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      join_fee: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="w-100">
                <label
                  htmlFor="form_no"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  رقم الاستمارة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="number"
                  name="form_no"
                  id="form_no"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رقم الاستمارة"
                  required
                  value={commonDat.form_no}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      form_no: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="value_added_tax"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  ضريبة القيمة المضافة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="value_added_tax"
                  id="value_added_tax"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="ضريبة القيمة المضافة"
                  required
                  value={commonDat.value_added_tax}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      value_added_tax: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="w-100">
  <label
    htmlFor="installment"
    className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
  >
    التقسيط
    <span className="text-danger"> * </span>
  </label>
  <input
    type="number" // Updated to number
    step="0.01" // Allows decimal input
    name="installment"
    id="installment"
    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    placeholder="التقسيط"
    value={installment}
    required
    onChange={(e) => {
      const value = e.target.value;
      const decimalValue = parseFloat(value); // Parse the value as a float
      setInstallment(isNaN(decimalValue) ? 0 : decimalValue); // Default to 0 if invalid
    }}
  />
</div>

            </div>
            <label
              htmlFor="remark"
              className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
            >
              ملاحظات
            </label>
            <input
              type="text"
              name="remark"
              id="remark"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="ملاحظات"
              required
              value={commonDat.remark}
              onChange={(e) => {
                setcommonData((prev) => ({
                  ...prev,
                  remark: e.target.value,
                }));
              }}
            />
          </div>
        </form>
        <form
          onSubmit={append}
          className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto"
        >
          <div className="grid gap-2 mb-6 md:grid-cols-1 w-100">
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="member_order_date"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  تاريخ الاشتراك
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="date"
                  name="member_order_date"
                  id="member_order_date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="تاريخ الاشتراك"
                  required
                  value={commonDataa.member_order_date}
                  onChange={(e) => {
                    setcommonDataa((prev) => ({
                      ...prev,
                      member_order_date: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="w-100">
                <label
                  htmlFor="start_date"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  تاريخ البدء
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  id="start_date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="تاريخ البدء"
                  required
                  value={commonDataa.start_date}
                  onChange={(e) => {
                    setcommonDataa((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="end_date"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  تاريخ الانتهاء
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="تاريخ الانتهاء"
                  required
                  value={commonDataa.end_date}
                  onChange={(e) => {
                    setcommonDataa((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="w-100">
                <label
                  htmlFor="serial_no"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  رقم الايصال
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="serial_no"
                  id="serial_no"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رقم الايصال"
                  required
                  value={commonDataa.serial_no}
                  onChange={(e) => {
                    setcommonDataa((prev) => ({
                      ...prev,
                      serial_no: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3  mt-2">
              <div className="w-100">
                <label
                  htmlFor="total_amount"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  الاجمالي العام
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  name="total_amount"
                  id="total_amount"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="الاجمالي العام"
                  required
                  disabled
                  value={bigTotal}
                  // onChange={(e) => {
                  //   setcommonDataa((prev) => ({
                  //     ...prev,
                  //     total_amount: e.target.value,
                  //   }));
                  // }}
                />
              </div>
              <div className="w-100">
                <label
                  htmlFor="total_amount"
                  className="block mt-2 text-xl font-bold text-gray-500 dark:text-black"
                >
                  الحالة
                  <span className="text-danger"> * </span>
                </label>
                <select
                  className="w-75 m-2"
                  as="select"
                  id="status"
                  name="status"
                  value={commonDataa.status}
                  style={dropdownStyle} // Apply styles here
                  onChange={(e) => {
                    setcommonDataa((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }));
                  }}
                >
                  <option value="" label="الحاله" />
                  {dropdownOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full w-50">
            اضافة
          </button>
        </form>
        {membershipsList && membershipsList.length !== 0 && (
          <form className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto">
            <div className="grid gap-2 mb-6 md:grid-cols-1 w-100">
              <TableContainer
                component={Paper}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <Table aria-label="rooms table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        تاريخ الاشتراك
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        تاريخ البدء
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        تاريخ الانتهاء
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        رقم الايصال
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        الاجمالي العام
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        الحالة
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "600", fontSize: "20px" }}
                      >
                        {" "}
                        حذف{" "}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {membershipsList &&
                      membershipsList.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell align="center">
                            {row?.member_order_date}
                          </TableCell>
                          <TableCell align="center">
                            {row?.start_date}
                          </TableCell>
                          <TableCell align="center">{row?.end_date}</TableCell>
                          <TableCell align="center">{row?.serial_no}</TableCell>
                          <TableCell align="center">
                            {row?.total_amount}
                          </TableCell>
                          <TableCell align="center">
                            {row?.status === "1"
                              ? "نشط"
                              : row?.status === "2"
                              ? "منتهي"
                              : "متوقف"}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton aria-label="edit">
                              <DeleteIcon
                                onClick={() => deleteRow(index)}
                                sx={{ fontSize: "30px", color: "red" }}
                              />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <button
              onClick={join}
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full w-50"
            >
              حفظ
            </button>
          </form>
        )}
      </div>
    </>
  );
}
