"use client"
import { getStoredUser } from "@lib/browserStorage";

import React, { useEffect, useRef, useState } from 'react'
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import VeifyInstallmentForm from './VeifyInstallmentForm';
import InstallmentsMembersList from '@components/InstallmentsMembers/InstallmentsMembersList';
import VerifyForm from './VerifyForm';
import NewwInstallmentForm from './NewwInstallmentForm';

export default function Installments() {
    const [verifyDialog, setVerifyDialog] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [user_id, setUser_id] = useState("");
    const [memberData, setMemberData] = useState(null);
    const [memberCode, setMemberCode] = useState(null);
    const [newInstallmentMemberDialog,setNewInstallmentMemberDialog] = useState(false);

    function handleReload() {
        setReloadKey((prevKey) => {
          return prevKey + 1
        });
        
      }    
    const toast = useRef(null);
    useEffect(() => {
        setUser_id(localStorage.clubUser && getStoredUser().id);
      }, []);

      const toggleVerifyDialog = () => {
        setVerifyDialog(!verifyDialog);
      }

      const toggleNewInstallmentDialog = () => {
        setNewInstallmentMemberDialog(!newInstallmentMemberDialog);
      }

      const saveMemberData = (data,memberCode) => {
        setMemberData(data);
        setMemberCode(memberCode);
      }

    const leftToolbarTemplate = () => {
        return (
          <>
          <div className="flex flex-wrap gap-2 mx-3">
            <Button
              label="التحقق من العضو"
              iconPos="right"
              icon="pi pi-plus"
              onClick={toggleVerifyDialog}
            />   
          </div>
          </>

        );
      };
    
      const rightToolbarTemplate = () => {
        return (
          <>
            <h1 className="label_club">قائمة أقساط الاعضاء</h1>
          </>
        );
      };
  return (
    <>
    <Toast ref={toast} dir="rtl" />
      <Toolbar
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      ></Toolbar>

<InstallmentsMembersList
        key={reloadKey}
      />
{user_id && (
        <VerifyForm
          toggleVerifyDialog={toggleVerifyDialog}
          toggleNewInstallmentDialog={toggleNewInstallmentDialog}
          saveMemberData={saveMemberData}
          handleReload={handleReload}
          verifyDialog={verifyDialog}
          values={{ user_id }}
          title="إضافة عضو تقسيط جديد"
        />
      )}

{user_id && (
        <NewwInstallmentForm
          toggleNewInstallmentDialog={toggleNewInstallmentDialog}
          handleReload={handleReload}
          newInstallmentMemberDialog={newInstallmentMemberDialog}
          memberData={memberData}
          memberCode={memberCode}
          title="إضافة عضو تقسيط جديد"
        />
      )}
    </>
    
  )
}
