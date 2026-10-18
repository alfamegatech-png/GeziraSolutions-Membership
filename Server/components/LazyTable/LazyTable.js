"use server";
import prisma from "@app/api/db";
import { buildMemberWhere } from "./memberFilters";
import { memberInstallmentStates } from "@lib/newMembershipInstallmentGuards";
import { requirePrivilege, tablePrivilege, scopeSafe, safeInclude, scopeMemberHistory } from "@lib/accessControl";

export async function getData(
  table,
  lazyState,
  orderBy,
  include,
  filter,
  columns,
  download
) {
  const access = await requirePrivilege(tablePrivilege(table));
  if (download) await requirePrivilege("reports.export");
  include = safeInclude(include);
  if (table === "memberships") filter = { AND: [filter || {}, ...(access.privileges.includes("reports.all_safes") ? [] : [{ safe_no: scopeSafe(access) }])] };
  if (table === "members") {
    const where = buildMemberWhere(lazyState.filters, filter);
    const options = { where, orderBy, include };
    if (!download && Number.isInteger(lazyState.rows) && lazyState.rows > 0) options.take = lazyState.rows;
    if (!download && Number.isInteger(lazyState.first) && lazyState.first >= 0) options.skip = lazyState.first;
    if (download) delete options.include;
    const data = await prisma.members.findMany(options);
    const states = await memberInstallmentStates(prisma, data.map((row) => row.id));
    const pending = new Set(states.map((row) => row.member_id));
    const totalRecords = await prisma.members.count({ where });
    return { data: JSON.stringify(data.map((row) => scopeMemberHistory(access, pending.has(row.id) ? { ...row, installment_state: "pending" } : row))), totalRecords };
  }
  const { rows: take, first: skip, filters } = lazyState;

  let where = filter;
  let select;
  if (columns) {
    select = Object.fromEntries(
      columns.filter((item) => !item.includes(".")).map((key) => [key, true])
    );
  }

  if (filters) {
    where = {
      ...where,
      ...Object.entries(filters).reduce((acc, [key, { value, matchMode }]) => {
        if (!(matchMode == "equals" && !value))
          acc[key] = { [matchMode]: value ?? "" };
        return acc;
      }, {}),
    };
  }
  // console.log("where", where);
  const options = {
    // select,
    where,
    include,
    orderBy,
    take,
    skip,
  };
  download && delete options.take;
  download && delete options.skip;
  download && delete options.include;
  const data = await prisma[table].findMany(options);

  const totalRecords = await prisma[table].count({ where });

  return { data: JSON.stringify(data.map((row) => scopeMemberHistory(access, row))), totalRecords };
}
