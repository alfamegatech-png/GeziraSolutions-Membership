import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import axios from "@node_modules/axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PaymentReciept from "./PaymentReciept";
import { useReactToPrint } from "@node_modules/react-to-print/lib";
import { Toast } from "primereact/toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom";
import { cancelErp, hasPendingLockerBooking } from "@components/Members/member";
import { getStoredValue } from "@lib/browserStorage";

export const LockerPaymentModel = ({
  newDialog,
  toggleNewDialog,
  handleReload,
  selectedMember,
}) => {
  const [allbookinglockers, setallbookinglockers] = useState([]);
  const [lockergroup, setLockergroup] = useState([]);
  const [bookLocker, setBookLocker] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const componentRef = useRef(null);
  const toast = useRef(null);
  
  const headers = {
    Authorization: `Bearer ${getStoredValue("lockerToken", "")}`,
  };

  const GetBookingLockersByMembercode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5156/api/BookingLocker/GetBookingLockersByMembercodeAndRole?memberCode=${selectedMember?.member_code}`,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${localStorage.getItem("lockerToken")}`,
          },
        }
      );
      

      setallbookinglockers(response.data.data);
    } catch (error) {
      // Handle network or other errors
      console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
  });

  const getAllLockerGroup = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5156/api/LockerGroup/GetAll?PageNumber=0&PageSize=1000`,
        { headers }
      );
      

      if (res.status === 200) {
        setLockergroup(res.data.data.map((locker) => locker.data));
      }
    } catch (error) {
      
    }
  };
  useEffect(() => {
    getAllLockerGroup();
  }, []);
  

  useEffect(() => {
    if (selectedMember?.member_code && newDialog) GetBookingLockersByMembercode();
  }, [selectedMember, newDialog]);

  const lockerGroupTemplate = (rowData) => {
    const lockerGroup = lockergroup.find(
      (group) => group.id === rowData.locker.lockerGroupID
    );
    return lockerGroup ? lockerGroup.name : "غير متوفر";
  };

  const handlePaymentDate = (rowData) => {
    return rowData.paymentDate ? rowData.paymentDate : "غير مدفوع";
  };

  const downloadPDF = (base64String) => {
    // Convert Base64 to a byte string
    const byteCharacters = atob(base64String);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: "application/pdf" });

    // Create a link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.pdf"; // Specify the name for the downloaded file

    // Programmatically click the link to trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Release the object URL
  };

  const handleDownLoad = (rowData) => {
    return (
      <Button
        onClick={() => downloadPDF(rowData.receipt)}
        icon="pi pi-download"
        size="large"
        severity="secondary"
        aria-label="Filter"
      />
    );
  };

  const handlePayment = (rowData) => {
    return (
    
      <Button
        onClick={() => {
          setBookLocker(rowData);
          convertHtmlToPdfAndSend(rowData);
        }}
        disabled={rowData.paymentDate || rowData.paymentCanceled}
        icon="pi pi-wallet"
        label="دفع"
        aria-label="Filter"
      />
    );
  };

  const handleCancellation = async (rowData) => {
    try {
      const response = await axios.put(
        `http://localhost:5156/api/BookingLocker/CancelPayment?bookedLockerId=${rowData?.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("lockerToken")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          detail: "تم الغاء الدفع",
          life: 3000,
        });
        // await cancelErp(receiptNumber);
      }
    } catch (error) {
      console.error("Error:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
      if (
        error.response?.data?.message ===
        "You are not allowed to cancel a payment if the payment has not been made in the first place."
      ) {
        toast.current.show({
          severity: "error",
          detail: "!لم يتم الدفع مسبقا ",
          life: 3000,
        });
      } else if (
        error.response?.data?.message ===
        "You can't cancel payment for booking already end"
      ) {
        toast.current.show({
          severity: "error",
          detail: "الحجز انتهي بالفعل",
          life: 3000,
        });
      } else {
        toast.current.show({
          severity: "error",
          detail: "خطأ في التنفيذ",
          life: 3000,
        });
      }
    }
  };

  const convertHtmlToPdfAndSend = async (rowData) => {
    

    // Create a hidden container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    // Render the PaymentReciept component into the hidden container
    ReactDOM.render(
      <PaymentReciept stored={rowData} ref={componentRef} />,
      container
    );

    try {
      const canvas = await html2canvas(container);
      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = 140; // Width in mm (A5 size width)
      const pdfHeight = 200; // Height in mm (A5 size height)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
        0.5
      );

      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("receipt", pdfBlob, "receipt.pdf");

      const response = await axios.put(
        `http://localhost:5156/api/BookingLocker/Payment?id=${rowData.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("lockerToken")}`,
          },
        }
      );

      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          detail: "تم الدفع بنجاح",
          life: 3000,
        });
        // await syncERP({
        //     SafeNum,
        //     price,
        //     priceWithoutTax,
        //     tax,
        //     paymentDate,
        //     receiptNumber,
        //   });
        await handlePrint();
        toggleNewDialog();
      } else {
        console.error("Error uploading PDF:");
      }
    } catch (error) {
      console.error("Error sending PDF to API:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
      toast.current.show({
        severity: "error",
        summary: "حدث خطا ما",
        detail: "يرجي المحاوله مره اخري",
        life: 3000,
      });
    } finally {
      // Clean up: remove the hidden container from the DOM
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    }
  };

  const handleCancel = (rowData) => {
    return (
      <Button
        onClick={() => {
          setBookLocker(rowData);
          handleCancellation(rowData);
        }}
        disabled={!rowData.paymentDate || rowData.paymentCanceled}
        // icon="pi pi-times-circle"
        label="الغاء الدفع"
        aria-label="Filter"
      />
    );
  };

  const fields = [
    { field: "name", header: "الاسم" },
    { field: "locker.id", header: "الكود" },
    { field: "locker.lockerNumber", header: "رقم الدولاب" },
    { field: "locker.lockerGroupID", header: "الموقع" },
    { field: "price", header: "السعر" },
    { field: "paymentDate", header: "تاريخ الدفع" },
    { field: "downloadFile", header: "تحميل الملف" },
    { field: "payment", header: "دفع" },
    { field: "cancelPayment", header: "الغاء الدفع" },
  ];

  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        visible={newDialog}
        style={{ width: "75%" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="دفع الدولاب"
        headerStyle={{ direction: "rtl" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        onHide={toggleNewDialog}
      >
        <div className="card flex justify-content-center">
          <DataTable
            value={allbookinglockers}
            tableStyle={{ minWidth: "50rem" }}
          >
            {fields.map((field, idx) => (
              <Column
                align={"center"}
                key={idx}
                field={field.field}
                header={field.header}
                body={
                  field.field === "locker.lockerGroupID"
                    ? lockerGroupTemplate
                    : field.field === "paymentDate"
                    ? handlePaymentDate
                    : field.field === "downloadFile"
                    ? handleDownLoad
                    : field.field === "payment"
                    ? handlePayment
                    : field.field === "cancelPayment"
                    ? handleCancel
                    : undefined
                }
              ></Column>
            ))}
          </DataTable>
        </div>
      </Dialog>
      <div className="">
        {/* {showReceipt && (
          <PaymentReciept ref={componentRef} stored={bookLocker} />
        )} */}
      </div>
    </div>
  );
};
