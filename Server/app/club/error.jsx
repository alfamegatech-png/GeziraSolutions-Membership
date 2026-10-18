"use client";
import { Button } from "primereact/button";
export default function ClubError({ reset }) {
  return <section className="p-4" dir="rtl"><h2>تعذر فتح الشاشة</h2><Button label="إعادة المحاولة" icon="pi pi-refresh" onClick={reset} /></section>;
}
