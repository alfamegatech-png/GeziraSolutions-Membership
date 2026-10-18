// "use client";
import React, { useState, useRef, useEffect, createRef } from "react";
import { Toolbar } from "primereact/toolbar";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { SelectButton } from "primereact/selectbutton";


import NewMembershipForm from "./NewMembershipForm";
import NewSwimmingForm from "./NewSwimmingForm";
import UpdateMemberForm from "@components/MemberDetails/UpdateMemberForm";
import { Accordion, AccordionTab } from "primereact/accordion";
import Print from "@components/printPdf/Print";
import {
  createMemberAttachment,
  getMember,
  getMembershipsCreatedTodayByMemberCode,
  hasPendingLockerBooking,
} from "@components/Members/member";
import RelatedMember from "@components/RelatedMember/RelatedMember";
import MembershipList from "@components/MemberDetails/MembershipList";
import { useRouter } from "next/navigation";
import MemberData from "./MemberData";
import PaymentReceipt from "./PaymentReceipt";
import SuspendMemberForm from "./SuspendMemberForm";
import SeperateDead from "./SeperateDead";
import { useReactToPrint } from "react-to-print";
import moment from "moment";
import MembershipReceipt from "./MembershipReceipt";
import MembershipListDeleted from "./MembershipListDeleted";
import ReltaedMemberDeleted from "@components/RelatedMember/ReltaedMemberDeleted";
import MemberAttachment from "./MemberAttachment";
import MemberDownloadAttachments from "./DownloadAttachmentsButton";
import { LockerPaymentModel } from "./LockerPaymentModel";
import PaymentReciept from "./PaymentReciept";
import axios from "axios";
import OnOff from "@components/form/OnOff";
import { getStoredUser, getStoredValue } from "@lib/browserStorage";

