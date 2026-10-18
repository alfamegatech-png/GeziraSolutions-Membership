import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";

import React, { useEffect, useRef, useState } from "react";
import { generateClientCheques } from "./MemberDetailsAPIs";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { getStoredUser } from "@lib/browserStorage";

const GenerateChequesForm = ({
  toogleNewCheques,
  handleReload,
  NewCheques,
  title,
  account_id,
  onGeneratedCheques
}) => {
  const [chequeSerial, setChequeSerial] = useState(0);
  const toast = useRef(null);
  const [user_id, setUser_id] = useState(null);

  useEffect(() => {
    setUser_id(getStoredUser().id || null);
  }, []);

  const generateCheques = async () => {
    let data = {
        startingChequeNumber:chequeSerial,
        user_id:user_id
    }
    const res = await generateClientCheques(account_id,data);
    onGeneratedCheques(res);
    handleReload();
  };



  const chequeDialogFooter = (
    <div style={{ textAlign: "left" }} className="mt-5">
      <Button
        label="حفظ"
        icon="pi pi-check"
        iconPos="right"
        // loading={loading}
        onClick={() => {
            generateCheques();
        }}
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toogleNewCheques}
      />
    </div>
  );

  return (
    <>
    <Toast ref={toast} />
      <Dialog
        visible={NewCheques}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header={title}
        footer={chequeDialogFooter}
        headerStyle={{ direction: "rtl", backgroundColor: "#34797F" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        onHide={toogleNewCheques}
      >
        <div className="card flex justify-content-center align-items-center">
          <div className="flex-auto">
            <label htmlFor="chequeSerial" className="font-bold block mb-2">
              رقم الشيك التسلسلي
            </label>
            <InputNumber
              inputId="chequeSerial"
              value={chequeSerial}
              onValueChange={(e) => {setChequeSerial(e.value)}}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default GenerateChequesForm;
