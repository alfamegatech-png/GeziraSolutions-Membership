import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import React, { useState } from "react";
import { updateCheques } from "./chequesAPIs";

const ChangeStatusDialog = ({
  toggleChangeStatus,
  changeStatusDialog,
  handleReload,
  selectedCheques,
  banksListData,
  transData,
  title,
  toast
}) => {
  const [selectedBank, setSelectedBank] = useState("اختر نوع البنك");
  const [selectedTrans, setSelectedTrans] = useState("اختر الحالة");

  const sendSelectedCheques = () => {
    let dataIDs = selectedCheques.map((cheque) => cheque.cheque_id);

    let response = updateCheques(selectedTrans.id,dataIDs,toast,selectedBank.id)
  };

  const changeStatusFooter = (
    <div style={{ textAlign: "left" }} className="mt-5">
      <Button
        label="تغيير"
        icon="pi pi-check"
        iconPos="right"
        onClick={() => {
          sendSelectedCheques();
        }}
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toggleChangeStatus}
      />
    </div>
  );

  return (
    <>
      <Dialog
        visible={changeStatusDialog}
        style={{ width: "32rem", backgroundColor: "#000" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header={title}
        footer={changeStatusFooter}
        headerStyle={{ direction: "rtl", backgroundColor: "#000" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        onHide={toggleChangeStatus}
      >
        <div className="card flex justify-content-center align-items-center">
          <div className="flex-auto">
            <label htmlFor="dd-bankData" className="font-bold block mb-2">
              أختر البنك الخاص بالنادي
            </label>

            <Dropdown
              inputId="dd-bankData"
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.value);
              }}
              options={banksListData}
              optionLabel="bank_name"
              className="w-full md:w-20rem"
            />

            <label htmlFor="dd-transData" className="font-bold block m-2">
              أختر نوع الشيك
            </label>

            <Dropdown
              inputId="dd-transData"
              value={selectedTrans}
              onChange={(e) => {
                setSelectedTrans(e.value);
              }}
              options={transData}
              optionLabel="trans_name"
              className="w-full md:w-20rem"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ChangeStatusDialog;
