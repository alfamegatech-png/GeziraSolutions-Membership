const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const db = new PrismaClient();
const cents = (value) => Math.round(Number(value || 0) * 100);
const cashFields = ['installment', 'renew_fee', 'maintenance_fee', 'membership_card_fee', 'fellowship_fund_fee', 'value_added_tax', 'delay_penalty', 'previous_penalties', 'transfer_separation_fee', 'prev_years_fee', 'join_fee', 'first_time_fee', 'new_ref_fees', 'seperate_fees', 'swimming'];
async function main() {
  const memberCode = Number(process.argv[2]);
  assert.ok(Number.isInteger(memberCode) && memberCode > 0);
  console.log('Database:', (await db.$queryRaw`SELECT current_database() AS name`)[0].name);
  const receipts = await db.memberships.findMany({ where: { member_code: memberCode }, orderBy: { serial_no: 'asc' }, include: { member: { select: { name: true, member_type: true } }, rel_canceled: true } });
  const payments = await db.$queryRaw`SELECT p.* FROM public.membership_installment_payments p JOIN public.membership_installment_contracts c ON c.id=p.contract_id JOIN public.members m ON m.id=c.member_id WHERE m.member_code=${memberCode}`;
  const reportApi = h.evaluateModule(h.root, 'components/LazyTable/report.js', { '@app/api/db': db });
  const summary = {}, audit = [];
  for (const row of receipts) {
    const journals = await db.transactions.findMany({ where: { ReceiptNumber: row.serial_no }, include: { Transaction_AccountNumbers: true } });
    const payment = payments.find((item) => item.receipt_id === row.id);
    if (row.remark?.startsWith('[NMI:')) assert.ok(payment, `Receipt ${row.serial_no} is linked to contract`);
    assert.equal(journals.length, 1, `Unique ledger ${row.serial_no}`);
    assert.equal(journals[0].Canceled, row.canceled !== 0);
    assert.equal(journals[0].SafeNumber, String(row.safe_no));
    const credit = journals[0].Transaction_AccountNumbers.reduce((sum, account) => sum + cents(account.Money), 0);
    assert.equal(credit, cents(row.total_amount), `Ledger ${row.serial_no}`);
    assert.equal(cashFields.reduce((sum, field) => sum + cents(row[field]), 0), cents(row.total_amount), `Receipt components ${row.serial_no}`);
    if (payment) {
      assert.equal(Number(payment.amount_cents), cents(row.total_amount));
      assert.equal(Number(payment.principal_cents), cents(row.installment));
      assert.equal(Number(payment.penalty_cents), cents(row.delay_penalty));
    }
    if (row.canceled === 0) for (const field of [...cashFields, 'total_amount']) summary[field] = (summary[field] || 0) + cents(row[field]);
    audit.push({ receipt: row.serial_no, canceled: row.canceled, kind: payment?.kind || 'legacy', safe: row.safe_no, date: row.member_order_date.toISOString().slice(0, 10), principal: row.installment, total: row.total_amount, ledgerTotal: credit / 100, difference: (cents(row.total_amount) - credit) / 100 });
  }
  const memberReport = await reportApi.getReportData({ filters: {}, rows: 10, first: 0 }, { serial_no: 'asc' }, { member: true, rel_canceled: true }, { member_code: memberCode });
  assert.equal(memberReport.length, receipts.length, 'Financial report includes every receipt, not only active membership');
  const rendered = h.runReport(h.root, { now: '2026-10-18T10:00:00Z', data: JSON.parse(JSON.stringify(memberReport)) });
  assert.equal(rendered.rows.length, receipts.length);
  assert.equal(rendered.rows.filter((row) => row.active).reduce((sum, row) => sum + cents(row.totalAmount), 0), summary.total_amount);
  assert.equal(rendered.rows.filter((row) => row.active).reduce((sum, row) => sum + cents(row.installment), 0), summary.installment);
  assert.equal(rendered.rows.filter((row) => row.active).reduce((sum, row) => sum + cents(row.valueAddedTax), 0), summary.value_added_tax);
  const days = [...new Set(audit.map((row) => `${row.date}|${row.safe}`))];
  const daily = [];
  for (const key of days) {
    const [date, safe] = key.split('|');
    const rows = await reportApi.getReportData({ filters: {}, rows: 10, first: 0 }, { serial_no: 'asc' }, { member: true, rel_canceled: true }, { member_order_date: new Date(date), safe_no: Number(safe) });
    const own = rows.filter((row) => row.member_code === memberCode);
    assert.equal(own.length, receipts.filter((row) => row.member_order_date.toISOString().slice(0, 10) === date && row.safe_no === Number(safe)).length);
    const displayed = h.runReport(h.root, { now: '2026-10-18T10:00:00Z', data: JSON.parse(JSON.stringify(rows)) });
    assert.equal(displayed.rows.filter((row) => row.memberCode === memberCode && row.active).reduce((sum, row) => sum + cents(row.totalAmount), 0), own.filter((row) => row.canceled === 0).reduce((sum, row) => sum + cents(row.total_amount), 0));
    daily.push({ date, safe: Number(safe), memberReceipts: own.length, dayReceipts: rows.length, renewalCounterForMember: displayed.rows.filter((row) => row.memberCode === memberCode && row.active && row.renewFee > 0).length });
  }
  console.log(JSON.stringify({ receipts: audit, totals: Object.fromEntries(Object.entries(summary).filter(([, value]) => value !== 0).map(([field, value]) => [field, value / 100])), daily, financialReportCount: memberReport.length, differences: 0 }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
