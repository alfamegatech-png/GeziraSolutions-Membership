// "use client";
// import React, { forwardRef } from "react";
// import "./PaymentReceipt.styles.css";

// const MembershipReceipt = forwardRef(({ members,memberName,refMember }, ref) => {
//    const renderReceipts = () => {
//     // console.log(memberName ,"mohsd");
//      return members.map((member, index) => (
//        <div key={index}>
//          <Receipt member={member} />
//        </div>
//      ));
//    };
//   const Receipt = ({ member }) => {
//     // console.log(member_code);
//     return (
//       <div className="receipt">
//         <div>محافظة القاهرة</div>
//         <div>وزارة الشباب والرياضة</div>
//         <div>مركز التنمية الشبابية بالجزيرة</div>
//         <div className="flex justify-content-center">
//           <div>
//             اذن دفع رقم {String(member?.safe_no) + String(member?.serial_no)}
//           </div>
//         </div>
//         <div className="flex justify-content-center">
//           <div>رقم العضوية / {members[0]?.member_code}</div>
//         </div>

//         {member && (
//           <div>
//             <div style={{ float: "left" }}>عضوية {member.member_type}</div>
//             <div>الاسم / {memberName}</div>
//           </div>
//         )}
//         {/* {refMember && (
//           <div>
//             <div style={{ float: "left" }}>عضوية {refMember.member_type}</div>
//             <div>الاسم / {refMember.name}</div>
//           </div>
//         )} */}
//         <br />
//         <table>
//           <thead>
//             <tr>
//               <td> </td>
//               <td>عضوية اول مرة</td>
//               <td>رسم التحاق</td>
//               <td>تجديد</td>
//               {/* <td>بطاقة عضوية</td> */}
//               <td>سنوات سابقة</td>
//               <td>غرامة تأخير</td>
//               <td>قسط.ق.م</td>
//               <td>فرق اشتراك</td>
//               <td>اضافة تابع</td>
//               <td>فصل/نقل عضوية</td>
//               <td>رسم صيانة وانشاء</td>
//               <td>قيمة مضافة</td>
//               <td>رسم إشتراك السباحة</td>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td>القيمة</td>
//               <td>{member?.first_time_fee}</td>
//               <td>{member?.join_fee}</td>
//               <td>{member?.renew_fee}</td>
//               {/* <td>{member?.member_card_fee}</td> */}
//               <td>{member?.prev_years_fee}</td>
//               <td>{member?.delay_penalty}</td>
//               <td>{member?.installment}</td>
//               <td>0</td>
//               <td>{member?.new_ref_fees}</td>
//               <td>{member?.seperate_fees}</td>
//               <td>{member?.maintenance_fee}</td>
//               <td>{member?.value_added_tax}</td>

//               <td>{member?.swimming}</td>
//             </tr>
//           </tbody>
//         </table>
//         <br />
//         <div className="flex justify-between">
//           <div>
//             إجمالي قبل القيمة المضافة{"  "}
//             {member?.total_amount - member?.value_added_tax}
//           </div>

//           <div>
//             ضريبة قيمة مضافة {"  "}
//             {member?.value_added_tax}
//           </div>
//           <div>توقيع مسئول العضوية {"________"}</div>
//         </div>
//         <div className="flex justify-between">
//           <div>الإجمالي العام {member?.total_amount}</div>
//           <div>توقيع المراجع {"________"}</div>
//         </div>
//         <div>
//           تاريخ الإيصال{" "}
//           {new Date(member?.member_order_date).toLocaleDateString()}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ display: "none" }}>
//       {members && members.length > 0 && (
//         <div className="page" ref={ref} dir="rtl">
//           {renderReceipts()}
//         </div>
//       )}
//     </div>
//   );

// });

// export default MembershipReceipt;
"use client";
import React, { forwardRef } from "react";
import "./PaymentReceipt.styles.css";
import { DEFAULT_PRICE_SETTINGS_MAP } from "@components/MembershipPrices/priceSettingsConfig";

