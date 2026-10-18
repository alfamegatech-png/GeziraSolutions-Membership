"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactToPrint from "react-to-print";
import "./Report.styles.css";
import { getReportData } from "./report.js";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { getStoredUser } from "@lib/browserStorage";
import { DEFAULT_PRICE_SETTINGS_MAP } from "@components/MembershipPrices/priceSettingsConfig";
import { fetchMembershipPriceSettingsMap } from "@components/MembershipPrices/priceSettingsClient";
import MembershipAggregationTable from "./MembershipAggregationTable";

const columnSum = (data, column) => {
  return parseFloat(
    data
      ?.filter((el) => {
        return el.canceled == 0;
      })
      .reduce((accumulator, currentValue) => {
        
        

        return accumulator + Number(currentValue[column]);
      }, 0)
      .toFixed(2)
  );
};

const Report = ({ member, lazyState, orderBy, include, filter }) => {
  const [refAge, setRefAge] = useState(null);
  const [clubUser, setClubUser] = useState({});

  const [data, setData] = useState([]);
  const [refFee, setRefFee] = useState(null);
  const [priceSettings, setPriceSettings] = useState(
    DEFAULT_PRICE_SETTINGS_MAP
  );
  const price = (key) =>
    Number(priceSettings[key] ?? DEFAULT_PRICE_SETTINGS_MAP[key] ?? 0);
  const vatFactor = () => 1 / (1 + price("vat_rate"));
  const membership = member?.membership[0];

  const [dataLoaded, setDataLoaded] = useState(false);

  // console.log(member);

  const handleGetReportData = async () => {
    const data2Report = await getReportData(
      lazyState,
      orderBy,
      include,
      filter
    );

    setDataLoaded(true);
    setData(data2Report);
  };

  useEffect(() => {
    (async () => {
      setClubUser(getStoredUser());
      await handleGetReportData();
      const settings = await fetchMembershipPriceSettingsMap();
      setPriceSettings(settings);
    })();
  }, []);

  const pageRef = useRef();
  const reportReceiptDate = data.find((item) => item.member_order_date)
    ?.member_order_date;
  const Receipt = () => {
    const renewalReceiptCount = data.filter(
      (el) => el.canceled == 0 && Number(el.renew_fee || 0) > 0
    ).length;
    let first_time_fee_total = 0;
    let new_fee_total = 0;
    let card_total = 0;
    let manual_card_total = 0;
    let ref_fee_total = 0;
    let ref_fee_vat_total = 0;
    let seperate_fees_total = 0;
    let maintenance_fee_total = 0;
    let total_1_toal = 0;
    let vat_total = 0;
    let total_2total = 0;

    let total_before_vat_calc = (data) => {
      let sum =
        columnSum(data, "first_time_fee") +
        columnSum(data, "join_fee") +
        columnSum(data, "renew_fee") +
        columnSum(data, "prev_years_fee") +
        columnSum(data, "delay_penalty") +
        columnSum(data, "previous_penalties") +
        columnSum(data, "fellowship_fund_fee") +
        columnSum(data, "transfer_separation_fee") +
        columnSum(data, "installment") +
        ref_fee_total +
        columnSum(data, "seperate_fees") +
        columnSum(data, "maintenance_fee") +
        columnSum(data, "membership_card_fee") /*manual_card_total*/ +
        columnSum(data, "swimming") * vatFactor();
      //  + ((columnSum(data, "swimming") - (columnSum(data, "swimming") * 100) / 114 ))

      return sum;
    };

    return (
      <>
      <table>
        <thead>
          <tr>
            <th>رقم العضوية</th>
            <th>الاسم</th>
            <th>تجديد</th>
            <th>سنوات سابقة</th>
            <th>غرامة تأخير</th>
            <th>غرامات سابقة</th>
            <th>صندوق الزمالة</th>
            <th>رسوم التحويل والفصل</th>
            <th>قسط.ق.م</th>
            <th>فرق اشتراك</th>
            <th>اضافة تابع</th>
            <th>عضوية اول مرة</th>
            <th>فصل/نقل عضوية</th>
            <th>رسم صيانة وانشاء</th>
            <th>بطاقة عضوية</th>
            <th>رسم التحاق</th>
            <th>رسم إشتراك السباحة</th>
            <th>إجمالي ق-ق</th>

            <th>ضريبة السباحة</th>
            {/* <th>ضريبة إضافة تابع</th> */}
            <th>قيمة مضافة</th>
            <th>الإجمالي</th>
            <th>إذن دفع رقم</th>
            <th>تاريخ الإذن</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 &&
            data.map((el, index) => {
              // console.log(el);
              if (el.total_amount === 0) {
                return null; // Skip rendering this row
              }

              let card_fee_calc = (el) => {
                if (el.new_ref_fees > 0 && el.canceled === 0) {
                  card_total += price("membership_card_fee");
                  // manual_card_total += price("membership_card_fee");
                  return price("membership_card_fee");
                } else {
                  return el.membership_card_fee;
                }
              };

              let seperate_fee_calc = (el) => {
                if (el.seperate_fees > 0 && el.canceled === 0) {
                  el.seperate_fees = price("separation_fee");
                  el.maintenance_fee = price("separation_maintenance_fee");
                  el.membership_card_fee = price("separation_card_fee");
                  el.value_added_tax = (
                    (el.maintenance_fee + el.membership_card_fee) *
                    price("vat_rate")
                  ).toFixed(2);
                  el.total_amount = price("separation_total_amount");
                  seperate_fees_total += price("separation_fee");
                  maintenance_fee_total += price("separation_maintenance_fee");
                  vat_total += el.value_added_tax;
                  total_1_toal +=
                    el.seperate_fees +
                    el.maintenance_fee +
                    el.membership_card_fee;
                  total_2total +=
                    el.seperate_fees +
                    el.maintenance_fee +
                    el.membership_card_fee +
                    el.value_added_tax;
                  return price("separation_fee");
                } else {
                  return 0;
                }
              };

              let first_time_fee_calc = (el) => {
                if (el.first_time_fee > 0 && el.canceled === 0) {
                  el.first_time_fee = 100;
                  el.maintenance_fee = price("separation_maintenance_fee");
                  el.membership_card_fee = price("separation_card_fee");
                  el.value_added_tax = (
                    (el.maintenance_fee + el.membership_card_fee) *
                    price("vat_rate")
                  ).toFixed(2);
                  el.total_amount = price("separation_total_amount");

                  first_time_fee_total += 100;
                  card_total += price("membership_card_fee");
                  maintenance_fee_total += price("separation_maintenance_fee");
                  vat_total += el.value_added_tax;
                  total_1_toal +=
                    el.first_time_fee +
                    el.maintenance_fee +
                    el.membership_card_fee;
                  total_2total +=
                    el.first_time_fee +
                    el.maintenance_fee +
                    el.membership_card_fee +
                    el.value_added_tax;
                  return 100;
                } else {
                  return 0;
                }
              };
              {
                /* const getRefAge = async (ref_member_id) => {
                const refMember = await getRefMember(ref_member_id);

                let refDate = refMember?.birth_date.getFullYear();
                console.log(
                  "refMember,birth_date",
                  refMember?.birth_date.getFullYear()
                );
                if (refDate) return refDate;
              }; */
              }

              let currentFee = 0;

              {
                /* useCallback(async (ref_member_id) => {
                const refMember = await getRefMember(ref_member_id);
                let refDate = refMember?.birth_date.getFullYear();
                if (refDate) setRefAge(refDate);
              }, []); */
              }

              let ref_fee_calc = (el) => {
                

                let result = { computedFee: 0, renewFee: 0 };

                if (el.new_ref_fees > 0 && el.canceled == 0) {
                  let date = new Date(el.member?.join_date);
                  let year = date.getFullYear();
                  if (year) {
                    let age = el.refAge;
                    if (age >= 22 && el.member.member_type === 7) {
                      ;
                      
                      let renewFee = price("default_ref_adult_renew");
                      let fees = el.new_ref_fees - renewFee;
                      el.renew_fee = renewFee;
                      currentFee = renewFee;
                      let computedFee =
                        fees * vatFactor() - price("membership_card_fee");
                      new_fee_total += currentFee;
                      ref_fee_total += computedFee;
                      ref_fee_vat_total += fees - fees * vatFactor();
                      result = { computedFee, renewFee };
                    } else if (
                      el.member.member_type === 7 ||
                      el.member.member_type === 9
                    ) {
                      const refCodes = [
                        1, 2, 4, 9, 10, 43, 44, 49, 68, 69, 70, 79, 80,
                      ];
                      let renewFee = refCodes.includes(el.refType)
                        ? price("default_ref_adult_renew")
                        : price("associated_underage_renew");
                      el.renew_fee = renewFee;
                      currentFee = renewFee;
                      let fees = el.new_ref_fees - currentFee;
                      let feesVat = Math.floor(
                        el.new_ref_fees -
                          price("membership_card_fee") -
                          currentFee
                      );
                      new_fee_total += currentFee;
                      ref_fee_total += feesVat * vatFactor();
                      ref_fee_vat_total += fees - fees * vatFactor();
                      let computedFee = Math.floor(feesVat * vatFactor());
                      result = { computedFee, renewFee };
                    } else if (
                      el.member.member_type === 1 ||
                      el.member.member_type === 5
                    ) {
                      let renewFee = 0;
                      let fees = el.new_ref_fees;
                      let feesVat = el.new_ref_fees;
                      new_fee_total += currentFee || 0;
                      ref_fee_total +=
                        feesVat * vatFactor() - price("membership_card_fee");
                      ref_fee_vat_total += fees - fees * vatFactor();
                      let computedFee =
                        feesVat * vatFactor() - price("membership_card_fee");
                      result = { computedFee, renewFee };
                    }
                  }
                }
                return result;
              };

              // حساب القيمة المضافة
              let ref_fee_vat_calc = (el) => {
                if (el.new_ref_fees > 0) {
                  let fees = el.new_ref_fees - currentFee;
                  return fees - fees * vatFactor();
                } else {
                  return el.new_ref_fees;
                }
              };
              const feeResult = ref_fee_calc(el); // Call the function once
              el.renew_fee = feeResult.renewFee ==0?el.renew_fee: feeResult.renewFee;
              return (
                <tr key={index}>
                  <td>{el.member_code}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{el.member?.name}</td>
                  <td>{el.renew_fee}</td> {/* تجديد */}
                  <td>{el.prev_years_fee}</td>
                  {/* سنوات سابقة */}
                  <td>{el.delay_penalty}</td>
                  {/* غرامة تاخير*/}
                  <td>{el.previous_penalties || 0}</td>
                  {/* غرامات سابقة */}
                  <td>{el.fellowship_fund_fee || 0}</td>
                  {/* صندوق الزمالة */}
                  <td>{el.transfer_separation_fee || 0}</td>
                  {/* رسوم التحويل والفصل */}
                  <td>{el.installment}</td>
                  {/* قسط */}
                  <td>0</td>
                  {/* {el.new_ref_fees > 0
                    ? ((el.new_ref_fees * 100) / 114 - 5).toFixed(2)
                    : el.new_ref_fees} */}
                  <td>{feeResult.computedFee.toFixed(2)}</td> {/* اضافة تابع */}
                  {/* اضافة تابع */}
                  {/* {refFee !== null ? refFee.toFixed(2) : "Loading..."}  */}
                  <td>{el.first_time_fee} </td>
                  {/* عضوية اول مرة */}
                  <td>{seperate_fee_calc(el)}</td>
                  {/*فصل ونقل عضوية */}
                  <td>{el.maintenance_fee}</td>
                  {/* صيانة وانشاء*/}
                  <td>{card_fee_calc(el)}</td> {/* بطاقة عضوية*/}
                  <td>{el.join_fee}</td>
                  {/* رسم الالتحاق */}
                  <td>{(el.swimming * vatFactor()).toFixed(2)}</td>
                  {/* رسم اشتراك سباحة */}
                  <td>
                    {/* اجمالي ق.ق*/}
                    {el.new_ref_fees > 0
                      ? (
                          feeResult.renewFee +
                          feeResult.computedFee +
                          price("membership_card_fee")
                        ).toFixed(2)
                      : el.swimming > 0
                      ? (el.total_amount - el.value_added_tax).toFixed(2)
                      : (el.total_amount - el.value_added_tax).toFixed(2)}
                  </td>
                  <td>
                    {(el.swimming - el.swimming * vatFactor()).toFixed(2)}
                  </td>
                  {/* ضريبة السياحة */}
                  {/* <td>
                  
                  {ref_fee_vat_calc(el).toFixed(2)}
                </td> */}
                  <td>
                    {el.value_added_tax +
                      Number(ref_fee_vat_calc(el).toFixed(2))}
                    {/* قيمة مضافة */}
                  </td>
                  <td>{el.total_amount}</td>
                  {/* اجمالي */}
                  <td>{String(el.safe_no) + String(el.serial_no)}</td>
                  <td>{new Date(el.member_order_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                  <td>{el.rel_canceled.name}</td>
                </tr>
              );
            })}
          <tr className="sum">
            <td colSpan="2">الإجماليات</td>
            <td>{columnSum(data, "renew_fee")}</td>
            <td>{columnSum(data, "prev_years_fee")}</td>
            <td>{columnSum(data, "delay_penalty")}</td>
            <td>{columnSum(data, "previous_penalties")}</td>
            <td>{columnSum(data, "fellowship_fund_fee")}</td>
            <td>{columnSum(data, "transfer_separation_fee")}</td>
            <td>{columnSum(data, "installment")}</td>
            <td>0</td>
            {/* <td>{columnSum(data, "new_ref_fees")}</td> */}
            <td>{ref_fee_total.toFixed(2)}</td>
            <td>{columnSum(data, "first_time_fee")}</td>
            <td>{columnSum(data, "seperate_fees")}</td>
            <td>{columnSum(data, "maintenance_fee")}</td>
            <td>{columnSum(data, "membership_card_fee") + card_total}</td>
            <td>{columnSum(data, "join_fee")}</td>
            <td>{(columnSum(data, "swimming") * vatFactor()).toFixed(2)}</td>
            <td>
              {/* {parseFloat(
                data
                  ?.filter((el) => {
                    return el.canceled == 0;
                  })
                  .reduce((accumulator, currentValue) => {
                    return (
                      accumulator +
                      Number(currentValue.total_amount) -
                      Number(currentValue.value_added_tax) + card_total
                    );
                  }, 0)
                  .toFixed(2)
              )} */}
              {total_before_vat_calc(data).toFixed(2)}
            </td>
            <td>
              {(
                columnSum(data, "swimming") -
                columnSum(data, "swimming") * vatFactor()
              ).toFixed(2)}
            </td>
            {/* <td>
              {(
                ref_fee_total -
                ref_fee_total * vatFactor()
              ).toFixed(2)} 
             {ref_fee_vat_total.toFixed(2)}
            </td> */}
            <td>
              {(columnSum(data, "value_added_tax") + ref_fee_vat_total).toFixed(
                2
              )}
            </td>
            <td>{columnSum(data, "total_amount")}</td>


            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div className="report-receipt-count">
        عدد الإيصالات : {renewalReceiptCount}
      </div>
      </>
    );
  };

  return (
    <>
      <ReactToPrint
        pageStyle="@page { size: A4 landscape; margin: 0; }"
        trigger={() => (
          <Button permission="reports.print"
            label="إستخراج تقرير"
            icon="pi pi-book"
            iconPos="right"
            disabled={!dataLoaded}
          />
        )}
        content={() => pageRef.current}
      />

      <div style={{ display: "none" }}>
        <div className="page" ref={pageRef} dir="rtl">
          <MembershipAggregationTable
            data={data}
            price={price}
            vatFactor={vatFactor}
            clubUser={{ ...clubUser, safe_no: new Set(data.map((row) => row.safe_no)).size === 1 ? data[0]?.safe_no : "كل الخزائن" }}
            reportReceiptDate={reportReceiptDate}
          />
        </div>
      </div>
    </>
  );
};

export default Report;
