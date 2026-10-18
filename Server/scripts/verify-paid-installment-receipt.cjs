const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
const db = new (require('@prisma/client').PrismaClient)();
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function main() {
  let browser;
  try {
    const actor = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true, fullname: true, safe_no: true } });
    const rows = await db.$queryRaw`SELECT p.*, r.serial_no, r.installment, r.delay_penalty, r.total_amount FROM public.membership_installment_payments p JOIN public.membership_installment_contracts c ON c.id=p.contract_id JOIN public.members m ON m.id=c.member_id JOIN public.memberships r ON r.id=p.receipt_id WHERE m.member_code=236099 AND p.kind='installment' AND p.status='posted' ORDER BY r.serial_no DESC LIMIT 1`;
    assert.equal(rows.length, 1);
    const r = rows[0];
    for (const key of ['principal_cents', 'penalty_cents', 'extras_cents', 'amount_cents']) r[key] = Number(r[key]);
    assert.equal(r.principal_cents + r.penalty_cents + r.extras_cents, r.amount_cents);
    assert.equal(Math.round(r.installment * 100), r.principal_cents);
    assert.equal(Math.round(r.delay_penalty * 100), r.penalty_cents);
    assert.equal(Math.round(r.total_amount * 100), r.amount_cents);
    const before = await db.memberships.count({ where: { member_code: 236099 } });
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
    await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(actor), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript(u => localStorage.setItem('clubUser', JSON.stringify(u)), actor);
    const page = await context.newPage();
    await page.goto(`http://localhost:3001/club/new-membership-installments/${r.contract_id}`);
    await page.getByRole('button', { name: `إيصال ${r.serial_no}`, exact: true }).click();
    const copy = page.getByRole('dialog').locator('.nmi-receipt-copy').first();
    await copy.waitFor();
    const headers = await copy.locator('thead th').allTextContents();
    const values = await copy.locator('tbody tr').first().locator('th,td').allTextContents();
    const money = cents => (cents / 100).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    assert.equal(values[headers.indexOf('قسط ق.م')], money(r.principal_cents));
    assert.equal(values[headers.indexOf('غرامة تأخير')], money(r.penalty_cents));
    assert.ok((await copy.textContent()).includes(`الإجمالي العام: ${money(r.amount_cents)} جنيه`));
    await page.evaluate(() => document.fonts.ready);
    await copy.screenshot({ path: '../outputs/installment-receipt-preview/paid-installment-236099.png' });
    assert.equal(await db.memberships.count({ where: { member_code: 236099 } }), before);
    console.log(JSON.stringify({ receipt: r.serial_no, principal: r.principal_cents / 100, penalty: r.penalty_cents / 100, total: r.amount_cents / 100, allocations: r.allocations, matched: true }));
  } finally { if (browser) await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
