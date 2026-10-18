const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const h = require("./regression/calculation-baseline/harness.cjs");
const source = fs.readFileSync(path.join(h.root, "app/login/page.jsx"), "utf8");
function setup(loading = false) {
  let calls = 0;
  const handler = vm.runInNewContext(`${h.functionCode(source, "handleLoginKeyDown")}\nhandleLoginKeyDown;`, {
    loading, handleLogin: () => { calls++; return "login-result"; },
  });
  return { handler, count: () => calls };
}
test("Enter in both login inputs invokes the existing login handler", () => {
  for (const input of ["InputText", "Password"]) {
    assert.ok(h.find(source, (n) => n.type === "JSXOpeningElement" && n.name.name === input &&
      n.attributes.some((a) => a.name?.name === "onKeyDown" && a.value.expression.name === "handleLoginKeyDown")));
  }
  const state = setup(); let prevented = false;
  assert.equal(state.handler({ key: "Enter", preventDefault() { prevented = true; } }), "login-result");
  assert.equal(prevented, true);
  assert.equal(state.count(), 1);
});
test("non-Enter, composition, held Enter and loading cannot submit", () => {
  for (const event of [{ key: "a" }, { key: "Enter", repeat: true }, { key: "Enter", nativeEvent: { isComposing: true } }]) {
    const state = setup();
    state.handler({ preventDefault() {}, ...event });
    assert.equal(state.count(), 0);
  }
  const state = setup(true);
  state.handler({ key: "Enter", preventDefault() {} });
  assert.equal(state.count(), 0);
});
