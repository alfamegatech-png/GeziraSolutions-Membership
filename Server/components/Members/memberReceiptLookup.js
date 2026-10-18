"use server";
import { requirePrivilege } from "@lib/accessControl";
import prisma from "@app/api/db";

export async function getMemberByReceiptNumber(value) {
  await requirePrivilege("receipts.view");
  const text = String(value ?? "").trim()
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
  const number = Number(text);
  if (!/^\d{1,10}$/.test(text) || number < 1 || number > 2147483647) return null;
  const matches = await prisma.memberships.findMany({
    where: { serial_no: number, member: { isNot: null } },
    select: { member: { select: { id: true } } },
    distinct: ["member_code"],
    take: 2,
  });
  if (matches.length > 1) return { status: "ambiguous" };
  return matches[0]?.member || null;
}
