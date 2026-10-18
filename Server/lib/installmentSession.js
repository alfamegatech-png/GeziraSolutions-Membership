import { cookies } from "next/headers";
import prisma from "@app/api/db";
import { INSTALLMENT_COOKIE, signInstallmentSession, readInstallmentSession } from "./installmentSessionToken";

export async function issueInstallmentSession(user) {
  cookies().set(INSTALLMENT_COOKIE, signInstallmentSession(user), {
    httpOnly: true, sameSite: "strict", secure: process.env.INSTALLMENT_COOKIE_SECURE === "true", path: "/", maxAge: 8 * 3600,
  });
}
export async function requireInstallmentUser() {
  const session = readInstallmentSession(cookies().get(INSTALLMENT_COOKIE)?.value);
  if (!session) throw new Error("سجل الدخول مرة أخرى لاستخدام دورة التقسيط");
  const user = await prisma.users.findUnique({ where: { id: session.id }, select: { id: true, fullname: true, safe_no: true } });
  if (!user || !Number.isInteger(user.safe_no) || user.safe_no <= 0) throw new Error("المستخدم غير مصرح له بالتحصيل");
  return user;
}
