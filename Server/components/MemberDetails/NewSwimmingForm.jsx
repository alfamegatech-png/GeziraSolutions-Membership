
import { getStoredUser } from "@lib/browserStorage";
import React, { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { createMembership } from "@components/Members/member";
import { Toast } from "primereact/toast";

import Field from "@components/form/Field";
import { DEFAULT_PRICE_SETTINGS_MAP } from "@components/MembershipPrices/priceSettingsConfig";
import { fetchMembershipPriceSettingsMap } from "@components/MembershipPrices/priceSettingsClient";

const NewSwimmingForm = ({
  newDialog,
  toggleNewDialog,
  handleReload,
  selectedMember,
}) => {
  const [priceSettings, setPriceSettings] = useState(
    DEFAULT_PRICE_SETTINGS_MAP
  );
  const price = (key) =>
    Number(priceSettings[key] ?? DEFAULT_PRICE_SETTINGS_MAP[key] ?? 0);

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
      hidden: true,
    },
    {
      id: "first_time_fee",
      name: "رسم إشتراك أول مرة",
      fieldType: "input",
      dataType: "number",
      required: true,
      hidden: true,
    },
    {
      id: "join_fee",
      name: "رسم إلتحاق",
      fieldType: "input",
      dataType: "number",
      required: true,
      hidden: true,
    },
    {
      id: "form_no",
      name: "رقم الاستمارة",
      fieldType: "input",
      dataType: "number",
      required: true,
    },
    {
      id: "membership_card_fee",
      name: "رسم بطاقة العضوية",
      fieldType: "input",
      dataType: "number",
      required: true,
      hidden: true,
    },
    {
      id: "maintenance_fee",
      name: "رسم صيانة وإنشاء",
      fieldType: "input",
      dataType: "number",
      required: true,
      hidden: true,
    },
    {
      id: "renew_fee",
      name: "رسم تجديد",
      fieldType: "input",
      dataType: "number",
      required: true,
      hidden: true,
    },

    {
      id: "delay_penalty",
      name: "غرامة تأخير",
      fieldType: "input",
      dataType: "number",
      required: false,
      hidden: true,
    },

    {
      id: "swimming",
      name: "رسم إشتراك سباحة",
      fieldType: "input",
      dataType: "number",
      required: true,
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
    {
      id: "related_membership",
      name: "related_membership",
      fieldType: "input",
      dataType: "text",
      required: false,
      disabled: true,
      hidden: false,
    },
    {
      id: "secondary",
      name: "secondary",
      fieldType: "input",
      dataType: "number",
      required: false,
      disabled: true,
      hidden: true,
    },
  ];

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [fieldsValues, setFieldsValues] = useState({});
  const [formReload, setFormReload] = useState(0);

  // useEffect(() => {
  //   console.log(fieldsValues);
  // }, [fieldsValues]);
  useEffect(() => {
    if (selectedMember) {
      // console.log(selectedMember);
      const values = {};
      values.safe_no = "";
      values.member_code = selectedMember.member_code;

      //Kirollos commented the three below lines
      selectedMember.membership ? '' : values.ref_member_id = selectedMember.id; 
      // values.related_membership = selectedMember.membership.find(
      //   (el) => el.status == 1 && el.secondary == 0
      // )?.id;





      values.secondary = 1;
      ////////////////**************safe no ********************//////////////////////////////////// */
      values.safe_no = getStoredUser().safe_no;
      /////////////////////////////////////////// swimming calculations ///////////////////
      values.swimming = price("swimming_fee");
      values.form_no = 0;
      /////////////////////////////////////////// first time fee calculations ///////////////////
      values.first_time_fee = 0;
      values.join_fee = 0;
      ////////////////**************date calculations********************//////////////////////////////////// */
      values.member_order_date = new Date();
      const startDateCheck = new Date(
        `${values.member_order_date.getFullYear()}-07-01`
      );
      const endDateCheck = new Date(
        `${values.member_order_date.getFullYear()}-12-31`
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
      /////////////////////////////////////////// renew years calculations ///////////////////

      values.renew_years = 0;

      ///////////////////////////////////////////membership_card_fee calculations ///////////////////
      values.membership_card_fee = 0;
      ///////////////////////////////////////////maintenance_fee calculations ///////////////////

      values.maintenance_fee = 0;

      ///////////////////////////////////////////renew fee calculations ///////////////////

      values.renew_fee = 0;
      /////////////////////////////////////////// delay_penalty calculations ///////////////////

      values.delay_penalty = 0;

      /////////////////////////////////////////// value_added_tax calculations ///////////////////
      values.value_added_tax = 0;
      /////////////////////////////////////////// total amount calculations ///////////////////
      values.total_amount =
        values.membership_card_fee +
        values.maintenance_fee +
        values.renew_fee +
        values.delay_penalty +
        values.value_added_tax +
        values.swimming +
        values.first_time_fee +
        values.join_fee;

      values.user_id = getStoredUser().id;
      ////////////////*******************************************//////////////////////////////////// */
      Object.entries(values).forEach((val) => {
        if (val[1] === null) values[val[0]] = "";
        formik.setFieldValue(val[0], val[1]);
      });

      setFieldsValues(values);
    }

    setFields(intialFields);
  }, [formReload, priceSettings]);
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
      const res = await createMembership(data);
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
      join_fee: fieldsValues.join_fee,
    };
    if (Object.keys(values2Tax).find((el) => el == event.target.id)) {
      values2Tax = { ...values2Tax, [event.target.id]: event.target.value };
    }
    const value_added_tax = parseFloat(
      (
        price("vat_rate") *
        (values2Tax.membership_card_fee +
          values2Tax.maintenance_fee +
          values2Tax.join_fee)
      ).toFixed(2)
    );

    let values2Sum = {
      membership_card_fee: fieldsValues.membership_card_fee,
      maintenance_fee: fieldsValues.maintenance_fee,
      renew_fee: fieldsValues.renew_fee,
      delay_penalty: fieldsValues.delay_penalty,
      value_added_tax,
      swimming: fieldsValues.swimming,
      first_time_fee: fieldsValues.first_time_fee,
      join_fee: fieldsValues.join_fee,
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
                    value={fieldsValues[field.id]}
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

export default NewSwimmingForm;
