import crypto from "crypto";
import fs from "fs";
import path from "path";

export const INSTALLMENT_COOKIE = "gezira_installment_session";
function secret() {
  if (process.env.INSTALLMENT_SESSION_SECRET) return process.env.INSTALLMENT_SESSION_SECRET;
  const directory = path.join(process.cwd(), ".runtime");
  const file = path.join(directory, "installment-session.key");
  fs.mkdirSync(directory, { recursive: true });
  try { fs.writeFileSync(file, crypto.randomBytes(48).toString("hex"), { flag: "wx", mode: 0o600 }); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  return fs.readFileSync(file, "utf8");
}
export function signInstallmentSession(user, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ id: user.id, expires: now + 8 * 3600000 })).toString("base64url");
  return `${body}.${crypto.createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function readInstallmentSession(token, now = Date.now()) {
  if (typeof token !== "string" || token.length > 4096) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof data.id === "string" && Number.isFinite(data.expires) && data.expires > now ? data : null;
  } catch { return null; }
}
