const assert = require('node:assert/strict');
const test = require('node:test');
const h = require('./regression/calculation-baseline/harness.cjs');
const { installmentReceiptColumns } = h.evaluateModule(h.root, 'lib/installmentReceiptLayout.js');
const contract = { fee_snapshot: { renew_fee: 24000, maintenance_fee: 10000, membership_card_fee: 3000, fellowship_fund_fee: 1000, value_added_tax: 1051820 } };
test('deposit columns match saved accounting classification and total, without duplicating principal', () => {
  const columns = installmentReceiptColumns(contract, { kind: 'deposit', principal_cents: 2000000, penalty_cents: 0 });
  assert.equal(columns.reduce((sum, row) => sum + row.cents, 0), 3089820);
  assert.equal(columns.find((row) => row.label === 'قسط ق.م').cents, 2000000);
  assert.equal(columns[0].cents, 0);
});
test('installment receipt contains only collected principal and fine, not deposit fees', () => {
  const columns = installmentReceiptColumns(contract, { kind: 'installment', principal_cents: 458337, penalty_cents: 1250 });
  assert.equal(columns.reduce((sum, row) => sum + row.cents, 0), 459587);
  assert.equal(columns.find((row) => row.label === 'قيمة مضافة').cents, 0);
});
