"use server";
import prisma from "@app/api/db";
import { requirePrivilege, scopeSafe, safeInclude } from "@lib/accessControl";

export async function getReportData(lazyState, orderBy, include, filter1, filter2) {
  const access = await requirePrivilege("reports.view");
  include = safeInclude(include);
  if (!access.privileges.includes("reports.all_safes")) filter1 = { AND: [filter1 || {}, { safe_no: scopeSafe(access) }] };
  const { rows: take, first: skip, filters } = lazyState;

  // Initialize the 'where' object with the first filter
  let where = filter1;

  // Combine the second filter with the 'where' object using the 'AND' logical operator
  if (filter2) {
    where = {
      AND: [where, filter2],
    };
  }

  if (filters) {
    where = {
      ...where,
      ...Object.entries(filters).reduce((acc, [key, { value, matchMode }]) => {
        if (!(matchMode == "equals" && !value)) {
          acc[key] = { [matchMode]: value ?? "" };
        }
        return acc;
      }, {}),
    };
  }

  const options = {
    where,
    include,
    orderBy,
    take,
    skip,
  };
  delete options.take;
  delete options.skip;

  const data = await prisma.memberships.findMany(options);
  const refIds = [...new Set(data.map((item) => item.ref_member_id).filter(Boolean))];
  const refs = new Map();
  for (let offset = 0; offset < refIds.length; offset += 500) {
    const batch = await prisma.members_ref.findMany({
      where: { id: { in: refIds.slice(offset, offset + 500) } },
      select: { id: true, birth_date: true, rel_ref: { select: { code: true } } },
    });
    batch.forEach((ref) => refs.set(ref.id, ref));
  }
  const today = new Date();
  return data.map((item) => {
    const ref = refs.get(item.ref_member_id);
    let refAge = null;
    if (ref?.birth_date) {
      const birth = new Date(ref.birth_date);
      refAge = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) refAge--;
    }
    return { ...item, refAge, refType: ref?.rel_ref?.code ?? null };
  });
}
