
import {fetchBanksData, fetchPaymentTerms} from "./NewMemberIntialAPIs";

const BankComboOptions = fetchBanksData().then(data => {
  return data;
}).catch(error => {
  console.error("Operation failed", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
});

const PaymentComboOptions = fetchPaymentTerms().then(data => {
  return data;
}).catch(error => {
  console.error("Operation failed", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
});

export const NewMemberIntialFields = [
    {
        id: "member_code",
        name: "رقم العضوية",
        fieldType: "input",
        dataType: "number",
        disabled: false,
        hidden: false,
        required: true,
      },
      {
        id: "club_bank",
        name: "بنك النادي",
        fieldType: "bank",
        dataType: "number",
        bank:true,
        compound: false,
        comboOptions: BankComboOptions,
        required: true,
        disabled: false,
        hidden: false,
      },
      {
        id: "client_bank",
        name: "بنك العضو",
        fieldType: "bank",
        dataType: "number",
        bank:true,
        compound: false,
        comboOptions: BankComboOptions,
        required: true,
        disabled: false,
        hidden: false,
      },
      {
        id: "payment_terms_id",
        name: "عدد شهور التقسيط",
        fieldType: "terms",
        dataType: "number",
        compound: false,
        comboOptions: PaymentComboOptions,
        required: true,
        disabled: false,
        hidden: false,
      },
      {
        id: "name_check_holder",
        name: "اسم حامل الشيك",
        fieldType: "input",
        dataType: "text",
        required: true,
      },
      {
      id: "user_id",
      name: "user_id",
      fieldType: "input",
      dataType: "text",
  
      required: false,
      disabled: false,
      hidden: true,
    },
    // {
    //   id: "id",
    //   name: "id",
    //   fieldType: "input",
    //   dataType: "text",
    //   required: false,
    //   disabled: false,
    //   hidden: true,
    // },
  
];


  