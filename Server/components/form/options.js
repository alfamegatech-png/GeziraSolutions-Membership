"use server";
import prisma from "@app/api/db";
import { requireAnyPrivilege, AccessError } from "@lib/accessControl";

export async function getOptions(table) {
  await requireAnyPrivilege(["members.view", "refs.view", "prices.view"]);
  if (!["lookup_area", "lookup_city", "lookup_job", "lookup_marital_status", "lookup_member_type", "lookup_nationality", "lookup_qual", "lookup_religion", "lookup_section", "lookup_sex", "lookup_trans", "lookup_ref", "lookup_status", "lookup_secondary", "lookup_canceled"].includes(table)) throw new AccessError("قائمة غير مسموح بها");

  const data = await prisma[table].findMany({
    select: { code: true, name: true },
  });

  return data;
}
