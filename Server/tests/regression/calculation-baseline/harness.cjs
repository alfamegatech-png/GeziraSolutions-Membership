const fs = require("fs");
const path = require("path");
const vm = require("vm");
const babel = require("next/dist/compiled/babel/bundle");
const root = path.resolve(__dirname, "../../..");
const baseline = path.join(root, "docs/ui-modernization-baseline/source");
function parse(source) { return babel.parser().parse(source, { sourceType: "module", plugins: ["jsx"] }); }
function find(source, predicate) {
  let result;
  function visit(node) {
    if (!node || typeof node !== "object" || result) return;
    if (predicate(node)) { result = node; return; }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(parse(source));
  if (!result) throw new Error("Source extraction failed");
  return source.slice(result.start, result.end);
}
function functionCode(source, name) {
  return find(source, (node) => (node.type === "FunctionDeclaration" && node.id?.name === name) ||
    (node.type === "VariableDeclaration" && node.declarations.length === 1 && node.declarations[0].id.name === name));
}
function evaluateModule(base, file, mocks = {}, globals = {}) {
  mocks = { "@lib/accessControl": require("../../helpers/authorized.cjs"), ...mocks };
  const source = fs.readFileSync(path.join(base, file), "utf8");
  const code = babel.core().transformSync(source, { babelrc: false, configFile: false, presets: [babel.presetReact()], plugins: [babel.pluginTransformModulesCommonjs()] }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, process, Buffer,
    require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(require.resolve(id, { paths: [root] })),
    console: { error() {}, log() {} }, ...globals });
  return module.exports;
}
function clock(iso) {
  return class extends Date { constructor(...args) { super(...(args.length ? args : [iso])); } static now() { return new Date(iso).getTime(); } };
}
function runForm(base, input) {
  const file = input.swimming ? "components/MemberDetails/NewSwimmingForm.jsx" : "components/MemberDetails/NewMembershipForm.jsx";
  const source = fs.readFileSync(path.join(base, file), "utf8");
  const settings = evaluateModule(base, "components/MembershipPrices/priceSettingsConfig.js").DEFAULT_PRICE_SETTINGS_MAP;
  const helpers = input.swimming ? "" : ["isDifference21YearsOrMore", "roundedMoney", "isPenaltyGracePeriod", "getChargeablePenaltyYears", "getLatestYearRenewFee", "getPreviousYearRenewFee", "getRenewalBreakdown"].map((name) => functionCode(source, name)).join("\n");
  const effect = find(source, (node) => node.type === "CallExpression" && node.callee.name === "useEffect" &&
    source.slice(node.start, node.end).includes("values.member_order_date") && source.slice(node.start, node.end).includes("setFieldsValues(values)"));
  const callback = effect.slice(effect.indexOf("(") + 1, effect.lastIndexOf(", ["));
  let output;
  const sandbox = {
    Date: clock(input.now), selectedMember: structuredClone(input.member),
    price: (key) => Number(settings[key] ?? 0), totalLockerPrice: input.locker ?? 0,
    intialFields: [], setFields() {}, setFieldsValues(value) { output = value; },
    formik: { setFieldValue() {}, handleChange() {} }, localStorage: { clubUser: "fixture" },
    getStoredUser: () => ({ id: "fixture-user", safe_no: 2 }),
  };
  vm.createContext(sandbox);
  vm.runInContext(`${helpers}\n(${callback})();`, sandbox);
  if (input.change) {
    sandbox.fieldsValues = output;
    sandbox.event = { target: { id: input.change.field, value: input.change.value } };
    vm.runInContext(`${functionCode(source, "handleFileChange")}\nhandleFileChange(event);`, sandbox);
  }
  return JSON.parse(JSON.stringify(output));
}
function runReport(base, input) {
  const source = fs.readFileSync(path.join(base, "components/LazyTable/MembershipAggregationTable.jsx"), "utf8");
  const settings = evaluateModule(base, "components/MembershipPrices/priceSettingsConfig.js").DEFAULT_PRICE_SETTINGS_MAP;
  const start = source.indexOf("  const rows = data");
  const end = source.indexOf("  const columns =", start);
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(() => {${source.slice(start, end)}; return { rows, renewalReceiptCount }; })()`, {
    data: structuredClone(input.data), Date: clock(input.now),
    price: (key) => Number(settings[key] ?? 0), vatFactor: () => 1 / (1 + settings.vat_rate),
    number: (value) => { const n = Number(value); return Number.isFinite(n) ? n : 0; },
  })));
}
module.exports = { root, baseline, find, functionCode, parse, evaluateModule, clock, runForm, runReport };