const MembershipReceipt = forwardRef(
  ({ members, memberName, refMember }, ref) => {
    
    const calculateTotalAdditionalFees = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.new_ref_fees;
      });
      return totalAdditionalFees;
    };

    const calculateTotalAdditionalFees2 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.swimming;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees3 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.first_time_fee;
      });
      return totalAdditionalFees;
    };
    const calculateTotalLockerPrice = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        if (member.bookingLockersLinks) {
          member.bookingLockersLinks.forEach((locker) => {
            totalAdditionalFees += locker.bookingLocker?.Price || 0;
          });
        }
      });
      
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees4 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.join_fee;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees5 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.renew_fee;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees6 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.prev_years_fee;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees7 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += Number(member.delay_penalty || 0);
      });
      return totalAdditionalFees;
    };
    const calculateTotalPreviousPenalties = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += Number(member.previous_penalties || 0);
      });
      return totalAdditionalFees;
    };
    const calculateTotalFellowshipFund = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += Number(member.fellowship_fund_fee || 0);
      });
      return totalAdditionalFees;
    };
    const calculateTotalTransferSeparationFee = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += Number(member.transfer_separation_fee || 0);
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees8 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.installment;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees9 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.seperate_fees;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees10 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.maintenance_fee;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees11 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += member.value_added_tax;
      });
      return totalAdditionalFees;
    };
    const calculateTotalAdditionalFees13 = () => {
      let totalAdditionalFees = 0;
      members.forEach((member) => {
        totalAdditionalFees += calculateMembershipCardFee(member);
      });
      return totalAdditionalFees;
    };
    const calculateMembershipCardFee = (member) => {
      const activeRefs = member.member?.rel_members?.filter(
        (refMember) => refMember.deleted === 0
      );

      if (activeRefs) {
        return (
          Number(DEFAULT_PRICE_SETTINGS_MAP.membership_card_fee || 15) *
          Number(member.renew_years || 1) *
          (activeRefs.length + 1)
        );
      }

      return Number(member.membership_card_fee || 0);
    };
   const calculateTotalAdditionalFees12 = () => {

     let totalAdditionalFees = 0;
    // var total= calculateTotalAdditionalFees13()*14/100

     totalAdditionalFees += calculateTotalAdditionalFees();
     totalAdditionalFees += calculateTotalAdditionalFees2();
     totalAdditionalFees += calculateTotalAdditionalFees3();
     totalAdditionalFees += calculateTotalAdditionalFees4();
     totalAdditionalFees += calculateTotalAdditionalFees5();
     totalAdditionalFees += calculateTotalAdditionalFees6();
     totalAdditionalFees += calculateTotalAdditionalFees7();
     totalAdditionalFees += calculateTotalPreviousPenalties();
     totalAdditionalFees += calculateTotalFellowshipFund();
     totalAdditionalFees += calculateTotalTransferSeparationFee();
     totalAdditionalFees += calculateTotalAdditionalFees8();
     totalAdditionalFees += calculateTotalAdditionalFees9();
     totalAdditionalFees += calculateTotalAdditionalFees10();
     totalAdditionalFees += calculateTotalAdditionalFees11();
     totalAdditionalFees += calculateTotalAdditionalFees13();
    //  totalAdditionalFees += total;
     return totalAdditionalFees;
   };
  

    const renderReceipts = () => {
      if (!members || members.length === 0) return null;

      const firstMember = members[0];

      return (
        <div key={0}>
          <Receipt member={firstMember} />
        </div>
      );
    };

    const Receipt = ({ member }) => {
      // console.log(member_code);
      return (
        <div className="receipt">
          <div>محافظة القاهرة</div>
          <div>وزارة الشباب والرياضة</div>
          <div>مركز التنمية الشبابية بالجزيرة</div>
          <div className="flex justify-content-center">
            <div>
              اذن دفع رقم {String(member?.safe_no) + String(member?.serial_no)}
            </div>
          </div>
          <div className="flex justify-content-center">
            <div>رقم العضوية / {members[0]?.member_code}</div>
          </div>

          {member && (
            <div>
              <div style={{ float: "left" }}>عضوية {member.member_type}</div>
              <div>الاسم / {memberName}</div>
            </div>
          )}
          {/* {refMember && (
          <div>
            <div style={{ float: "left" }}>عضوية {refMember.member_type}</div>
            <div>الاسم / {refMember.name}</div>
          </div>
        )} */}
          <br />
          <table>
            <thead>
              <tr>
                <td> </td>
                <td>عضوية اول مرة</td>
                <td>رسم التحاق</td>
                <td>تجديد</td>
                {/* <td>بطاقة عضوية</td> */}
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
                <td>قيمة مضافة</td>
                <td>رسم إشتراك السباحة</td>
                <td>رسم إشتراك الدولاب</td>
                <td>رسوم كارنية</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>القيمة</td>
                <td>{calculateTotalAdditionalFees3()}</td>
                <td>{calculateTotalAdditionalFees4()}</td>
                <td>{calculateTotalAdditionalFees5()}</td>
                {/* <td>{member?.member_card_fee}</td> */}
                <td>{calculateTotalAdditionalFees6()}</td>
                <td>{calculateTotalAdditionalFees7()}</td>
                <td>{calculateTotalPreviousPenalties()}</td>
                <td>{calculateTotalFellowshipFund()}</td>
                <td>{calculateTotalTransferSeparationFee()}</td>
                <td>{calculateTotalAdditionalFees8()}</td>
                <td>0</td>
                <td>{calculateTotalAdditionalFees()}</td>
                <td>{calculateTotalAdditionalFees9()}</td>
                <td>{calculateTotalAdditionalFees10()}</td>
                <td>{calculateTotalAdditionalFees11()}</td>
                <td>{calculateTotalAdditionalFees2()}</td>
                <td>{calculateTotalLockerPrice()}</td>
                <td>{calculateTotalAdditionalFees13()}</td>
              </tr>
            </tbody>
          </table>
          <br />
          <div className="flex justify-between">
            <div>
              إجمالي قبل القيمة المضافة{"  "}
              {(calculateTotalAdditionalFees12()+calculateTotalLockerPrice() )-
                calculateTotalAdditionalFees11()}
            </div>

            <div>
              ضريبة قيمة مضافة {"  "}
              {calculateTotalAdditionalFees11()}
            </div>
            <div>توقيع مسئول العضوية {"________"}</div>
          </div>
          <div className="flex justify-between">
            <div>الإجمالي العام {calculateTotalAdditionalFees12()+calculateTotalLockerPrice()}</div>
            <div>توقيع المراجع {"________"}</div>
          </div>
          <div>
            تاريخ الإيصال{" "}
            {new Date(member?.member_order_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
          </div>
        </div>
      );
    };

    return (
      <div style={{ display: "none" }}>
        {members && members.length > 0 && (
          <div className="page" ref={ref} dir="rtl">
            {renderReceipts()}
          </div>
        )}
      </div>
    );
  }
);

export default MembershipReceipt;
