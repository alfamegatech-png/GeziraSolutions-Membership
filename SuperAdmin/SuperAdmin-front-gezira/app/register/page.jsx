"use client";
import React, { useState, useEffect, useRef } from "react";
import style from "./page.module.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

const Register = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    name: "",
    email: "",
    password: "",
    RoleId: 0,
    safe_no: 0,
    national_id: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [id, setId] = useState("");
  const [decodedToken, setDecodedToken] = useState(null);
  const [decoded, setDecoded] = useState(null);

  const formRef = useRef(null);

  useEffect(() => {
    // Fetch roles on mount
    fetchRoles();

    // Client-side code
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        // const decoded = ;
        setDecodedToken(getTokenPayload(token));
      }
    }
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://10.1.1.115:5000/api/GetAllRoles");
      setRoles(response.data.rows.rows);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserData = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getTokenPayload = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = atob(payloadBase64);
      const parsed = JSON.parse(decodedPayload);
      setId(parsed.id);
      return parsed;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token not found in local storage");
      }

      if (!decodedToken || decodedToken.role !== "Super Admin") {
        throw new Error("User is not authorized to perform this action");
      }

      const responseData = await axios.post(
        `http://10.1.1.115:5000/api/SignUp?superAdminId=${id}`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(responseData);
      console.log("Registration successful!");

      await Swal.fire({
        icon: "success",
        title: "تم انشاء حساب",
        text: "Registration successful!",
      });

      if (formRef.current) {
        formRef.current.reset();
      }
      setSuccess(true);
      setError("");
    } catch (error) {
      console.error("Error registering user:", error);
      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text: `${error.response?.data?.error || "An error occurred"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure the client-side code is executed here
  // const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  // const decoded = token ? jwtDecode(token) : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setDecoded(jwtDecode(token));
    }
  }, []);

  const showErrorPopup = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "لا يوجد صلاحيه لديك للمرور لهذه الصفحه, يرجي العودة إلي مديرك",
    });
  };

  return (
    <>
      {decoded && decoded.role !== "Super Admin" && (
        <div className={`${style.pageStyle}`}>{showErrorPopup()}</div>
      )}

      {decoded && decoded.role === "Super Admin" && (
        <div className={`${style.pageStyle}`}>
          <form
            ref={formRef}
            className={`${style.formStyle}`}
            onSubmit={handleSubmit}
          >
            <label htmlFor="fullname">الأسم الأول: </label>
            <input
              onChange={getUserData}
              type="text"
              className="form-control"
              name="name"
              id="name"
              value={formData.name}
            />
            <label htmlFor="name">الأسم بالكامل: </label>
            <input
              onChange={getUserData}
              type="text"
              className="form-control"
              name="fullname"
              id="fullname"
              value={formData.fullname}
            />
            <label htmlFor="email"> الحساب: </label>
            <input
              onChange={getUserData}
              type="email"
              className="form-control"
              name="email"
              id="email"
              value={formData.email}
            />
            <label htmlFor="password">الرقم السري: </label>
            <input
              onChange={getUserData}
              type="password"
              className="form-control"
              name="password"
              id="password"
              value={formData.password}
            />
            <label htmlFor="RoleId">الدور:</label>
            <select
              className="form-control"
              name="RoleId"
              id="RoleId"
              // value={formData.RoleId}
              onChange={(e) => {
                setFormData((b) => ({
                  ...b,
                  RoleId: parseInt(e.target.value),
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
              onChange={getUserData}
              value={formData.safe_no}
              type="number"
              className="form-control"
              name="safe_no"
              id="safe_no"
            />
            <label htmlFor="national_id"> الرقم القومي: </label>
            <input
              onChange={getUserData}
              value={formData.national_id}
              type="number"
              className="form-control"
              name="national_id"
              id="national_id"
            />
            <button type="submit" className={`${style.registerButton}`}>
              {loading ? "Loading..." : "Register"}
            </button>
            {error.length > 0 && (
              <div className="alert alert-danger my-2">{error}</div>
            )}
          </form>
        </div>
      )}
    </>
  );
};

export default Register;
