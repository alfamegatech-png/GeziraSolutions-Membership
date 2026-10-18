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
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Autocomplete from "@mui/material/Autocomplete";

export default function LookupQual() {
  //////////////////////////states/////////////////////////////
  const [GetlookupQual, setGetlookupQual] = useState([]);
  const [editlookupQual, seteditlookupQual] = useState(null);
  const [showedit, setshowedit] = useState(false);
  const [afteredit, setafteredit] = useState(false);
  const [Selectedcode, setSelectedcode] = useState(null);
  const [Selectedname, setSelectedname] = useState(null);
  const [SelectedFirstMembership, setSelectedFirstMembership] = useState(false);
  const [SelectedRenewRef, setSelectedRenewRef] = useState(null);
  const [SelectedJoinFee, setSelectedJoinFee] = useState(null);
  const [SelectedMaintenanceFee, setSelectedMaintenanceFee] = useState(null);
  const [SelectedRef, setSelectedRef] = useState([]);
  const [SelectedRenewFee, setSelectedRenewFee] = useState(null);

  const [addinputs, setaddinputs] = useState(false);
  const [addcode, setaddcode] = useState(0);
  const [addname, setaddname] = useState(null);

  const [addFirstMembership, setAddFirstMembership] = useState(false);
  const [addRenewRef, setAddRenewRef] = useState(null);
  const [addJoinFee, setAddJoinFee] = useState(null);
  const [addMaintenanceFee, setAddMaintenanceFee] = useState(null);
  const [addRef, setAddRef] = useState([]);
  const [addRenewFee, setAddRenewFee] = useState(null);
  var size = 10;
  var [count, setcount] = useState(null);
  var [change, setchange] = useState(1);
  const [showpagination, setshowpagination] = useState(true);
  const [toggleChecked, setToggleChecked] = useState(false); // State to manage the toggle switch
  const [responseData, setResponseData] = useState([]);

  /////////////////APIS////////////////////////
  const lookupQual = async (change, size) => {
    await axios
      .get(
        `http://10.1.1.115:5000/api/GetAlllookup_qual?pageNumber=${change}&pageLimit=${size}`
      )
      .then((response) => {
        console.log(response.data.rows);
        setGetlookupQual(response.data.rows.rows);
        setcount(response.data.rows.count);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  };
  useEffect(() => {
    lookupQual(change, size);
  }, []);
  useEffect(() => {
    lookupQual(change, size);
  }, [afteredit]);
  useEffect(() => {
    lookupQual(change, size);
  }, [change]);
  const editlookupQuals = async () => {
    var lookupQualsobj = {
      code: Selectedcode != null ? Selectedcode : editlookupQual.code,
      name: Selectedname != null ? Selectedname : editlookupQual.name,
      FirstMembership: SelectedFirstMembership,
      RenewRef:
        SelectedRenewRef != null ? SelectedRenewRef : editlookupQual.RenewRef,
      join_fee:
        SelectedJoinFee != null ? SelectedJoinFee : editlookupQual.join_fee,
      maintenance_fee:
        SelectedMaintenanceFee != null
          ? SelectedMaintenanceFee
          : editlookupQual.maintenance_fee,
      ref: SelectedRef.length > 0 ? SelectedRef : editlookupQual.ref,
      renew_fee:
        SelectedRenewFee != null ? SelectedRenewFee : editlookupQual.renew_fee,
    };
    console.log(lookupQualsobj);
    await axios
      .put(
        `http://10.1.1.115:5000/api/Updatelookupqual?id=${editlookupQual.id}`,
        lookupQualsobj
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

  const addlookupQual = async () => {
    var addlookupTypesobj = {
      code: addcode,
      name: addname,
      FirstMembership: toggleChecked,
      RenewRef: addRenewRef,
      join_fee: addJoinFee,
      maintenance_fee: addMaintenanceFee,
      ref: addRef,
      renew_fee: addRenewFee,
    };

    console.log("Data to be sent:", addlookupTypesobj); // Log the data to be sent
    await axios
      .post(`http://10.1.1.115:5000/api/Addlookup_Qual`, addlookupTypesobj)
      .then((response) => {
        console.log("Response from server:", response);
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
          `http://10.1.1.115:5000/api/Deletelookup_Qual?id=${memberID}`
        );
        console.log(response);
        if (response.status === 200) {
          // Fetch updated list of members
          lookupQual(change, size);
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
    seteditlookupQual(i);
    setSelectedcode(i.code);
    setSelectedname(i.name);
    setSelectedFirstMembership(i.FirstMembership);
    setSelectedRenewRef(i.RenewRef);
    setSelectedJoinFee(i.join_fee);
    setSelectedMaintenanceFee(i.maintenance_fee);
    setSelectedRef(i.ref);
    setSelectedRenewFee(i.renew_fee);
    setshowedit(true);
    setaddinputs(false);
  }

  function Add() {
    setaddinputs(true);
    setshowedit(false);
  }

  function clickedit() {
    editlookupQuals();
  }

  function clickadd() {
    addlookupQual();
  }

  const handlePageChange = (event, newPage) => {
    setchange(newPage);
  };

  const GetAllMemberShips = async () => {
    try {
      const response = await axios.get(
        `http://10.1.1.115:5000/api/GetAlllookup_ref`
      );
      console.log("Fetched response data:", response.data.rows.rows);
      setResponseData(
        Array.isArray(response.data.rows.rows) ? response.data.rows.rows : []
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    GetAllMemberShips();
  }, []);

  return (
    <>
      <Container>
        <div className={`${style.parenttable}`}>
          <h1 className=" mt-5 text-center">المؤهلات</h1>
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
                {/* <th className={`${style.t}`}>عضوية أول مره</th>
                <th className={`${style.t}`}>رسم تجديد العضو التابع</th>
                <th className={`${style.t}`}>رسم اشتراك اول مره</th>
                <th className={`${style.t}`}>رسم صيانه</th>
                <th className={`${style.t}`}>صلة القرابة</th>
                <th className={`${style.t}`}>رسم تجديد</th> */}
                <th className={`${style.t}`}>التعديل</th>
                <th className={`${style.t}`}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {GetlookupQual.map((lockQual, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>{lockQual.code}</td>
                  <td className={`${style.name}`}>{lockQual.name}</td>
                  {/* <td className={`${style.name}`}>
                    {lockQual?.FirstMembership || "---"}
                  </td>
                  <td className={`${style.name}`}>
                    {lockQual?.RenewRef || "---"}
                  </td>
                  <td className={`${style.name}`}>
                    {lockQual?.join_fee || "---"}
                  </td>
                  <td className={`${style.name}`}>
                    {lockQual?.maintenance_fee || "---"}
                  </td>
                  <td className={`${style.name}`}>{lockQual?.ref || "---"}</td>
                  <td className={`${style.name}`}>
                    {lockQual?.renew_fee || "---"}
                  </td> */}

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
              <Stack spacing={2} direction="row">
                <TextField
                  sx={{ width: "300px" }}
                  id="outlined-basic"
                  type="number"
                  required
                  value={Selectedcode}
                  onChange={(e) => setSelectedcode(e.target.value)}
                  className={"ms-2 "}
                  label="الكود"
                  variant="outlined"
                />
                <TextField
                  sx={{ width: "300px" }}
                  id="outlined-basic"
                  required
                  value={Selectedname}
                  onChange={(e) => setSelectedname(e.target.value)}
                  className={"ms-2 "}
                  label="الاسم"
                  variant="outlined"
                />
                {/* <FormControlLabel
                  control={
                    <Switch
                      checked={SelectedFirstMembership}
                      onChange={(e) =>
                        setSelectedFirstMembership(e.target.checked)
                      }
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                  label={
                    <Typography variant="h6">
                      {SelectedFirstMembership ? "نعم" : "لا"}
                    </Typography>
                  }
                  labelPlacement="start"
                />
                <TextField
                  id="outlined-basic"
                  required
                  type="number"
                  value={SelectedRenewRef}
                  onChange={(e) => setSelectedRenewRef(e.target.value)}
                  className={"ms-2 "}
                  label="رسم اشتراك اول مره"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  required
                  type="number"
                  value={SelectedJoinFee}
                  onChange={(e) => setSelectedJoinFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم اشتراك اول مره"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  value={SelectedMaintenanceFee}
                  onChange={(e) => setSelectedMaintenanceFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم صيانه"
                  variant="outlined"
                />
                <Autocomplete
                  id="combo-box"
                  options={responseData}
                  getOptionLabel={(option) => option.name}
                  onChange={(e, newValue) => {
                    setSelectedRef(
                      newValue ? newValue.map((value) => value.code) : []
                    );
                  }}
                  value={(SelectedRef || [])
                    .map((code) =>
                      responseData.find((ref) => ref.code === code)
                    )
                    .filter((ref) => ref !== undefined)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="صلة القرابة"
                      variant="outlined"
                    />
                  )}
                  multiple
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  value={SelectedRenewFee}
                  onChange={(e) => setSelectedRenewFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم تجديد"
                  variant="outlined"
                /> */}
                <Button
                  variant="contained"
                  className={"w-25 fs-5 ms-2 bg-success"}
                  onClick={() => {
                    clickedit();
                  }}
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
                  sx={{ width: "300px" }}
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
                  sx={{ width: "300px" }}
                  id="outlined-basic"
                  required
                  onChange={(e) => setaddname(e.target.value)}
                  className={"ms-2 "}
                  label="الاسم"
                  variant="outlined"
                />
                {/* <FormControlLabel
                  control={
                    <Switch
                      checked={toggleChecked}
                      onChange={(e) => setToggleChecked(e.target.checked)}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                  label={
                    <Typography variant="h6">
                      {toggleChecked ? "نعم" : "لا"}
                    </Typography>
                  }
                  labelPlacement="start"
                />
                <TextField
                  id="outlined-basic"
                  required
                  type="number"
                  onChange={(e) => setAddRenewRef(e.target.value)}
                  className={"ms-2 "}
                  label="رسم اشتراك اول مره"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  required
                  type="number"
                  onChange={(e) => setAddJoinFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم اشتراك اول مره"
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setAddMaintenanceFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم صيانه"
                  variant="outlined"
                />
                <Autocomplete
                  id="combo-box"
                  options={responseData}
                  getOptionLabel={(option) => option.name}
                  onChange={(e, newValue) => {
                    console.log("Selected newValue:", newValue);
                    setAddRef(
                      newValue ? newValue.map((value) => value.code) : []
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="صلة القرابة"
                      variant="outlined"
                    />
                  )}
                  multiple
                />
                <TextField
                  id="outlined-basic"
                  type="number"
                  required
                  onChange={(e) => setAddRenewFee(e.target.value)}
                  className={"ms-2 "}
                  label="رسم تجديد"
                  variant="outlined"
                /> */}
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
