"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import style from "./page.module.css";
import EditNoteIcon from "@mui/icons-material/EditNote";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import register from "../register/page";

const AllUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decodedToken, setDecodedToken] = useState(false);
  const [decoded, setDecoded] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullname: "",
    name: "",
    email: "",
    password: "",
    RoleId: 0,
    safe_no: "",
    national_id: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = getTokenPayload(token);
      console.log(decoded);

      setDecodedToken(decoded);
      setDecoded(jwtDecode(token));
    }
    fetchUsers();
    fetchRoles();
  }, []);

  console.log(decoded);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://10.1.1.115:5000/api/GetAllUsers");
      setAllUsers(response.data.userRoles);
      console.log(response.data.userRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTokenPayload = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = atob(payloadBase64);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://10.1.1.115:5000/api/GetAllRoles");
      setRoles(response.data.rows.rows);
      console.log(response.data.rows.rows);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://10.1.1.115:5000/api/UpdateUserDataAndRole?userId=${id}`,
        formData
      );
      console.log(formData);
      if (response.status === 200) {
        Swal.fire({
          // position: "top-end",
          icon: "success",
          title: "تم التعديل",
          showConfirmButton: false,
          timer: 1500,
        });

        fetchUsers();

        setShowRegisterForm(false);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        // position: "top-end",
        icon: "error",
        title: "يرجي التأكد من صحة البيانات وعدم تكرارها",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  // const token = localStorage.getItem('token');
  // let decoded;
  // if (token) {
  //   try {
  //     decoded = jwtDecode(token);
  //     console.log(decoded); // Log or use the decoded token as needed
  //   } catch (error) {
  //     console.error("Invalid token", error);
  //   }
  // } else {
  //   console.log("No token found");
  // }
  // const token = `${localStorage.getItem("token")}`;
  // const decoded = jwtDecode(token);

  // console.log(token);

  const showErrorPopup = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "لا يوجد صلاحيه لديك للمرور لهذه الصفحه, يرجي العودة إلي مديرك",
    });
  };

  return (
    <div>
      {decoded && decoded?.role !== "Super Admin" && (
        <div className={`${style.pageStyle}`}>
          {Swal.fire({
            icon: "error",
            title: "Error",
            text: "لا يوجد صلاحيه لديك للمرور لهذه الصفحه, يرجي العودة إلي مديرك",
          })}
        </div>
      )}
      {decoded?.role === "Super Admin" && (
        <>
          <table className={`${style.table}  `}>
            <thead>
              <tr>
                <th className={`${style.t}`}>الدور</th>
                <th className={`${style.t}`}>الحساب</th>
                <th className={`${style.t}`}>رقم الخزنة</th>
                <th className={`${style.t}`}>الرقم القومي</th>
                <th className={`${style.t}`}>الرقم السري</th>
                <th className={`${style.t}`}>الاسم</th>
                <th className={`${style.t}`}>تعديل</th>
                {/* <th className={`${style.t}`}>حذف</th> */}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user, index) => (
                <tr key={index}>
                  <td className={`${style.t}`}>
                    {user.Role.name ? user.Role.name : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    {user?.User?.email ? user?.User?.email : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    {user?.User?.safe_no ? user?.User?.safe_no : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    {user?.User?.national_id ? user?.User?.national_id : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    {user?.User?.password ? user?.User?.password : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    {user?.User?.name ? user?.User?.name : "--"}
                  </td>
                  <td className={`${style.t}`}>
                    <IconButton
                      aria-label="edit"
                      onClick={() => {
                        // console.log(editMember);
                        setEditMember(user.User);
                        setSelectedEmail(user.User.email);
                        setShowRegisterForm(true);
                        setFormData({
                          fullname: user.User.fullname,
                          name: user.User.name,
                          email: user.User.email,
                          password: user.User.password,
                          roleId: user.Role.id,
                          safe_no: user.User.safe_no,
                          national_id: user.User.national_id,
                        });
                        console.log(formData);

                        // handleEdit(user.User.id);
                      }}
                    >
                      <EditNoteIcon />
                    </IconButton>
                  </td>

                  {/* <td className={`${style.t}`}>
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDelete(user.User.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
          {showRegisterForm && (
            <form
              ref={formRef}
              className={`${style.formStyle}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(editMember.id, formData);
              }}
            >
              <label htmlFor="fullname">الأسم الأول: </label>
              <input
                type="text"
                className="form-control"
                name="fullname"
                id="fullname"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                placeholder="الأسم الأول"
              />
              <label htmlFor="name">الأسم بالكامل: </label>
              <input
                type="text"
                className="form-control"
                name="name"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={formData.name}
              />
              <label htmlFor="email"> الحساب: </label>
              <input
                type="email"
                className="form-control"
                name="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={formData.email}
              />
              <label htmlFor="password">الرقم السري: </label>
              <input
                type="password"
                className="form-control"
                name="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={formData.password}
              />
              <label htmlFor="RoleId">الدور:</label>
              <select
                className="form-control"
                name="RoleId"
                id="RoleId"
                placeholder={formData.RoleId}
                onChange={(e) => {
                  setFormData((b) => ({
                    ...b,
                    roleId: parseInt(e.target.value),
                  }));
                }}
              >
                <option value="" disabled selected>
                  اختر الدور
                </option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              <label htmlFor="safe_no"> رقم الخزنة: </label>
              <input
                type="number"
                className="form-control"
                name="safe_no"
                id="safe_no"
                value={formData.safe_no}
                onChange={(e) =>
                  setFormData({ ...formData, safe_no: e.target.value })
                }
                placeholder={formData.safe_no}
              />
              <label htmlFor="national_id"> الرقم القومي: </label>
              <input
                type="number"
                className="form-control"
                name="national_id"
                id="national_id"
                value={formData.national_id}
                onChange={(e) =>
                  setFormData({ ...formData, national_id: e.target.value })
                }
                placeholder={formData.national_id}
              />
              <button type="submit" className={`${style.registerButton}`}>
                {loading ? "Loading..." : "تعديل"}
              </button>
              {error.length > 0 && (
                <div className="alert alert-danger my-2">{error}</div>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
};
export default AllUsers;
