import React, { useEffect, useRef, useState } from "react";
import { getMemberCheques, getMemberDetails } from "./MemberDetailsAPIs";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import InstallmentMemberData from "@components/InstallmentsMembers/InstallmentMemberData";
import { DataTable } from "primereact/datatable";
import { Accordion, AccordionTab } from "primereact/accordion";
import GenerateChequesForm from "./GenerateChequesForm";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import ChangeStatusDialog from "@components/cheques/ChangeStatusDialog";
import { Toast } from "primereact/toast";
import { getPaymentsTerms } from "../cheques/chequesAPIs";
import { fetchBanksData } from "../Installments/NewMemberIntialAPIs";

const InstallmentMemberDetails = ({ account_id }) => {
  const router = useRouter();
  const toast = useRef(null);

  const [reload, setReload] = useState(1);
  const [memberData, setMemberData] = useState([]);
  const [NewCheques, setNewCheques] = useState(false);
  const [NewChequesData, setNewChequesData] = useState([]);
  const [currentCheques, setCurrentCheques] = useState([]);
  const [selectedCheques, setSelectedCheques] = useState(null);
  const [changeStatusDialog, setChangeStatusDialog] = useState(false);
  const [transData, setTransData] = useState([]);
  const [banksListData, setBanksListData] = useState([]);

  const handleReload = () => {
    setReload(reload + 1);
  };

  useEffect(() => {
    const data = loadMemberDetailsData();
    loadBanksData();
    loadPaymentTermsData();
    setMemberData(data);
    
  }, [account_id]);

  useEffect(() => {
    
  }, [memberData]);


  const loadMemberDetailsData = async () => {
    
    const data = await getMemberDetails(account_id);
    setMemberData(data);
    const unfilteredCheques = await getMemberCheques(account_id);
    const cheques = unfilteredCheques?.filter((cheque) => {
      if (cheque.deleted_at == null) {
        return cheque;
      }
    });
    setCurrentCheques(cheques);
    return data;
  };

  const loadPaymentTermsData = async () => {
    const transDataRes = await getPaymentsTerms();
    setTransData(transDataRes);
  };
  const loadBanksData = async () => {
    const banksNames = await fetchBanksData();
    setBanksListData(banksNames);
  };
  const toggleChangeStatus = () => {
    setChangeStatusDialog(!changeStatusDialog);
  };

  const toogleNewCheques = () => {
    setNewCheques(!NewCheques);
  };

  const handleGeneratedCheques = (generatedChequesData) => {
    
    setCurrentCheques(generatedChequesData);
    handleReload();
  };

  const formatDate = (value) => {
    return new Date(value).toDateString();
  };

  const dateCreatedAtBodyTemplate = (rowData) => {
    
    return formatDate(rowData.createdAt);
  };
  const dateCollectedBodyTemplate = (rowData) => {
    return formatDate(rowData.installment_date);
  };

  const memberDetailsToolbarRight = () => {
    return (
      <>
        <h1 className="label_club">بيانات تقسيط العضوية</h1>
      </>
    );
  };

  const memberDetailsToolbarLeft = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          icon="pi pi-chevron-left"
          outlined
          onClick={() => router.back()}
        />
        <Button
          icon="pi pi-users"
          outlined
          onClick={() => router.replace("club/installments")}
        />
      </div>
    );
  };

  const membershipDetailsToolbarLeft = () => {
    return (
      <>
        <Button
          label="إنشاء الشيكات"
          icon="pi pi-plus"
          iconPos="right"
          onClick={toogleNewCheques}
          disabled={currentCheques?.length > 0 ? true : false}
        />

        <Button
          label="تغيير حالة الشيكات"
          iconPos="right"
          icon="pi pi-plus"
          onClick={toggleChangeStatus}
          disabled={currentCheques?.length > 0 ? false : true}

        />
      </>
    );
  };

  return (
    <>
      <Toast ref={toast} dir="rtl" />

      <Toolbar
        left={memberDetailsToolbarLeft}
        right={memberDetailsToolbarRight}
      ></Toolbar>

      <InstallmentMemberData memberData={memberData} />

      <GenerateChequesForm
        toogleNewCheques={toogleNewCheques}
        handleReload={handleReload}
        NewCheques={NewCheques}
        title="إنشاء الشيكات"
        account_id={account_id}
        onGeneratedCheques={handleGeneratedCheques}
      />

      <ChangeStatusDialog
        toggleChangeStatus={toggleChangeStatus}
        changeStatusDialog={changeStatusDialog}
        selectedCheques={selectedCheques}
        banksListData={banksListData}
        transData={transData}
        toast={toast}
        title="تغيير حالة الشيكات"
      />

      <Accordion activeIndex={0}>
        <AccordionTab
          header="الشيكات الحالية"
          headerStyle={{ direction: "rtl" }}
          // key={reloadKeyMembership}
        >
          <Toolbar left={membershipDetailsToolbarLeft}></Toolbar>

          <div className="card">
            <DataTable
              dataKey="cheque_id"
              dir="rtl"
              value={currentCheques}
              tableStyle={{ minWidth: "50rem" }}
              selectionMode={"checkbox"}
              selection={selectedCheques}
              onSelectionChange={(e) => {
                setSelectedCheques(e.value);
              }}
            >
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3rem" }}
              ></Column>

              <Column
                field="cheque_no"
                header="رقم الشيك"
                align={"center"}
              ></Column>
              <Column
                field="installment"
                header="قيمة الشيك"
                align={"center"}
              ></Column>
              <Column
                field="createdAt"
                header="تاريخ إنشاء الشيك"
                dataType="date"
                body={dateCreatedAtBodyTemplate}
                align={"center"}
              ></Column>
              <Column
                field="installment_with_interest"
                header="إجمالي القسط"
                align={"center"}
              ></Column>
              <Column
                field="total_collection_fees"
                header="مبلغ الفائدة"
                align={"center"}
              ></Column>
              <Column
                field="installment_date"
                header="تاريخ تحصيل الشيك"
                dataType="date"
                body={dateCollectedBodyTemplate}
                align={"center"}
              ></Column>
            </DataTable>
          </div>
        </AccordionTab>
      </Accordion>
    </>
  );
};

export default InstallmentMemberDetails;
