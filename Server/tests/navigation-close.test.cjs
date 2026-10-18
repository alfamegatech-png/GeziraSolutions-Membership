const test = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const h = require("./regression/calculation-baseline/harness.cjs");
function setup() {
  const events = [];
  const values = ["locker-token", 2, true, false, { fullname: "Test" }];
  let index = 0;
  const react = { ...React, useEffect() {}, useState: () => {
    const state = index++;
    return [values[state], (value) => events.push({ state, value })];
  } };
  const Layout = h.evaluateModule(h.root, "app/club/layout.js", {
    react: { __esModule: true, default: react, ...react },
    "@lib/browserStorage": {},
    "@app/login/installmentSession": { closeInstallmentSession: async () => {} },
    "@components/Access/AccessButton": { AccessButton: "Button" },
    "@components/Access/AccessProvider": { __esModule: true, default: "AccessProvider", useAccess: () => ({ user: { id: "fixture", fullname: "Test", safe_no: 2 }, can: () => true }) },
    "next/navigation": { useRouter: () => ({ replace: (path) => events.push({ path }) }) },
    "primereact/button": { Button: "Button" }, "primereact/sidebar": { Sidebar: "Sidebar" },
    "primereact/card": { Card: "Card" }, "primereact/toolbar": { Toolbar: "Toolbar" },
  }, { React, window: undefined }).default;
  const buttons = [];
  function walk(node) {
    if (!node?.props) return;
    if (typeof node.type === "function") { walk(node.type(node.props)); return; }
    if (node.type === "Button" && node.props.label) buttons.push(node);
    for (const field of ["children", "footer"]) for (const child of [].concat(node.props[field] || [])) walk(child);
  }
  walk(Layout({ children: null }));
  return { buttons, events };
}
test("every navigation choice closes the sidebar before navigating, including the current screen", () => {
  const { buttons, events } = setup();
  const routes = ["/club/landing", "/club/members", "/club/suspendedMembers", "/club/suspendedMembersRef", "/club/members-ref", "/club/memberships", "/club/dailyLockersRevenues", "/club/new-membership-installments", "/club/membership-prices", "/club/user-roles", "/club/security-audit", "/club/installments"];
  const navigation = buttons.filter((button) => button.props.label !== "تسجيل خروج");
  assert.equal(navigation.length, routes.length);
  navigation.forEach((button, index) => {
    events.length = 0;
    button.props.onClick();
    assert.deepEqual(events[0], { state: 2, value: false });
    assert.equal(events.find((event) => event.path)?.path, routes[index]);
  });
});
