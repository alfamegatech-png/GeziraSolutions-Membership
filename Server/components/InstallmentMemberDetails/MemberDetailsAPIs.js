import axios from "axios";

export async function getMemberDetails(MEMBER_ID) {
  try {
    const response = await axios.get(`http://localhost:3001/api/getClientAccount/${MEMBER_ID}`);
    return response.data.rows;
  } catch (error) {
    console.error("Error fetching payment terms data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    // toast.current.show({
    //   severity: "error",
    //   summary: "خطأ",
    //   detail: error.response.data.error,
    //   life: 3000,
    // });
  }
}

export async function generateClientCheques(MEMBER_ID,data) {
  try {
    const response = await axios.post(`http://localhost:3001/api/GenerateCheques/${MEMBER_ID}`,data);
    
    return response.data.insertedData;
  } catch (error) {
    console.error("Error sending cheque data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    // toast.current.show({
    //   severity: "error",
    //   summary: "خطأ",
    //   detail: error.response.data.error,
    //   life: 3000,
    // });
  }
}

export async function getMemberCheques(MEMBER_ID) {
  try {
    const response = await axios.get(`http://localhost:3001/api/GetSpecificCheques/${MEMBER_ID}`);
    return response.data.cheque;
  } catch (error) {
    console.error("Error fetching payment terms data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    // toast.current.show({
    //   severity: "error",
    //   summary: "خطأ",
    //   detail: error.response.data.error,
    //   life: 3000,
    // });
  }
}
