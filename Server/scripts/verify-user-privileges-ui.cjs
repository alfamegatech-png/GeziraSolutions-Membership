const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const db = new (require('@prisma/client').PrismaClient)();
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function main() {
  const id = crypto.randomUUID(), name = 'PERMISSION-UI-' + id;
  let browser;
  const before = await db.$queryRaw`SELECT user_id,role_code FROM public.user_roles ORDER BY user_id,role_code`;
  const overridesBefore = await db.$queryRaw`SELECT user_id,privilege_code,effect FROM public.user_privilege_overrides ORDER BY user_id,privilege_code`;
  try {
    await db.users.create({ data: { id, name, email: id + '@test.invalid', fullname: 'اختبار تخصيص الصلاحيات', national_id: '', password: crypto.randomBytes(32).toString('hex'), safe_no: 1 } });
    const actor = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true, fullname: true, safe_no: true } });
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(actor), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript(u => localStorage.setItem('clubUser', JSON.stringify(u)), actor);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3001/club/user-roles');
    await page.getByRole('textbox', { name: 'بحث المستخدمين' }).fill(name);
    await page.getByRole('button', { name: 'بحث', exact: true }).click();
    await page.getByRole('button', { name: `تعديل أدوار ${name}`, exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('checkbox', { name: 'محصل الخزينة', exact: true }).check();
    await dialog.getByRole('checkbox', { name: 'تحصيل تجديد عضوية', exact: true }).uncheck();
    await dialog.getByRole('checkbox', { name: 'تصدير البيانات', exact: true }).check();
    assert.equal(await dialog.getByRole('checkbox', { name: 'تعديل الأسعار - حساب الشركة', exact: true }).isDisabled(), true);
    await dialog.getByRole('textbox', { name: 'سبب تغيير الأدوار' }).fill('اختبار إضافة واستبعاد صلاحيات لمستخدم تجريبي فقط');
    await dialog.getByRole('button', { name: 'تأكيد تغيير الأدوار', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    const saved = await db.$queryRaw`SELECT privilege_code,effect FROM public.user_privilege_overrides WHERE user_id=${id} ORDER BY privilege_code`;
    assert.deepEqual(saved, [{ privilege_code: 'memberships.renew', effect: 'deny' }, { privilege_code: 'reports.export', effect: 'allow' }]);
    assert.equal((await db.$queryRaw`SELECT 1 FROM public.role_privileges WHERE role_code='cashier' AND privilege_code='memberships.renew'`).length, 1);
    await page.getByRole('button', { name: `تعديل أدوار ${name}`, exact: true }).click();
    dialog = page.getByRole('dialog');
    assert.equal(await dialog.getByRole('checkbox', { name: 'تحصيل تجديد عضوية', exact: true }).isChecked(), false);
    assert.equal(await dialog.getByRole('checkbox', { name: 'تصدير البيانات', exact: true }).isChecked(), true);
    await dialog.evaluate(async element => {
      const animations = element.getAnimations({ subtree: true }).concat(element.parentElement.getAnimations());
      await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
    });
    fs.mkdirSync('../outputs/user-privileges', { recursive: true });
    await page.screenshot({ path: '../outputs/user-privileges/desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: '../outputs/user-privileges/mobile.png', fullPage: true });
    await dialog.getByRole('button', { name: 'استعادة صلاحيات الأدوار', exact: true }).click();
    assert.equal(await dialog.getByRole('checkbox', { name: 'تحصيل تجديد عضوية', exact: true }).isChecked(), true);
    assert.equal(await dialog.getByRole('checkbox', { name: 'تصدير البيانات', exact: true }).isChecked(), false);
    await dialog.getByRole('textbox', { name: 'سبب تغيير الأدوار' }).fill('اختبار استعادة صلاحيات الدور للمستخدم التجريبي');
    await dialog.getByRole('button', { name: 'تأكيد تغيير الأدوار', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal((await db.$queryRaw`SELECT 1 FROM public.user_privilege_overrides WHERE user_id=${id}`).length, 0);
    assert.deepEqual(errors, []);
    console.log('PASS: UI grant/deny, persisted checkboxes, role defaults unchanged, company-price lock, restore defaults, desktop/mobile');
  } finally {
    if (browser) await browser.close();
    await db.$transaction(async tx => {
      await tx.$executeRaw`DELETE FROM public.user_privilege_overrides WHERE user_id=${id}`;
      await tx.$executeRaw`DELETE FROM public.user_roles WHERE user_id=${id}`;
      await tx.users.deleteMany({ where: { id } });
    });
    assert.deepEqual(await db.$queryRaw`SELECT user_id,role_code FROM public.user_roles ORDER BY user_id,role_code`, before);
    assert.deepEqual(await db.$queryRaw`SELECT user_id,privilege_code,effect FROM public.user_privilege_overrides ORDER BY user_id,privilege_code`, overridesBefore);
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
