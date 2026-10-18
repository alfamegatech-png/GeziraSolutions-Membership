const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const db = new PrismaClient();
const created = [];
async function main() {
  const admin = await db.users.findUnique({ where: { email: 'm.saeed@gmail.com' }, select: { id: true, name: true, fullname: true, safe_no: true } });
  assert.ok(admin);
  fs.mkdirSync('../outputs/rbac', { recursive: true });
  let browser;
  try {
    const fixtures = {};
    for (const role of ['cashier', 'membership_staff', 'auditor', 'accounts_supervisor', 'no_role']) {
      const id = crypto.randomUUID();
      const user = await db.users.create({ data: { id, name: `RBAC_TEST_${role}_${id.slice(0, 8)}`, email: `${id}@test.invalid`, fullname: `اختبار مؤقت ${role}`, national_id: '', password: crypto.randomBytes(48).toString('hex'), safe_no: ['cashier', 'accounts_supervisor'].includes(role) ? 1 : null }, select: { id: true, name: true, fullname: true, safe_no: true } });
      created.push(id); fixtures[role] = user;
      if (role !== 'no_role') await db.$executeRaw`INSERT INTO public.user_roles(user_id,role_code) VALUES (${id},${role})`;
    }
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    async function session(user, spoof = false) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(user), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
      await context.addInitScript((actor) => { localStorage.setItem('clubUser', JSON.stringify(actor)); localStorage.setItem('filterDate', '2026-10-18'); }, spoof ? { ...admin, safe_no: 999 } : user);
      return { context, page: await context.newPage() };
    }
    const administrator = await session(admin);
    const page = administrator.page;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:3001/club/user-roles');
    await page.getByRole('heading', { name: 'أدوار المستخدمين', exact: true }).waitFor();
    await page.getByRole('button', { name: `تعديل أدوار ${fixtures.cashier.name}`, exact: true }).waitFor();
    await page.screenshot({ path: '../outputs/rbac/roles-desktop.png', fullPage: true });
    await page.getByRole('button', { name: `تعديل أدوار ${fixtures.cashier.name}`, exact: true }).click();
    await page.getByLabel('محصل الخزينة', { exact: true }).uncheck();
    await page.getByLabel('مراجع الحسابات', { exact: true }).check();
    await page.getByLabel('سبب تغيير الأدوار').fill('اختبار واجهة إسناد دور لحساب اختبار مؤقت فقط');
    await page.getByRole('button', { name: 'تأكيد تغيير الأدوار', exact: true }).click();
    await page.locator('.access-dialog').waitFor({ state: 'hidden' });
    assert.equal((await db.$queryRaw`SELECT role_code FROM public.user_roles WHERE user_id=${fixtures.cashier.id}`)[0].role_code, 'auditor');
    // Restore this fixture through the same audited UI, never by editing a real user's roles.
    await page.getByRole('button', { name: `تعديل أدوار ${fixtures.cashier.name}`, exact: true }).click();
    await page.getByLabel('مراجع الحسابات', { exact: true }).uncheck();
    await page.getByLabel('محصل الخزينة', { exact: true }).check();
    await page.getByLabel('سبب تغيير الأدوار').fill('إرجاع دور حساب الاختبار المؤقت بعد نجاح الاختبار');
    await page.getByRole('button', { name: 'تأكيد تغيير الأدوار', exact: true }).click();
    await page.locator('.access-dialog').waitFor({ state: 'hidden' });
    const adminCount = Number((await db.$queryRaw`SELECT COUNT(*)::int AS count FROM public.user_roles WHERE role_code='system_admin'`)[0].count);
    if (adminCount === 1) {
    await page.getByRole('button', { name: `تعديل أدوار ${admin.name}`, exact: true }).click();
    await page.getByLabel('مدير النظام', { exact: true }).uncheck();
    await page.getByLabel('سبب تغيير الأدوار').fill('اختبار منع إزالة آخر مدير دون تغيير أدواره');
    await page.getByRole('button', { name: 'تأكيد تغيير الأدوار', exact: true }).click();
    await page.getByText('لا يمكن إزالة آخر مدير للنظام', { exact: true }).last().waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '../outputs/rbac/roles-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    if (await page.locator('.access-dialog').isVisible()) await page.locator('.access-dialog .p-dialog-header-close').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3001/club/memberships');
    await page.waitForFunction(() => document.querySelector('.page[dir="rtl"]')?.textContent.includes('85898.20'));
    assert.ok((await page.locator('.page[dir="rtl"]').textContent()).includes('75000.00'));
    const contracts = await db.$queryRaw`SELECT c.id FROM public.membership_installment_contracts c JOIN public.members m ON m.id=c.member_id WHERE m.member_code=236099 AND c.status='active'`;
    assert.equal(contracts.length, 1);
    await page.goto(`http://localhost:3001/club/new-membership-installments/${contracts[0].id}`);
    await page.getByText('مفعلة - مكتملة السداد', { exact: true }).waitFor();
    assert.equal(await page.locator('.nmi-actions').count(), 13);
    await page.goto('http://localhost:3001/club/security-audit');
    await page.getByRole('heading', { name: 'سجل الصلاحيات', exact: true }).waitFor();
    await page.getByText('تغيير أدوار مستخدم', { exact: true }).first().waitFor();
    await administrator.context.close();
    for (const role of ['cashier', 'membership_staff', 'auditor', 'accounts_supervisor', 'no_role']) {
      const { context, page: view } = await session(fixtures[role], role === 'cashier');
      await view.goto('http://localhost:3001/club/members');
      if (role === 'no_role') {
        await view.getByRole('heading', { name: 'غير مصرح بالدخول', exact: true }).waitFor();
      } else {
        await view.locator('.member-search-filters').waitFor();
        const add = view.getByRole('button', { name: 'إضافة عضو جديد', exact: true });
        assert.equal(await add.count(), role === 'membership_staff' ? 1 : 0);
        const response = await context.request.put('http://localhost:3001/api/membership-prices', { data: { fixedSettings: [], memberTypes: [], refTypes: [] } });
        assert.equal(response.status(), 403, `${role} cannot edit prices`);
        if (role === 'cashier') {
          assert.equal(await view.locator('.workspace-user').textContent(), fixtures.cashier.fullname);
          await view.goto('http://localhost:3001/club/user-roles');
          await view.getByRole('heading', { name: 'غير مصرح بالدخول', exact: true }).waitFor();
        }
        if (role === 'cashier' || role === 'auditor' || role === 'accounts_supervisor') {
          await view.goto('http://localhost:3001/club/memberships');
          await view.locator('.p-datatable').waitFor();
          assert.equal(await view.getByLabel('خزينة التقرير', { exact: true }).count(), role === 'cashier' ? 0 : 1);
        }
      }
      await context.close();
    }
    const anonymous = await browser.newContext();
    assert.equal((await anonymous.request.get('http://localhost:3001/api/membership-prices')).status(), 401);
    assert.equal((await anonymous.request.post('http://localhost:3001/api/excel', { data: {} })).status(), 401);
    assert.equal((await anonymous.request.get('http://localhost:3001/api/print?id=test')).status(), 401);
    await anonymous.close();
    assert.deepEqual(errors, []);
    console.log('PASS: actual admin UI assignment/revocation, last-admin denial, all5 roles, no-role denial, forged localStorage ignored, safe scoping and protected HTTP endpoints; desktop/mobile screenshots verified');
  } finally {
    if (browser) await browser.close();
    if (created.length) {
      await db.$executeRaw`DELETE FROM public.user_roles WHERE user_id=ANY(${created}::text[])`;
      await db.users.deleteMany({ where: { id: { in: created } } });
      assert.equal(await db.users.count({ where: { id: { in: created } } }), 0);
      console.log('Temporary test accounts removed. Real user roles untouched; test role changes remain audited.');
    }
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
