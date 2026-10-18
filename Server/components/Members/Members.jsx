"use client";
import { getStoredUser } from "@lib/browserStorage";

import React, { useState, useRef, useEffect } from "react";

import { Toolbar } from "primereact/toolbar";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { suspendOutdatedMembers } from "@components/Members/member";
import NewMemberForm from "@components/Members/NewMemberForm";
import MembersList from "@components/Members/MembersList";
import Form1 from "@components/form/Form1";
const Members = () => {
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user_id, setUser_id] = useState("");

  function handleReload() {
    setReloadKey((prevKey) => {
      return prevKey + 1
    });
    
  }
  const toast = useRef(null);
  useEffect(() => {
    setUser_id(localStorage.clubUser && getStoredUser().id);
  }, []);
  async function suspend() {
    setLoading(true);
    const count = await suspendOutdatedMembers();

    setLoading(false);
    toggleConfirmSuspendDialog();
    handleReload();
    toast.current.show({
      severity: "success",
      summary: "تم",
      detail: `${count} عضو تم إنهاء عضويتهم`,

      life: 3000,
    });
  }
  const toggleConfirmSuspendDialog = () => {
    setSuspendDialog(!suspendDialog);
  };
  const toggleNewDialog = () => {
    setNewDialog(!newDialog);
  };
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button permission="members.create"
          label="إضافة عضو جديد"
          iconPos="right"
          icon="pi pi-plus"
          onClick={toggleNewDialog}
        />
        <Button permission="memberships.expire"
          label="تعليق العضويات المنتهية"
          icon="pi pi-ban"
          iconPos="right"
          onClick={toggleConfirmSuspendDialog}

        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <>
        <h1 className="label_club">قائمة الاعضاء</h1>
      </>
    );
  };

  const suspendDialogFooter = (
    <div style={{ textAlign: "left" }}>
      <Button
        label="نعم"
        icon="pi pi-check"
        iconPos="right"
        loading={loading}
        onClick={async () => {
          await suspend();
        }}
      />
      <Button
        label="لا"
        icon="pi pi-times"
        iconPos="right"
        onClick={toggleConfirmSuspendDialog}

      />
    </div>
  );
  return (
    <>

      <Toast ref={toast} dir="rtl" />
      <Toolbar
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      ></Toolbar>



      <MembersList
        key={reloadKey}
      />
      {user_id && (
        <NewMemberForm
          toggleNewDialog={toggleNewDialog}
          handleReload={handleReload}
          newDialog={newDialog}
          values={{ user_id }}
          title="إضافة عضو جديد"
          method="create"
        />
      )}


      <Dialog
        visible={suspendDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="إنتبه !"
        headerStyle={{ direction: "rtl" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        footer={suspendDialogFooter}
        onHide={toggleConfirmSuspendDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />

          <span>هل تريد إيقاف العضويات المنتهية ؟</span>
        </div>
      </Dialog>
    </>
  );
};

export default Members;
