const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
process.env.TZ = "Africa/Cairo";
const h = require("./harness.cjs");
const golden = require("./golden.json");
for (const fixture of golden.cases) {
  test(fixture.id, () => {
    for (const base of [h.baseline, h.root]) {
      const execute = () => fixture.kind === "report" ? h.runReport(base, fixture.input) : h.runForm(base, fixture.input);
      if (fixture.expectedError) assert.throws(execute, { message: fixture.expectedError });
      else assert.deepEqual(execute(), fixture.expected);
    }
  });
}
test("immutable baseline hashes and unchanged financial/validation implementations", () => {
  const manifest = require(path.join(h.root, "docs/ui-modernization-baseline/source-manifest.json"));
  const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash(fs.readFileSync(path.join(__dirname, "golden.json"))), fs.readFileSync(path.join(__dirname, "golden.sha256"), "utf8").trim(), "Golden expectations changed");
  for (const item of manifest.entries) {
    assert.equal(hash(fs.readFileSync(path.join(h.baseline, item.file))), item.sha256, `Baseline altered: ${item.file}`);
  }
  const files = ["components/MemberDetails/NewMembershipForm.jsx", "components/MemberDetails/NewSwimmingForm.jsx", "components/LazyTable/MembershipAggregationTable.jsx", "components/MemberDetails/PaymentReceipt.jsx", "components/MemberDetails/MembershipReceipt.jsx", "components/LazyTable/report.js", "components/MembershipPrices/priceSettingsConfig.js", "prisma/schema.prisma", "app/login/login.js"];
  for (const file of files) {
    let current = fs.readFileSync(path.join(h.root, file), "utf8");
    current = require("../../helpers/without-rbac.cjs")(current, file);
    if (file === "components/MemberDetails/NewMembershipForm.jsx") {
      // Authorized change: only a separated member's first renewal inherits its parent's end date.
      const fallback = " || selectedMember.separationRenewalContext?.lastMembershipEndDate";
      assert.equal(current.split(fallback).length, 2);
      current = current.replace(fallback, "");
    }
    if (file === "app/login/login.js") current = current
      .replace('import { issueInstallmentSession } from "@lib/installmentSession";\n', "")
      .replace('    if (user) await issueInstallmentSession(user);\n', "");
    assert.equal(current, fs.readFileSync(path.join(h.baseline, file), "utf8"), file);
  }
  // Only the members table has new filter handling; the original financial query path is untouched.
  const queryFile = "components/LazyTable/LazyTable.js";
  const before = h.parse(fs.readFileSync(path.join(h.baseline, queryFile), "utf8")).program.body.find((n) => n.type === "ExportNamedDeclaration").declaration;
  const after = h.parse(fs.readFileSync(path.join(h.root, queryFile), "utf8")).program.body.find((n) => n.type === "ExportNamedDeclaration").declaration;
  // Explicit role checks/safe scoping are independently exercised in rbac.test.cjs.
  assert.equal(after.body.body[0].declarations[0].id.name, "access");
  assert.equal(after.body.body[1].test.name, "download");
  assert.equal(after.body.body[2].expression.right.callee.name, "safeInclude");
  assert.equal(after.body.body[3].test.right.value, "memberships");
  after.body.body.splice(0, 4);
  assert.equal(after.body.body[0].type, "IfStatement");
  assert.equal(after.body.body[0].test.left.name, "table");
  assert.equal(after.body.body[0].test.right.value, "members");
  after.body.body.shift();
  const serialized = after.body.body.at(-1).argument.properties.find((property) => property.key.name === "data").value;
  assert.equal(serialized.arguments[0].callee.property.name, "map");
  assert.equal(serialized.arguments[0].arguments[0].body.callee.name, "scopeMemberHistory");
  serialized.arguments[0] = { type: "Identifier", name: "data" };
  const normalize = (node) => JSON.stringify(node, (key, value) => ["start", "end", "loc", "extra", "comments", "leadingComments", "trailingComments", "innerComments"].includes(key) ? undefined : value);
  assert.equal(normalize(after), normalize(before), "Non-members query path changed");
});
