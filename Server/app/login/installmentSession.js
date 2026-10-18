"use server";
import { cookies } from "next/headers";
import { INSTALLMENT_COOKIE } from "@lib/installmentSessionToken";
export async function closeInstallmentSession() { cookies().delete(INSTALLMENT_COOKIE); }
