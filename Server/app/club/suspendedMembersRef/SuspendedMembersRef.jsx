
import { Toast } from "primereact/toast";
import React, { useRef } from "react";
import { Toolbar } from "primereact/toolbar";
import { SupendedMembersRefList } from "./SupendedMembersRefList";

export const SuspendedMembersRef = () => {
    const toast = useRef(null);
    const rightToolbarTemplate = () => (
        <h1 className="label_club">قائمة الاعضاء التابعين الموقوفين</h1>
    );
    return (<>
        <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printTableSection, #printTableSection * {
            visibility: visible;
          }
          #printTableSection {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            text-align: center;
            font-weight: bold;
            font-size: 25px;

          }
          #printTableSection table {
            width: 100%;
            border-collapse: collapse;
          }
          #printTableSection th, #printTableSection td {
            border: 1px solid black;
            padding: 8px;
          }
        }
      `}</style>
        <Toast ref={toast} dir="rtl" />
        <Toolbar right={rightToolbarTemplate}></Toolbar>
        <SupendedMembersRefList />
    </>)
}
