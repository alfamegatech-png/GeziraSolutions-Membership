import React from "react";
import { Calendar } from "primereact/calendar";

export default function Filters({ setDates,print }) {
  function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return (
    <div className="flex px-5 items-center justify-between gap-5">
      <div>
        <Calendar
          placeholder="اختر تاريخ البداية"
          onChange={(e) =>
            setDates((old) => ({
              ...old,
              start: formatDate(e.target.value),
            }))
          }
          dateFormat="dd/mm/yy"
        />
        <Calendar
          placeholder="اختر تاريخ النهاية"
          onChange={(e) =>
            setDates((old) => ({
              ...old,
              end: formatDate(e.target.value),
            }))
          }
          dateFormat="dd/mm/yy"
        />
      </div>
      <button onClick={print} className="py-2 font-bold px-5 bg-green-500 rounded">طباعة</button>
    </div>
  );
}
