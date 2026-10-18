"use server";
import prisma from "@app/api/db";
import { getAccess, requirePrivilege } from "@lib/accessControl";
import { assignRoles, readAdministration } from "@lib/roleAdministration";
export async function currentAccess() {
  try { return { ok: true, data: await getAccess() }; }
  catch (error) { return { ok: false, status: error.status || 503, licenseRequired: Boolean(error.licenseRequired), message: error.status ? error.message : "تعذر تحميل الصلاحيات" }; }
}
export async function getRoleAdministration(search = "", page = 0) {
  await requirePrivilege("users.roles.manage");
  return readAdministration(prisma, search, page);
}
export async function updateUserRoles(input) {
  try {
    const access = await requirePrivilege("users.roles.manage");
    return await assignRoles(prisma, access.user, input);
  } catch (error) { return { ok: false, message: error.status ? error.message : "تعذر حفظ الأدوار" }; }
}
export async function getSecurityAudit(page = 0) {
  await requirePrivilege("audit.view");
  const offset = Math.max(0, Math.min(100000, Math.floor(Number(page) || 0))) * 25;
  return prisma.$queryRaw`SELECT a.id,a.action,a.target_id,a.before_value,a.after_value,a.reason,a.created_at,u.fullname AS actor,COALESCE(t.fullname,t.name,a.target_id) AS target_name FROM public.security_audit a LEFT JOIN public.users u ON u.id=a.actor_id LEFT JOIN public.users t ON t.id=a.target_id ORDER BY a.created_at DESC,a.id DESC LIMIT 25 OFFSET ${offset}`;
}
export async function getSafeOptions() {
  await requirePrivilege("reports.all_safes");
  const rows = await prisma.users.findMany({ where: { safe_no: { gt: 0 } }, distinct: ["safe_no"], select: { safe_no: true }, orderBy: { safe_no: "asc" } });
  return rows.map((row) => row.safe_no);
}
