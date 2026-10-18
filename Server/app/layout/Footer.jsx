"use client";
import React from "react";
import "./Footer.css";
import { Button } from "primereact/button";
import Image from "next/image";
const Footer = () => {
  return (
    <footer className="footer membership-footer">
      <Image src="/logo.png" width={32} height={32} alt="مركز التنمية الشبابية بالجزيرة" />
      <span>مركز التنمية الشبابية بالجزيرة</span>
    </footer>
  );
};

export default Footer;
