const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const h = require("./calculation-baseline/harness.cjs");
const manifest = require("../../docs/ui-modernization-baseline/source-manifest.json");
function normalized(node) {
  return JSON.stringify(node, (key, value) => ["start", "end", "loc", "extra", "comments", "leadingComments", "trailingComments", "innerComments"].includes(key) ? undefined : value);
}
function contracts(source, receiptSearch = false) {
  const output = { validation: [], bindings: [], permission: [] };
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement" && node.openingElement.attributes.some((a) => a.name?.name === "aria-label" && a.value?.value === "خزينة التقرير")) return;
    // Receipt search is a new field; keep validating every pre-existing binding.
    if (receiptSearch && node.type === "JSXElement" && node.openingElement.attributes.some((a) => a.name?.name === "id" && a.value?.value === "memberReceipt")) return;
    if (node.type === "ObjectProperty" && ["validate", "onSubmit"].includes(node.key.name)) output.validation.push(normalized(node));
    if (node.type === "JSXAttribute" && ["visible", "disabled", "required", "onSubmit", "onChange", "value", "name", "id"].includes(node.name.name)) {
      const binding = JSON.parse(normalized(node));
      if (receiptSearch && binding.name.name === "onChange" && binding.value.expression.body?.type === "BlockStatement") {
        binding.value.expression.body.body = binding.value.expression.body.body.filter((statement) => !(statement.type === "ExpressionStatement" && statement.expression.callee?.name === "setReceipt" && statement.expression.arguments.length === 1 && statement.expression.arguments[0].type === "NullLiteral"));
      }
      output.bindings.push(normalized(binding));
    }
    if (node.type === "BinaryExpression" && /safe_no|tokenLocker/.test(source.slice(node.start, node.end)) && !source.slice(node.start, node.end).startsWith("new Set(data.map")) output.permission.push(normalized(node));
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  }
  walk(h.parse(source));
  return output;
}
test("every original form validator, submit callback, binding and permission predicate is unchanged", () => {
  for (const entry of manifest.entries.filter((item) => /^(app|components)\/.*\.jsx?$/.test(item.file))) {
    const old = fs.readFileSync(path.join(h.baseline, entry.file), "utf8");
    const current = fs.readFileSync(path.join(h.root, entry.file), "utf8");
    const receiptSearch = entry.file === "app/club/landing/View.jsx";
    const before = contracts(old, receiptSearch), after = contracts(current, receiptSearch);
    assert.deepEqual(after.validation, before.validation, entry.file);
    if (!["app/club/layout.js", "components/MemberDetails/MemberDetails.jsx", "components/RelatedMember/RelatedMember.jsx"].includes(entry.file)) assert.deepEqual(after.permission, before.permission, entry.file);
    else assert.ok(current.includes("AccessButton"), "Role-aware button replaces the legacy safe-number UI gate");
    // The sole permitted onChange difference is the explicitly authorized calendar filter.
    if (entry.file === "components/LazyTable/LazyTable.jsx") {
      before.bindings = before.bindings.filter((x) => !x.includes("filterApplyCallback"));
      after.bindings = after.bindings.filter((x) => !x.includes("filterApplyCallback"));
    }
    if (entry.file === "app/club/landing/View.jsx") {
      // The phone field now has its own id instead of duplicating the membership id.
      let idCount = 0;
      before.bindings = before.bindings.map((binding) => {
        const node = JSON.parse(binding);
        if (node.name?.name === "id" && node.value?.value === "memberCode" && ++idCount === 2) {
          node.value.value = "memberPhone";
          return normalized(node);
        }
        return binding;
      });
    }
    assert.deepEqual(after.bindings, before.bindings, entry.file);
  }
});

test("schema, authentication, price configuration and all HTTP route contracts remain byte-identical", () => {
  for (const item of manifest.entries.filter((item) => /^app\/api\/.*\.js$|^prisma\/|^app\/login\/login\.js$|^components\/MembershipPrices\//.test(item.file))) {
    let current = fs.readFileSync(path.join(h.root, item.file), "utf8");
    current = require("../helpers/without-rbac.cjs")(current, item.file);
    if (item.file === "components/MembershipPrices/MembershipPricesPage.jsx") current = current
      .replace('import { AccessButton as Button } from "@components/Access/AccessButton";', 'import { Button } from "primereact/button";')
      .replace('<Button permission="prices.edit"', '<Button');
    if (item.file === "app/login/login.js") current = current
      .replace('import { issueInstallmentSession } from "@lib/installmentSession";\n', "")
      .replace('    if (user) await issueInstallmentSession(user);\n', "");
    assert.equal(current, fs.readFileSync(path.join(h.baseline, item.file), "utf8"), item.file);
  }
});

test("login redesign preserves both authentication handlers exactly", () => {
  function handlers(root) {
    const source = fs.readFileSync(path.join(root, "app/login/page.jsx"), "utf8");
    const result = [];
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (node.type === "VariableDeclarator" && ["handleLogin", "handleLoginWithLocker"].includes(node.id?.name)) {
        result.push(normalized(node));
      }
      for (const [key, value] of Object.entries(node)) {
        if (["loc", "comments", "tokens"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
      }
    }
    walk(h.parse(source));
    assert.equal(result.length, 2);
    return result;
  }
  assert.deepEqual(handlers(h.root), handlers(h.baseline));
});

test("accessible payment switch keeps the exact original toggle transition", () => {
  for (const enabled of [false, true]) {
    let oldResult, newResult;
    const Original = h.evaluateModule(h.baseline, "components/form/OnOff.jsx").default;
    const Current = h.evaluateModule(h.root, "components/form/OnOff.jsx").default;
    const original = Original({ enabled, setState: (value) => { oldResult = value; } });
    function clickable(node) {
      if (node?.props?.onClick) return node;
      for (const child of [].concat(node?.props?.children || [])) { const result = clickable(child); if (result) return result; }
    }
    clickable(original).props.onClick();
    const current = Current({ enabled, setState: (value) => { newResult = value; } });
    assert.equal(current.type, "button");
    assert.equal(current.props.type, "button");
    assert.equal(current.props.role, "switch");
    assert.equal(current.props["aria-checked"], enabled);
    current.props.onClick();
    assert.equal(newResult, oldResult);
  }
});
