"use server";
import prisma from "@app/api/db";
import { issueInstallmentSession } from "@lib/installmentSession";

export const login = async (userName, password) => {
  try {

    if (typeof userName !== "string" || typeof password !== "string" || !userName || !password) {
      return { status: "invalid", user: null };
    }
    const user = await prisma.users.findFirst({
      where: { email: userName, password },
      select: { id: true, fullname: true, safe_no: true },
    });
    if (user) await issueInstallmentSession(user);
    return { status: user ? "success" : "invalid", user };
  } catch (error) {
    console.error("Membership login unavailable");
    return { status: "error", user: null };
  }
};

export async function getClubName() {
  "use server";
  return process.env["club"];
}
