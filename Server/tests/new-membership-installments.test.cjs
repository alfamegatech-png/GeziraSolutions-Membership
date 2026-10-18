const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./regression/calculation-baseline/harness.cjs');
const math = h.evaluateModule(h.root, 'lib/newMembershipInstallments.js');
const fees = h.evaluateModule(h.root, 'lib/newMembershipInstallmentFees.js');
const prices = h.evaluateModule(h.root, 'components/MembershipPrices/priceSettingsConfig.js').DEFAULT_PRICE_SETTINGS_MAP;
const clean = (value) => JSON.parse(JSON.stringify(value));

for (const [frequency, count, amount, last] of [
  ['monthly', 12, 458333, '2027-02-01'],
  ['quarterly', 4, 1375000, '2026-12-01'],
  ['semiannual', 2, 2750000, '2026-09-01'],
]) test(`${frequency}: exact principal, first next-month day one, no interest`, () => {
  const rows = math.installmentSchedule(7500000, 2000000, frequency, '2026-02-28');
  assert.equal(rows.length, count);
  assert.equal(rows[0].due_date, '2026-03-01');
  assert.equal(rows.at(-1).due_date, last);
  assert.equal(rows[0].principal_cents, amount);
  assert.equal(rows.reduce((sum, row) => sum + row.principal_cents, 0), 5500000);
  if (count === 12) assert.equal(rows.at(-1).principal_cents, 458337);
});

for (const [payment, days] of [['2026-02-28', 0], ['2026-03-10', 0], ['2026-03-11', 11], ['2026-04-05', 36], ['2026-04-11', 42]])
  test(`actual inclusive calendar days and grace: ${payment}`, () => {
    const fine = math.latePenalty({ due_date: '2026-03-01', principal_cents: 458333 }, payment);
    assert.equal(fine.days, days);
    assert.equal(fine.cents, Math.round(458333 * .2 / 360 * days));
  });
test('each installment gets its own grace period and fine', () => {
  const rows = math.installmentSchedule(7500000, 2000000, 'monthly', '2026-02-01');
  const april5 = math.quoteInstallments(rows, 2, '2026-04-05');
  assert.deepEqual(clean(april5.items.map((row) => row.penalty.days)), [36, 0]);
  const april11 = math.quoteInstallments(rows, 2, '2026-04-11');
  assert.deepEqual(clean(april11.items.map((row) => row.penalty.days)), [42, 11]);
  assert.equal(april11.total_cents, april11.principal_cents + april11.penalty_cents);
  rows[0].paid_payment_id = 'paid';
  assert.equal(math.latePenalty(rows[0], '2027-04-11').cents, 0);
  assert.equal(math.quoteInstallments(rows, 1, '2026-04-11').items[0].number, 2);
});
test('leap February and December rollover', () => {
  assert.equal(math.latePenalty({ due_date: '2028-02-01', principal_cents: 100000 }, '2028-03-01').days, 30);
  assert.equal(math.installmentSchedule(7500000, 2000000, 'monthly', '2026-12-31')[0].due_date, '2027-01-01');
});
test('reject invalid money, terms and deposits', () => {
  for (const amount of ['-1', 'NaN', '1.001', '1e3', '']) assert.throws(() => math.moneyCents(amount));
  for (const frequency of ['yearly', '__proto__', 'constructor']) assert.throws(() => math.installmentSchedule(7500000, 2000000, frequency, '2026-02-01'));
  assert.throws(() => math.installmentSchedule(7500000, 1999999, 'monthly', '2026-02-01'));
  assert.throws(() => math.installmentSchedule(2000000, 2000000, 'monthly', '2026-02-01'));
  assert.throws(() => math.dateOnly('2026-02-30'));
  assert.throws(() => math.quoteInstallments([], 1, '2026-02-01'));
});
test('full membership VAT is upfront, annual family fees match the current form', () => {
  const member = { birth_date: '1990-01-01', section: 1, member_type: 7, rel_member_type: { name: 'عامل', price: 120 }, rel_members: [], membership: [] };
  const result = fees.newMembershipFees(member, prices, '2026-10-18', 7500000);
  assert.equal(result.membership_vat_cents, 1050000);
  assert.equal(result.total_cents, 1070410);
  assert.equal(2000000 + result.total_cents, 3070410);
  for (const refs of [[], [{ deleted: 0, birth_date: '1991-01-01', rel_ref: { price: 50 } }], [{ deleted: 0, birth_date: '2015-01-01', rel_ref: { price: 50 } }]]) {
    for (const section of [1, 2, 12, 14, 22, 23]) {
      const input = { ...member, section, rel_members: refs };
      const normal = h.runForm(h.root, { now: '2026-10-18T09:00:00Z', member: input });
      const actual = fees.newMembershipFees(input, prices, '2026-10-18', 7500000);
      for (const key of ['renew_fee', 'maintenance_fee', 'membership_card_fee', 'fellowship_fund_fee']) assert.equal(actual[key], Math.round(normal[key] * 100), `${section}:${refs.length}:${key}`);
    }
  }
});
test('activation begins only on settlement date through fiscal June end', () => {
  assert.equal(math.activationPeriod('2026-10-18').start_date.toISOString().slice(0, 10), '2026-10-18');
  assert.equal(math.activationPeriod('2026-10-18').end_date.toISOString().slice(0, 10), '2027-06-30');
});
test('cash session cannot be forged or reused after expiration', () => {
  const original = process.env.INSTALLMENT_SESSION_SECRET;
  process.env.INSTALLMENT_SESSION_SECRET = 'test-only-not-a-production-secret';
  try {
    const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
    const signed = token.signInstallmentSession({ id: 'cashier' }, 1000);
    assert.equal(token.readInstallmentSession(signed, 2000).id, 'cashier');
    assert.equal(token.readInstallmentSession(signed, 1000 + 8 * 3600000), null);
    assert.equal(token.readInstallmentSession(signed + 'x', 2000), null);
    assert.equal(token.readInstallmentSession('bad', 2000), null);
  } finally { if (original === undefined) delete process.env.INSTALLMENT_SESSION_SECRET; else process.env.INSTALLMENT_SESSION_SECRET = original; }
});
