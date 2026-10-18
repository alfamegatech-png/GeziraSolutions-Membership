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
import Swal from "sweetalert2";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Lookupref() {
  //////////////////////////states/////////////////////////////
  const [Getlookupref, setGetlookupref] = useState([]);
  const [editlookupref, seteditlookupref] = useState(null);
  console.log(editlookupref);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [Selectedname, setSelectedname] = useState(null);
  const [Selectedmembertype, setSelectedmembertype] = useState(null);
  const [Selectedprice, setSelectedprice] = useState(null);
  const [addinputs, setaddinputs] = useState(false);
  const [addcode, setaddcode] = useState(0);
  const [addname, setaddname] = useState(null);
  const [addprice, setaddprice] = useState(0);
  const [addmembertype, setaddmembertype] = useState(null);
  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);
  /////////////////APIS////////////////////////
  const lookupref = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAlllookup_ref?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        setGetlookupref(response.data.rows.rows);
        setcount(response.data.rows.count);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };
  useEffect(() => {
    lookupref(change, size);
  }, []);
  useEffect(() => {
    lookupref(change, size);
  }, [afteredit]);
  useEffect(() => {
    lookupref(change, size);
  }, [change]);

  const lookuprefedit = async () => {
    var lookuprefsobj = {
      code: Selectedcode != null ? Selectedcode : editlookupref.code,
      name: Selectedname != null ? Selectedname : editlookupref.name,
      member_type:
        Selectedmembertype != null
          ? Selectedmembertype
          : editlookupref.member_type,
      price: Selectedprice != null ? Selectedprice : editlookupref.price,
    };
    console.log(lookuprefsobj);
    await axios
      .put(
        `http://10.1.1.115:5000/api/UpdatelookupRef?id=${editlookupref.id}`,
        lookuprefsobj
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
        setshowpagination(true);
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

  const addlookupref = async () => {
    var addlookuprefsobj = {
      code: addcode,
      name: addname,
      member_type: addmembertype,
      price: addprice,
    };
    console.log(addlookuprefsobj);
    await axios
      .post(`http://10.1.1.115:5000/api/AddlookupRef`, addlookuprefsobj)
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
        setshowpagination(true);
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
        text: "لا يمكنك استرجاع العضو مره أخري",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: " بالتأكيد",
        cancelButtonText: "لا",
      });

      if (confirmed.isConfirmed) {
        const response = await axios.delete(
          `http://10.1.1.115:5000/api/Deletelookup_Ref?id=${memberID}`
        );
        console.log(response);
        if (response.status === 200) {
          // Fetch updated list of members
          lookupref(change, size);
          Swal.fire("تم الحذف!", "تم الحذف بنجاح", "success");
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire("خطأ!", "هناك خطأ ما اثناء الحذف.", "error");
    }
  };
  //////////////////////////////////////////Functions/////////////////////////
  function onEdit(i) {
    seteditlookupref((prev) => (i === prev ? null : i));
    setshowedit(true);
    setaddinputs(false);
  }
  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }
  function clickedit() {
    lookuprefedit();
  }
  function clickadd() {
    addlookupref();
  }
  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };

  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">انواع التوابع</h1>
          <Button
            variant="contained"
            className={" fs-5 mt-4  bg-[#15803D] hover:bg-[#166534]"}
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
                <th className={`${style.t}`}>الأسم</th>
                <th className={`${style.t}`}>السعر</th>
                <th className={`${style.t}`}>نوع العضو</th>
                <th className={`${style.t}`}>التعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {Getlookupref.map((lockQual, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>{lockQual.code}</td>
                  <td className={`${style.name}`}>{lockQual.name}</td>
                  <td className={`${style.t}`}>{lockQual.price}</td>
                  <td className={`${style.t}`}>{lockQual.member_type}</td>

                  <td className={`${style.t} `}>
                    <IconButton aria-label="home">
                      <EditNoteIcon
                        onClick={() => {
                          onEdit(lockQual);
                        }}
                        sx={{ fontSize: "25px" }}
                      ></EditNoteIcon>
                    </IconButton>
                  </td>
                  <td className={`${style.t}`}>
                    <IconButton aria-label="delete">
                      <DeleteIcon
                        onClick={() => {
                          handleDelete(lockQual.id);
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
              <Stack spacing={2} direction="row ">
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editlookupref?.code ? editlookupref.code : "الكود"
                  }`}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2 "}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlookupref?.name ? editlookupref.name : "الأسم"
                  }`}
                  onChange={(e) => setSelectedname(e.target.value)}
                  className={"ms-2  w-75"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlookupref?.name ? editlookupref.price : "السعر"
                  }`}
                  onChange={(e) => setSelectedprice(e.target.value)}
                  className={"ms-2  "}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlookupref?.name
                      ? editlookupref.member_type
                      : "نوع العضو"
                  }`}
                  onChange={(e) => setSelectedmembertype(e.target.value)}
                  className={"ms-2  w-50"}
                  variant="outlined"
                />

                <Button
                  variant="contained"
                  onClick={() => {
                    clickedit();
                  }}
                  className={"w-25 fs-5 ms-2 bg-success"}
                >
                  حفظ
                </Button>
              </Stack>
            </FormControl>
          )}

          {addinputs && (
            <FormControl className={`${style.form}`} spacing={2}>
              <Stack spacing={2} direction="row">
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setaddcode(e.target.value)}
                  className={"ms-2 "}
                  label="الكود"
                  variant="outlined"
                  value={addcode}
                />
                <TextField
                  id="outlined-basic"
                  required
                  onChange={(e) => setaddname(e.target.value)}
                  className={"ms-2 w-75"}
                  label="الاسم"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setaddprice(e.target.value)}
                  className={"ms-2 "}
                  label="السعر"
                  variant="outlined"
                  value={addprice}
                />
                <TextField
                  id="outlined-basic"
                  required
                  onChange={(e) => setaddmembertype(e.target.value)}
                  className={"ms-2 w-50"}
                  label="نوع العضو"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  className={"w-25 fs-5 ms-2 bg-success"}
                  onClick={() => {
                    clickadd();
                  }}
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
