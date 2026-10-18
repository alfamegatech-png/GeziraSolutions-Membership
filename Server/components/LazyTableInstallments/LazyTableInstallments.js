"use server"

import axios from "axios";
import { requirePrivilege } from "@lib/accessControl";

export async function getInstallmentData(
    table,
    lazyState,
    orderBy,
    include,
    filter,
    columns,
    download
  ){
    await requirePrivilege("legacy_installments.view");
    const { rows: take, first: skip, filters , page} = lazyState;

    try {
        const response = await axios.get("http://localhost:3001/api/getAllClients");
        return response.data.rows;
      } catch (error) {
        console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" })
      }
  }
  
