const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const db = new PrismaClient();
async function main() {
  const user = await db.users.findFirst({ where: { safe_no: { gt: 0 } }, select: { id: true, fullname: true, safe_no: true } });
  const candidates = await db.members.findMany({ where: { suspended: '-', member_type: { not: null } }, orderBy: { member_code: 'desc' }, take: 50, select: { member_code: true } });
  let member;
  for (const candidate of candidates) {
    if (!await db.memberships.findFirst({ where: { member_code: candidate.member_code, canceled: 0 }, select: { id: true } })) { member = candidate; break; }
  }
  assert.ok(member, 'Need an unpaid member for read-only preview');
  const output = path.resolve('../outputs/new-membership-installments');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(user), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript((actor) => localStorage.setItem('clubUser', JSON.stringify(actor)), user);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:3001/club/new-membership-installments');
    await page.getByRole('heading', { name: 'تقسيط العضوية الجديدة', exact: true }).waitFor();
    await page.getByText('لا توجد عقود مطابقة', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'list-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'عقد جديد', exact: true }).click();
    await page.getByLabel('رقم العضوية للتعاقد', { exact: true }).fill(String(member.member_code));
    await page.getByLabel('ثمن العضوية قبل الضريبة', { exact: true }).fill('75000');
    await page.getByRole('button', { name: 'معاينة العقد', exact: true }).click();
    await page.getByRole('button', { name: 'حفظ العقد بدون تحصيل', exact: true }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator('.nmi-preview tbody').first().getByText('٥٥٬٠٠٠٫٠٠', { exact: true }).count(), 1);
    assert.equal(await page.locator('.nmi-preview .nmi-table-scroll tbody tr').count(), 12);
    await page.screenshot({ path: path.join(output, 'preview-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'preview-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, 'No horizontal page overflow on mobile');
    assert.deepEqual(errors, []);
    const React = require('react');
    const ReactDOMServer = require('react-dom/server');
    const vm = require('node:vm');
    const babel = require('next/dist/compiled/babel/bundle');
    const source = fs.readFileSync('components/NewMembershipInstallments/InstallmentCycle.jsx', 'utf8');
    const snippet = ['modes', 'money', 'day', 'feeNames', 'Schedule', 'Paper'].map((name) => h.functionCode(source, name)).join('\n');
    const code = babel.core().transformSync(snippet + '\nmodule.exports = Paper;', { babelrc: false, configFile: false, presets: [babel.presetReact()] }).code;
    const sandbox = { React, forwardRef: React.forwardRef, module: { exports: {} } };
    vm.runInNewContext(code, sandbox);
    const math = h.evaluateModule(h.root, 'lib/newMembershipInstallments.js');
    const fixture = { id: 'PRINT TEST - NOT A REAL CONTRACT', member: { name: 'عضو اختبار طباعة', member_code: 'TEST' }, application_date: '2026-02-15', frequency: 'monthly', price_cents: 7500000, deposit_cents: 2000000, extras_cents: 1070410, items: math.installmentSchedule(7500000, 2000000, 'monthly', '2026-02-15'), fee_snapshot: { renew_fee: 12000, maintenance_fee: 5000, membership_card_fee: 1500, fellowship_fund_fee: 1000, membership_vat_cents: 1050000, annual_vat_cents: 910 } };
    const css = fs.readFileSync('components/NewMembershipInstallments/installments.css', 'utf8');
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.emulateMedia({ media: 'print' });
    for (const [name, payment] of [['contract', null], ['receipt', { serial_no: 'TEST', kind: 'deposit', principal_cents: 2000000, penalty_cents: 0, amount_cents: 3070410, payment_date: '2026-02-15', safe_no: 'TEST', cashier_name: 'اختبار', allocations: [], status: 'posted' }]]) {
      const markup = ReactDOMServer.renderToStaticMarkup(React.createElement(sandbox.module.exports, { contract: fixture, payment }));
      await page.setContent(`<base href="http://localhost:3001"><style>${css}</style>${markup}`);
      await page.locator('.nmi-paper img').waitFor();
      assert.equal(await page.locator('.nmi-paper img').evaluate((img) => img.complete && img.naturalWidth > 0), true);
      assert.equal(await page.locator('.nmi-paper').evaluate((paper) => getComputedStyle(paper).direction), 'rtl');
      await page.screenshot({ path: path.join(output, `print-${name}.png`), fullPage: true });
      await page.pdf({ path: path.join(output, `print-${name}.pdf`), format: 'A4' });
    }
    console.log('PASS: actual contract/receipt print components, RTL and logo, with non-financial static fixtures');
    console.log('PASS: live Arabic list, authenticated read-only preview, 12 installments, desktop/mobile without page errors or overflow');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
