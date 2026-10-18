// "use client";
// import React, { useRef, useEffect, useState } from "react";
// import ReactToPrint from "react-to-print";

// import "./Report.styles.css";
// import { getReportData } from "./report.js";
// import { Button } from "primereact/button";

// import { ExcelFile, ExcelSheet } from "../../node_modules/react-data-export";

// const columnSum = (data, column) => {
//   return parseFloat(
//     data
//       ?.filter((el) => {
//         return el.canceled == 0;
//       })
//       .reduce((accumulator, currentValue) => {
//         return accumulator + Number(currentValue[column]);
//       }, 0)
//       .toFixed(2)
//   );
// };
// const ReportExcel = ({ member, lazyState, orderBy, include, filter }) => {
//   const [data, setData] = useState();
//   const membership = member?.membership[0];
//   const handleGetReportData = async () => {
//     const data2Report = await getReportData( lazyState, orderBy, include, filter );
//     console.log(data2Report)
//     setData(data2Report);
//     let currentSavedDate = localStorage.getItem("filterDate");
//   };
//   useEffect(() => {
//     (async () => {
//       await handleGetReportData();
//     })();
//   }, []);
//   const pageRef = useRef();
//   const Receipt = () => {
//     let ref_card_total=0;

//     return (
//         <ExcelFile
//           filename="report"
//           element={<Button label="Export Excel" icon="pi pi-file-excel" iconPos="right" />}
//         >
//           <ExcelSheet data={data} name="Report">
//             {/* Your table headers */}
//             <ExcelColumn label="رقم العضوية" value="member_code" />
//             {/* Add more ExcelColumn components for other columns */}
//             {/* ... (other columns) */}
  
//             {/* Your table body */}
//             {data?.map((el, index) => (
//               <ExcelColumn label={el.member_code} value={el.member_code} />
//             ))}
//           </ExcelSheet>
//         </ExcelFile>
      

//     //   <table>
//     //     <thead>
//     //       <tr>
//     //         <th>رقم العضوية</th>
//     //         <th>الاسم</th>
//     //         <th>عضوية اول مرة</th>
//     //         <th>رسم التحاق</th>
//     //         <th>تجديد</th>
//     //         <th>بطاقة عضوية</th>
//     //         <th> ضريبة بطاقة عضوية </th>
//     //         <th>سنوات سابقة</th>
//     //         <th>غرامة تأخير</th>
//     //         <th>قسط.ق.م</th>
//     //         <th>فرق اشتراك</th>
//     //         <th>بطاقة عضوية تابع</th>
//     //         <th>ضريبة بطاقة عضوية تابع</th>
//     //         <th>اضافة تابع</th>
//     //         <th>ضريبة إضافة تابع</th>
//     //         <th>فصل/نقل عضوية</th>
//     //         <th>ضريبة فصل/نقل عضوية </th>
//     //         <th>رسم صيانة وانشاء</th>
//     //         <th>إجمالي ق-ق</th>
//     //         <th>قيمة مضافة</th>
//     //         <th>الإجمالي</th>
//     //         <th>إذن دفع رقم</th>
//     //         <th>تاريخ الإذن</th>
//     //         <th>رسم إشتراك السباحة</th>
//     //         <th>ضريبة السباحة</th>
//     //       </tr>
//     //     </thead>
//     //     <tbody>
//     //       {data?.map((el, index) => {
//     //         let returnRefCardFee = (el) => {
//     //           if (el.new_ref_fees > 0) {
//     //             ref_card_total += 5;
//     //             return 5;
//     //           } else {
//     //             return 0;
//     //           }
//     //         }
//     //         return (
//     //           <tr key={index}>
//     //             <td>{el.member_code}</td>
//     //             <td style={{ whiteSpace: "nowrap" }}>{el.member?.name}</td>
//     //             <td>{el.first_time_fee}</td>
//     //             <td>{el.join_fee}</td>
//     //             <td>{el.renew_fee}</td>
//     //             <td>{el.membership_card_fee}</td>
//     //             <td>{(el.membership_card_fee - (((el.membership_card_fee)*100)/114)).toFixed(2)}</td>
//     //             <td>{el.prev_years_fee}</td>
//     //             <td>{el.delay_penalty}</td>
//     //             <td>{el.installment}</td>
//     //             <td>0</td>
//     //             <td>{returnRefCardFee(el)}</td>
//     //             <td>{el.new_ref_fees > 0 ? 0.61 : 0}</td>
//     //             <td>{el.new_ref_fees > 0 ? ((((el.new_ref_fees)*100)/114)-5).toFixed(2) : el.new_ref_fees}</td>
//     //             <td>{el.new_ref_fees > 0 ? (el.new_ref_fees-5 - ((((el.new_ref_fees)*100)/114)-5)).toFixed(2) : el.new_ref_fees}</td>
//     //             <td>{el.seperate_fees}</td>
//     //             <td>{(el.seperate_fees - (((el.seperate_fees)*100)/114)).toFixed(2)}</td>
//     //             <td>{el.maintenance_fee}</td>
//     //             <td>{el.total_amount - el.value_added_tax}</td>
//     //             <td>{el.value_added_tax}</td>
//     //             <td>{el.total_amount}</td>
//     //             <td>{String(el.safe_no) + String(el.serial_no)}</td>
//     //             <td>{el.member_order_date.toLocaleDateString()}</td>
//     //             <td>{(((el.swimming)*100)/114).toFixed(2)}</td>
//     //             <td>{(el.swimming - (((el.swimming)*100)/114)).toFixed(2)}</td>
//     //             <td>{el.rel_canceled.name}</td>
//     //           </tr>
//     //         );
//     //       })}
//     //       <tr className="sum">
//     //         <td colspan="2">الإجماليات</td>
//     //         <td>{columnSum(data, "first_time_fee")}</td>
//     //         <td>{columnSum(data, "join_fee")}</td>
//     //         <td>{columnSum(data, "renew_fee")}</td>
//     //         <td>{columnSum(data, "membership_card_fee")}</td> 
//     //         <td>{(columnSum(data, "membership_card_fee") - ((columnSum(data, "membership_card_fee")*100)/114)).toFixed(2)}</td> 

