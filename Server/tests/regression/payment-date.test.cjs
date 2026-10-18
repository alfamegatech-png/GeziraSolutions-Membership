const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./calculation-baseline/harness.cjs");
const clock = h.evaluateModule(h.root, "lib/paymentClock.js");

for (const [instant, day] of [
  ["2026-07-05T20:59:59.999Z", "2026-07-05"],
  ["2026-07-05T21:00:00.000Z", "2026-07-06"],
  ["2026-01-05T21:59:59.999Z", "2026-01-05"],
  ["2026-01-05T22:00:00.000Z", "2026-01-06"],
  ["2026-12-31T22:00:00.000Z", "2027-01-01"],
  ["2028-02-28T22:00:00.000Z", "2028-02-29"],
]) test(`Cairo date at ${instant}`, () => {
  const result = clock.getPaymentClock(new Date(instant));
  assert.equal(result.instant.toISOString(), instant);
  assert.equal(result.receiptDate.toISOString(), `${day}T00:00:00.000Z`);
});

function application(base, instant, extra = {}) {
  const writes = { memberships: [], transactions: [], accounts: [], lockers: [] };
  const tx = {
    $queryRaw: async () => [],
    BookingLockers: { findFirst: async ({ where }) => where.Id ? { Id: where.Id, ReceiptNumber: 700 + where.Id, Price: 114, Tax: 14, PriceWithoutTax: 100 } : null,
      update: async ({ data }) => { writes.lockers.push(data); return data; } },
    memberships: { create: async ({ data }) => { writes.memberships.push(data); return { id: "saved", serial_no: 123, ...data }; } },
    transactions: { findFirst: async () => null, create: async ({ data }) => { writes.transactions.push(data); return { Id: writes.transactions.length, ...data }; } },
    accountNumbers: { findUnique: async ({ where }) => ({ Id: where.Id }) },
    transaction_AccountNumbers: { create: async ({ data }) => { writes.accounts.push(data); return data; } },
    MembershipBookingLocker: { create: async () => ({}) },
  };
  const env = {};
  ["membership_card_fee", "maintenance_fee", "renew_fee", "fellowship_fund", "delay_penalty", "swimming", "value_added_tax", "join_fee", "installment", "prev_years_fee", "seperate_fees", "new_ref_fees", "value_added_tax_swim", "first_time_fee"].forEach((name, index) => { env[`${name}_ACCOUNT`] = String(index + 1); });
  env.Tax = "15"; env.Locker = "16";
  const FixedDate = h.clock(instant);
  const paymentClock = h.evaluateModule(h.root, "lib/paymentClock.js", {}, { Date: FixedDate });
  const api = h.evaluateModule(base, "components/Members/member.js", {
    "@app/api/db": { $transaction: (callback) => callback(tx), memberships: { findMany: async (query) => { writes.query = query; return []; } } },
    "@lib/memberLookup": h.evaluateModule(h.root, "lib/memberLookup.js"),
    "@lib/phoneLookup": h.evaluateModule(h.root, "lib/phoneLookup.js"),
    "@lib/separationRenewalContext": h.evaluateModule(h.root, "lib/separationRenewalContext.js"),
    "@lib/newMembershipInstallmentGuards": h.evaluateModule(h.root, "lib/newMembershipInstallmentGuards.js"),
    "@lib/paymentClock": paymentClock,
    "@components/MembershipPrices/priceSettingsActions": { getMembershipPriceSettingsMap: async () => ({ vat_rate: .14 }) },
  }, { Date: FixedDate, process: { env }, ...extra });
  return { api, writes };
}
const payload = { member_code: 900001, user_id: "fixture", safe_no: 2,
  member_order_date: new Date("2000-01-01"), member_order_time: new Date("2000-01-01"),
  renew_fee: 120, maintenance_fee: 50, membership_card_fee: 15, fellowship_fund_fee: 10, value_added_tax: 9.1, total_amount: 204.1 };

test("authenticated operator and safe override spoofed payment identities", async () => {
  const { api, writes } = application(h.root, "2026-10-18T09:00:00Z");
  const result = await api.createMembership({ ...payload, user_id: "forged-user", safe_no: 999 }, null);
  assert.equal(result.status, "success");
  assert.equal(writes.memberships[0].user_id, "fixture");
  assert.equal(writes.memberships[0].safe_no, 2);
  assert.equal(writes.transactions[0].CreateByMembershipUser, "fixture");
  assert.equal(writes.transactions[0].SafeNumber, "2");
});
test("single-argument swimming/dependent receipts do not accidentally trigger locker collection", async () => {
  const { api, writes } = application(h.root, "2026-10-18T09:00:00Z");
  const result = await api.createMembership({ ...payload });
  assert.equal(result.status, "success");
  assert.equal(writes.memberships.length, 1);
  assert.equal(writes.lockers.length, 0);
});