const MemberDetails = ({ member_id }) => {
  const allPageRef = createRef();
  const swimmingPageRef = createRef();
  const codeRef = createRef();
  const router = useRouter();
  const toast = useRef(null);
  const [newSwimmingDialog, setNewSwimmingDialog] = useState(false);
  const [lockerPaymentModel, setLockerPaymentModel] = useState(false);
  const [newMembershipDialog, setNewMembershipDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [printDialog, setPrintDialog] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [seperateDeadDialog, setseperateDeadDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState();
  const [selectedMembership, setSelectedMembership] = useState();
  const [reloadKeyMember, setReloadKeyMember] = useState("member");
  const [memberName, setMemberName] = useState("member");
  const [reloadKeyMembership, setReloadKeyMembership] = useState("membership");
  const [reload, setReload] = useState(1);
  const [memberShipSubscription, setMemberShipSubscription] = useState([]);
  const [isLockerPayment, setIsLockerPayment] = useState(false);
  const [tokenLocker, setTokenLocker] = useState(null);
  const [fontSize, setFontSize] = useState(42);
  const [totalLockerPrice, setTotalLockerPrice] = useState(null);
  const [lockerIds, setLockerIds] = useState([]);
  const [safe_no, setSafe_num] = React.useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // default

  // console.log(safe_no);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSafe_num(getStoredUser().safe_no || 0);
      setTokenLocker(getStoredValue("lockerToken"));
      setFontSize(Number(getStoredValue("fontSize")) || 42);
    }
  }, []);
  // console.log(safe_no);
  // console.log(selectedMember);
  // console.log(selectedMembership);

  const handleAllPrint = useReactToPrint({
    content: () => allPageRef.current,
  });
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      // Handle error: no file selected
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("memberid", selectedMember.id); // Ensure you have the member ID available

    // Perform the upload operation
    try {
      const response = await createMemberAttachment(formData);
      if (response.status === "success") {
        // Handle successful upload
        setUploadDialog(false); // Close dialog
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "File uploaded successfully",
        });
      } else {
        // Handle upload error
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to upload file",
        });
      }
    } catch (error) {
      // Handle exception
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to upload file",
      });
    }
  };
  const handleSwimmingPrint = useReactToPrint({
    content: () => {
      
      return swimmingPageRef.current;
    },
  });
  const handelCodePrint = useReactToPrint({
    content: () => codeRef.current,
  });

  const handleReload = () => {
    setReload(reload + 1);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
      const member = await getMember(member_id);
      if (!active) return;
      // console.log(member);

      setSelectedMember(member);
      setMemberName(member?.name);
      if (!member) {
        setMemberShipSubscription([]);
        toast.current?.show({ severity: "warn", summary: "تنبيه", detail: "لم يتم العثور على العضو", life: 4000 });
        return;
      }
      const test = await getMembershipsCreatedTodayByMemberCode(
        member?.member_code
      );
      // console.log(test);
      if (active) setMemberShipSubscription(test.data || []);
      } catch {
        if (active) toast.current?.show({ severity: "error", summary: "خطأ", detail: "تعذر تحميل بيانات العضو", life: 4000 });
      }
    })();
    return () => { active = false; };
  }, [member_id, reloadKeyMember, reloadKeyMembership, reload]);

  useEffect(() => {
    setSelectedMembership(
      selectedMember?.membership.filter((el) => el.ref_member_id == null)
    );
  }, [selectedMember]);

  const toggleSuspendDialog = () => {
    setSuspendDialog(!suspendDialog);
  };
  const toggleSeperateDeadDialog = () => {
    setseperateDeadDialog(!seperateDeadDialog);
  };
  function handleReloadMembership() {
    setReloadKeyMembership((prevKey) => prevKey + 1);
  }
  function handleReloadMember() {
    setReloadKeyMember((prevKey) => prevKey + 1);
  }

  const toggleNewMembershipDialog = () => {
    setNewMembershipDialog(!newMembershipDialog);
  };
  const toggleLockerPaymentModel = () => {
    setLockerPaymentModel(!lockerPaymentModel);
  };
  const toggleNewSwimmingDialog = () => {
    setNewSwimmingDialog(!newSwimmingDialog);
  };
  const toggleUpdateDialog = () => {
    setUpdateDialog(!updateDialog);
  };
  /////////////////////////////////////////////////////////////////////////////
  const togglePrintDialog = async () => {
    if (selectedMember?.newMembershipInstallment && selectedMember.newMembershipInstallment.status !== "active") {
      toast.current?.show({ severity: "warn", summary: "تنبيه", detail: "العضوية لا تُفعّل قبل سداد جميع الأقساط والغرامات", life: 4000 });
      return;
    }
    setPrintDialog(!printDialog);
  };
  /////////////////////////////////// check payment locker
  // console.log(selectedMember);
  const checkPayment = async () => {
    const res = await hasPendingLockerBooking(selectedMember?.member_code);
    const lockerIds = res?.data?.map((locker) => locker.Id);
    setTotalLockerPrice(res.totalPrice);
    setLockerIds(lockerIds);
    // setIsLockerPayment(res.data);
    
  };

  useEffect(() => {
    if (selectedMember && tokenLocker) {
      checkPayment();
    }
  }, [selectedMember, tokenLocker]);

  ////////////////////////////////////////////////////////////////////////////
  const memberDetailsToolbarLeft = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          icon="pi pi-chevron-left"
          outlined
          onClick={() => router.replace("/club/members")}
        />
        {selectedMember && (
          <>
            <Button
              icon="pi pi-users"
              outlined
              onClick={() => router.replace("club/members")}
            />
            <Button permission="members.edit"
              label="تعديل البيانات"
              icon="pi pi-user-edit"
              iconPos="right"
              onClick={toggleUpdateDialog}
            />
            <Button permission="cards.print"
              label="طباعة الكارنيه"
              icon="pi pi-print"
              iconPos="right"
              onClick={togglePrintDialog}
            />
            <Button permission="members.suspend"
              label="إيقاف العضو"
              icon="pi pi-exclamation-circle"
              iconPos="right"
              onClick={toggleSuspendDialog}
            />
            <Button permission="refs.separate"
              label="فصل العضو ونقل العضوية"
              icon="pi pi-arrow-right-arrow-left"
              iconPos="right"
              onClick={toggleSeperateDeadDialog}
            />
            <MemberAttachment memberId={member_id} />
          </>
        )}
      </div>
    );
  };

  const membershipDetailsToolbarLeft = () => {
    if (selectedMember?.newMembershipInstallment && selectedMember.newMembershipInstallment.status !== "active") return (
      <Button label="متابعة أقساط العضوية - غير مفعلة" icon="pi pi-wallet" onClick={() => router.push(`/club/new-membership-installments/${selectedMember.newMembershipInstallment.id}`)} />
    );
    return (
      <>
        {tokenLocker ? (
          <Button permission="memberships.renew"
            label="تجديد العضوية"
            icon="pi pi-plus"
            iconPos="right"
            onClick={toggleNewMembershipDialog}
            disabled={
              selectedMember.membership?.some((el) => {
                return el.status == 1 && el.secondary == 0;
              }) || isLockerPayment
            }
            visible={Boolean(safe_no)}
          />
        ) : (
          <Button permission="memberships.renew"
            label="تجديد العضوية"
            icon="pi pi-plus"
            iconPos="right"
            onClick={() => setShowPaymentDialog(true)} // ← open payment dialog first
            disabled={selectedMember.membership?.some((el) => {
              return el.status == 1 && el.secondary == 0;
            })}
            visible={Boolean(safe_no)}
          />
        )}
        <Button permission="memberships.swim"
          label="تجديد إشتراك سباحة"
          icon="pi pi-plus"
          iconPos="right"
          onClick={toggleNewSwimmingDialog}
          disabled={
            selectedMembership?.every((el) => el.secondary != 0) ||
            selectedMembership?.some(
              (el) => el.status == 1 && el.swimming > 0
            ) ||
            selectedMembership?.every((el) => el.status != 1)
          }
          visible={Boolean(safe_no)}
        />
        {/* {tokenLocker && (
          <Button
            label="دفع الدولاب"
            icon="pi pi-unlock"
            iconPos="right"
            onClick={toggleLockerPaymentModel}
            disabled={!isLockerPayment}
          />
        )} */}
      </>
    );
  };

  const memberDetailsToolbarRight = () => {
    return (
      <>
        <h1 className="label_club">بيانات العضوية</h1>
      </>
    );
  };

  const membershipDetailsToolbarRight = () => {
    const currentDate = moment().format("YYYY-MM-DD");

    return (
      <>
        {/* <Button
          label="دفع الدولاب"
          icon="pi pi-unlock"
          iconPos="right"
          // onClick={handelCodePrint}
        /> */}
        <Button permission="receipts.print"
          label="ايصال اشتراك عضويه"
          icon="pi pi-credit-card"
          iconPos="right"
          onClick={handelCodePrint}
        />

        <Button permission="receipts.print"
          label="إيصال دفع"
          icon="pi pi-credit-card"
          iconPos="right"
          onClick={handleAllPrint}
          disabled={
            !selectedMember.membership?.some((el) => {
              return el.status == 1 && el.secondary == 0 && el.canceled == 0;
            })
          }
        />
        <Button permission="receipts.print"
          label="إيصال إشتراك السباحة"
          icon="pi pi-credit-card"
          iconPos="right"
          onClick={handleSwimmingPrint}
          disabled={
            !selectedMembership?.some((el) => {
              return el.status == 1 && el.secondary == 1 && el.canceled == 0;
            })
          }
        />
      </>
    );
  };

  return (
    selectedMember &&
    reload && (
      <>
        <PaymentReceipt
          member={selectedMember}
          totalLockerPrice={totalLockerPrice}
          secondary={0}
          ref={allPageRef}
        />
        <PaymentReceipt
          member={selectedMember}
          secondary={1}
          ref={swimmingPageRef}
          isRef={false}
        />

        <MembershipReceipt
          members={memberShipSubscription}
          memberName={memberName}
          ref={codeRef}
        />

        <Toast ref={toast} />

        <Print
          toggleNewDialog={togglePrintDialog}
          newDialog={printDialog}
          url={`/api/print?&id=${selectedMember.id}&textSize=${
            fontSize
          }`}
        />

        <NewMembershipForm
          toggleNewDialog={toggleNewMembershipDialog}
          handleReload={handleReloadMembership}
          newDialog={newMembershipDialog}
          selectedMember={selectedMember}
          totalLockerPrice={totalLockerPrice}
          lockerIds={lockerIds}
          paymentMethod={paymentMethod} 
        />

        <NewSwimmingForm
          toggleNewDialog={toggleNewSwimmingDialog}
          handleReload={handleReloadMembership}
          newDialog={newSwimmingDialog}
          selectedMember={selectedMember}
        />
        {/* <LockerPaymentModel
          toggleNewDialog={toggleLockerPaymentModel}
          handleReload={handleReloadMembership}
          newDialog={lockerPaymentModel}
          selectedMember={selectedMember}
        /> */}

        <SuspendMemberForm
          toggleNewDialog={toggleSuspendDialog}
          newDialog={suspendDialog}
          table="members"
          handleReload={handleReloadMember}
          key={"s" + reloadKeyMember + 1}
          title="إيقاف العضو"
          method="update"
          values={selectedMember}
        />

        <SeperateDead
          toggleNewDialog={toggleSeperateDeadDialog}
          newDialog={seperateDeadDialog}
          handleReload={handleReloadMember}
          key={"ss" + reloadKeyMember + 1}
          title="فصل العضو ونقل العضوية إلي"
          selectedMember={selectedMember}
        />

        <UpdateMemberForm
          toggleNewDialog={toggleUpdateDialog}
          handleReload={handleReloadMember}
          key={reloadKeyMember + 1}
          newDialog={updateDialog}
          title="تعديل بيانات العضو"
          method="update"
          values={selectedMember}
        />
        <Toolbar
          left={memberDetailsToolbarLeft}
          right={memberDetailsToolbarRight}></Toolbar>

        <MemberData selectedMember={selectedMember} />
        <Accordion activeIndex={0}>
          <AccordionTab
            header="سجل التجديدات"
            headerStyle={{ direction: "rtl" }}
            key={reloadKeyMembership}>
            {safe_no !== 0 && (
              <Toolbar
                left={membershipDetailsToolbarLeft}
                right={membershipDetailsToolbarRight}></Toolbar>
            )}
            <div>
              <MembershipList
                selectedMember={selectedMember}
                handleReload={handleReload}
                reload={reload}
                isRef={false}
                safe_no={safe_no}
              />
            </div>
          </AccordionTab>
          {safe_no !== 0 && (
            <AccordionTab
              header="تحميل الملفات"
              headerStyle={{ direction: "rtl" }}>
              <MemberDownloadAttachments memberId={member_id} />
            </AccordionTab>
          )}
          {safe_no !== 0 && (
            <AccordionTab
              header="ارشيف الايصالات التي تم حذفها"
              headerStyle={{ direction: "rtl" }}
              key={reloadKeyMembership}>
              {/* <Toolbar
              left={membershipDetailsToolbarLeft}
              right={membershipDetailsToolbarRight}></Toolbar>*/}
              <div>
                <MembershipListDeleted
                  selectedMember={selectedMember}
                  handleReload={handleReload}
                  reload={reload}
                  isRef={false}
                />
              </div>
            </AccordionTab>
          )}
          <AccordionTab
            header="الاعضاء التابعة"
            headerStyle={{ direction: "rtl" }}>
            <RelatedMember safe_no={safe_no} selectedMember={selectedMember} />
          </AccordionTab>

          {safe_no !== 0 && (
            <AccordionTab
              header="الاعضاء التابعة المحذوفه "
              headerStyle={{ direction: "rtl" }}>
              <ReltaedMemberDeleted selectedMember={selectedMember} />
            </AccordionTab>
          )}
        </Accordion>

        <Dialog
  header="طريقة الدفع"
  visible={showPaymentDialog}
  onHide={() => setShowPaymentDialog(false)}
  modal
  style={{ width: "30vw", direction: "rtl" }}
>
  <div className="flex flex-column gap-4 align-items-center justify-content-center">
    <label style={{ fontWeight: "bold" }}>
      طريقة الدفع: {paymentMethod === "cash" ? "نقدي" : "قسط"}
    </label>

    <OnOff
      enabled={paymentMethod === "installment"} 
      setState={(val) => setPaymentMethod(val ? "installment" : "cash")}
    />

    <Button
      label="التالي"
      icon="pi pi-arrow-left"
      iconPos="right"
      className="w-full"
      onClick={() => {
        setShowPaymentDialog(false);
        setNewMembershipDialog(true);
      }}
    />
  </div>
</Dialog>


      </>
    )
  );
};

export default MemberDetails;
