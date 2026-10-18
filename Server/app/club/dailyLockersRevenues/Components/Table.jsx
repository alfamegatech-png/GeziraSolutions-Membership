import React from "react";
import '../pagePRINT.css'

export default function Table({ data }) {
  return data?.length > 0 ? (
    <table
      className={`table-auto w-full text-center print:text-black mx-auto mb-[12px] border-collapse bg-white rounded-lg shadow-md print:shadow-none`}
    >
      <thead>
        <tr className={`bg-[#d8b372] print:bg-[#fff] text-black`}>
          <th className="p-[16px] print:border">الاسم</th>
          <th className="p-[16px] print:border">رقم العضوية</th>
          <th className="p-[16px] print:border">الاجمالي</th>
          <th className="p-[16px] print:border">السعر بدون ضريبة</th>
          <th className="p-[16px] print:border">الضريبة</th>
          <th className="p-[16px] print:border">رقم الدولاب</th>
        </tr>
      </thead>
      <tbody className={`bg-white text-black`}>
        {data.map((el) => (
          <tr
            key={el.id}
            className={`text-center border-0 transition duration-300 even:bg-gray-200  print:even:bg-[#fff] hoverbg-gray-100 print:bg-[#fff]`}
          >
            <td className="print:border px-2 py-4 print:py-1">{el.name}</td>
            <td className="print:border px-2 py-4 print:py-1">
              {el.memberCode}
            </td>
            <td className="print:border px-2 py-4 print:py-1">{el.price}</td>
            <td className="print:border px-2 py-4 print:py-1">
              {el.priceWithoutTax}
            </td>
            <td className="print:border px-2 py-4 print:py-1">{el.tax}</td>
            <td className="print:border px-2 py-4 print:py-1">
              {el.locker?.name}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="w-full text-center text-xl font-medium">لا يوجد بيانات</p>
  );
}
