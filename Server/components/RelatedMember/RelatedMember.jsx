
import { getStoredUser } from "@lib/browserStorage";
import { useState, useRef, createRef } from "react";
import ReactToPrint, { useReactToPrint } from "react-to-print";
import { Toolbar } from "primereact/toolbar";
import { AccessButton as Button } from "@components/Access/AccessButton";
import NewRelatedMemberForm from "./NewRelatedMemberForm";
import RelatedMembersList from "./RelatedMembersList";
import PaymentReceipt from "@components/MemberDetails/PaymentReceipt";

const RelatedMember = ({ selectedMember, safe_no }) => {
  const pageRef = createRef();

  const handlePrint = useReactToPrint({
    content: () => pageRef.current,
  });

  const [newDialog, setNewDialog] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRefMember, setSelectedRefMember] = useState(null);

  const toggleNewDialog = () => {
    setNewDialog(!newDialog);
  };

  function handleReloadRelatedMember() {
    setReloadKey((prevKey) => prevKey + 1);
  }

  const relatedMemberToolbarLeft = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button permission="refs.create"
          label="إضافة عضو تابع جديد"
          iconPos="right"
          icon="pi pi-plus"
          onClick={toggleNewDialog}
        />
      </div>
    );
  };

  const relatedMemberToolbarRight = () => {
    return (
      <Button permission="receipts.print"
        label="إيصال إضافة تابع"
        icon="pi pi-credit-card"
        iconPos="right"
        onClick={handlePrint}
      />
    );
  };

  return (
    <>
      <PaymentReceipt
        member={selectedMember}
        secondary={2}
        ref_member_id={selectedRefMember?.id}
        ref={pageRef}
      />
      {selectedMember && (
        <Toolbar
          left={relatedMemberToolbarLeft}
          right={relatedMemberToolbarRight}
        ></Toolbar>
      )}

      {
        <NewRelatedMemberForm
          toggleNewDialog={toggleNewDialog}
          handleReload={handleReloadRelatedMember}
          newDialog={newDialog}
          title="إضافة عضو جديد"
          method="create"
          values={{
            member_code: selectedMember.member_code,
            user_id: getStoredUser().id,
            safe_no: getStoredUser().safe_no,
          }}
        />
      }
      <RelatedMembersList
        reloadKey={reloadKey}
        member_code={selectedMember.member_code}
        selectedRefMember={selectedRefMember}
        setSelectedRefMember={setSelectedRefMember}
      />
    </>
  );
};

export default RelatedMember;
