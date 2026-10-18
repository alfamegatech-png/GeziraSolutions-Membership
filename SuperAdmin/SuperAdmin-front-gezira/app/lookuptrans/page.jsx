"use client";
import React, { useEffect, useRef, useState } from "react";
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
  Select,
  MenuItem,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";

export default function Lookuptrans() {
  //////////////////////////states//////////
  const [Getlookuptrans, setGetlookuptrans] = useState([]);
  const [editlookuptrans, seteditlookuptrans] = useState(null);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [Selectedname, setSelectedname] = useState(null);
  const [selectedDead, setSelectedDead] = useState(null);
  const [selectedSeprate, setSelectedSeprate] = useState(null);
  const [addinputs, setaddinputs] = useState(false);
  const [addcode, setaddcode] = useState(0);
  const [addname, setaddname] = useState(null);
  const [addDead, setAddDead] = useState(null);
  const [addSeprate, setAddSeprate] = useState(null);

  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);

  /////////////////APIS////////////////////////
  const lookuptrans = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAlllookupTrans?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        setGetlookuptrans(response.data.rows.rows);
        setcount(response.data.rows.count);
        console.log(response.data.rows);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };
  useEffect(() => {
    lookuptrans(change, size);
  }, []);
  useEffect(() => {
    lookuptrans(change, size);
  }, [afteredit]);
  useEffect(() => {
    lookuptrans(change, size);
  }, [change]);

  const lookuptransedit = async () => {
    var lookuptransobj = {
      code: Selectedcode != null ? Selectedcode : editlookuptrans.code,
      name: Selectedname != null ? Selectedname : editlookuptrans.name,
      IsDead: selectedDead != null ? selectedDead : editlookuptrans.IsDead,
      IsSeperated:
        selectedSeprate != null ? selectedSeprate : editlookuptrans.IsSeperated,
    };
    await axios
      .put(
        `http://10.1.1.115:5000/api/UpdateMemberTrans?id=${editlookuptrans.id}`,
        lookuptransobj
      )
      .then((response) => {
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

  const addlookuptrans = async () => {
    var addlookupStatussobj = {
      code: addcode,
      name: addname,
      IsDead: addDead,
      IsSeperated: addSeprate,
    };
    await axios
      .post(`http://10.1.1.115:5000/api/AddlookupTrans`, addlookupStatussobj)
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
        setshowpagination(true);
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
          `http://10.1.1.115:5000/api/Deletelookup_trans?id=${memberID}`
        );
        console.log(response);
        if (response.status === 200) {
          // Fetch updated list of members
          lookuptrans(change, size);
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
    seteditlookuptrans((prev) => (i === prev ? null : i));
    setshowedit(true);
    setaddinputs(false);
  }
  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }
  function clickedit() {
    lookuptransedit();
  }
  function clickadd() {
    addlookuptrans();
  }
  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };
  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">انواع الفصل </h1>
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
                <th className={`${style.t}`}>الحالة</th>

                {Getlookuptrans.length > 0 &&
                  Getlookuptrans[0].hasOwnProperty("IsDead") && (
                    <th className={`${style.t}`}>حالة الحذف</th>
                  )}
                {Getlookuptrans.length > 0 &&
                  Getlookuptrans[0].hasOwnProperty("IsSeperated") && (
                    <th className={`${style.t}`}>حالة الفصل</th>
                  )}

                <th className={`${style.t}`}>التعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {Getlookuptrans.map((item, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>{item.code}</td>
                  <td className={`${style.name}`}>{item.name}</td>
                  {item.hasOwnProperty("IsDead") && (
                    <td className={`${style.name}`}>
                      {item.IsDead !== null
                        ? item.IsDead
                          ? "تفعيل"
                          : "تعطيل"
                        : ""}
                    </td>
                  )}
                  {item.hasOwnProperty("IsSeperated") && (
                    <td className={`${style.name}`}>
                      {item.IsSeperated !== null
                        ? item.IsSeperated
                          ? "تفعيل"
                          : "تعطيل"
                        : ""}
                    </td>
                  )}
                  <td className={`${style.t} `}>
                    <IconButton aria-label="home">
                      <EditNoteIcon
                        onClick={() => {
                          onEdit(item);
                        }}
                        sx={{ fontSize: "25px" }}
                      ></EditNoteIcon>
                    </IconButton>
                  </td>
                  <td className={`${style.t}`}>
                    <IconButton aria-label="delete">
                      <DeleteIcon
                        onClick={() => {
                          handleDelete(item.id);
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
                    editlookuptrans?.code ? editlookuptrans.code : "الكود"
                  }`}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2 "}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlookuptrans?.name ? editlookuptrans.name : "الأسم"
                  }`}
                  onChange={(e) => setSelectedname(e.target.value)}
                  className={"ms-2  "}
                  variant="outlined"
                />
                <Select
                  value={selectedDead}
                  onChange={(e) => setSelectedDead(e.target.value)}
                  variant="outlined"
                  className={"ms-2"}
                  placeholder={`${
                    editlookuptrans?.IsDead ? editlookuptrans.IsDead : "تعطيل"
                  }`}
                >
                  <MenuItem value={true}>تفعيل</MenuItem>
                  <MenuItem value={false}>تعطيل</MenuItem>
                </Select>
                <Select
                  value={selectedSeprate}
                  onChange={(e) => setSelectedSeprate(e.target.value)}
                  variant="outlined"
                  className={"ms-2"}
                >
                  <MenuItem value={true}>تفعيل</MenuItem>
                  <MenuItem value={false}>تعطيل</MenuItem>
                </Select>
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
                  type="number"
                  id="outlined-basic"
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
                  className={"ms-2 "}
                  label="الاسم"
                  variant="outlined"
                />
                <Select
                  value={addDead}
                  onChange={(e) => setAddDead(e.target.value)}
                  variant="outlined"
                  className={"ms-2"}
                  placeholder="اختر الحالة"
                >
                  <MenuItem disabled value="">
                    اختر الحالة
                  </MenuItem>
                  <MenuItem value={true}>تفعيل</MenuItem>
                  <MenuItem value={false}>تعطيل</MenuItem>
                </Select>
                <Select
                  value={addSeprate}
                  onChange={(e) => setAddSeprate(e.target.value)}
                  variant="outlined"
                  className={"ms-40"}
                  placeholder="اختر الحالة"
                >
                  <MenuItem disabled value="">
                    اختر الحالة
                  </MenuItem>
                  <MenuItem value={true}>تفعيل</MenuItem>
                  <MenuItem value={false}>تعطيل</MenuItem>
                </Select>

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
