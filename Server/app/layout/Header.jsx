"use client";
import React from "react";
import "./Header.css";
import { Button } from "primereact/button";
import Image from "next/image";
const Header = () => {
  return (
    <header className="header membership-header">
      <Image src="/logo.png" width={64} height={64} alt="مركز التنمية الشبابية بالجزيرة" />
      <div className="membership-identity">
        <span>مركز التنمية الشبابية بالجزيرة</span>
        <strong>منظومة العضويات</strong>
      </div>
      {/* <div style={{ position: "absolute", right: 0, top: 0 }}>
        <Button label="تسجيل الخروج" />
      </div> */}
    </header>
  );
};

export default Header;
