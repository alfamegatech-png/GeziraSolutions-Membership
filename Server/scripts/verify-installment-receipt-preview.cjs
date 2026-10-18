const assert = require('node:assert/strict');
const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const db = new PrismaClient();
async function main() {
  const actor = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true, fullname: true, safe_no: true } });
  const rows = await db.$queryRaw`SELECT c.id,p.receipt_id,r.serial_no FROM public.membership_installment_contracts c JOIN public.members m ON m.id=c.member_id JOIN public.membership_installment_payments p ON p.contract_id=c.id JOIN public.memberships r ON r.id=p.receipt_id WHERE m.member_code=236099 AND p.kind='deposit' AND p.status='posted' LIMIT 1`;
  assert.equal(rows.length, 1);
  const receipt = rows[0];
  const before = await db.memberships.count({ where: { member_code: 236099 } });
  fs.mkdirSync('../outputs/installment-receipt-preview', { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(actor), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript((user) => localStorage.setItem('clubUser', JSON.stringify(user)), actor);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('frameattached', (frame) => frame.evaluate(() => { window.print = () => { window.top.__receiptPrintCalls = (window.top.__receiptPrintCalls || 0) + 1; }; }).catch(() => {}));
    await page.goto(`http://localhost:3001/club/new-membership-installments/${receipt.id}`);
    const button = page.getByRole('button', { name: `إيصال ${receipt.serial_no}`, exact: true });
    await button.waitFor();
    assert.equal(await button.textContent(), 'عرض الإيصال');
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'مستند التقسيط', exact: true });
    await dialog.waitFor();
    await dialog.getByText(/إيصال تحصيل تقسيط عضوية جديدة/).first().waitFor();
    assert.ok((await dialog.textContent()).includes(String(receipt.serial_no)));
    assert.equal(await dialog.locator('img').first().evaluate((img) => img.complete && img.naturalWidth > 0), true);
    await page.screenshot({ path: '../outputs/installment-receipt-preview/receipt-desktop.png', fullPage: true });
    await dialog.getByRole('button', { name: 'طباعة', exact: true }).click();
    await page.waitForFunction(() => window.__receiptPrintCalls > 0);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: '../outputs/installment-receipt-preview/receipt-mobile.png', fullPage: true });
    assert.equal(await dialog.locator('.nmi-receipt-copy').count(), 3);
    assert.equal(await dialog.locator('.nmi-receipt-copy:visible').count(), 1);
    assert.equal(await dialog.locator('.nmi-receipt-copy').first().locator('tbody td').count(), 17);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await dialog.locator('.nmi-receipt-copy').first().screenshot({ path: '../outputs/installment-receipt-preview/renewal-style-installment-receipt.png' });
    await page.evaluate(() => {
      const paper = document.querySelector('.nmi-receipt-paper').cloneNode(true);
      document.body.replaceChildren(paper);
    });
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.nmi-receipt-copy:visible').count(), 3);
    await page.pdf({ path: '../outputs/installment-receipt-preview/renewal-style-installment-receipt.pdf', format: 'A4', landscape: true, margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' } });
    assert.deepEqual(errors, []);
    assert.equal(await db.memberships.count({ where: { member_code: 236099 } }), before);
    console.log(`PASS: existing receipt ${receipt.serial_no} preview, logo and print action; desktop/mobile; no payment requests or new receipts`);
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
