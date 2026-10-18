import crypto from "crypto";
import { AccessError } from "./accessControl";
export async function readAdministration(db, search = "", page = 0) {
  const term = String(search).trim().slice(0, 100);
  const offset = Math.max(0, Math.min(100000, Math.floor(Number(page) || 0))) * 25;
  const owners = await db.$queryRaw`SELECT user_id FROM public.access_screen_owners WHERE screen_code='membership_prices'`;
  const filters = [{ OR: [{ email: null }, { NOT: { email: { equals: "Admin@gmail.com", mode: "insensitive" } } }] }];
  if (owners[0]?.user_id) filters.push({ id: { not: owners[0].user_id } });
  if (term) filters.push({ OR: [{ name: { contains: term, mode: "insensitive" } }, { fullname: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }] });
  const users = await db.users.findMany({ where: { AND: filters }, select: { id: true, name: true, fullname: true, email: true, safe_no: true }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: offset, take: 25 });
  const assignments = users.length ? await db.$queryRaw`SELECT user_id,role_code FROM public.user_roles WHERE user_id=ANY(${users.map((user) => user.id)}::text[])` : [];
  const roles = await db.$queryRaw`SELECT r.code,r.name,COALESCE(json_agg(json_build_object('code',p.code,'name',p.name,'category',p.category) ORDER BY p.category,p.name) FILTER(WHERE p.code IS NOT NULL),'[]') AS privileges FROM public.roles r LEFT JOIN public.role_privileges rp ON rp.role_code=r.code LEFT JOIN public.privileges p ON p.code=rp.privilege_code GROUP BY r.code,r.name ORDER BY r.name`;
  const overrides = users.length ? await db.$queryRaw`SELECT user_id,privilege_code AS code,effect FROM public.user_privilege_overrides WHERE user_id=ANY(${users.map((user) => user.id)}::text[]) ORDER BY privilege_code` : [];
  const privileges = await db.$queryRaw`SELECT code,name,category FROM public.privileges ORDER BY category,name`;
  return { users: users.map((user) => ({ ...user, roles: assignments.filter((row) => row.user_id === user.id).map((row) => row.role_code), overrides: overrides.filter((row) => row.user_id === user.id).map(({ code, effect }) => ({ code, effect })) })), roles, privileges, priceOwnerId: owners[0]?.user_id };
}
function normalizeOverrides(value) {
  if (!Array.isArray(value) || value.length > 100 || value.some((entry) => !entry || typeof entry.code !== "string" || !["allow", "deny"].includes(entry.effect)) || new Set(value.map((entry) => entry.code)).size !== value.length) throw new AccessError("بيانات تخصيص الصلاحيات غير صحيحة");
  return value.map(({ code, effect }) => ({ code, effect })).sort((a, b) => a.code.localeCompare(b.code));
}
export async function assignRoles(db, actor, input) {
  if (typeof input?.userId !== "string" || !Array.isArray(input.roles) || input.roles.length > 5 || input.roles.some((role) => typeof role !== "string")) throw new AccessError("بيانات الأدوار غير صحيحة");
  if (typeof input.reason !== "string" || input.reason.trim().length < 5 || input.reason.length > 500) throw new AccessError("اكتب سبب تغيير الصلاحيات بوضوح");
  const requested = [...new Set(input.roles)].sort();
  if (!Array.isArray(input.expectedRoles) || input.expectedRoles.length > 5 || input.expectedRoles.some((role) => typeof role !== "string")) throw new AccessError("حدّث بيانات المستخدم قبل الحفظ");
  const overrides = input.overrides === undefined ? null : normalizeOverrides(input.overrides);
  const expectedOverrides = overrides === null ? null : normalizeOverrides(input.expectedOverrides);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20261018)::text AS lock`;
    // Re-check inside the same serialized transaction to close role-revocation races.
    const authorized = await tx.$queryRaw`SELECT 1 WHERE
      (EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.role_privileges rp ON rp.role_code=ur.role_code WHERE ur.user_id=${actor.id} AND rp.privilege_code='users.roles.manage')
       OR EXISTS(SELECT 1 FROM public.user_privilege_overrides WHERE user_id=${actor.id} AND privilege_code='users.roles.manage' AND effect='allow'))
      AND NOT EXISTS(SELECT 1 FROM public.user_privilege_overrides WHERE user_id=${actor.id} AND privilege_code='users.roles.manage' AND effect='deny')`;
    if (!authorized.length) throw new AccessError("لم تعد لديك صلاحية إدارة الأدوار");
    const user = await tx.users.findUnique({ where: { id: input.userId }, select: { id: true, name: true, email: true } });
    if (!user) throw new AccessError("المستخدم غير موجود");
    const protectedOwners = await tx.$queryRaw`SELECT user_id FROM public.access_screen_owners WHERE screen_code='membership_prices'`;
    if (user.email?.trim().toLowerCase() === "admin@gmail.com" || protectedOwners.some((owner) => owner.user_id === user.id)) throw new AccessError("حساب الشركة محمي؛ لا يمكن تعديل أدواره أو صلاحياته من هذه الشاشة");
    const existing = (await tx.$queryRaw`SELECT role_code FROM public.user_roles WHERE user_id=${user.id} ORDER BY role_code`).map((row) => row.role_code);
    if (JSON.stringify(existing) !== JSON.stringify([...new Set(input.expectedRoles)].sort())) throw new AccessError("تم تعديل أدوار المستخدم بواسطة مستخدم آخر؛ حدّث الصفحة");
    const oldOverrides = normalizeOverrides(await tx.$queryRaw`SELECT privilege_code AS code,effect FROM public.user_privilege_overrides WHERE user_id=${user.id}`);
    if (overrides !== null && JSON.stringify(oldOverrides) !== JSON.stringify(expectedOverrides)) throw new AccessError("تم تعديل صلاحيات المستخدم بواسطة مستخدم آخر؛ حدّث الصفحة");
    const nextOverrides = overrides ?? oldOverrides;
    if (overrides !== null) {
      const codes = overrides.map((entry) => entry.code);
      const knownPrivileges = await tx.$queryRaw`SELECT code FROM public.privileges WHERE code=ANY(${codes}::text[])`;
      if (knownPrivileges.length !== codes.length) throw new AccessError("توجد صلاحية غير معروفة");
      const owners = await tx.$queryRaw`SELECT user_id FROM public.access_screen_owners WHERE screen_code='membership_prices'`;
      if (owners[0]?.user_id !== user.id && overrides.some((entry) => entry.effect === "allow" && ["prices.manage", "prices.edit"].includes(entry.code))) throw new AccessError("إعدادات الأسعار وتعديلها لحساب الشركة فقط");
    }
    const known = await tx.$queryRaw`SELECT code FROM public.roles WHERE code=ANY(${requested}::text[])`;
    if (known.length !== requested.length) throw new AccessError("يوجد دور غير معروف");
    if (existing.includes("system_admin") && (!requested.includes("system_admin") || nextOverrides.some((entry) => entry.code === "users.roles.manage" && entry.effect === "deny"))) {
      const other = await tx.$queryRaw`SELECT ur.user_id FROM public.user_roles ur WHERE ur.role_code='system_admin' AND ur.user_id<>${user.id}
        AND NOT EXISTS(SELECT 1 FROM public.user_privilege_overrides o WHERE o.user_id=ur.user_id AND o.privilege_code='users.roles.manage' AND o.effect='deny') LIMIT 1`;
      if (!other.length) throw new AccessError("لا يمكن إزالة آخر مدير للنظام");
    }
    await tx.$executeRaw`DELETE FROM public.user_roles WHERE user_id=${user.id}`;
    for (const role of requested) await tx.$executeRaw`INSERT INTO public.user_roles(user_id,role_code,assigned_by) VALUES (${user.id},${role},${actor.id})`;
    if (overrides !== null) {
      await tx.$executeRaw`DELETE FROM public.user_privilege_overrides WHERE user_id=${user.id}`;
      for (const entry of overrides) await tx.$executeRaw`INSERT INTO public.user_privilege_overrides(user_id,privilege_code,effect,assigned_by) VALUES (${user.id},${entry.code},${entry.effect},${actor.id})`;
      await tx.$executeRaw`INSERT INTO public.security_audit(id,actor_id,action,target_id,before_value,after_value,reason) VALUES (${crypto.randomUUID()},${actor.id},'user_access.changed',${user.id},${JSON.stringify({ roles: existing, overrides: oldOverrides })}::jsonb,${JSON.stringify({ roles: requested, overrides })}::jsonb,${input.reason.trim()})`;
      return { ok: true };
    }
    await tx.$executeRaw`INSERT INTO public.security_audit(id,actor_id,action,target_id,before_value,after_value,reason) VALUES (${crypto.randomUUID()},${actor.id},'user_roles.changed',${user.id},${JSON.stringify(existing)}::jsonb,${JSON.stringify(requested)}::jsonb,${input.reason.trim()})`;
    return { ok: true };
  });
}
