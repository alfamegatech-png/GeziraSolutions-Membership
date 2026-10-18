import { NextResponse } from "next/server";
import prisma from "@app/api/db";
import { getIdentity, AccessError } from "@lib/accessControl";
import { isCompanyAccount, licenseStatus, activateLicense } from "@lib/systemLicense";
import { getServerFingerprint } from "@lib/serverFingerprint.cjs";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function company() {
  const user = await getIdentity();
  if (!isCompanyAccount(user)) throw new AccessError("هذه الشاشة لحساب الشركة فقط");
  return user;
}
function failure(error) {
  const messages = { INVALID_LICENSE: "ملف الترخيص غير صالح", INVALID_SIGNATURE: "توقيع الترخيص غير صحيح", WRONG_SERVER: "هذا الترخيص صادر لسيرفر مختلف", EXPIRED: "الترخيص منتهي؛ اطلب ترخيصًا جديدًا", CLOCK_INVALID: "تاريخ السيرفر غير صحيح؛ راجع الساعة قبل التفعيل" };
  return NextResponse.json({ message: error.status ? error.message : messages[error.message] || "تعذر التحقق من الترخيص؛ راجع إعدادات السيرفر" }, { status: error.status || 400, headers: { "Cache-Control": "no-store" } });
}
export async function GET() {
  try {
    await company();
    return NextResponse.json({ ...await licenseStatus(prisma), fingerprint: getServerFingerprint() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request) {
  try {
    const user = await company();
    const expectedOrigin = process.env.APP_PUBLIC_ORIGIN ? new URL(process.env.APP_PUBLIC_ORIGIN).origin : new URL(request.url).origin;
    if (request.headers.get("origin") !== expectedOrigin) throw new AccessError("مصدر طلب التفعيل غير مسموح");
    const text = await request.text();
    if (text.length > 20000) throw new AccessError("ملف التفعيل أكبر من المسموح", 400);
    const body = JSON.parse(text);
    if (typeof body.password !== "string" || !body.password || body.password.length > 512) throw new AccessError("أدخل كلمة مرور حساب الشركة للتأكيد");
    const verified = await prisma.users.findFirst({ where: { id: user.id, password: body.password }, select: { id: true } });
    if (!verified) throw new AccessError("كلمة المرور غير صحيحة");
    const result = await activateLicense(prisma, user, body.license);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
