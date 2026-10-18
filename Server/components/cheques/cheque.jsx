
import { getStoredUser } from "@lib/browserStorage";
import React, { useEffect, useRef, useState } from "react";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import {
  getAllChequesByBankID,
  getAllChequesByOptions,
  getAllChequesByTransId,
  getPaymentsTerms,
} from "./chequesAPIs";
import { fetchBanksData } from "../Installments/NewMemberIntialAPIs";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ChangeStatusDialog from "./ChangeStatusDialog";

export default function Cheques() {
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user_id, setUser_id] = useState("");
  const [transData, setTransData] = useState([]);
  const [banksListData, setBanksListData] = useState([]);
  const [selectedTrans, setSelectedTrans] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [date, setDate] = useState(null);
  const [allCheques, setAllcheques] = useState([]);

  const [showClubBankDD, setShowClubBankDD] = useState(false);
  const [selectedCheques, setSelectedCheques] = useState(null);

  const [changeStatusDialog, setChangeStatusDialog] = useState(false);

  function handleReload() {
    setReloadKey((prevKey) => {
      return prevKey + 1;
    });
  }
  const toast = useRef(null);
  useEffect(() => {
    setUser_id(localStorage.clubUser && getStoredUser().id);
    loadPaymentTermsData();
    loadBanksData();
  }, []);

  useEffect(() => {
    loadTableData();
  }, [selectedTrans, selectedBank, date]);

  // useEffect(() => {
  // },[selectedCheques])

  const toggleChangeStatus = () => {
    setChangeStatusDialog(!changeStatusDialog);
  };
  const loadPaymentTermsData = async () => {
    const transDataRes = await getPaymentsTerms();
    setTransData(transDataRes);
  };

  const loadBanksData = async () => {
    const banksNames = await fetchBanksData();
    setBanksListData(banksNames);
  };
  const loadTableData = async () => {
    selectedTrans?.id == 2 ? setShowClubBankDD(true) : setShowClubBankDD(false);
    showClubBankDD ? "" : setSelectedBank("");
    let endDate = "";
    date ? (endDate = new Date(date).toISOString()) : "";
    const chequesData = await getAllChequesByOptions(
      selectedTrans?.id,
      selectedBank?.id,
      endDate
    );
    
    setAllcheques(chequesData);
  };

  const formatDate = (value) => {
    return new Date(value).toLocaleDateString();
  };

  const dateCreatedAtBodyTemplate = (rowData) => {
    return formatDate(rowData.createdAt);
  };
  const dateCollectedBodyTemplate = (rowData) => {
    return formatDate(rowData.installment_date);
  };
  const leftToolbarTemplate = () => {
    return (
      <>
        <div className="flex flex-wrap gap-2 mx-3">
          <Button
            label="تغيير حالة الشيكات"
            iconPos="right"
            icon="pi pi-plus"
            onClick={toggleChangeStatus}
          />
        </div>
      </>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <>
        <h1 className="label_club">قائمة الشيكات</h1>
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

      <ChangeStatusDialog
        toggleChangeStatus={toggleChangeStatus}
        changeStatusDialog={changeStatusDialog}
        handleReload={handleReload}
        selectedCheques={selectedCheques}
        banksListData={banksListData}
        transData={transData}
        toast={toast}
        title="تغيير حالة الشيكات"
      />

      <div className="card flex justify-content-end m-5">
        {showClubBankDD && (
          <span className="p-float-label">
            <Dropdown
              inputId="dd-bankData"
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.value);
              }}
              options={banksListData}
              optionLabel="bank_name"
              className="w-full md:w-14rem"
            />
            <label htmlFor="dd-bankData">أختر البنك الخاص بالنادي</label>
          </span>
        )}

        <div className="card flex justify-content-center mx-5">
          <span className="p-float-label">
            <Calendar
              inputId="cheque_date"
              value={date}
              showIcon
              onChange={(e) => {
                setDate(e.value);
              }}
            />
            <label htmlFor="cheque_date">تاريخ الشيك</label>
          </span>
        </div>

        <span className="p-float-label">
          <Dropdown
            inputId="dd-transData"
            value={selectedTrans}
            onChange={(e) => {
              setSelectedTrans(e.value);
              setSelectedBank("");
            }}
            options={transData}
            optionLabel="trans_name"
            className="w-full md:w-14rem"
          />
          <label htmlFor="dd-transData">أختر نوع الشيك</label>
        </span>
      </div>

      {/* <chequesList key={reloadKey} 
      chequesData/> */}

      <div className="card">
        <DataTable
          dir="rtl"
          value={allCheques}
          tableStyle={{ minWidth: "50rem" }}
          selectionMode={"checkbox"}
          selection={selectedCheques}
          onSelectionChange={(e) => {
            setSelectedCheques(e.value)
          }}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            align={"center"}
          ></Column>
          <Column
            field="member_code"
            header="رقم العضو"
            align={"center"}
          ></Column>
          <Column
            field="member_name"
            header="اسم العضو"
            align={"center"}
          ></Column>
          <Column
            field="createdAt"
            header="تاريخ الشيك"
            dataType="date"
            body={dateCreatedAtBodyTemplate}
            align={"center"}
          ></Column>
          <Column
            field="cheque_no"
            header="رقم الشيك"
            align={"center"}
          ></Column>
          <Column
            field="installment"
            header="مبلغ الشيك"
            align={"center"}
          ></Column>
          <Column
            field="clubBank.bank_name"
            header="بنك التحصيل"
            align={"center"}
          ></Column>
          <Column
            field="installment_date"
            header="تاريخ التحصيل"
            dataType="date"
            body={dateCollectedBodyTemplate}
            align={"center"}
          ></Column>
        </DataTable>
      </div>
    </>
  );
}
