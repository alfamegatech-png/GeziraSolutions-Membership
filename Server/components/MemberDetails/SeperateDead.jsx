
import { getStoredUser } from "@lib/browserStorage";
import React, { useState, useRef } from "react";
import { useFormik, Formik } from "formik";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import { Toast } from "primereact/toast";
import submit from "@components/form/submit";
import Field from "@components/form/Field";
import { seperateDead } from "@components/Members/member";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
const SeperateDead = ({
  newDialog,
  toggleNewDialog,
  handleReload,
  title,

  selectedMember,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const [print, setPrint] = useState(null);
  const [selectedRefMember, setSelectedRefMember] = useState();

  const newDialogFooter = (
    <div style={{ textAlign: "left" }}>
      <Button
        label="حفظ"
        icon="pi pi-check"
        iconPos="right"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          // || !seperateFees
          if (!selectedRefMember ) {
            toast.current.show({
              severity: "error",
              summary: "خطأ",
              detail: "برجاء ملئ الحقول المطلوبة",
              life: 3000,
            });
            setLoading(false);
            return;
          }
          const result = await seperateDead(
            selectedMember,
            selectedRefMember,
            0,
            getStoredUser().id,
            getStoredUser().safe_no
          );

          setLoading(false);
          if (result.status !== "success") {
            toast.current.show({
              severity: "error",
              summary: "خطأ",
              detail: result.message || "تعذر فصل العضو",
              life: 5000,
            });
            return;
          }

          toggleNewDialog();
          router.push(`/club/members/${result.data.id}`);
          toast.current.show({
            severity: "success",
            summary: "تم",
            detail: "تم فصل العضو",
            life: 3000,
          });
        }}
        type="submit"
      />
      <Button
        label="إلغاء"
        iconPos="right"
        icon="pi pi-times"
        onClick={toggleNewDialog}
      />
    </div>
  );
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
        <div className="card flex justify-content-center">
          <DataTable
            value={selectedMember.rel_members}
            selectionMode="radiobutton"
            selection={selectedRefMember}
            onSelectionChange={(e) => setSelectedRefMember(e.value)}
            dataKey="id"
            // tableStyle={{ minWidth: "50rem" }}
          >
            <Column
              selectionMode="single"
              headerStyle={{ width: "3rem" }}
            ></Column>

            <Column field="name" header="الاسم"></Column>
            <Column field="rel_ref.name" header="صلة القرابة"></Column>
            <Column field="rel_ref.member_type" header="نوع العضوية"></Column>
          </DataTable>
        </div>
        {/* <label htmlFor="seperate_fees">رسم فصل العضوية</label>
        <input
          id="seperate_fees"
          type="number"
          value={seperateFees}
          onChange={(e) => {
            setSeperateFees(Number(e.target.value));
          }}
        /> */}
      </Dialog>
    </>
  );
};

export default SeperateDead;
