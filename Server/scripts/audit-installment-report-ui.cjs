const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const db = new PrismaClient();
async function main() {
  const user = await db.users.findFirst({ where: { safe_no: 1 }, select: { id: true, fullname: true, safe_no: true } });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.addInitScript((actor) => { localStorage.setItem('clubUser', JSON.stringify(actor)); localStorage.setItem('filterDate', '2026-10-18'); }, user);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:3001/club/memberships');
    await page.getByRole('button', { name: 'إستخراج تقرير', exact: true }).waitFor();
    const report = page.locator('.page[dir="rtl"]');
    await page.waitForFunction(() => [...document.querySelectorAll('.page[dir="rtl"] tr')].some((row) => row.textContent.includes('1452121')));
    const rows = await report.locator('tbody tr').allTextContents();
    for (let receipt = 452109; receipt <= 452121; receipt++) assert.ok(rows.some((row) => row.includes(`1${receipt}`)), `Receipt ${receipt} appears in daily report`);
    const text = await report.textContent();
    assert.ok(text.includes('85898.20'), 'Daily report grand total');
    assert.ok(text.includes('75000.00'), 'Principal subtotal includes deposit and installments');
    assert.ok(text.includes('10518.20'), 'Full VAT upfront and not repeated');
    assert.deepEqual(errors, []);
    console.log('PASS: actual daily-report DOM includes all 13 paid receipts, principal75000.00, VAT10518.20, total85898.20; no browser errors');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
