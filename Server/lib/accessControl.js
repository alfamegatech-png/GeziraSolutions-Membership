import { cookies } from "next/headers";
import prisma from "@app/api/db";
import { INSTALLMENT_COOKIE, readInstallmentSession } from "./installmentSessionToken";
import { resolvePrivileges } from "./userPrivilegeOverrides";
import { assertSystemLicense } from "./systemLicense";

export class AccessError extends Error {
  constructor(message, status = 403) { super(message); this.name = "AccessError"; this.status = status; }
}
export async function getIdentity() {
  const session = readInstallmentSession(cookies().get(INSTALLMENT_COOKIE)?.value);
  if (!session) throw new AccessError("سجل الدخول مرة أخرى للمتابعة", 401);
  const user = await prisma.users.findUnique({ where: { id: session.id }, select: { id: true, name: true, fullname: true, email: true, safe_no: true } });
  if (!user) throw new AccessError("جلسة المستخدم غير صالحة", 401);
  return user;
}
export async function getAccess() {
  const user = await getIdentity();
  const license = await assertSystemLicense(prisma);
  const roles = await prisma.$queryRaw`SELECT r.code,r.name FROM public.user_roles ur JOIN public.roles r ON r.code=ur.role_code WHERE ur.user_id=${user.id} ORDER BY r.code`;
  const privileges = await prisma.$queryRaw`SELECT DISTINCT rp.privilege_code AS code FROM public.user_roles ur JOIN public.role_privileges rp ON rp.role_code=ur.role_code WHERE ur.user_id=${user.id}`;
  const owners = await prisma.$queryRaw`SELECT user_id FROM public.access_screen_owners WHERE screen_code='membership_prices'`;
  const overrides = await prisma.$queryRaw`SELECT privilege_code AS code,effect FROM public.user_privilege_overrides WHERE user_id=${user.id}`;
  const ownsPrices = owners[0]?.user_id === user.id;
  return { user, roles, privileges: resolvePrivileges(privileges.map((row) => row.code), overrides, ownsPrices), licenseRemainingMs: license.remainingMs };
}
export async function requirePrivilege(permission) {
  const access = await getAccess();
  if (!access.privileges.includes(permission)) throw new AccessError("ليس لديك صلاحية لتنفيذ هذه العملية؛ راجع مدير النظام");
  return access;
}
export async function requireAnyPrivilege(permissions) {
  const access = await getAccess();
  if (!permissions.some((permission) => access.privileges.includes(permission))) throw new AccessError("ليس لديك صلاحية لتنفيذ هذه العملية؛ راجع مدير النظام");
  return access;
}
export function requireSafe(access) {
  if (!Number.isInteger(access.user.safe_no) || access.user.safe_no <= 0) throw new AccessError("يجب ربط المستخدم بخزينة صالحة قبل التحصيل");
  return access.user.safe_no;
}
export function scopeSafe(access, requested) {
  if (access.privileges.includes("reports.all_safes")) return requested;
  return Number.isInteger(access.user.safe_no) && access.user.safe_no > 0 ? access.user.safe_no : -1;
}
export function assertSafe(access, safe) {
  if (!access.privileges.includes("reports.all_safes") && Number(safe) !== requireSafe(access)) throw new AccessError("هذه العملية تخص خزينة أخرى");
}
export function tablePrivilege(table) {
  const permissions = { members: "members.view", members_ref: "refs.view", memberships: "receipts.view", InstallmentsMembers: "legacy_installments.view" };
  if (!Object.hasOwn(permissions, table)) throw new AccessError("جدول غير مسموح");
  return permissions[table];
}
export function safeInclude(include) {
  if (!include || typeof include !== "object") return include;
  const result = {};
  for (const [key, value] of Object.entries(include)) {
    if (["user", "users", "rel_user"].includes(key)) result[key] = { select: { id: true, fullname: true, safe_no: true } };
    else if (value && typeof value === "object") result[key] = { ...value, ...(value.include ? { include: safeInclude(value.include) } : {}), ...(value.select ? { select: safeInclude(value.select) } : {}) };
    else result[key] = value;
  }
  return result;
}
export function scopeMemberHistory(access, member) {
  if (!member || access.privileges.includes("reports.all_safes")) return member;
  const result = { ...member };
  if (Array.isArray(member.membership)) result.membership = member.membership.map((receipt) => {
    if (receipt.safe_no === access.user.safe_no && access.privileges.includes("receipts.view")) return receipt;
    return { id: receipt.id, start_date: receipt.start_date, end_date: receipt.end_date, status: receipt.status, secondary: receipt.secondary, canceled: receipt.canceled, renew_years: receipt.renew_years, rel_status: receipt.rel_status, masked: true };
  });
  if (member.member) result.member = scopeMemberHistory(access, member.member);
  if (Array.isArray(member.rel_members)) result.rel_members = member.rel_members.map((ref) => scopeMemberHistory(access, ref));
  return result;
}
