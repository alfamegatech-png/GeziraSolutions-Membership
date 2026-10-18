"use server";
import prisma from "@app/api/db";
import { requirePrivilege } from "@lib/accessControl";

export async function getMemberSearchOptions() {
  await requirePrivilege("members.view");
  const options = { select: { code: true, name: true }, orderBy: { code: "asc" } };
  const [nationalities, jobs, memberTypes] = await Promise.all([
    prisma.lookup_nationality.findMany(options),
    prisma.lookup_job.findMany(options),
    prisma.lookup_member_type.findMany(options),
  ]);
  return { nationalities, jobs, memberTypes };
}
