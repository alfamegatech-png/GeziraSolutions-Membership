import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyLicense, expiryInstant } from "./licenseFormat.cjs";
import { getServerFingerprint } from "./serverFingerprint.cjs";

export const LICENSE_MESSAGE = "برجاء تحديث المنظومة. يُرجى تسجيل الدخول بحساب الشركة لإعادة التفعيل.";
export function isCompanyAccount(user) { return user?.email?.trim().toLowerCase() === "admin@gmail.com"; }
function publicKey() { return fs.readFileSync(path.join(process.cwd(), "config", "license-public-key.pem"), "utf8"); }
export async function licenseStatus(db, now = new Date()) {
  try {
    const fingerprint = getServerFingerprint();
    const rows = await db.$queryRaw`SELECT envelope,last_seen_at FROM public.system_license WHERE id='membership'`;
    if (!rows.length) return { active: false, code: "NOT_ACTIVATED", fingerprint };
    const data = verifyLicense(rows[0].envelope, publicKey(), fingerprint, now);
    if (rows[0].last_seen_at && new Date(rows[0].last_seen_at).getTime() > now.getTime() + 300000) return { active: false, code: "CLOCK_INVALID", fingerprint };
    if (!rows[0].last_seen_at || now.getTime() - new Date(rows[0].last_seen_at).getTime() > 60000) await db.$executeRaw`UPDATE public.system_license SET last_seen_at=GREATEST(last_seen_at,${now}) WHERE id='membership'`;
    return { active: true, fingerprint, expiresOn: data.expiresOn, licenseId: data.id, remainingMs: expiryInstant(data.expiresOn) - now.getTime() };
  } catch (error) {
    return { active: false, code: ["INVALID_LICENSE", "INVALID_SIGNATURE", "WRONG_SERVER", "CLOCK_INVALID", "EXPIRED"].includes(error.message) ? error.message : "LICENSE_UNAVAILABLE" };
  }
}
export async function assertSystemLicense(db) {
  const status = await licenseStatus(db);
  if (!status.active) {
    const error = new Error(LICENSE_MESSAGE);
    error.status = 423; error.licenseRequired = true;
    throw error;
  }
  return status;
}
export async function activateLicense(db, user, envelope, now = new Date()) {
  if (!isCompanyAccount(user)) { const error = new Error("التفعيل لحساب الشركة فقط"); error.status = 403; throw error; }
  const fingerprint = getServerFingerprint();
  const data = verifyLicense(envelope, publicKey(), fingerprint, now);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20260601)::text AS lock`;
    const before = await tx.$queryRaw`SELECT envelope,last_seen_at FROM public.system_license WHERE id='membership'`;
    if (before[0]?.last_seen_at && new Date(before[0].last_seen_at).getTime() > now.getTime() + 300000) throw new Error("CLOCK_INVALID");
    await tx.$executeRaw`INSERT INTO public.system_license(id,envelope,activated_by,activated_at,last_seen_at) VALUES ('membership',${envelope},${user.id},${now},${now}) ON CONFLICT(id) DO UPDATE SET envelope=EXCLUDED.envelope,activated_by=EXCLUDED.activated_by,activated_at=EXCLUDED.activated_at,last_seen_at=GREATEST(system_license.last_seen_at,EXCLUDED.last_seen_at)`;
    const digest = value => crypto.createHash("sha256").update(value).digest("hex");
    await tx.$executeRaw`INSERT INTO public.security_audit(id,actor_id,action,target_id,before_value,after_value,reason) VALUES (${crypto.randomUUID()},${user.id},'system_license.activated','membership',${JSON.stringify(before.length ? { hash: digest(before[0].envelope) } : null)}::jsonb,${JSON.stringify({ licenseId: data.id, expiresOn: data.expiresOn, fingerprint, hash: digest(envelope) })}::jsonb,'Signed server license activated by company account')`;
    return { active: true, fingerprint, expiresOn: data.expiresOn };
  });
}
