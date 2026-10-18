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
export default function LookupStatus() {
  //////////////////////////states/////////////////////////////
  const [GetlookupStatus, setGetlookupStatus] = useState([]);
  const [editlookupStatus, seteditlookupStatus] = useState(null);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [Selectedname, setSelectedname] = useState(null);
  const [addinputs, setaddinputs] = useState(false);
  const [addcode, setaddcode] = useState(0);
  const [addname, setaddname] = useState(null);
  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);
  /////////////////APIS////////////////////////
  const lookupStatus = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAlllookupStatus?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        setGetlookupStatus(response.data.rows.rows);
        setcount(response.data.rows.count);
      })

      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };
  useEffect(() => {
    lookupStatus(change, size);
  }, []);
  useEffect(() => {
    lookupStatus(change, size);
  }, [afteredit]);

  useEffect(() => {
    lookupStatus(change, size);
  }, [change]);

  const editlookupStatuss = async () => {
    var lookupStatussobj = {
      code: Selectedcode != null ? Selectedcode : editlookupStatus.code,
      name: Selectedname != null ? Selectedname : editlookupStatus.name,
    };

    await axios
      .put(
        `http://10.1.1.115:5000/api/UpdateMemberStatus?id=${editlookupStatus.id}`,
        lookupStatussobj
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
        setshowedit(false);
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

  const addlookupStatus = async () => {
    var addlookupStatussobj = {
      code: addcode,
      name: addname,
    };
    await axios
      .post(`http://10.1.1.115:5000/api/AddlookupStatus`, addlookupStatussobj)
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
          `http://10.1.1.115:5000/api/Deletelookup_status?id=${memberID}`
        );
        console.log(response);
        if (response.status === 200) {
          // Fetch updated list of members
          lookupStatus(change, size);
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
    seteditlookupStatus((prev) => (i === prev ? null : i));
    setshowedit(true);
    setaddinputs(false);
  }
  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }
  function clickedit() {
    editlookupStatuss();
  }
  function clickadd() {
    addlookupStatus();
  }
  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };
  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">الحالة الأجتماعية</h1>
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
                <th className={`${style.t}`}>التعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {GetlookupStatus.map((item, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>{item.code}</td>
                  <td className={`${style.name}`}>{item.name}</td>

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
                    editlookupStatus?.code ? editlookupStatus.code : "الكود"
                  }`}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2 "}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editlookupStatus?.name ? editlookupStatus.name : "الأسم"
                  }`}
                  onChange={(e) => setSelectedname(e.target.value)}
                  className={"ms-2  "}
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
                  className={"ms-2 "}
                  label="الاسم"
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
