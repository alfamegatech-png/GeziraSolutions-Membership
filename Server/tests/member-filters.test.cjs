const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./regression/calculation-baseline/harness.cjs");
const api = h.evaluateModule(h.root, "components/LazyTable/memberFilters.js");
test("top nationality and job filters combine with type, code and existing dates", () => {
  const where = api.buildMemberWhere({ nationality: { value: 1 }, job: { value: 3 }, member_type: { value: 2 }, member_code: { value: "234272" }, birth_date: { value: "1990-01-05T00:00:00.000Z" } }, { suspended: "-" });
  assert.equal(where.AND.length, 6);
  assert.equal(where.AND[1].nationality, 1);
  assert.equal(where.AND[2].job, 3);
  assert.equal(where.AND[3].member_type, 2);
  assert.equal(where.AND[4].member_code, 234272);
  assert.equal(where.AND[5].birth_date.toISOString(), "1990-01-05T00:00:00.000Z");
});
test("search options select only real lookup names and codes", async () => {
  let queries = 0;
  const lookup = { findMany: async (options) => {
    queries++;
    assert.equal(Object.keys(options.select).sort().join(","), "code,name");
    return [{ code: 1, name: "Test" }];
  } };
  const action = h.evaluateModule(h.root, "components/LazyTable/memberSearchOptions.js", {
    "@app/api/db": { lookup_nationality: lookup, lookup_job: lookup, lookup_member_type: lookup },
  });
  const result = await action.getMemberSearchOptions();
  assert.equal(queries, 3);
  assert.equal(result.nationalities[0].code, 1);
  assert.equal(result.jobs[0].code, 1);
  assert.equal(result.memberTypes[0].code, 1);
});
test("all five member filters combine without overwriting the base conditions", () => {
  const where = api.buildMemberWhere({
    member_code: { value: 4 }, name: { value: "  test  " }, member_type: { value: "٢" },
    birth_date: { value: "1990-01-05T00:00:00.000Z" }, join_date: { value: "2020-07-08T00:00:00.000Z" },
  }, { suspended: "-" });
  assert.equal(where.AND[0].suspended, "-");
  assert.equal(where.AND[1].member_code, 4);
  assert.equal(where.AND[2].name.contains, "test");
  assert.equal(where.AND[3].member_type, 2);
  assert.equal(where.AND[4].birth_date.toISOString(), "1990-01-05T00:00:00.000Z");
  assert.equal(where.AND[5].join_date.toISOString(), "2020-07-08T00:00:00.000Z");
});
test("cleared filters are omitted, zero is kept and invalid input never broadens a search", () => {
  assert.equal(api.buildMemberWhere({ birth_date: { value: null }, name: { value: "" } }, { suspended: "-" }).suspended, "-");
  assert.equal(api.buildMemberWhere({ member_code: { value: 0 } }).AND[1].member_code, 0);
  for (const entry of [{ birth_date: { value: "invalid" } }, { member_code: { value: "1.5" } }]) {
    assert.equal(api.buildMemberWhere(entry).AND[1].id, "");
  }
});
test("member data and export use identical filters and preserve paging", async () => {
  const calls = [], counts = [];
  const actions = h.evaluateModule(h.root, "components/LazyTable/LazyTable.js", {
    "@lib/newMembershipInstallmentGuards": h.evaluateModule(h.root, "lib/newMembershipInstallmentGuards.js"),
    "@app/api/db": { members: {
      findMany: async (options) => { calls.push(options); return []; },
      count: async (options) => { counts.push(options); return 0; },
    } }, "./memberFilters": api,
  });
  const state = { first: 10, rows: 10, filters: { birth_date: { value: "1990-01-05T00:00:00.000Z" } } };
  await actions.getData("members", state, { member_code: "asc" }, {}, { suspended: "-" });
  await actions.getData("members", state, { member_code: "asc" }, {}, { suspended: "-" }, undefined, true);
  assert.equal(calls[0].take, 10); assert.equal(calls[0].skip, 10);
  assert.equal(calls[1].take, undefined); assert.equal(calls[1].skip, undefined);
  assert.deepEqual(calls[0].where, calls[1].where);
  assert.deepEqual(counts[0].where, calls[0].where);
});
test("keyboard dates accept separated, compact and Arabic dates and reject impossible dates", () => {
  const dates = h.evaluateModule(h.root, "components/LazyTable/memberDateInput.js");
  for (const text of ["08/01/1990", "08011990", "٨/١/١٩٩٠", "08-01-1990"]) {
    assert.equal(dates.parseMemberDate(text).toISOString(), "1990-01-08T00:00:00.000Z");
  }
  for (const text of ["31/02/2026", "29/02/2025", "12/", "1234", "00/01/2026"]) assert.equal(dates.parseMemberDate(text), undefined);
  assert.equal(dates.parseMemberDate(""), null);
  assert.equal(dates.formatMemberDate("1990-01-08T00:00:00.000Z"), "08/01/1990");
});
