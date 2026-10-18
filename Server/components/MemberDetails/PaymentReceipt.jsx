"use client";
import React, { useRef, forwardRef, useEffect, useState } from "react";
import ReactToPrint, { useReactToPrint } from "react-to-print";
import "./PaymentReceipt.styles.css";
import { Button } from "primereact/button";

const PaymentReceipt = forwardRef(
  (
    {
      member,
      refMember,
      secondary,
      ref_member_id,
      membershipData,
      membership: directMembership,
      isRef,
      totalLockerPrice ,
    },
    ref,
  ) => {
    let membership = directMembership;
    if (isRef) {
      membership = membership || membershipData || refMember?.member?.membership.find(
        (el) => {
          return (el.status == 1 &&
            el.secondary == secondary &&
            el.ref_member_id == ref_member_id && el.canceled == 0)
        })
    } else if (!isRef) {
      membership = membership || membershipData || member?.membership.find(
        (el) => {
          return (
            el.status == 1 &&
            el.secondary == secondary &&
            el.ref_member_id == ref_member_id)
        })
    }


    const receiptMember = member || refMember || membership?.member;
const calculateTotalLockerPrice = () => {
  let totalAdditionalFees = 0;
  
    if (membership?.bookingLockersLinks) {
      membership.bookingLockersLinks.forEach((locker) => {
        totalAdditionalFees += locker.bookingLocker?.Price || 0;
      });
    
    }
  return totalAdditionalFees;
};
    const lockerTotal =
      Number(totalLockerPrice) || Number(calculateTotalLockerPrice() || 0);
    const Receipt = () => {
      return (
        <div className="receipt">
          <div>محافظة القاهرة </div>
          <div>وزارة الشباب والرياضة</div>
          <div>مركز التنمية الشبابية بالجزيرة</div>
          <div className="flex justify-content-center">
            <div>
              اذن دفع رقم{" "}
              {String(membership?.safe_no) + String(membership?.serial_no)}
            </div>
          </div>
          <div className="flex justify-content-center">
            <div>رقم العضوية / {membership?.member_code}</div>
          </div>

          {receiptMember && <div>
              <div style={{ float: "left" }}>عضوية {receiptMember.member_type}</div>
              <div>الاسم / {receiptMember.name}</div>
            </div>
          }
          {refMember && member && <div>
              <div style={{ float: "left" }}>عضوية {refMember.member_type}</div>
              <div>الاسم / {refMember.name}</div>
            </div>
          }
          <br />
          <table>
            <thead>
              <tr>
                <td> </td>
                <td>عضوية اول مرة</td>
                <td>رسم التحاق</td>
                <td>تجديد</td>
                <td>بطاقة عضوية</td>
                <td>سنوات سابقة</td>
                <td>غرامة تأخير</td>
                <td>غرامات سابقة</td>
                <td>صندوق الزمالة</td>
                <td>رسوم التحويل والفصل</td>
                <td>قسط.ق.م</td>
                <td>فرق اشتراك</td>
                <td>اضافة تابع</td>
                <td>فصل/نقل عضوية</td>
                <td>رسم صيانة وانشاء</td>
                <td>رسم الدولاب</td>
                <td>قيمة مضافة</td>
                <td>رسم إشتراك السباحة</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>القيمة</td>
                <td>{membership?.first_time_fee}</td>
                <td>{membership?.join_fee}</td>
                <td>{membership?.renew_fee}</td>
                <td>{membership?.membership_card_fee}</td>
                <td>{membership?.prev_years_fee}</td>
                <td>{membership?.delay_penalty}</td>
                <td>{membership?.previous_penalties || 0}</td>
                <td>{membership?.fellowship_fund_fee || 0}</td>
                <td>{membership?.transfer_separation_fee || 0}</td>
                <td>{membership?.installment}</td>
                <td>0</td>
                <td>{membership?.new_ref_fees}</td>
                <td>{membership?.seperate_fees}</td>
                <td>{membership?.maintenance_fee}</td>
                <td>{lockerTotal}</td>
                <td>{membership?.value_added_tax}</td>

                <td>{membership?.swimming}</td>
              </tr>
            </tbody>
          </table>
          <br />
          <div className="flex justify-between">
            <div>
              إجمالي قبل القيمة المضافة{"  "}
              {Number(membership?.total_amount || 0) +
                lockerTotal -
                Number(membership?.value_added_tax || 0)}
            </div>

            <div>
              ضريبة قيمة مضافة {"  "}
              {membership?.value_added_tax}
            </div>
            <div>توقيع مسئول العضوية {"________"}</div>
          </div>
          <div className="flex justify-between">
            <div>
              الإجمالي العام {Number(membership?.total_amount || 0) + lockerTotal}
            </div>
            <div>توقيع المراجع {"________"}</div>
          </div>
          <div>
            تاريخ الإيصال{" "}
            {new Date(membership?.member_order_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
          </div>
        </div>
      );
    };
    return (
      <>
        <div style={{ display: "none" }}>
          <div className="page" ref={ref} dir="rtl">
            <Receipt />
            <Receipt />
            <Receipt />
          </div>
        </div>
      </>
    );
  }
);

export default PaymentReceipt;
