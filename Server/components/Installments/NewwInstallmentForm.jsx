
import { getStoredUser } from "@lib/browserStorage";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useFormik } from "formik";
import { classNames } from "primereact/utils";
import { Dropdown } from "primereact/dropdown";
import {
  fetchBanksData,
  GetAllPaymentFrequency,
  fetchPaymentTerms,
  submitNewMember
} from "../Installments/NewMemberIntialAPIs";
import { useRouter } from "next/navigation";

import React, { useEffect, useRef, useState } from "react";

const NewwInstallmentForm = ({
  toggleNewInstallmentDialog,
  handleReload,
  newInstallmentMemberDialog,
  memberData,
  memberCode,
  title,
}) => {
  const toast = useRef(null);
  const router = useRouter();
  const [user_id, setUser_id] = useState(0);
  const [selectedClubBank, setSelectedClubBank] = useState(null);
  const [selectedClientBank, setSelectedClientBank] = useState(null);
  const [allBanks, setAllBanks] = useState([]);
  const [allPaymentFreq, setAllPaymentFreq] = useState([]);
  const [selectedFreq, setSelectedFreq] = useState([]);
  const [allInstallmentMonthsList, setInstallmentMonthsList] = useState([]);
  const [allSelectedInstallmentMonthsList, setSelectedInstallmentMonthsList] =
    useState([]);
  const [selectedMonth, setSelectedMonth] = useState([]);

  useEffect(() => {
    setUser_id(localStorage.clubUser && getStoredUser().id);
    loadBanksData();
    loadPaymentFrequencies();
    loadPaymentTerms();
  }, []);

  useEffect(() => {
    if (memberData) {
      formik.setFieldValue("first_time_fee", memberData.first_time_fee);
      formik.setFieldValue("total_amount", memberData.total_amount);
      formik.setFieldValue("installment", memberData.installment);
      formik.setFieldValue("name", memberData.name);
    }
  }, [memberData]);

  const loadBanksData = async () => {
    const banksNames = await fetchBanksData();
    setAllBanks(banksNames);
  };

  const loadPaymentFrequencies = async () => {
    const freqs = await GetAllPaymentFrequency();
    setAllPaymentFreq(freqs);
  };

  const loadPaymentTerms = async () => {
    const paymentTerms = await fetchPaymentTerms();
    setInstallmentMonthsList(paymentTerms);
  };

  const handleSelectedFreq = async (value) => {
    setSelectedFreq(value);
    if (value.code === 2) {
      setSelectedInstallmentMonthsList(
        allInstallmentMonthsList.filter((el) => {
          return el.term_code % 3 === 0;
        })
      );
    } else if (value.code === 3) {
      setSelectedInstallmentMonthsList(
        allInstallmentMonthsList.filter((el) => {
          return el.term_code % 6 === 0;
        })
      );
    } else if (value.code === 4) {
      setSelectedInstallmentMonthsList(
        allInstallmentMonthsList.filter((el) => {
          return el.term_code % 12 === 0;
        })
      );
    } else {
      setSelectedInstallmentMonthsList(allInstallmentMonthsList);
    }
  };


  const formik = useFormik({
    initialValues: {
      memberCode: memberCode || "",
      first_time_fee: memberData?.first_time_fee || "",
      total_amount: memberData?.total_amount || "",
      installment: memberData?.installment || "",
      name: memberData?.name || "",
      clubBank: selectedClubBank || null,
      clientBank: selectedClientBank || null,
      payFreq: selectedFreq || null,
      paymentTerms: selectedMonth || null,
    },
    validate: (data) => {
      let errors = {};

      // if (!data.clubBank) {
      //   errors.clubBank = "برجاء إختيار بنك النادي";
      // }
      // if (!data.clientBank) {
      //   errors.clientBank = "برجاء إختيار بنك العميل";
      // }
      // if (!data.payFreq) {
      //   errors.payFreq = "برجاء إختيار مدة التقسيط";
      // }
      // if (!data.paymentTerms) {
      //   errors.paymentTerms = "برجاء إختيار مدة التقسيط";
      // }

      return errors;
    },
    onSubmit: (data) => {
      // data && show(data);
      // console.log(data);
      let formData = {
        member_code: parseInt(memberCode),
        club_bank: selectedClubBank.id,
        client_bank: selectedClientBank.id,
        payment_terms_id: selectedMonth.id,
        payment_frequency_id: selectedFreq.id,
        name_check_holder: memberData.name,
        user_id: user_id
      }
      const utils = {
        toast,
        toggleNewInstallmentDialog,
        router,
      };
      submitNewMember(formData,utils);
      formik.resetForm();
    },
  });

  const isFormFieldInvalid = (name) =>
    !!(formik.touched[name] && formik.errors[name]);

  const getFormErrorMessage = (name) => {
    return isFormFieldInvalid(name) ? (
      <small className="p-error">{formik.errors[name]}</small>
    ) : (
      <small className="p-error">&nbsp;</small>
    );
  };

  const newInstallmentMemberDialogFooter = (
    <div style={{ textAlign: "left" }} className="mt-5">
      <Button
        label="حفظ"
        type="submit"
        icon="pi pi-check"
        iconPos="right"
        onClick={() => {
          if (!formik.dirty || Object.keys(formik.errors).length > 0) {
            toast.current.show({
              severity: "error",
              summary: "خطأ",
              detail: "برجاء ملئ/مراجعة الحقول المطلوبة",
              life: 3000,
            });
          }
          formik.handleSubmit();
        }}
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toggleNewInstallmentDialog}
      />
    </div>
  );
  return (
    <div>
      <Toast ref={toast} />
      {memberData ? (
        <Dialog
          visible={newInstallmentMemberDialog}
          style={{ width: "32rem" }}
          breakpoints={{ "960px": "75vw", "641px": "90vw" }}
          header={title}
          footer={newInstallmentMemberDialogFooter}
          headerStyle={{ direction: "rtl", backgroundColor: "#34797F" }}
          rtl={true}
          contentStyle={{ direction: "rtl" }}
          modal
          onHide={toggleNewInstallmentDialog}
        >
          <div className="card flex justify-content-center align-items-center">
            <div className="flex-auto">
              <form
                onSubmit={formik.handleSubmit}
                className="flex flex-column gap-2"
              >
                <label
                  htmlFor="memberCode"
                  className="font-bold block my-3 text-white"
                >
                  رقم العضوية
                </label>
                <InputText
                  inputId="memberCode"
                  value={memberCode}
                  disabled={true}
                />
                <label
                  htmlFor="first_time_fee"
                  className="font-bold block my-3 text-white"
                >
                  المقدم
                </label>
                <InputText
                  inputId="first_time_fee"
                  value={formik.values.first_time_fee}
                  disabled={true}
                />
                <label
                  htmlFor="total_amount"
                  className="font-bold block my-3 text-white"
                >
                  الإجمالي
                </label>
                <InputText
                  inputId="total_amount"
                  value={formik.values.total_amount}
                  disabled={true}
                />

                <label
                  htmlFor="installment"
                  className="font-bold block my-3 text-white"
                >
                  القسط
                </label>
                <InputText
                  inputId="installment"
                  value={formik.values.installment}
                  disabled={true}
                />
                <label
                  htmlFor="name"
                  className="font-bold block my-3 text-white"
                >
                  اسم حامل الشيك
                </label>
                <InputText
                  inputId="name"
                  value={formik.values.name}
                  disabled={true}
                />

                <label
                  className="font-bold block my-3 text-white"
                  htmlFor="clubBank"
                >
                  بنك النادي
                </label>
                {/* <InputText
                  id="value"
                  name="value"
                  value={formik.values.value}
                  onChange={(e) => {
                    formik.setFieldValue("value", e.target.value);
                  }}
                  className={classNames({
                    "p-invalid": isFormFieldInvalid("value"),
                  })}
                /> */}
                {/*getFormErrorMessage("value")*/}

                <div className="card flex justify-content-center">
                  <Dropdown
                    id="clubBank"
                    value={selectedClubBank}
                    onChange={(e) => setSelectedClubBank(e.value)}
                    options={allBanks}
                    optionLabel="bank_name"
                    placeholder="اختر البنك الخاص بالنادي"
                    className="w-full"
                  />
                </div>
                {getFormErrorMessage("clubBank")}

                <label
                  className="font-bold block my-3 text-white"
                  htmlFor="clientBank"
                >
                  بنك العميل
                </label>

                <div className="card flex justify-content-center">
                  <Dropdown
                    id="clientBank"
                    value={selectedClientBank}
                    onChange={(e) => setSelectedClientBank(e.value)}
                    options={allBanks}
                    optionLabel="bank_name"
                    placeholder="اختر البنك الخاص بالعميل"
                    className="w-full"
                  />
                </div>
                {getFormErrorMessage("clientBank")}

                <label
                  className="font-bold block my-3 text-white"
                  htmlFor="input_value"
                >
                  اختر طريقة التقسيط
                </label>

                <div className="card flex justify-content-center">
                  <Dropdown
                    id="payFreq"
                    value={selectedFreq}
                    onChange={(e) => handleSelectedFreq(e.value)}
                    options={allPaymentFreq}
                    optionLabel="name"
                    placeholder="اختر طريقة التقسيط"
                    className="w-full"
                  />
                </div>

                <label
                  className="font-bold block my-3 text-white"
                  htmlFor="paymentTerms"
                >
                  اختر عدد شهور التقسيط
                </label>

                <div className="card flex justify-content-center">
                  <Dropdown
                    id="paymentTerms"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.value)}
                    options={allSelectedInstallmentMonthsList}
                    optionLabel="term_name"
                    placeholder="اختر عدد شهور التقسيط"
                    className="w-full"
                  />
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      ) : (
        ""
      )}
    </div>
  );
};

export default NewwInstallmentForm;
