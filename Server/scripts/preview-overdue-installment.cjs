const fs = require('node:fs');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('next/dist/compiled/babel/bundle');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const { latePenalty, quoteInstallments } = h.evaluateModule(h.root, 'lib/newMembershipInstallments.js');
const { installmentReceiptColumns } = h.evaluateModule(h.root, 'lib/installmentReceiptLayout.js');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

async function main() {
  // Render the real receipt component with synthetic data; no database client or payment action is used.
  const two = process.argv.includes('--two');
  const item = { number: 1, due_date: two ? '2026-03-01' : '2026-10-01', principal_cents: 458333 };
  const graceItem = { ...item, due_date: '2026-10-01' };
  assert.equal(latePenalty(graceItem, '2026-10-10').cents, 0);
  assert.equal(latePenalty(graceItem, '2026-10-11').days, 11);
  const items = two ? [item, { ...item, number: 2, due_date: '2026-04-01' }] : [item];
  const paymentDate = two ? '2026-04-11' : '2026-10-18';
  const quote = quoteInstallments(items, items.length, paymentDate);
  assert.equal(quote.penalty_cents, two ? 13495 : 4583);
  assert.equal(quote.items[0].penalty.days, two ? 42 : 18);
  assert.equal(quote.total_cents, two ? 930161 : 462916);
  if (two) {
    assert.equal(quote.items[0].penalty.cents, 10694);
    assert.equal(quote.items[1].penalty.days, 11);
    assert.equal(quote.items[1].penalty.cents, 2801);
    const grace = quoteInstallments(items, 2, '2026-04-10');
    assert.equal(grace.items[0].penalty.days, 41);
    assert.equal(grace.items[1].penalty.days, 0);
    assert.equal(grace.items[1].penalty.cents, 0);
    const early = quoteInstallments(items, 2, '2026-04-05');
    assert.equal(early.items[0].penalty.days, 36);
    assert.equal(early.items[1].penalty.cents, 0);
  }
  const contract = { member: { name: 'عضو تجريبي — ليست عملية فعلية', member_code: 'تجريبي' }, fee_snapshot: {} };
  const payment = {
    kind: 'installment', status: 'posted', serial_no: 'تجريبي — غير صادر', safe_no: null,
    payment_date: paymentDate, cashier_name: 'معاينة فقط',
    principal_cents: quote.principal_cents, penalty_cents: quote.penalty_cents, amount_cents: quote.total_cents,
    allocations: quote.items.map(row => ({ number: row.number, due_date: row.due_date, principal_cents: row.principal_cents, penalty_days: row.penalty.days, penalty_cents: row.penalty.cents })),
  };
  const columns = installmentReceiptColumns(contract, payment);
  assert.equal(columns.reduce((sum, column) => sum + column.cents, 0), payment.amount_cents);
  const source = fs.readFileSync('components/NewMembershipInstallments/InstallmentCycle.jsx', 'utf8');
  const code = babel.core().transformSync(h.functionCode(source, 'Paper'), { babelrc: false, configFile: false, presets: [babel.presetReact()] }).code;
  const money = cents => (Number(cents || 0) / 100).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const day = date => new Date(date).toLocaleDateString('ar-EG', { timeZone: 'UTC' });
  const Paper = new Function('React', 'forwardRef', 'installmentReceiptColumns', 'money', 'day', `${code}; return Paper;`)(React, React.forwardRef, installmentReceiptColumns, money, day);
  const html = renderToStaticMarkup(React.createElement(Paper, { contract, payment }));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });
    await page.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
    await page.goto('http://localhost:3001/login');
    await page.evaluate(markup => {
      document.body.innerHTML = `<main dir="rtl" style="padding:24px;background:white;color:black"><p style="text-align:center;font-weight:bold;border:2px solid #a00;padding:12px;color:#a00">محاكاة تجريبية فقط — لا يُعتد به كإيصال دفع — لم تُسجل أي عملية</p>${markup}</main>`;
    }, html);
    await page.addStyleTag({ content: fs.readFileSync('components/NewMembershipInstallments/installments.css', 'utf8') });
    await page.evaluate(() => document.fonts.ready);
    const receipt = page.locator('.nmi-receipt-copy').first();
    const headings = await receipt.locator('thead th').allTextContents();
    const cells = await receipt.locator('tbody tr').locator('th,td').allTextContents();
    assert.equal(cells[headings.indexOf('قسط ق.م')], money(quote.principal_cents));
    assert.equal(cells[headings.indexOf('غرامة تأخير')], money(quote.penalty_cents));
    assert.ok((await receipt.textContent()).includes(`الإجمالي العام: ${money(quote.total_cents)} جنيه`));
    fs.mkdirSync('../outputs/installment-receipt-preview', { recursive: true });
    await page.locator('main').screenshot({ path: `../outputs/installment-receipt-preview/${two ? 'two-overdue-installments' : 'overdue-installment'}-simulation.png` });
    console.log(JSON.stringify({ simulated: true, databaseConnections: 0, principal: quote.principal_cents / 100, simulatedPaymentDate: payment.payment_date, allocations: payment.allocations, penalty: quote.penalty_cents / 100, total: quote.total_cents / 100, displayMatched: true }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
