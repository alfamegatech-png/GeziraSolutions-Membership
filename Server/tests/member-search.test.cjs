const test = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { root, evaluateModule } = require("./regression/calculation-baseline/harness.cjs");

function setup({ code = "234272", phone = null, receipt = "", loading = false, result = { id: "member-id" }, fail = false } = {}) {
  const values = [code, phone, 42, loading, receipt];
  const lookups = [], routes = [], messages = [];
  const react = { ...React, useState: () => [values.shift(), () => {}], useEffect() {},
    useRef: () => ({ current: { show: (message) => messages.push(message) } }) };
  const { View } = evaluateModule(root, "app/club/landing/View.jsx", {
    react: { __esModule: true, default: react, ...react },
    "@lib/browserStorage": {},
    "@components/Members/memberReceiptLookup": {
      getMemberByReceiptNumber: async (value) => { lookups.push(value); return result; },
    },
    "@components/Members/member": {
      getMemberByMemberCode: async (value) => { lookups.push(value); return result; },
      getMemberByPhoneNumber: async (value) => { lookups.push(value); if (fail) throw new Error("Database unavailable"); return result; },
    },
    "next/navigation": { useRouter: () => ({ push: (url) => routes.push(url) }) },
    "primereact/progressspinner": { ProgressSpinner: () => null },
    "primereact/toast": { Toast: () => null },
  });
  function find(node, placeholder = "رقم العضوية") {
    if (node?.props?.placeholder === placeholder) return node;
    for (const child of [].concat(node?.props?.children || [])) { const found = find(child, placeholder); if (found) return found; }
  }
  const tree = View();
  const input = find(tree), phoneInput = find(tree, "رقم التيليفون");
  return { input, phoneInput, receiptInput: find(tree, "رقم الإيصال"), lookups, routes, messages };
}

test("receipt Enter opens the linked member; missing or ambiguous receipts never navigate", async () => {
  for (const result of [{ id: "receipt-member" }, null, { status: "ambiguous" }]) {
    const state = setup({ code: null, receipt: "6441778", result });
    await state.receiptInput.props.onKeyDown({ key: "Enter", preventDefault() {} });
    assert.deepEqual(state.lookups, ["6441778"]);
    assert.deepEqual(state.routes, result?.id ? ["/club/members/receipt-member"] : []);
    if (!result?.id) assert.equal(state.messages[0].severity, "warn");
  }
});

test("telephone Enter preserves leading zero and uses the telephone lookup", async () => {
  const state = setup({ code: null, phone: "01012345678" });
  assert.equal(state.phoneInput.props.type, "tel");
  assert.equal(state.phoneInput.props.id, "memberPhone");
  await state.phoneInput.props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.deepEqual(state.lookups, ["01012345678"]);
  assert.deepEqual(state.routes, ["/club/members/member-id"]);
});

test("telephone failures show a useful error instead of silently failing", async () => {
  const state = setup({ code: null, phone: "01012345678", fail: true });
  await state.phoneInput.props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(state.messages[0].severity, "error");
  assert.deepEqual(state.routes, []);
});

test("Enter uses the existing member search and navigation", async () => {
  const state = setup(); let prevented = false;
  await state.input.props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(state.lookups, [234272]);
  assert.deepEqual(state.routes, ["/club/members/member-id"]);
});

test("other keys, held Enter, IME composition and in-flight searches do not submit", async () => {
  for (const options of [{ key: "ArrowUp" }, { key: "Enter", repeat: true }, { key: "Enter", nativeEvent: { isComposing: true } }]) {
    const state = setup();
    await state.input.props.onKeyDown({ preventDefault() {}, ...options });
    assert.equal(state.lookups.length, 0);
  }
  const state = setup({ loading: true });
  await state.input.props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(state.lookups.length, 0);
});

test("empty or unknown member retains existing validation and warning", async () => {
  const empty = setup({ code: "" });
  await empty.input.props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(empty.lookups.length, 0);
  assert.equal(empty.messages[0].severity, "error");
  const missing = setup({ result: null });
  await missing.input.props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(missing.routes.length, 0);
  assert.equal(missing.messages[0].severity, "warn");
});
