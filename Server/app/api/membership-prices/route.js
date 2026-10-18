import { NextResponse } from "next/server";
import {
  getMembershipPricesData,
  getMembershipPriceSettingsMap,
  updateMembershipPrices,
} from "@components/MembershipPrices/priceSettingsActions";

export async function GET(request) {
  try {
    if (request && new URL(request.url).searchParams.get("mode") === "calculation") return NextResponse.json(await getMembershipPriceSettingsMap());
    const data = await getMembershipPricesData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading membership prices:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    return NextResponse.json(
      { message: error.status ? error.message : "تعذر تحميل الأسعار" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const result = await updateMembershipPrices(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating membership prices:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    return NextResponse.json({ message: error.status ? error.message : "تعذر حفظ الأسعار" }, { status: error.status || 500 });
  }
}
