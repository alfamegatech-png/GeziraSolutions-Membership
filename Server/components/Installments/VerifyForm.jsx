
import { getStoredUser } from "@lib/browserStorage";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { checkMemberId } from "./NewMemberIntialAPIs";
import React, { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";

const VerifyForm = ({
  toggleVerifyDialog,
  toggleNewInstallmentDialog,
  saveMemberData,
  handleReload,
  verifyDialog,
  values,
  title,
}) => {
  const [user_id, setUser_id] = useState(0);
  const [shouldDisplayToast, setShouldDisplayToast] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [memberCode, setMemberCode] = useState(0);
  const [installmentMemberData, setInstallmentMemberData] = useState({});
  const toast = useRef(null);

  useEffect(() => {
    setUser_id(localStorage.clubUser && getStoredUser().id);
  }, []);

  useEffect(() => {
    if (showToast && shouldDisplayToast) {
      toast.current.show({
        severity: "error",
        summary: "خطأ",
        detail: " رقم العضوية لديه ملف عضوية بالفعل أو غير مشترك بنظام التقسيط",
        life: 3000,
      });
    }
    setShouldDisplayToast(false);
  }, [showToast, shouldDisplayToast]);

  const handleInstallmentCheck = async () => {
    const installmentData = await checkMemberId(memberCode);
    if (installmentData?.message === "success") {
      saveMemberData(installmentData.rows[0],memberCode);
      setInstallmentMemberData(installmentData.rows[0]);
      setShowToast(false);
      toggleVerifyDialog();
      toggleNewInstallmentDialog();
    } else {
      setShowToast(true);
      setShouldDisplayToast(true);
    }
  };

  const verifyDialogFooter = (
    <div style={{ textAlign: "left" }} className="mt-5">
      <Button
        label="تحقق"
        icon="pi pi-check"
        iconPos="right"
        onClick={() => {
          handleInstallmentCheck();
        }}
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toggleVerifyDialog}
      />
    </div>
  );
  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        visible={verifyDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header={title}
        footer={verifyDialogFooter}
        headerStyle={{ direction: "rtl", backgroundColor: "#34797F" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        onHide={toggleVerifyDialog}
      >
        <div className="card flex justify-content-center align-items-center">
          <div className="flex-auto">
            <label htmlFor="memberCode" className="font-bold block mb-2">
              رقم العضوية
            </label>
            <InputText
              inputId="memberCode"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default VerifyForm;
