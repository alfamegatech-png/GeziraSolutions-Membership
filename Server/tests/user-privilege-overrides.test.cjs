const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./regression/calculation-baseline/harness.cjs');
const { resolvePrivileges, togglePrivilegeOverride } = h.evaluateModule(h.root, 'lib/userPrivilegeOverrides.js');
const plain = value => JSON.parse(JSON.stringify(value));
test('personal grant and denial do not mutate role defaults', () => {
  const base = ['members.view', 'members.create'];
  const result = resolvePrivileges(base, [{ code: 'members.create', effect: 'deny' }, { code: 'receipts.print', effect: 'allow' }]);
  assert.deepEqual(plain(result), ['members.view', 'receipts.print']);
  assert.deepEqual(base, ['members.view', 'members.create']);
  assert.deepEqual(plain(resolvePrivileges(base)), [...base].sort());
});
test('checkbox changes create minimal overrides and reset by returning to role default', () => {
  const base = ['members.view'];
  let overrides = togglePrivilegeOverride(base, [], 'members.view', false);
  assert.deepEqual(plain(overrides), [{ code: 'members.view', effect: 'deny' }]);
  overrides = togglePrivilegeOverride(base, overrides, 'members.view', true);
  assert.equal(overrides.length, 0);
  overrides = togglePrivilegeOverride(base, [], 'receipts.print', true);
  assert.equal(resolvePrivileges(base, overrides).includes('receipts.print'), true);
  assert.equal(togglePrivilegeOverride(base, overrides, 'receipts.print', false).length, 0);
});
test('company price permissions cannot be enabled by a personal grant for another user', () => {
  assert.deepEqual(plain(resolvePrivileges(['prices.view', 'prices.manage'], [{ code: 'prices.edit', effect: 'allow' }], false)), ['prices.view']);
});
test('personal exclusions survive a change to a more privileged role', () => {
  assert.equal(resolvePrivileges(['members.view', 'members.create', 'receipts.cancel'], [{ code: 'receipts.cancel', effect: 'deny' }]).includes('receipts.cancel'), false);
});
