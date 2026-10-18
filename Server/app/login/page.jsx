"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { login, getClubName } from "./login";
import { useRouter } from "next/navigation";
import axios from "@node_modules/axios";
import "./login.css";

const LoginPage = () => {
  const router = useRouter();
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");

  const [clubName, setClubName] = useState("");

  useEffect(() => {
    getClubName().then(setClubName).catch(() => setClubName(""));
  }, []);

  const handleLoginWithLocker = async () => {
    try {



      const data = {
        emailOrMembershipCode: userName,
        password: password,
      };
      const loginWithLocker = await axios.post(
        "http://localhost:5156/api/Accounts/Login",
        data,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );
      if (loginWithLocker.status === 200) {
        localStorage.setItem("lockerToken", loginWithLocker?.data?.data?.token);
      }
    } catch (error) {
      
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (userName && password) {
        // login in membership
        const result = await login(userName, password);
        const user = result?.user;

        // login in locker

        if (result?.status === "success" && user?.id && Number.isInteger(user.safe_no)) {
          const { id, fullname, safe_no } = user;
          localStorage.removeItem("lockerToken");
          localStorage.setItem(
            "clubUser",
            JSON.stringify({ id, fullname, safe_no })
          );

          router.push("/club/landing");

          // login in locker
         await handleLoginWithLocker();
        } else {
          toast.current.show({
            severity: "error",
            summary: "خطأ",
            detail: result?.status === "error"
              ? "تعذر الاتصال بالخادم، حاول مرة أخرى"
              : "خطأ في اسم المستخدم أو كلمة المرور",
            life: 3000,
          });
          // Reset password field and loading state
          // setPassword(""); // Clears the password field
          setLoading(false); // Allows user to retry
        }
      } else {
        setLoading(false);
        toast.current.show({
          severity: "error",
          summary: "خطأ",
          detail: "برجاء ملئ/مراجعة الحقول المطلوبة",
          life: 3000,
        });
      }
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "خطأ", detail: "تعذر تسجيل الدخول، حاول مرة أخرى", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginKeyDown = (event) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    if (!loading && !event.repeat) return handleLogin();
  };

  return (
    <>
      <Toast ref={toast} />
      <main className="login-screen" dir="rtl">
        <section className="login-surface" aria-label="تسجيل الدخول إلى مركز التنمية الشبابية بالجزيرة">
          <div className="login-brand">
            <img className="login-logo" src="/logo.png" width="104" height="104"
              alt="شعار مركز التنمية الشبابية بالجزيرة" />
            <p className="login-ministry">وزارة الشباب والرياضة</p>
            <h1>مركز التنمية الشبابية بالجزيرة</h1>
            <p className="login-system-name">{clubName || "منظومة العضويات"}</p>
          </div>
          <div className="login-fields">
            <h2>تسجيل الدخول</h2>
          <label htmlFor="username">اسم المستخدم</label>
          <InputText
            id="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={handleLoginKeyDown}
          />

          <label htmlFor="login-password">كلمة المرور</label>

          <Password
            id="password"
            inputId="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleLoginKeyDown}
            feedback={false}
            toggleMask
            style={{ width: "100%" }}
          />
            <Button
              className="login-submit"
              label="تسجيل دخول"
              icon="pi pi-sign-in"
              onClick={handleLogin}
              loading={loading}
            />
          </div>
          <p className="login-signature"><i className="pi pi-shield" aria-hidden="true" /> بوابة العاملين بالمركز</p>
        </section>
      </main>
    </>
  );
};

export default LoginPage;