test("server save overrides stale/browser dates; ledger shares one instant; finances match original", async () => {
  const instant = "2026-09-17T21:00:01.123Z";
  const original = application(h.baseline, instant);
  const current = application(h.root, instant);
  const before = await original.api.createMembership({ ...payload }, null);
  const after = await current.api.createMembership({ ...payload }, null);
  assert.equal(before.status, "success"); assert.equal(after.status, "success");
  const saved = current.writes.memberships[0];
  assert.equal(saved.member_order_date.toISOString(), "2026-09-18T00:00:00.000Z");
  assert.equal(saved.member_order_time.toISOString(), instant);
  assert.equal(current.writes.transactions[0].CreateAt.toISOString(), instant);
  assert.equal(after.data.invoice.CreatedAt.toISOString(), instant);
  const financial = ({ member_order_date, member_order_time, ...rest }) => JSON.parse(JSON.stringify(rest));
  assert.deepEqual(financial(saved), financial(original.writes.memberships[0]));
  assert.deepEqual(JSON.parse(JSON.stringify(current.writes.accounts)), JSON.parse(JSON.stringify(original.writes.accounts)));
  assert.equal(after.data.invoice.TotalDebit, before.data.invoice.TotalDebit);
  assert.equal(after.data.invoice.TotalCredit, before.data.invoice.TotalCredit);
});

test("today receipts use Cairo calendar date rather than server-local timestamp boundaries", async () => {
  const { api, writes } = application(h.root, "2026-07-05T21:00:00.000Z");
  await api.getMembershipsCreatedTodayByMemberCode(4);
  assert.equal(writes.query.where.AND[0].member_order_date.toISOString(), "2026-07-06T00:00:00.000Z");
  assert.equal(writes.query.where.AND[1].member_code, 4);
});

test("optional locker payments and their ledgers use the membership save instant", async () => {
  const instant = "2026-07-05T21:00:00.000Z";
  const { api, writes } = application(h.root, instant);
  const result = await api.createMembership({ ...payload }, [1, 2], "8", 2);
  assert.equal(result.status, "success");
  assert.equal(writes.transactions.length, 3);
  writes.transactions.forEach((row) => assert.equal(row.CreateAt.toISOString(), instant));
  writes.lockers.forEach((row) => assert.equal(row.PaymentDate.toISOString(), instant));
});

test("credit/debit mismatch still fails, without persisting any ledger row in the mock", async () => {
  for (const base of [h.baseline, h.root]) {
    const { api, writes } = application(base, "2026-09-17T12:00:00Z");
    const result = await api.createMembership({ ...payload, total_amount: 999 }, null);
    assert.equal(result.status, "error");
    assert.match(result.message, /sum of credits does not equal the debit/);
    assert.equal(writes.transactions.length, 0);
  }
});

for (const [end, instant, expected] of [
  ["2025-06-30", "2026-10-17T09:00:00Z", 960.8],
  ["2024-06-30", "2026-10-17T09:00:00Z", 1183.5],
  ["2024-06-30", "2027-01-01T09:00:00Z", 1267.5],
]) test(`separated member invoice balances inherited arrears and separation VAT: ${end}, ${instant}`, async () => {
  const values = h.runForm(h.root, { now: instant, member: {
    id: "separated", member_code: 900001, birth_date: "1990-01-01", section: 1,
    rel_member_type: { name: "عضو عامل", price: 120 }, rel_members: [], membership: [],
    separationRenewalContext: { lastMembershipEndDate: end },
  }, change: { field: "transfer_separation_fee", value: "500" } });
  const { api, writes } = application(h.root, instant);
  const result = await api.createMembership({ ...values, transfer_separation_fee: 500,
    start_date: new Date(values.start_date), end_date: new Date(values.end_date),
  }, null);
  assert.equal(result.status, "success", result.message);
  assert.equal(Number(result.data.invoice.TotalDebit.toFixed(2)), expected);
  assert.equal(Number(result.data.invoice.TotalCredit.toFixed(2)), expected);
  assert.equal(writes.memberships[0].renew_years, values.renew_years);
  assert.equal(writes.memberships[0].prev_years_fee, values.prev_years_fee);
  assert.equal(writes.memberships[0].delay_penalty, values.delay_penalty);
  assert.equal(writes.memberships[0].transfer_separation_fee, 500);
});
