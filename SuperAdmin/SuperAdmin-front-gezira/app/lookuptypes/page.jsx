"use client";
import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import style from "./page.module.css";
import axios from "axios";
import {
  TextField,
  Button,
  FormControl,
  Typography,
  Box,
  Stack,
  Pagination,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
export default function Lookuptypes() {
  //////////////////////////states//////////
  const [GetlookupTypes, setGetlookupTypes] = useState([]);
  const [editlocktype, seteditlocktype] = useState(null);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [SelectedAddtypes, setSelectedAddtypes] = useState(null);
  const [Selectedsupscription, setSelectedsupscription] = useState(null);
  const [Selectedaddedvalue, setSelectedaddedvalue] = useState(null);
  const [Selectedcardfee, setSelectedcardfee] = useState(null);
  const [Selectedvalueaddedtax, setSelectedvalueaddedtax] = useState(null);
  const [Selectedtotalamount, setSelectedtotalamount] = useState(null);
  const [SelectedExpireddate, setExpireddate] = useState(null);
  const [addinputs, setaddinputs] = useState(false);
  const [addcode, setaddcode] = useState(0);
  const [addAddtypes, setaddAddtypes] = useState("");
  const [addsupscription, setaddsupscription] = useState(0);
  const [addaddedvalue, setaddedvalue] = useState(0);
  const [addcardfee, setaddcardfee] = useState(0);
  const [addvalueaddedtax, setaddvalueaddedtax] = useState(0);
  const [addtotalamount, setaddtotalamount] = useState(0);
  const [addExpireddate, setaddExpireddate] = useState(null);
  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);

  /////////////////APIS////////////////////////
  const lookupTypes = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAlllookup_Types?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        setGetlookupTypes(response.data.rows.rows);
        setcount(response.data.rows.count);
        console.log(response);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };
  useEffect(() => {
    lookupTypes(change, size);
  }, []);

  useEffect(() => {
    lookupTypes(change, size);
  }, [afteredit]);
  useEffect(() => {
    lookupTypes(change, size);
  }, [change]);

  const editlookupTypes = async (params) => {
    var lookupTypesobj = {
      code: Selectedcode != null ? Selectedcode : editlocktype.code,
      Add_types:
        SelectedAddtypes != null ? SelectedAddtypes : editlocktype.Add_types,
      supscription:
        Selectedsupscription != null
          ? Selectedsupscription
          : editlocktype.supscription,
      added_value:
        Selectedaddedvalue != null
          ? Selectedaddedvalue
          : editlocktype.added_value,
      card_fee:
        Selectedcardfee != null ? Selectedcardfee : editlocktype.card_fee,
      value_added_tax:
        Selectedvalueaddedtax != null
          ? Selectedvalueaddedtax
          : editlocktype.value_added_tax,
      total_amount:
        Selectedtotalamount != null
          ? Selectedtotalamount
          : editlocktype.total_amount,
      Expired_date:
        SelectedExpireddate != null
          ? SelectedExpireddate
          : editlocktype.Expired_date,
    };

    await axios
      .put(
        `http://10.1.1.115:5000/api/UpdatelookupTypes?id=${editlocktype.id}`,
        lookupTypesobj
      )
      .then((response) => {
        console.log(response);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "تم التعديل",
          showConfirmButton: false,
          timer: 1500,
        });
        setafteredit(!afteredit);
        setshowedit(false);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "يرجي التأكد من صحة البيانات وعدم تكرارها",
          showConfirmButton: false,
          timer: 1500,
        });
      });
  };

  const addlookupType = async (params) => {
    var addlookupTypesobj = {
      code: addcode,
      Add_types: addAddtypes,
      supscription: addsupscription,
      added_value: addaddedvalue,
      card_fee: addcardfee,
      value_added_tax: addvalueaddedtax,
      total_amount: addtotalamount,
      Expired_date: addExpireddate,
    };

    await axios
      .post(`http://10.1.1.115:5000/api/AddlookupTypes`, addlookupTypesobj)
      .then((response) => {
        console.log(response);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "تم الاضافة",
          showConfirmButton: false,
          timer: 1500,
        });
        setafteredit(!afteredit);
        setaddinputs(false);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "يرجي التأكد من صحة البيانات وعدم تكرارها",
          showConfirmButton: false,
          timer: 1500,
        });
      });
  };

  const handleDelete = async (memberID) => {
    try {
      const confirmed = await Swal.fire({
        title: "هل تريد الحذف",
        text: "لا يمكنك استرجاع العضو مرة أخرى",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: " بالتأكيد",
        cancelButtonText: "لا",
      });

      if (confirmed.isConfirmed) {
        const response = await axios.delete(
          `http://10.1.1.115:5000/api/DeleteLookup_Types?id=${memberID}`
        );
        console.log(response);

        if (response.status === 200) {
          lookupTypes(change, size); // Assuming this function exists to refresh data
          Swal.fire("Deleted!", "تم الحذف بنجاح", "success");
        } else {
          console.error(error);
          Swal.fire("خطأ!", "هناك خطأ ما اثناء الحذف.", "error");
        }
      }
    } catch (error) {
      console.error("Delete Error:", error);
      Swal.fire(
        "Error!",
        "An error occurred while deleting the member.",
        "error"
      );
    }
  };

  //////////////////////////////////////////Functions/////////////////////////
  function onEdit(i) {
    const newarr = GetlookupTypes.filter((prev) => i === prev.id);
    console.log(...newarr);

    seteditlocktype(...newarr);
    setExpireddate(newarr[0].Expired_date);
    setshowedit(true);
    setaddinputs(false);
  }

  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }

  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };

  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">أضافة التوابع</h1>

          <Button
            variant="contained"
            className={" fs-5 mt-4 bg-[#15803D] hover:bg-[#166534]"}
            onClick={() => {
              Add();
            }}
          >
            إضافة
          </Button>

          <table dir="rtl" className={`${style.table}`}>
            <thead>
              <tr>
                <th className={`${style.t}`}>الكود</th>
                <th className={`${style.t}`}>إضافة التوابع</th>
                <th className={`${style.t}`}>القيمة المضافة</th>
                <th className={`${style.t}`}>رسوم الأشتراك</th>
                <th className={`${style.t}`}>رسوم البطاقة</th>
                <th className={`${style.t}`}>ضريبة القيمة المضافة</th>
                <th className={`${style.t}`}>الاجمالي</th>
                <th className={`${style.t}`}>تاريخ الأنتهاء</th>
                <th className={`${style.t}`}>التعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {GetlookupTypes.map((locktype, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>{locktype.code}</td>
                  <td className={`${style.name}`}>{locktype.Add_types}</td>
                  <td className={`${style.t}`}>{locktype.added_value}</td>
                  <td className={`${style.t}`}>{locktype.supscription}</td>
                  <td className={`${style.t}`}>{locktype.card_fee}</td>
                  <td className={`${style.t}`}>{locktype.value_added_tax}</td>
                  <td className={`${style.t}`}>{locktype.total_amount}</td>
                  <td className={`${style.t}`}>{locktype.Expired_date}</td>
                  <td className={`${style.t} `}>
                    <IconButton aria-label="home">
                      <EditNoteIcon
                        onClick={() => {
                          onEdit(locktype.id);
                        }}
                        sx={{ fontSize: "25px" }}
                      ></EditNoteIcon>
                    </IconButton>
                  </td>
                  <td className={`${style.t}`}>
                    <IconButton aria-label="delete">
                      <DeleteIcon
                        onClick={() => {
                          handleDelete(locktype.id);
                        }}
                        sx={{ fontSize: "25px" }}
                      />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showpagination && (
            <div className="d-flex justify-content-center mt-3 mb-3 ">
              <Pagination
                count={Math.ceil(count / size)}
                page={change}
                onChange={handlePageChange}
                variant="outlined"
                shape="rounded"
                size="large"
                dir="ltr"
              />
            </div>
          )}
          {showedit && (
            <FormControl className={`${style.form}`} spacing={2}>
              <Stack direction="d-flex row ">
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.code ? editlocktype.code : "الكود"
                  }`}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlocktype?.Add_types
                      ? editlocktype.Add_types
                      : "إضافة التوابع"
                  }`}
                  onChange={(e) => setSelectedAddtypes(e.target.value)}
                  className={"ms-2 mt-3 mb-4 w-25"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.supscription
                      ? editlocktype.supscription
                      : "القيمة المضافة"
                  }`}
                  onChange={(e) => setSelectedsupscription(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.added_value
                      ? editlocktype.added_value
                      : "رسوم الأشتراك"
                  }`}
                  onChange={(e) => setSelectedaddedvalue(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />

                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.card_fee
                      ? editlocktype.card_fee
                      : "رسوم البطاقة"
                  }`}
                  onChange={(e) => setSelectedcardfee(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.value_added_tax
                      ? editlocktype.value_added_tax
                      : "ضريبة القيمة المضافة"
                  }`}
                  onChange={(e) => setSelectedvalueaddedtax(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlocktype?.total_amount
                      ? editlocktype.total_amount
                      : "الاجمالي"
                  }`}
                  onChange={(e) => setSelectedtotalamount(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <input
                  type="date"
                  id="end_date"
                  className={`${style.inputStyle} mt-3 ms-2`}
                  onChange={(e) => setExpireddate(e.target.value)}
                  value={SelectedExpireddate || ""}
                />

                <Button
                  variant="contained"
                  className={"fs-5 ms-2  h-25 bg-success"}
                  onClick={editlookupTypes}
                  sx={{ marginTop: "1.6%" }}
                >
                  حفظ
                </Button>
              </Stack>
            </FormControl>
          )}
          {addinputs && (
            <FormControl className={`${style.form}`} spacing={2}>
              <Stack direction="d-flex row ">
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  label="الكود"
                  onChange={(e) => setaddcode(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                  value={addcode}
                />
                <TextField
                  id="outlined-basic"
                  required
                  label="إضافة التوابع"
                  onChange={(e) => setaddAddtypes(e.target.value)}
                  className={"ms-2 mt-3 mb-4 w-25"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  required
                  label="القيمة المضافة"
                  onChange={(e) => setaddsupscription(e.target.value)}
                  value={addsupscription}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  label="رسوم الأشتراك"
                  onChange={(e) => setaddedvalue(e.target.value)}
                  value={addaddedvalue}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />

                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  label="رسوم البطاقة"
                  onChange={(e) => setaddcardfee(e.target.value)}
                  value={addcardfee}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  label="ضريبة القيمة المضافة"
                  onChange={(e) => setaddvalueaddedtax(e.target.value)}
                  value={addvalueaddedtax}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  label="الاجمالي"
                  onChange={(e) => setaddtotalamount(e.target.value)}
                  className={"ms-2 mt-3 mb-4"}
                  variant="outlined"
                  value={addtotalamount}
                />
                <input
                  type="date"
                  id="end_date"
                  className={`${style.inputStyle} mt-3 ms-2`}
                  onChange={(e) => setaddExpireddate(e.target.value)}
                  required
                />

                <Button
                  variant="contained"
                  className={"fs-5 ms-2  h-25 bg-success"}
                  onClick={addlookupType}
                  sx={{ marginTop: "1.6%" }}
                >
                  إضافة
                </Button>
              </Stack>
            </FormControl>
          )}
        </div>
      </Container>
    </>
  );
}
