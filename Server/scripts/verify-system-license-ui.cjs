const assert = require('node:assert/strict');
const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const db = new (require('@prisma/client').PrismaClient)();
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function main() {
  const file = process.argv[2];
  assert.ok(file, 'Pass the locally issued license file');
  const license = fs.readFileSync(file, 'utf8');
  const actor = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true, fullname: true, email: true, safe_no: true, password: true } });
  const other = await db.users.findUnique({ where: { email: 'm.saeed@gmail.com' }, select: { id: true, fullname: true, email: true, safe_no: true } });
  const { password, ...user } = actor;
  const before = await db.memberships.count();
  const initial = await db.$queryRaw`SELECT envelope FROM public.system_license WHERE id='membership'`;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const company = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await company.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(user), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await company.addInitScript(u => localStorage.setItem('clubUser', JSON.stringify(u)), user);
    const nonCompany = await browser.newContext();
    await nonCompany.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(other), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    assert.equal((await nonCompany.request.get('http://localhost:3001/api/system-license')).status(), 403);
    assert.equal((await nonCompany.request.post('http://localhost:3001/api/system-license', { headers: { origin: 'http://localhost:3001' }, data: { license, password: 'not-used' } })).status(), 403);
    const page = await company.newPage();
    fs.mkdirSync('../outputs/system-license', { recursive: true });
    if (!initial.length) {
      assert.equal((await company.request.get('http://localhost:3001/api/membership-prices')).status(), 423);
      assert.equal((await company.request.post('http://localhost:3001/api/excel', { data: {} })).status(), 423);
      assert.equal((await company.request.post('http://localhost:3001/api/pdf', { data: {} })).status(), 423);
      await page.goto('http://localhost:3001/club/landing');
      await page.getByRole('heading', { name: 'برجاء تحديث المنظومة', exact: true }).waitFor();
      await page.screenshot({ path: '../outputs/system-license/locked.png', fullPage: true });
    }
    const rejected = await company.request.post('http://localhost:3001/api/system-license', { headers: { origin: 'http://localhost:3001' }, data: { license: '{}', password } });
    assert.equal(rejected.status(), 400);
    assert.equal((await company.request.post('http://localhost:3001/api/system-license', { headers: { origin: 'https://invalid.example' }, data: { license, password } })).status(), 403);
    assert.equal((await company.request.post('http://localhost:3001/api/system-license', { headers: { origin: 'http://localhost:3001' }, data: { license, password: 'wrong-password-for-test' } })).status(), 403);
    assert.deepEqual(await db.$queryRaw`SELECT envelope FROM public.system_license WHERE id='membership'`, initial);
    await page.goto('http://localhost:3001/activation');
    await page.getByRole('textbox', { name: 'بصمة السيرفر', exact: true }).waitFor();
    await page.getByLabel('ملف الترخيص', { exact: true }).setInputFiles(file);
    await page.getByLabel('كلمة مرور حساب الشركة', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'تأكيد التفعيل', exact: true }).click();
    await page.getByText('تم تفعيل المنظومة بنجاح', { exact: true }).waitFor();
    await page.screenshot({ path: '../outputs/system-license/activation-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: '../outputs/system-license/activation-mobile.png', fullPage: true });
    assert.equal((await company.request.get('http://localhost:3001/api/membership-prices')).status(), 200);
    const info = await (await company.request.get('http://localhost:3001/api/system-license')).json();
    assert.equal(info.active, true);
    assert.equal(info.expiresOn, '2027-06-01');
    const rows = await db.$queryRaw`SELECT last_seen_at FROM public.system_license WHERE id='membership'`;
    const format = require('../lib/licenseFormat.cjs');
    const service = h.evaluateModule(h.root, 'lib/systemLicense.js', { './licenseFormat.cjs': format, './serverFingerprint.cjs': require('../lib/serverFingerprint.cjs') });
    assert.equal((await service.licenseStatus(db, new Date(format.expiryInstant(info.expiresOn)))).code, 'EXPIRED');
    assert.deepEqual(await db.$queryRaw`SELECT last_seen_at FROM public.system_license WHERE id='membership'`, rows);
    assert.equal(await db.memberships.count(), before);
    console.log('PASS: missing license locks UI and business APIs; company-only activation; invalid signature, password and origin rejected; signed license activated; desktop/mobile; June boundary verified; no financial writes');
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
