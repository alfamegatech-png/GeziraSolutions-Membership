const test = require("node:test");
const assert = require("node:assert/strict");
process.env.TZ = "Africa/Cairo";
const h = require("./regression/calculation-baseline/harness.cjs");
const contextApi = h.evaluateModule(h.root, "lib/separationRenewalContext.js");
function member(context, membership = []) {
  return { id: "separated", member_code: 900001, birth_date: "1990-01-01", section: 1,
    rel_member_type: { name: "عضو عامل", price: 120 }, rel_members: [], membership,
    separationRenewalContext: context };
}
for (const [years, end, previous, cards, maintenance, penalty, total] of [
  [1, "2026-06-30", 0, 15, 50, 0, 774.1],
  [2, "2025-06-30", 100, 20, 100, 24, 960.8],
  [3, "2024-06-30", 200, 25, 150, 84, 1183.5],
]) test(`${years} inherited years in grace: old/new rates, cumulative penalty, VAT and separation fee`, () => {
  const result = h.runForm(h.root, { now: "2026-10-17T09:00:00Z", member: member({ lastMembershipEndDate: end }), change: { field: "transfer_separation_fee", value: "500" } });
  assert.equal(result.renew_years, years);
  assert.equal(result.renew_fee, 120);
  assert.equal(result.prev_years_fee, previous);
  assert.equal(result.membership_card_fee, cards);
  assert.equal(result.maintenance_fee, maintenance);
  assert.equal(result.delay_penalty, penalty);
  assert.equal(result.transfer_separation_fee, "500");
  assert.equal(result.value_added_tax, Number(((cards + maintenance + 500) * .14).toFixed(2)));
  assert.equal(Number(result.total_amount.toFixed(2)), total);
});

test("three inherited years after grace add the third penalty; own renewal takes priority", () => {
  const context = { lastMembershipEndDate: "2024-06-30" };
  const result = h.runForm(h.root, { now: "2027-01-01T09:00:00Z", member: member(context), change: { field: "transfer_separation_fee", value: "500" } });
  assert.equal(result.renew_years, 3);
  assert.equal(result.delay_penalty, 168);
  assert.equal(Number(result.total_amount.toFixed(2)), 1267.5);
  const own = h.runForm(h.root, { now: "2027-07-01T09:00:00Z", member: member(context, [{ end_date: "2027-06-30" }]) });
  assert.equal(own.renew_years, 1);
  assert.equal(own.delay_penalty, 0);
});

for (const [now, end, penalty] of [
  ["2026-06-30T20:59:59Z", "2023-06-30", 168],
  ["2026-06-30T21:00:00Z", "2024-06-30", 84],
  ["2026-12-31T21:59:59Z", "2024-06-30", 84],
  ["2026-12-31T22:00:00Z", "2024-06-30", 168],
]) test(`inherited arrears respect grace-period boundary at ${now}`, () => {
  const result = h.runForm(h.root, { now, member: member({ lastMembershipEndDate: end }) });
  assert.equal(result.renew_years, 3);
  assert.equal(result.delay_penalty, penalty);
});

test("snapshot is stable even when the original family has since renewed", async () => {
  const snapshot = { sourceMemberCode: 4, lastMembershipEndDate: "2024-06-30T00:00:00.000Z" };
  const context = await contextApi.getSeparationRenewalContext({
    members_ref: { findUnique: async () => ({ member_code: 4, deleted: 1 }) },
    history: { findFirst: async () => ({ last_values: [{ field: "separation_renewal_context", value: { to: snapshot } }] }) },
    memberships: { findFirst: async () => { throw new Error("Must use snapshot, not current parent membership"); } },
  }, member(null));
  assert.deepEqual(context, snapshot);
});

