const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./regression/calculation-baseline/harness.cjs");
function setup(rows = [{ member: { id: "member" } }]) {
  const queries = [];
  const api = h.evaluateModule(h.root, "components/Members/memberReceiptLookup.js", {
    "@app/api/db": { memberships: { findMany: async (query) => { queries.push(query); return rows; } } },
  });
  return { ...api, queries };
}
test("receipt search validates numbers before querying and supports Arabic digits", async () => {
  const api = setup();
  for (const value of [null, "", 0, -1, "123x", "12.5", "2147483648"]) assert.equal(await api.getMemberByReceiptNumber(value), null);
  assert.equal(api.queries.length, 0);
  assert.equal((await api.getMemberByReceiptNumber(" ٦٤٤١٧٧٨ ")).id, "member");
  assert.equal(api.queries[0].where.serial_no, 6441778);
  assert.equal(api.queries[0].select.member.select.id, true);
  assert.equal(api.queries[0].distinct[0], "member_code");
  assert.equal(api.queries[0].take, 2);
});
test("missing receipt returns null and conflicting member codes are explicitly ambiguous", async () => {
  assert.equal(await setup([]).getMemberByReceiptNumber("123"), null);
  assert.equal((await setup([{ member: { id: "a" } }, { member: { id: "b" } }]).getMemberByReceiptNumber("123")).status, "ambiguous");
});
