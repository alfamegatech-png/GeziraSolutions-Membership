"use client";
import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import style from "./page.module.css";
import axios, { Axios } from "axios";
import Swal from "sweetalert2";
import {
  TextField,
  Button,
  FormControl,
  Typography,
  Box,
  Pagination,
} from "@mui/material";
import Stack from "@mui/material/Stack";
import EditNoteIcon from "@mui/icons-material/EditNote";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

export default function MemberType() {
  ////////////////////////////////////States//////////////////////////////////////////////////////
  const [GetAllMemberType, setGetAllMemberType] = useState([]);

  const [editmember, seteditmember] = useState(null);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedname, setSelectedname] = useState(null);
  const [Selectedprice, setSelectedprice] = useState(null);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [addinputs, setaddinputs] = useState(false);
  const [addname, setaddname] = useState(null);
  const [addprice, setaddprice] = useState(0);
  const [addcode, setaddcode] = useState(0);
  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);
  //////////////////////////////////////////////APIS///////////////////////////////////////////
  const getAlMemberType = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAllMemberType?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        console.log(response.data);
        setGetAllMemberType(response.data.rows.rows);
        setcount(response.data.rows.count);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };

  useEffect(() => {
    getAlMemberType(change, size);
  }, []);
  useEffect(() => {
    getAlMemberType(change, size);
  }, [afteredit]);

  useEffect(() => {
    getAlMemberType(change, size);
  }, [change]);

  const addmembertype = async () => {
    var addmem = {
      code: addcode,
      name: addname,
      price: addprice,
    };

    try {
      const response = await axios.post(
        `http://10.1.1.115:5000/api/AddMemberType`,
        addmem
      );
      console.log(response);
      if (response.status === 201) {
        setafteredit(!afteredit);
        setaddinputs(false);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "تم الاضافة",
          showConfirmButton: false,
          timer: 1500,
        });
        setshowpagination(true);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "يرجي التأكد من صحة البيانات وعدم تكرارها",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const Edit = async () => {
    var objmembertype = {
      code: Selectedcode != null ? Selectedcode : editmember.code,
      name: Selectedname != null ? Selectedname : editmember.name,
      price: Selectedprice != null ? Selectedprice : editmember.price,
    };
    try {
      const response = await axios.put(
        `http://10.1.1.115:5000/api/UpdateMemberType?id=${editmember.id}`,
        objmembertype
      );
      console.log(objmembertype);
      console.log(editmember);
      if (response.status === 200) {
        console.log(response);
        setafteredit(!afteredit);
        setshowedit(false);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "تم التعديل",
          showConfirmButton: false,
          timer: 1500,
        });
        setshowpagination(true);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "يرجي التأكد من صحة البيانات وعدم تكرارها",
        showConfirmButton: false,
        timer: 1500,
      });
    }
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
          `http://10.1.1.115:5000/api/DeleteMemberType?id=${memberID}`
        );
        console.log(response);
        if (response.status === 200) {
          // Fetch updated list of members
          getAlMemberType(change, size);
          Swal.fire("تم الحذف!", "تم الحذف بنجاح", "success");
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire("خطأ!", "هناك خطأ ما اثناء الحذف.", "error");
    }
  };

  ///////////////////////////////////////////Functions///////////////////////////////////////////
  function onEdit(i) {
    seteditmember((prev) => (i === prev ? null : i));
    setshowedit(true);
    setaddinputs(false);
  }
  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }
  function clickedit() {
    Edit();
  }
  function clickadd() {
    addmembertype();
  }

  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };

  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">أنواع الأعضاء</h1>
          <Button
            variant="contained"
            className={"fs-5 mt-4 bg-success"}
            onClick={() => {
              Add();
            }}
          >
            إضافة
          </Button>
          <table dir="rtl" className={`${style.table} `}>
            <thead>
              <tr>
                <th className={`${style.t}`}>الاسم</th>
                <th className={`${style.t}`}>السعر</th>
                <th className={`${style.t}`}>الكود</th>
                <th className={`${style.t}`}>تعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {GetAllMemberType.map((member, index) => (
                <tr key={index}>
                  <td className={`${style.name}`}>{member.name}</td>
                  <td className={`${style.t}`}>{member.price}</td>
                  <td className={`${style.t}`}>{member.code}</td>
                  <td className={`${style.t} `}>
                    <IconButton aria-label="home">
                      <EditNoteIcon
                        onClick={() => {
                          onEdit(member);
                        }}
                        sx={{ fontSize: "25px" }}
                      ></EditNoteIcon>
                    </IconButton>
                  </td>
                  <td className={`${style.t}`}>
                    <IconButton aria-label="delete">
                      <DeleteIcon
                        onClick={() => {
                          handleDelete(member.id);
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
              <Stack spacing={2} direction="row">
                <Button
                  variant="contained"
                  className={"w-25 fs-5 ms-2 bg-success"}
                  onClick={clickedit}
                >
                  حفظ
                </Button>
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editmember?.code ? editmember.code : "الكود"
                  }`}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  placeholder={`${
                    editmember?.price ? editmember.price : "السعر"
                  }`}
                  onChange={(e) => setSelectedprice(e.target.value)}
                  className={"ms-2"}
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  placeholder={`${
                    editmember?.name ? editmember.name : "الاسم"
                  }`}
                  onChange={(e) => setSelectedname(e.target.value)}
                  className={"ms-2"}
                  variant="outlined"
                />
              </Stack>
            </FormControl>
          )}

          {addinputs && (
            <FormControl className={`${style.form}`} spacing={2}>
              <Stack spacing={2} direction="row">
                <Button
                  variant="contained"
                  className={"w-25 fs-5 ms-2 bg-success"}
                  onClick={() => {
                    clickadd();
                  }}
                >
                  إضافة
                </Button>
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setaddcode(e.target.value)}
                  className={"ms-2"}
                  label="الكود"
                  variant="outlined"
                  value={addcode}
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setaddprice(e.target.value)}
                  value={addprice}
                  className={"ms-2"}
                  label="السعر"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  required
                  onChange={(e) => setaddname(e.target.value)}
                  className={"ms-2"}
                  label="الاسم"
                  variant="outlined"
                />
              </Stack>
            </FormControl>
          )}
        </div>
      </Container>
    </>
  );
}
