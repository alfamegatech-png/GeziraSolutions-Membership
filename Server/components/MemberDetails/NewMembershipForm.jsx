
import { getStoredUser, getStoredValue } from "@lib/browserStorage";
import React, { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import { jwtDecode } from "jwt-decode";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { createMembership } from "@components/Members/member";
import { Toast } from "primereact/toast";
import axios from "axios";
import Field from "@components/form/Field";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom";
import PaymentReciept from "./PaymentReciept";
import {
  DEFAULT_PRICE_SETTINGS_MAP,
} from "@components/MembershipPrices/priceSettingsConfig";
import { fetchMembershipPriceSettingsMap } from "@components/MembershipPrices/priceSettingsClient";

function isDifference21YearsOrMore(date1, date2) {
  const diffYears = date1.getFullYear() - date2.getFullYear();
  if (diffYears > 21) {
    
    return true;
  } else if (diffYears === 21) {
    // If the difference is exactly 21 years, check months and days
    const diffMonths = date1.getMonth() - date2.getMonth();
    if (diffMonths > 0) {
      

      return true;
    } else if (diffMonths === 0) {
      // If months are equal, check days
      

      const diffDays = date1.getDate() - date2.getDate();
      if (diffDays >= 0) {
        

        return true;
      }
    }
  }

  return false;
}

const roundedMoney = (value) => parseFloat(Number(value || 0).toFixed(2));

const isPenaltyGracePeriod = (paymentDate = new Date()) => {
  const month = paymentDate.getMonth();
  return month >= 6 && month <= 11;
};

const getChargeablePenaltyYears = (renewYears, paymentDate = new Date()) => {
  const years = Number(renewYears || 0);
  if (years <= 0) return 0;
  return isPenaltyGracePeriod(paymentDate) ? Math.max(years - 1, 0) : years;
};

const NewMembershipForm = ({
  newDialog,
  toggleNewDialog,
  handleReload,
  selectedMember,
  totalLockerPrice,
  lockerIds,
}) => {
  const [priceSettings, setPriceSettings] = useState(
    DEFAULT_PRICE_SETTINGS_MAP
  );
  const price = (key) =>
    Number(priceSettings[key] ?? DEFAULT_PRICE_SETTINGS_MAP[key] ?? 0);

  const getLatestYearRenewFee = (fee) => {
    const value = Number(fee || 0);
    if (value === price("old_reduced_renew_fee")) {
      return price("associated_underage_renew");
    }
    return value;
  };

  const getPreviousYearRenewFee = (latestFee) => {
    const fee = Number(latestFee || 0);
    if (fee === price("associated_underage_renew")) {
      return price("old_reduced_renew_fee");
    }
    if (fee === 120) {
      return price("old_member_renew_fee");
    }
    return fee;
  };

  const getRenewalBreakdown = (latestAnnualFee, previousAnnualFee, renewYears) => {
    const previousYears = Math.max(Number(renewYears || 0) - 1, 0);
    return {
      latestYearFee: roundedMoney(latestAnnualFee),
      previousYearsFee: roundedMoney(previousYears * previousAnnualFee),
    };
  };

  useEffect(() => {
    fetchMembershipPriceSettingsMap().then(setPriceSettings);
  }, []);

  const intialFields = [
    {
      id: "safe_no",
      name: "رقم الخزنة",
      fieldType: "input",
      dataType: "number",
      disabled: true,
      required: true,
    },
    {
      id: "member_code",
      name: "رقم العضوية",
      fieldType: "input",
      dataType: "text",
      disabled: true,
      required: true,
      value: selectedMember.member_code,
    },
    {
      id: "member_order_date",
      name: "تاريخ التجديد",
      fieldType: "input",
      dataType: "date",
      required: true,
    },
    {
      id: "start_date",
      name: "تاريخ البدء",
      fieldType: "input",
      dataType: "date",
      required: true,
    },

    {
      id: "end_date",
      name: "تاريخ الإنتهاء",
      fieldType: "input",
      dataType: "date",
      required: true,
    },
    {
      id: "renew_years",
      name: "سنوات التجديد",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "first_time_fee",
      name: "رسم إشتراك أول مرة",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "join_fee",
      name: "رسم إلتحاق",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "form_no",
      name: "رقم الاستمارة",
      fieldType: "input",
      dataType: "number",
      required: false,
    },
    {
      id: "membership_card_fee",
      name: "رسم بطاقة العضوية",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "maintenance_fee",
      name: "رسم صيانة وإنشاء",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "prev_years_fee",
      name: "سنوات سابقة",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "renew_fee",
      name: "رسم تجديد",
      fieldType: "input",
      dataType: "number",
      required: true,
    },

    {
      id: "delay_penalty",
      name: "غرامة تأخير",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "previous_penalties",
      name: "غرامات سابقة",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "fellowship_fund_fee",
      name: "صندوق الزمالة",
      fieldType: "input",
      dataType: "number",
      disabled: true,
      required: true,
    },
    {
      id: "transfer_separation_fee",
      name: "رسوم التحويل والفصل",
      fieldType: "input",
      dataType: "number",
      required: true,
    },

    {
      id: "swimming",
      name: "رسم إشتراك سباحة",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "locaker_price",
      name: "قيمة سعر الدولاب",
      fieldType: "input",
      dataType: "number",
      disabled: true,
      required: false,
    },
    {
      id: "value_added_tax",
      name: "ضريبة القيمة المضافة",
      fieldType: "input",
      dataType: "number",
      disabled: true,
      required: true,
    },
    {
      id: "installment",
      name: "قسط قيمة مضافة",
      fieldType: "input",
      dataType: "number",
      disabled: false,
      required: true,
    },

    {
      id: "total_amount",
      name: "الإجمالي العام",
      fieldType: "input",
      dataType: "number",
      disabled: true,
      required: true,
    },
    {
      id: "remark",
      name: "ملاحظات",
      fieldType: "input",
      dataType: "text",
      required: false,
    },
    {
      id: "user_id",
      name: "user_id",
      fieldType: "input",
      dataType: "text",
      required: false,
      // disabled: true,
      hidden: true,
    },
  ];

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [fieldsValues, setFieldsValues] = useState({});
  const [formReload, setFormReload] = useState(0);
  const [decodedData, setDecodedData] = useState(null);
  const [tokenLocker, setTokenLocker] = useState(null);
  useEffect(() => { setTokenLocker(getStoredValue("lockerToken")); }, []);
  const componentRef = useRef(null);

useEffect(()=>{
  if (tokenLocker) {
    try {
      setDecodedData(jwtDecode(tokenLocker));
    } catch {
      setDecodedData(null);
    }
  }
 
},[tokenLocker])
  useEffect(() => {
    if (selectedMember) {

      const values = {};
      values.safe_no = "";
      values.member_code = selectedMember.member_code;
      values.safe_no =
        localStorage.clubUser && getStoredUser().safe_no;
      values.swimming = 0;
      values.first_time_fee = 0;
      values.join_fee = 0;
      values.installment = 0;
      values.previous_penalties = 0;
      values.fellowship_fund_fee = price("fellowship_fund_fee");
      values.transfer_separation_fee = 0;
      values.member_order_date = new Date();
      values.member_order_date.setHours(10, 37, 14, 0); // Set static time to 10:37:14

      // console.log(
      //   values.member_order_date +
      //     "dsegbfbslfnldsfldsnflkdsjhfljdsflkdsjlkfjhdlsjnf;"
      // );

      const staticTime = "10:37:14"; // Static time in HH:MM:SS format

      const startDateCheck = new Date(
        `${values.member_order_date.getFullYear()}-07-01T${staticTime}`
      );
      const endDateCheck = new Date(
        `${values.member_order_date.getFullYear()}-12-31T${staticTime}`
      );

      // console.log(endDateCheck + "khalooda");

      selectedMember.membership.sort(
        (a, b) => new Date(b.end_date) - new Date(a.end_date)
      );

      if (
        values.member_order_date >= startDateCheck &&
        values.member_order_date <= endDateCheck
      ) {
        values.start_date = new Date(
          `${values.member_order_date.getFullYear()}-07-01`
        );
      } else {
        values.start_date = new Date(
          `${values.member_order_date.getFullYear() - 1}-07-01`
        );
      }
      values.end_date = new Date(
        `${values.start_date.getFullYear() + 1}-06-30`
      );
      // console.log(selectedMember.membership[0]);

      const lastMembershipEndDate = selectedMember.membership[0]?.end_date || selectedMember.separationRenewalContext?.lastMembershipEndDate;
      const parsedLastEndDate = lastMembershipEndDate
        ? new Date(lastMembershipEndDate)
        : null;
      const hasValidLastEndDate =
        parsedLastEndDate && !Number.isNaN(parsedLastEndDate.getTime());
      const latency_years = hasValidLastEndDate
        ? Math.max(
            0,
            values.start_date.getFullYear() - parsedLastEndDate.getFullYear()
          )
        : 0;

      values.renew_years = latency_years + 1;

      const activeMembersCount =
        selectedMember.rel_members.filter((member) => member.deleted === 0)
          .length + 1;
      values.membership_card_fee =
        (price("membership_card_fee") +
          Math.max(values.renew_years - 1, 0) *
            price("old_membership_card_fee")) *
        activeMembersCount;
      const m_f_value = selectedMember.rel_members.filter(
        (member) => member.deleted === 0
      ).length
        ? price("maintenance_with_related")
        : price("maintenance_without_related");

      if (values.renew_years > 3) values.maintenance_fee = 3 * m_f_value;
      else values.maintenance_fee = values.renew_years * m_f_value;

      let member_renew;
      let total_ref_members_renew;
      let previous_member_renew;
      let previous_ref_members_renew;

      if ([12, 14].includes(selectedMember.section)) {
        member_renew = price("special_section_member_renew");
        previous_member_renew = member_renew;
        total_ref_members_renew = selectedMember.rel_members.reduce(
          (sum, member) => {
            return (
              sum +
              (member.deleted === 0 // Check if deleted is 0
                ? isDifference21YearsOrMore(
                    new Date(),
                    new Date(member.birth_date)
                  )
                  ? price("special_section_ref_adult")
                  : price("special_section_ref_child")
                : 0)
            );
          },
          0
        );
        previous_ref_members_renew = total_ref_members_renew;
      } else if (
        selectedMember.rel_member_type?.name == "منتسبه" &&
        !isDifference21YearsOrMore(
          new Date(),
          new Date(selectedMember.birth_date)
        )
      ) {
        member_renew = price("associated_underage_renew");
        previous_member_renew = getPreviousYearRenewFee(member_renew);
        total_ref_members_renew = selectedMember.rel_members.reduce(
          (sum, member) => {
            return (
              sum +
              (member.deleted === 0
                ? isDifference21YearsOrMore(
                    new Date(),
                    new Date(member.birth_date)
                  )
                  ? price("associated_underage_renew")
                  : getLatestYearRenewFee(member.rel_ref.price)
                : 0)
            );
          },
          0
        );
        previous_ref_members_renew = selectedMember.rel_members.reduce(
          (sum, member) => {
            if (member.deleted !== 0) return sum;
            const latestFee = isDifference21YearsOrMore(
              new Date(),
              new Date(member.birth_date)
            )
              ? price("associated_underage_renew")
              : getLatestYearRenewFee(member.rel_ref.price);
            return sum + getPreviousYearRenewFee(latestFee);
          },
          0
        );
      } else {
        member_renew = getLatestYearRenewFee(
          selectedMember.rel_member_type?.price || 0
        );
        previous_member_renew = getPreviousYearRenewFee(member_renew);
        total_ref_members_renew = selectedMember.rel_members.reduce(
          (sum, member) => {
            return (
              sum +
              (member.deleted === 0
                ? isDifference21YearsOrMore(
                    new Date(),
                    new Date(member.birth_date)
                  )
                  ? price("default_ref_adult_renew")
                  : getLatestYearRenewFee(member.rel_ref.price)
                : 0)
            );
          },
          0
        );
        previous_ref_members_renew = selectedMember.rel_members.reduce(
          (sum, member) => {
            if (member.deleted !== 0) return sum;
            const latestFee = isDifference21YearsOrMore(
              new Date(),
              new Date(member.birth_date)
            )
              ? price("default_ref_adult_renew")
              : getLatestYearRenewFee(member.rel_ref.price);
            return sum + getPreviousYearRenewFee(latestFee);
          },
          0
        );
      }

      let latestAnnualRenewFee = member_renew + total_ref_members_renew;
      let previousAnnualRenewFee =
        previous_member_renew + previous_ref_members_renew;

      if ([2, 22, 23].includes(selectedMember.section)) {
        latestAnnualRenewFee =
          price("reduced_sections_renew_multiplier") * latestAnnualRenewFee;
        previousAnnualRenewFee =
          price("reduced_sections_renew_multiplier") * previousAnnualRenewFee;
      }

      const renewalBreakdown = getRenewalBreakdown(
        latestAnnualRenewFee,
        previousAnnualRenewFee,
        values.renew_years
      );
      values.renew_fee = renewalBreakdown.latestYearFee;
      values.prev_years_fee = renewalBreakdown.previousYearsFee;

      const currentYear = new Date().getFullYear();
      const lastEndDate = hasValidLastEndDate
        ? parsedLastEndDate.getFullYear()
        : null;

      if (lastEndDate === null || lastEndDate >= currentYear) {
        values.delay_penalty = 0;
      } else {
        const renewYears = getChargeablePenaltyYears(
          values.renew_years,
          new Date()
        );
        const delayPenaltyRate =
          (renewYears >= 1 ? price("delay_penalty_one_year") : 0) +
          (renewYears >= 2 ? price("delay_penalty_two_years") : 0) +
          (renewYears >= 3 ? price("delay_penalty_three_years") : 0);
        if (renewYears == 0) values.delay_penalty = 0;
        if (renewYears > 0) {
          values.delay_penalty = parseFloat(
            (delayPenaltyRate * values.renew_fee).toFixed(2)
          );
        }
      }

      values.value_added_tax = parseFloat(
        (
          price("vat_rate") *
          (values.membership_card_fee +
            values.maintenance_fee +
            values.transfer_separation_fee +
            values.join_fee)
        ).toFixed(2)
      );

      values.total_amount =
        values.membership_card_fee +
        values.maintenance_fee +
        values.renew_fee +
        values.delay_penalty +
        values.previous_penalties +
        values.fellowship_fund_fee +
        values.transfer_separation_fee +
        values.value_added_tax +
        values.swimming +
        values.first_time_fee +
        values.join_fee +
        values.installment +
        values.prev_years_fee;
      values.user_id =
        localStorage.clubUser && getStoredUser().id;
        if (totalLockerPrice) {
          values.total_amount += totalLockerPrice;
        }
      Object.entries(values).forEach((val) => {
        if (val[1] === null) values[val[0]] = "";
        formik.setFieldValue(val[0], val[1]);
      });
      // console.log(values);

      setFieldsValues(values);
    }

    setFields(intialFields);
  }, [formReload,totalLockerPrice, priceSettings]);
  const toast = useRef(null);
  function toggle() {
    formik.handleReset;
    formik.resetForm();
    setFormReload(formReload + 1);
    toggleNewDialog();
  }


  const formik = useFormik({
    initialValues: fields.reduce((obj, field) => {
      if (field.dataType == "text") obj[field.id] = "";
      if (field.value) obj[field.id] = field.value;

      return obj;
    }, {}),
    validate: (data) => {

      let errors = {};
      fields.forEach((field) => {
        if (!data[field.id] && field.required) {
          if (field.dataType != "number") errors[field.id] = `هذا الحقل إجباري`;
        }
        if (
          field.dataType == "number" &&
          isNaN(data[field.id]) &&
          field.required
        ) {
          errors[field.id] = `هذا الحقل إجباري`;
        }
      });
      if (data.end_date <= data.start_date) {
        errors.end_date = "يجب ان يكون تاريخ الانتهاء بعد تاريخ البدء";
      }

      return errors;
    },
    onSubmit: async (data) => {
      setLoading(true);
      const dataToSubmit = { ...data };
      if (totalLockerPrice) {
        dataToSubmit.total_amount = Number((dataToSubmit.total_amount).toFixed(2)) - Number((totalLockerPrice));
      }
      
  
      const bookingLockerIds = totalLockerPrice ? lockerIds : null;
      const user_id = totalLockerPrice ? decodedData?.nameid : null;
      const safeNumber = totalLockerPrice ? dataToSubmit?.safe_no : null;
      const res = await createMembership(dataToSubmit, bookingLockerIds, user_id, safeNumber);
      // const res = await createMembership(dataToSubmit);
      setLoading(false);

      if (res.status == "success") {
        toggle();
        handleReload();
      }

      toast.current.show({
        severity: res.status,
        summary: res.status,
        detail: res.message,
        life: 3000,
      });
    },
  });

  const newDialogFooter = (
    <div style={{ textAlign: "left" }}>
      <Button
        label="إضافة"
        icon="pi pi-check"
        loading={loading}
        iconPos="right"
        onClick={() => {
          if (!formik.isValid) {
            toast.current.show({
              severity: "error",
              summary: "خطأ",
              detail: "برجاء ملئ/مراجعة الحقول المطلوبة",
              life: 3000,
            });
          }
          formik.handleSubmit();
        }}
        type="submit"
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toggle}
      />
    </div>
  );

  const isFormFieldInvalid = (id) => {
    return formik.errors[id];
  };

  const getFormErrorMessage = (name) => {
    return isFormFieldInvalid(name) ? (
      <small className="p-error">{formik.errors[name]}</small>
    ) : (
      <small className="p-error">&nbsp;</small>
    );
  };

  const handleFileChange = (event) => {
    let values2Tax = {
      membership_card_fee: fieldsValues.membership_card_fee,
      maintenance_fee: fieldsValues.maintenance_fee,
      transfer_separation_fee: fieldsValues.transfer_separation_fee,
      join_fee: fieldsValues.join_fee,
    };

    if (Object.keys(values2Tax).find((el) => el == event.target.id)) {
      values2Tax = { ...values2Tax, [event.target.id]: event.target.value };
    }

    const value_added_tax = parseFloat(
      (
        price("vat_rate") *
        (+values2Tax.membership_card_fee +
          +values2Tax.maintenance_fee +
          +values2Tax.transfer_separation_fee +
          +values2Tax.join_fee)
      ).toFixed(2)
    );

    let values2Sum = {
      membership_card_fee: fieldsValues.membership_card_fee,
      maintenance_fee: fieldsValues.maintenance_fee,
      renew_fee: fieldsValues.renew_fee,
      delay_penalty: fieldsValues.delay_penalty,
      previous_penalties: fieldsValues.previous_penalties,
      fellowship_fund_fee: fieldsValues.fellowship_fund_fee,
      transfer_separation_fee: fieldsValues.transfer_separation_fee,
      value_added_tax,
      swimming: fieldsValues.swimming,
      first_time_fee: fieldsValues.first_time_fee,
      join_fee: fieldsValues.join_fee,
      installment: fieldsValues.installment,
      prev_years_fee: fieldsValues.prev_years_fee,
      locker_price: totalLockerPrice,
    };
    if (Object.keys(values2Sum).find((el) => el == event.target.id)) {
      values2Sum = { ...values2Sum, [event.target.id]: event.target.value };
    }
    const total_amount = Object.values(values2Sum).reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue),
      0
    );
    formik.setFieldValue("value_added_tax", value_added_tax);
    formik.setFieldValue("total_amount", total_amount);
    setFieldsValues({
      ...fieldsValues,
      [event.target.id]: event.target.value,
      value_added_tax,
      total_amount,
    });

    if (event.target.id == "image") {
      const file = event.target.files[0];
      setSelectedImage(file);
    }

    formik.handleChange(event);
  };

  return (
    <>
      <Toast ref={toast} />

      <Dialog
        visible={newDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="تجديد العضوية"
        headerStyle={{ direction: "rtl" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        footer={newDialogFooter}
        onHide={toggleNewDialog}
      >
        <div className="card flex justify-content-center">
          <form className="flex flex-column gap-2">
            <br />

            {fieldsValues &&
              fields.map((field) => {
                return (
                  <Field
                    key={field.id}
                    id={field.id}
                    name={field.name}
                    isFormFieldInvalid={isFormFieldInvalid}
                    getFormErrorMessage={getFormErrorMessage}
                    onChange={handleFileChange}
                    value={
                      field.id === "locaker_price"
                        ? totalLockerPrice
                        : fieldsValues[field.id]
                    }
                    fieldType={field.fieldType}
                    dataType={field.dataType}
                    disabled={field.disabled}
                    hidden={field.hidden}
                    required={field.required}
                  />
                );
              })}
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default NewMembershipForm;
