import axios from "axios";


async function fetchBanksData() {
  try {
    const response = await axios.get("http://localhost:3001/api/banks");
    return response.data.rows;
  } catch (error) {
    console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" })
  }
}
async function fetchPaymentTerms() {
  try {
    const response = await axios.get("http://localhost:3001/api/GetAllTerms");
    return response.data.rows;
  } catch (error) {
    console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" })
  }
}
async function checkMemberId(memberData){
  try {
    const response = await axios.get(`http://localhost:3001/api/specificMemberShip/${memberData}`)
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" })
  }
}
async function GetAllPaymentFrequency(){
  try {
    const response = await axios.get(`http://localhost:3001/api/GetAllPaymentFrequency`)
    return response.data.rows;
  } catch (error) {
    console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" })
  }
}
async function submitNewMember(data,utils){
  const {toast, toggleNewInstallmentDialog, router } = utils;

  let new_id = 0;

  try {
    
    let res = await axios.post("http://localhost:3001/api/addClientInstallment", data);
    toast.current.show({
        severity: "success",
        summary: "تم إضافة ملف عضو التقسيط بنجاح",
        detail: res.data.message,
        life: 3000,
      });
    
    new_id = res.data.account_id;
    router.push(`/club/installments_member/${new_id}`);
  } catch (error) {
    console.error("Error submitting form data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    toast.current.show({
        severity: "error",
        summary: "خطأ",
        detail: error.response
        .data.error,
        life: 3000,
      });
  }
  toggleNewInstallmentDialog();
}
module.exports ={ fetchBanksData, fetchPaymentTerms, checkMemberId, GetAllPaymentFrequency, submitNewMember};
