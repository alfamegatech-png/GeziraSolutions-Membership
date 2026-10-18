"use client";
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

const VAT_RATE = 0.14;
const toMoney = (value) => Number(value || 0) || 0;

export default function NewMembership() {
  const [commonDat, setcommonData] = useState({
    member_order_date: "",
    end_date: "",
    start_date: "",
  });
  const [commonDataa, setcommonDataa] = useState({
    total_amount: 0,
    serial_no: 0,
    status: 0,
    member_code: 0,
    value_added_tax: 0,
    renew_fee: 0,
    prev_years_fee: 0,
    delay_penalty: 0,
    previous_penalties: 0,
    fellowship_fund_fee: 0,
    transfer_separation_fee: 0,
    membership_card_fee: 0,
    form_no: 0,
    maintenance_fee: 0,
    swimming: 0,
    remark: "",
  });

  const bigTotal =
    (Number(commonDataa.value_added_tax || 0) || 0) +
    (Number(commonDataa.renew_fee || 0) || 0) +
    (Number(commonDataa.prev_years_fee || 0) || 0) +
    (Number(commonDataa.delay_penalty || 0) || 0) +
    (Number(commonDataa.previous_penalties || 0) || 0) +
    (Number(commonDataa.fellowship_fund_fee || 0) || 0) +
    (Number(commonDataa.transfer_separation_fee || 0) || 0) +
    (Number(commonDataa.membership_card_fee || 0) || 0) +
    (Number(commonDataa.swimming || 0) || 0) +
    (Number(commonDataa.maintenance_fee || 0) || 0);

  const updateTransferSeparationFee = (value) => {
    setcommonDataa((prev) => {
      const oldTransfer = toMoney(prev.transfer_separation_fee);
      const newTransfer = toMoney(value);
      const valueAddedTax = toMoney(prev.value_added_tax) +
        (newTransfer - oldTransfer) * VAT_RATE;

      return {
        ...prev,
        transfer_separation_fee: value,
        value_added_tax: Number(valueAddedTax.toFixed(2)),
      };
    });
  };

  useEffect(() => {
    if (bigTotal) {
      setcommonDataa((old) => ({ ...old, total_amount: bigTotal || 0 }));
    }
  }, [bigTotal]);

  var [membershipsList, setmembershipsList] = useState([]);
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
    }, 3500);
  }, [isAdded, isNotAdded]);

  // Check if running in a browser
  const isBrowser = typeof window !== "undefined";
  console.log(isBrowser, "checking for browser");

  const token = isBrowser ? localStorage.getItem("token") : null;
  const decoded = isBrowser ? jwtDecode(token) : null;

  const join = async (e) => {
    e.preventDefault();
    if (!decoded?.id) {
      Swal.fire("فشل بعملية الاضافة", "برجاء تسجيل الدخول مرة أخرى", "error");
      return;
    }

    const commonData = commonDat;
    const membershipsListrt = `membershipsList: ${JSON.stringify(
      membershipsList
    )}`;
    var data = { commonData, membershipsList };
    console.log(data);
    try {
      const response = await axios.post(
        `http://10.1.1.115:5000/api/AddMultipleMemberships?user_id=${decoded.id}`,
        data
      );
      console.log(response);
      Swal.fire("تم الاشتراك بنجاح");
      setmembershipsList([]);
      setcommonData({
        member_order_date: "",
        end_date: "",
        start_date: "",
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
    setmembershipsList([
      ...membershipsList,
      {
        ...commonDataa,
        total_amount: bigTotal,
        value_added_tax: Number(commonDataa.value_added_tax),
        renew_fee: Number(commonDataa.renew_fee),
        prev_years_fee: Number(commonDataa.prev_years_fee),
        delay_penalty: Number(commonDataa.delay_penalty),
        previous_penalties: Number(commonDataa.previous_penalties),
        fellowship_fund_fee: Number(commonDataa.fellowship_fund_fee),
        transfer_separation_fee: Number(commonDataa.transfer_separation_fee),
        membership_card_fee: Number(commonDataa.membership_card_fee),
        maintenance_fee: Number(commonDataa.maintenance_fee),
        swimming: Number(commonDataa.swimming),
      },
    ]);
    setcommonDataa({
      total_amount: "",
      serial_no: "",
      status: "",
      member_code: 0,
      value_added_tax: "",
      renew_fee: "",
      prev_years_fee: "",
      delay_penalty: "",
      previous_penalties: "",
      fellowship_fund_fee: "",
      transfer_separation_fee: "",
      membership_card_fee: "",
      form_no: "",
      maintenance_fee: "",
      swimming: "",
      remark: "",
    });
  };

  const deleteRow = (index) => {
    // Filter out the row with the specified index
    const updatedList = membershipsList.filter((_, idx) => idx !== index);
    console.log(updatedList); // Verify in console if needed
    setmembershipsList(updatedList); // Update state with filtered list
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
            <div className="flex gap-3  mt-2"></div>
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
                  value={commonDat.member_order_date}
                  onChange={(e) => {
                    setcommonData((prev) => ({
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
                  value={commonDat.start_date}
                  onChange={(e) => {
                    setcommonData((prev) => ({
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
                  value={commonDat.end_date}
                  onChange={(e) => {
                    setcommonData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </form>
        <form
          onSubmit={append}
          className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto"
        >
          <div className="grid gap-4 mb-6 md:grid-cols-1 w-100">
            <div className="flex gap-3">
              <div className="w-50">
                <label
                  htmlFor="member_code"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رقم العضوية
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="number"
                  id="member_code"
                  name="member_code"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رقم العضوية"
                  value={commonDataa.member_code}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      member_code: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="serial_no"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  الرقم التسلسلي
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="number"
                  id="serial_no"
                  name="serial_no"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="الرقم التسلسلي"
                  value={commonDataa.serial_no}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      serial_no: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="status"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  الحالة
                  <span className="text-danger"> * </span>
                </label>
                <select
                  id="status"
                  name="status"
                  style={dropdownStyle}
                  value={commonDataa.status}
                  onChange={(e) => {
                    console.log(e.target.value);
                    setcommonDataa((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }));
                  }}
                  required
                >
                  <option value="">اختر</option>
                  {dropdownOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-50">
                <label
                  htmlFor="total_amount"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  المبلغ الاجمالي
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="total_amount"
                  name="total_amount"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="المبلغ الاجمالي"
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      total_amount: e.target.value,
                    }))
                  }
                  required
                  disabled
                  value={bigTotal}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="value_added_tax"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  ضريبة القيمة المضافة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="value_added_tax"
                  name="value_added_tax"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="ضريبة القيمة المضافة"
                  value={commonDataa.value_added_tax}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      value_added_tax: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="renew_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رسوم التجديد
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="renew_fee"
                  name="renew_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسوم التجديد"
                  value={commonDataa.renew_fee}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      renew_fee: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="prev_years_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  سنوات سابقة
                </label>
                <input
                  type="text"
                  id="prev_years_fee"
                  name="prev_years_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="سنوات سابقة"
                  value={commonDataa.prev_years_fee}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      prev_years_fee: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="delay_penalty"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  غرامة تأخير
                </label>
                <input
                  type="text"
                  id="delay_penalty"
                  name="delay_penalty"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="غرامة تأخير"
                  value={commonDataa.delay_penalty}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      delay_penalty: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="previous_penalties"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  غرامات سابقة
                </label>
                <input
                  type="text"
                  id="previous_penalties"
                  name="previous_penalties"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="غرامات سابقة"
                  value={commonDataa.previous_penalties}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      previous_penalties: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="fellowship_fund_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  صندوق الزمالة
                </label>
                <input
                  type="text"
                  id="fellowship_fund_fee"
                  name="fellowship_fund_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="صندوق الزمالة"
                  value={commonDataa.fellowship_fund_fee}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      fellowship_fund_fee: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="transfer_separation_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رسوم التحويل والفصل
                </label>
                <input
                  type="text"
                  id="transfer_separation_fee"
                  name="transfer_separation_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسوم التحويل والفصل"
                  value={commonDataa.transfer_separation_fee}
                  onChange={(e) => updateTransferSeparationFee(e.target.value)}
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="membership_card_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رسوم الكارنيه
                </label>
                <input
                  type="text"
                  id="membership_card_fee"
                  name="membership_card_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسوم الكارنيه"
                  value={commonDataa.membership_card_fee}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      membership_card_fee: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="form_no"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رقم النموذج
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="number"
                  id="form_no"
                  name="form_no"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رقم النموذج"
                  value={commonDataa.form_no}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      form_no: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="maintenance_fee"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رسوم الصيانة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="maintenance_fee"
                  name="maintenance_fee"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسوم الصيانة"
                  value={commonDataa.maintenance_fee}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      maintenance_fee: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="w-50">
                <label
                  htmlFor="swimming"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  رسوم السباحة
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="swimming"
                  name="swimming"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="رسوم السباحة"
                  value={commonDataa.swimming}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      swimming: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="w-50">
                <label
                  htmlFor="remark"
                  className="text-xl font-bold text-gray-500 dark:text-black mr-2"
                >
                  ملاحظات
                  <span className="text-danger"> * </span>
                </label>
                <input
                  type="text"
                  id="remark"
                  name="remark"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="ملاحظات"
                  value={commonDataa.remark}
                  onChange={(e) =>
                    setcommonDataa((prev) => ({
                      ...prev,
                      remark: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            اضف الى القائمة
          </button>
        </form>

        <Container>
          <Row>
            <Col>
              <div className="mt-5">
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>رقم العضوية</TableCell>
                        <TableCell>الرقم التسلسلي</TableCell>
                        <TableCell>الحالة</TableCell>
                        <TableCell>المبلغ الاجمالي</TableCell>
                        <TableCell>ضريبة القيمة المضافة</TableCell>
                        <TableCell>رسوم التجديد</TableCell>
                        <TableCell>سنوات سابقة</TableCell>
                        <TableCell>غرامة تأخير</TableCell>
                        <TableCell>غرامات سابقة</TableCell>
                        <TableCell>صندوق الزمالة</TableCell>
                        <TableCell>رسوم التحويل والفصل</TableCell>
                        <TableCell>رسوم الكارنيه</TableCell>
                        <TableCell>رقم النموذج</TableCell>
                        <TableCell>رسوم الصيانة</TableCell>
                        <TableCell>رسوم السباحة</TableCell>
                        <TableCell>ملاحظات</TableCell>
                        <TableCell>حذف</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {membershipsList.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.member_code}</TableCell>
                          <TableCell>{item.serial_no}</TableCell>
                          <TableCell>
                            {dropdownOptions.find(
                              (option) => option.value === item.status
                            )?.label || "غير محدد"}
                          </TableCell>
                          <TableCell>{item.total_amount}</TableCell>
                          <TableCell>{item.value_added_tax}</TableCell>
                          <TableCell>{item.renew_fee}</TableCell>
                          <TableCell>{item.prev_years_fee}</TableCell>
                          <TableCell>{item.delay_penalty}</TableCell>
                          <TableCell>{item.previous_penalties}</TableCell>
                          <TableCell>{item.fellowship_fund_fee}</TableCell>
                          <TableCell>{item.transfer_separation_fee}</TableCell>
                          <TableCell>{item.membership_card_fee}</TableCell>
                          <TableCell>{item.form_no}</TableCell>
                          <TableCell>{item.maintenance_fee}</TableCell>
                          <TableCell>{item.swimming}</TableCell>
                          <TableCell>{item.remark}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => deleteRow(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </Col>
          </Row>
        </Container>
        <div className="d-flex justify-content-center mt-5">
          <button
            onClick={join}
            className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            اضف
          </button>
        </div>
      </div>
    </>
  );
}
