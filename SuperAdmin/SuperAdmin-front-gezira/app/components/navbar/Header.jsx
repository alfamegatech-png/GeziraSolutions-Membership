import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import style from "./header.module.css";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  userLoggedout,
  userLoggedin,
} from "@/app/state-management/slices/login";
import { jwtDecode } from "jwt-decode";

export default function Header() {
  const { isLogged } = useSelector((state) => state.login);
  const dispatch = useDispatch();
  const [decodedToken, setDecodedToken] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let verify = localStorage.getItem("token");
    if (verify) dispatch(userLoggedin());
    else if (!verify) dispatch(userLoggedout());
  }, []);

  useEffect(() => {
    if (isLogged) {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      setDecodedToken(decoded);
    }
  }, [isLogged]);

  return (
    <>
      <Navbar expand="lg" className={`${style.headerBg}`}>
        <Container>
          <Navbar.Brand className={`text-white fs-3 me-3 fw-bold`}>
            <Link className={`text-decoration-none text-white`} href="/">
              لوحة التحكم
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="w-100">
              {/* {isLogged && (
                <Link
                  className={`text-decoration-none text-white m-3 fs-4`}
                  href="/"
                >
                  الصفحة الرئيسية
                </Link>
              )} */}
              {isLogged &&
                (decodedToken.role === "Super Admin" ||
                  decodedToken.role === "Admin") && (
                  <Link
                    className={`text-decoration-none text-white m-3 fs-4`}
                    href="/member"
                  >
                    العضو العامل
                  </Link>
                )}
              {isLogged &&
                (decodedToken.role === "Super Admin" ||
                  decodedToken.role === "Admin") && (
                  <Link
                    className={`text-decoration-none text-white m-3 fs-4`}
                    href="/ref-member"
                  >
                    العضو التابع
                  </Link>
                )}
                {/* decodedToken.role === "Super Admin" && */}
              {isLogged &&  (
                <Link
                  className={`text-decoration-none text-white m-3 fs-4`}
                  href="/memberships"
                >
                  التسجيلات
                </Link>
              )}
              {/* {isLogged && decodedToken.role === "Super Admin" && (
                // <Link
                //   className={`text-decoration-none text-white m-3 fs-4`}
                //   href="/accounts"
                // >
                //   الفندق
                // </Link>
              )} */}
              {isLogged && (
                <NavDropdown
                  title="التقارير"
                  className={`fs-4 me-aut mx-2 my-2  `}
                >
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/date-details"
                  >
                    {" "}
                    احصائيات الاعضاء{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/member-register"
                  >
                    {" "}
                    سجل الاعضاء{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/membership-report"
                  >
                    {" "}
                    تقرير العضوية{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/receipt-items-report"
                  >
                    {" "}
                    تقرير بنود الإيصال{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/safe-daily-report"
                  >
                    {" "}
                    يومية الخزنة{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/accounting-review-report"
                  >
                    {" "}
                    مراجعة القيود المحاسبية{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/end-members"
                  >
                    {" "}
                    الأعضاء المنتهي عضويتهم{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/renew-date"
                  >
                    {" "}
                    تجديد العضوية{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/follow-member"
                  >
                    {" "}
                    الاعضاء التابعين{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/new-member"
                  >
                    {" "}
                    العضوية الجديده{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/entered-member"
                  >
                    {" "}
                    المنضمين الجدد للاعضاء التابعين{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/money-details"
                  >
                    {" "}
                    احصائيات الاعضاء خلال العام المالي{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/safe-details"
                  >
                    {" "}
                    اجماليات الخزن{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/money-member"
                  >
                    {" "}
                    العضويات العائلية خلال العام المالي{" "}
                  </Link>
                  <Link
                    className={`text-decoration-none text-black ms-0 fs-4 dropdown-item`}
                    href="/refWife"
                  >
                    {" "}
                  الأعضاء العائلية
                  </Link>
                </NavDropdown>
              )}
              {isLogged && decodedToken.role === "Super Admin" && (
                <NavDropdown
                  className={` text-decoration-none  mx-2 my-2 fs-4`}
                  title={"البيانات الأساسية"}
                  id="basic-nav-dropdown"
                >
                  <NavDropdown.Item className={`fs-5`} href="/membertype">
                    أنواع الأعضاء
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookuptypes">
                    إضافة التوابع
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookuparea">
                    العناوين
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookupqual">
                    المؤهلات
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    className={`fs-5`}
                    href="/lookupnationality"
                  >
                    الجنسيات
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookupref">
                    انواع التوابع
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookupstatus">
                    الحالة الأجتماعية
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookupcity">
                    المناطق
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookupsection">
                    انواع العضويات
                  </NavDropdown.Item>
                  <NavDropdown.Item className={`fs-5`} href="/lookuptrans">
                    انواع الفصل
                  </NavDropdown.Item>
                  {/* <NavDropdown.Item className={`fs-5`} href="/prices">
                  اسعار الاعضاء التابعين
                  </NavDropdown.Item> */}
                </NavDropdown>
              )}
            </Nav>

            <Nav id="basic-navbar-nav">
              <NavDropdown
                className={`text-white fs-4 me-aut`}
                title={""}
                id="basic-nav-dropdown"
              >
                {!isLogged && (
                  <NavDropdown.Item className={`fs-5`} href="/login">
                    تسجيل الدخول
                  </NavDropdown.Item>
                )}
                {isLogged && (
                  <NavDropdown.Item
                    onClick={() => {
                      localStorage.removeItem("token");
                    }}
                    className={`fs-5`}
                    href="/"
                  >
                    تسجيل الخروج
                  </NavDropdown.Item>
                )}
                {isLogged && decodedToken.role === "Super Admin" && (
                  <>
                    <NavDropdown.Item className={`fs-5`} href="/register">
                      إنشاء حساب جديد
                    </NavDropdown.Item>
                    <NavDropdown.Item className={`fs-5`} href="/allUsers">
                      جميع المستخدمين
                    </NavDropdown.Item>
                    <NavDropdown.Item className={`fs-5`} href="/logs">
                      السجلات{" "}
                    </NavDropdown.Item>
                  </>
                )}
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
