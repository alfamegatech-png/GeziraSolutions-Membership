import axios from "axios";

export default async (data, utils) => {
  const { setLoading, toast, toggle, setSave, handleReload, router } = utils;
  let new_id = 0;

  setLoading(true);
    try {
    
    let res = await axios.post("http://localhost:3001/api/addClientInstallment", data);
    toast.current.show({
        severity: "success",
        summary: "تم إضافة ملف عضو التقسيط بنجاح",
        detail: res.data.message,
        life: 3000,
      });
    

    new_id = res.data.account_id;
    setSave(false);
  } catch (error) {
    console.error("Error submitting form data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    toast.current.show({
        severity: "error",
        summary: "خطأ",
        detail: error.response
        .data.error,
        life: 3000,
      });
      setSave(false);
  }
  toggle();
  router.push(`/club/installments_member/${new_id}`);
  handleReload();

  setLoading(false);
};