test("legacy separation uses original family receipts at separation time, excluding secondary/cancelled receipts", async () => {
  const separatedAt = new Date("2026-10-01T09:00:00Z"); let query;
  const context = await contextApi.getSeparationRenewalContext({
    members_ref: { findUnique: async () => ({ member_code: 4, deleted: 1 }) },
    history: { findFirst: async () => ({ time: separatedAt, last_values: [] }) },
    memberships: { findFirst: async (options) => { query = options; return { end_date: new Date("2024-06-30") }; } },
  }, member(null));
  assert.equal(context.sourceMemberCode, 4);
  assert.equal(context.lastMembershipEndDate, "2024-06-30T00:00:00.000Z");
  assert.equal(query.where.canceled, 0);
  assert.equal(query.where.secondary, 0);
  assert.equal(query.where.OR[0].member_order_time.lte, separatedAt);
});

test("inherited debt stops after the first independent renewal, not after swimming or cancelled receipts", async () => {
  const paid = member(null, [{ canceled: 0, secondary: 0, start_date: "2026-07-01", end_date: "2027-06-30" }]);
  assert.equal(await contextApi.getSeparationRenewalContext({}, paid), null);
  let queried = false;
  const unpaid = member(null, [{ canceled: 1, secondary: 0, start_date: "2026-07-01", end_date: "2027-06-30" }, { canceled: 0, secondary: 0, start_date: null, end_date: null }]);
  assert.equal(await contextApi.getSeparationRenewalContext({ members_ref: { findUnique: async () => { queried = true; return null; } } }, unpaid), null);
  assert.equal(queried, true);
});

function separationApplication({ failHistory = false } = {}) {
  let committed = null;
  const db = { $transaction: async (callback) => {
    const staged = { members: [], history: [], deleted: false };
    const tx = {
      $queryRaw: async () => [],
      members_ref: { findUnique: async () => ({ id: "ref", member_code: 4, serial_no: 1, deleted: 0, name: "Test", sex: 1, birth_date: new Date("1990-01-01"), remark: null, join_date: null, user_id: "creator" }), update: async () => { staged.deleted = true; } },
      memberships: { findFirst: async () => ({ end_date: new Date("2024-06-30") }) },
      members: { aggregate: async () => ({ _max: { member_code: 100 } }), create: async ({ data }) => { staged.members.push(data); return data; } },
      history: { create: async ({ data }) => { if (failHistory) throw new Error("History failed"); staged.history.push(data); return data; } },
    };
    const result = await callback(tx); committed = staged; return result;
  } };
  const api = h.evaluateModule(h.root, "components/Members/member.js", {
    "@app/api/db": db,
    "@lib/memberLookup": h.evaluateModule(h.root, "lib/memberLookup.js"),
    "@lib/phoneLookup": h.evaluateModule(h.root, "lib/phoneLookup.js"),
    "@lib/separationRenewalContext": contextApi,
    "@lib/newMembershipInstallmentGuards": h.evaluateModule(h.root, "lib/newMembershipInstallmentGuards.js"),
    "@lib/paymentClock": h.evaluateModule(h.root, "lib/paymentClock.js"),
    "@components/MembershipPrices/priceSettingsActions": {},
    fs: { readFile() {}, constants: { F_OK: 0 }, access: (path, flag, callback) => callback(new Error("no image")) },
  });
  return { api, committed: () => committed };
}
test("separation atomically saves the parent snapshot without creating receipts or charging legacy separation fees", async () => {
  const app = separationApplication();
  const result = await app.api.seperateMember("ref", 999, "operator", 2);
  assert.equal(result.status, "success");
  assert.equal(result.data.member_code, 101);
  const writes = app.committed();
  assert.equal(writes.deleted, true);
  assert.equal(writes.history.length, 2);
  const snapshot = writes.history[0].last_values.find((entry) => entry.field === "separation_renewal_context").value.to;
  assert.equal(snapshot.sourceMemberCode, 4);
  assert.equal(snapshot.lastMembershipEndDate, "2024-06-30T00:00:00.000Z");
});
test("failed separation history rolls back instead of creating a member with lost debt", async () => {
  const app = separationApplication({ failHistory: true });
  assert.equal((await app.api.seperateMember("ref", 0, "operator", 2)).status, "error");
  assert.equal(app.committed(), null);
});