//     //         <td>{columnSum(data, "prev_years_fee")}</td>
//     //         <td>{columnSum(data, "delay_penalty")}</td>
//     //         <td>{columnSum(data, "installment")}</td>
//     //         <td>0</td>
//     //         <td>{ref_card_total}</td>
//     //         <td>{(ref_card_total - ((ref_card_total *100)/114)).toFixed(2)}</td>
//     //         <td>{columnSum(data, "new_ref_fees")}</td>
//     //         <td>{(columnSum(data, "new_ref_fees") - ((columnSum(data, "new_ref_fees")*100)/114)).toFixed(2)}</td>



//     //         <td>{columnSum(data, "seperate_fees")}</td>
//     //         <td>{((columnSum(data, "seperate_fees")) - ((columnSum(data, "seperate_fees")*100)/114)).toFixed(2)}</td>
//     //         <td>{columnSum(data, "maintenance_fee")}</td>
//     //         <td>
//     //           {parseFloat(
//     //             data
//     //               ?.filter((el) => {
//     //                 return el.canceled == 0;
//     //               })
//     //               .reduce((accumulator, currentValue) => {
//     //                 return (
//     //                   accumulator +
//     //                   Number(currentValue.total_amount) -
//     //                   Number(currentValue.value_added_tax)
//     //                 );
//     //               }, 0)
//     //               .toFixed(2)
//     //           )}
//     //         </td>
//     //         <td>{columnSum(data, "value_added_tax")}</td>
//     //         <td>{columnSum(data, "total_amount")}</td>
//     //         <td></td>
//     //         <td></td>
//     //         <td>{((columnSum(data, "swimming")*100)/114).toFixed(2) }</td>
//     //         <td>{((columnSum(data, "swimming")) - ((columnSum(data, "swimming")*100)/114)).toFixed(2)}</td>

//     //         <td></td>
//     //       </tr>
//     //     </tbody>
//     //   </table>
//     );
//   };
//   return (
//     <>
//       <ReactToPrint
//         trigger={() => (
//           <Button label="إستخراج تقرير xlxs" icon="pi pi-book" iconPos="right" />
//         )}
//         content={() => pageRef.current}
//       />

// <Receipt />

//       <div style={{ display: "none" }}>
//         <div className="page" ref={pageRef} dir="rtl">
//           <div className="receipt">
//             <div>محافظة القاهرة</div>
//             <div>وزارة الشباب والرياضة</div>
//             <div>مركز التنمية الشبابية بالجزيرة</div>
//             <div className="flex justify-content-center space-x-4">
//               <div className="m-2">
//                 إحصائية خزينة رقم :{" "}
//                 {localStorage.clubUser &&
//                   JSON.parse(localStorage.clubUser).safe_no}
//               </div>
//               <div className="m-2">
//                 اسم مسئول الخزينة :{" "}
//                 {localStorage.clubUser &&
//                   JSON.parse(localStorage.clubUser).fullname}
//               </div>
//               <div className="m-2">{new Date().toLocaleDateString()}</div>
//             </div>
//             <Receipt />
//             <div className="flex justify-between ">
//               <div className="m-2">توقيع مسئول خزينة داخلية</div>
//               <div className="m-2">توقيع مراجع الخزينة</div>
//               <div className="m-2">توقيع رئيس قسم العضوية</div>
//             </div>
//             {}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ReportExcel;
