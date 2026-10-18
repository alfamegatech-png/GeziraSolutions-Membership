import React, { useState, useRef, useEffect } from "react";
import { useFormik, Formik } from "formik";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import { Toast } from "primereact/toast";
import submit from "@components/form/submit";
import Field from "@components/form/Field";

import Image from "next/image";
import { intialFields } from "./UpdateIntialFields";
import { useRouter } from "next/navigation";
const UpdateMemberForm = ({
  newDialog,
  toggleNewDialog,
  handleReload,
  title,
  method,

  values,
  hidden,
  disabled,
  required,
  comboOptions,
}) => {
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [fieldsValues, setFieldsValues] = useState({});
  const [formReload, setFormReload] = useState(0);
  useEffect(() => {
    if (values) {
      Object.entries(values).forEach((val) => {
        if (val[1] === null) values[val[0]] = "";
        formik.setFieldValue(val[0], val[1]);
      });
      setFieldsValues(values);
    }
    hidden &&
      Object.entries(hidden).forEach(
        (val) => (intialFields.find((el) => el.id == val[0]).hidden = val[1])
      );
    disabled &&
      Object.entries(disabled).forEach(
        (val) => (intialFields.find((el) => el.id == val[0]).disabled = val[1])
      );

    required &&
      Object.entries(required).forEach(
        (val) => (intialFields.find((el) => el.id == val[0]).required = val[1])
      );
    comboOptions &&
      Object.entries(comboOptions).forEach(
        (val) =>
          (intialFields.find((el) => el.id == val[0]).comboOptions = val[1])
      );
    setFields(intialFields);
  }, [formReload]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const handleFileChange = (event) => {
    setFieldsValues({ ...fieldsValues, [event.target.id]: event.target.value });

    if (event.target.id == "image") {
      const file = event.target.files[0];
      setSelectedImage(file);
    }
    formik.handleChange(event);
  };
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
          errors[field.id] = `هذا الحقل إجباري`;
        }
        if (
          field.dataType == "number" &&
          isNaN(data[field.id]) &&
          field.required
        ) {
          errors[field.id] = `هذا الحقل إجباري`;
        }
      });

      // if (data.national_id?.length != 14 || !Number(data.national_id)) {
      //   errors.national_id = "يجب ان يتكون الرقم القومي من 14 رقم";
      // }

      if (data.end_date <= data.start_date) {
        errors.end_date = "يجب ان يكون تاريخ الانتهاء بعد تاريخ البدء";
      }

      return errors;
    },

    onSubmit: async (data) => {
      const utils = {
        fields,
        selectedImage,
        setLoading,
        toast,
        toggle,
        handleReload,
        setSelectedImage,
        router,
      };
      submit("members", method, data, utils);
    },
  });

  const newDialogFooter = (
    <div style={{ textAlign: "left" }}>
      <Button
        label="حفظ"
        icon="pi pi-check"
        iconPos="right"
        loading={loading}
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

  return (
    <>
      <Toast ref={toast} />

      <Dialog
        visible={newDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header={title}
        headerStyle={{ direction: "rtl" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        footer={newDialogFooter}
        onHide={toggleNewDialog}
      >
        <div className="card flex justify-content-center"></div>
        <div className="card flex justify-content-center">
          <form className="flex flex-column gap-2">
            <br />

            {fields.map((field) => {
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
                  lookup={field.lookup}
                  dataType={field.dataType}
                  required={field.required}
                  disabled={field.disabled}
                  accept={field.accept}
                  hidden={field.hidden}
                  compound={field.compound}
                  comboOptions={field.comboOptions}
                />
              );
            })}
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default UpdateMemberForm;
