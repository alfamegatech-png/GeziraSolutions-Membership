const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const db = new PrismaClient();
async function main() {
  const users = await db.users.findMany({ where: { email: { in: ['Admin@gmail.com', 'm.saeed@gmail.com'] } }, select: { id: true, email: true, fullname: true, safe_no: true } });
  const settings = await db.$queryRaw`SELECT setting_key,value FROM public.membership_price_settings ORDER BY setting_key`;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    for (const user of users) {
      const company = user.email === 'Admin@gmail.com';
      assert.equal((await db.$queryRaw`SELECT role_code FROM public.user_roles WHERE user_id=${user.id} AND role_code='system_admin'`).length, 1);
      const context = await browser.newContext();
      await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(user), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
      await context.addInitScript((actor) => localStorage.setItem('clubUser', JSON.stringify(actor)), user);
      const full = await context.request.get('http://localhost:3001/api/membership-prices');
      assert.equal(full.status(), company ? 200 : 403);
      const calculated = await context.request.get('http://localhost:3001/api/membership-prices?mode=calculation');
      assert.equal(calculated.status(), 200);
      const map = await calculated.json();
      for (const setting of settings) assert.equal(map[setting.setting_key], Number(setting.value));
      const page = await context.newPage();
      await page.goto('http://localhost:3001/club/membership-prices');
      if (company) {
        await page.getByRole('button', { name: 'حفظ', exact: true }).waitFor();
        await page.getByRole('button', { name: 'القائمة الرئيسية', exact: true }).click();
        for (const label of ['قائمة الأعضاء', 'قائمة الأعضاء التابعين', 'قائمة تجديدات العضويات', 'ايرادات الدواليب للحساب', 'تقسيط العضوية الجديدة', 'إعدادات الأسعار', 'أدوار المستخدمين', 'سجل الصلاحيات', 'التقسيط القديم']) await page.getByRole('button', { name: label, exact: true }).waitFor();
      } else await page.getByRole('heading', { name: 'غير مصرح بالدخول', exact: true }).waitFor();
      await page.goto('http://localhost:3001/club/user-roles');
      await page.getByRole('textbox', { name: 'بحث المستخدمين' }).fill('Admin@gmail.com');
      await page.getByRole('button', { name: 'بحث', exact: true }).click();
      await page.getByText('لا توجد نتائج', { exact: true }).waitFor();
      assert.equal(await page.locator('.access-scroll tbody').getByText('Admin@gmail.com', { exact: true }).count(), 0);
      await context.close();
    }
    assert.deepEqual(await db.$queryRaw`SELECT setting_key,value FROM public.membership_price_settings ORDER BY setting_key`, settings);
    console.log('PASS: company retains all screens and price editing; hidden from role administration for both administrators; price policy preserved; read-only verification, no pricing writes');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
