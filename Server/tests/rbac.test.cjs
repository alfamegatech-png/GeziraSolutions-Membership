const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./regression/calculation-baseline/harness.cjs');
const catalog = h.evaluateModule(h.root, 'lib/privilegeCatalog.js');
function authorization(roleCodes = [], safe = 1, ownsPrices = true) {
  let signedIn = true, tokenValid = true;
  const user = { id: 'actual-server-user', name: 'server-user', safe_no: safe };
  const db = { users: { findUnique: async ({ where }) => where.id === user.id ? user : null }, $queryRaw: async (sql) => {
    if (sql.join('').includes('access_screen_owners')) return [{ user_id: ownsPrices ? user.id : 'company-user' }];
    if (sql.join('').includes('SELECT r.code')) return catalog.ROLES.filter((role) => roleCodes.includes(role.code));
    return [...new Set(catalog.ROLES.filter((role) => roleCodes.includes(role.code)).flatMap((role) => role.privileges))].map((code) => ({ code }));
  } };
  const api = h.evaluateModule(h.root, 'lib/accessControl.js', {
    './systemLicense': { assertSystemLicense: async () => ({ remainingMs: 86400000 }) },
    './userPrivilegeOverrides': h.evaluateModule(h.root, 'lib/userPrivilegeOverrides.js'),
    'next/headers': { cookies: () => ({ get: () => signedIn ? { value: 'signed' } : undefined }) }, '@app/api/db': db,
    './installmentSessionToken': { INSTALLMENT_COOKIE: 'test', readInstallmentSession: (value) => value === 'signed' && tokenValid ? { id: user.id } : null },
  });
  return { api, user, logout: () => { signedIn = false; }, forge: () => { tokenValid = false; } };
}
test('exactly five roles, distinct privileges, all role permissions exist', () => {
  assert.equal(catalog.ROLES.length, 5);
  const codes = catalog.PRIVILEGES.map(([code]) => code);
  assert.equal(new Set(codes).size, codes.length);
  for (const role of catalog.ROLES) {
    assert.equal(new Set(role.privileges).size, role.privileges.length);
    assert.ok(role.privileges.every((code) => codes.includes(code)));
  }
});
test('deny by default: no role, absent cookie, forged cookie', async () => {
  const state = authorization();
  await assert.rejects(() => state.api.requirePrivilege('members.view'), { status: 403 });
  state.logout();
  await assert.rejects(() => state.api.getAccess(), { status: 401 });
  const forged = authorization(['system_admin']);
  forged.forge();
  await assert.rejects(() => forged.api.requirePrivilege('prices.edit'), { status: 401 });
});
test('cashier can collect but cannot change prices, cancel receipts or assign roles', async () => {
  const { api } = authorization(['cashier']);
  for (const code of ['memberships.renew', 'installments.collect', 'installments.collect_deposit']) await api.requirePrivilege(code);
  for (const code of ['prices.edit', 'receipts.cancel', 'users.roles.manage', 'reports.all_safes']) await assert.rejects(() => api.requirePrivilege(code), { status: 403 });
});
test('membership staff can create a contract without a safe; cannot collect', async () => {
  const { api } = authorization(['membership_staff'], null);
  const access = await api.requirePrivilege('installments.create');
  assert.throws(() => api.requireSafe(access), { status: 403 });
  await assert.rejects(() => api.requirePrivilege('installments.collect'), { status: 403 });
  assert.equal(api.scopeSafe(access, 999), -1);
});
test('auditor is read-only and supervisor cancels; roles union without accidental admin', async () => {
  const auditor = authorization(['auditor']).api;
  await auditor.requirePrivilege('reports.all_safes');
  await assert.rejects(() => auditor.requirePrivilege('memberships.renew'), { status: 403 });
  await assert.rejects(() => auditor.requirePrivilege('receipts.cancel'), { status: 403 });
  await authorization(['accounts_supervisor']).api.requirePrivilege('receipts.cancel');
  const combined = authorization(['cashier', 'membership_staff']).api;
  await combined.requirePrivilege('members.create'); await combined.requirePrivilege('installments.collect');
  await assert.rejects(() => combined.requirePrivilege('users.roles.manage'), { status: 403 });
});
test('safe scoping overrides a forged requested safe; generic tables cannot expose users', async () => {
  const { api } = authorization(['cashier'], 2);
  const access = await api.getAccess();
  assert.equal(api.scopeSafe(access, 99), 2);
  assert.throws(() => api.assertSafe(access, 99), { status: 403 });
  for (const table of ['users', 'user_roles', '__proto__', 'transactions']) assert.throws(() => api.tablePrivilege(table), { status: 403 });
  const safe = api.safeInclude({ member: { select: { rel_user: { select: { password: true } } } } });
  assert.equal(safe.member.select.rel_user.select.password, undefined);
  assert.equal(safe.member.select.rel_user.select.fullname, true);
});
test('server generic query rejects unauthorized mutations and scopes financial data', async () => {
  const { api } = authorization(['cashier'], 2);
  let query;
  const db = { memberships: { findMany: async (options) => { query = options; return []; }, count: async () => 0 } };
  const service = h.evaluateModule(h.root, 'components/LazyTable/LazyTable.js', { '@app/api/db': db, '@lib/accessControl': api,
    './memberFilters': {}, '@lib/newMembershipInstallmentGuards': {} });
  await assert.rejects(() => service.getData('users', {}, {}, {}, {}), { status: 403 });
  await service.getData('memberships', { filters: {}, rows: 10, first: 0 }, {}, {}, { safe_no: 999 });
  assert.equal(query.where.AND[1].safe_no, 2);
});
test('other-safe history preserves renewal dates without exposing monetary fields', async () => {
  const { api } = authorization(['cashier'], 2);
  const access = await api.getAccess();
  const date = new Date('2026-06-30');
  const member = api.scopeMemberHistory(access, { membership: [{ id: 'other', safe_no: 1, end_date: date, total_amount: 1000 }, { id: 'own', safe_no: 2, end_date: date, total_amount: 2000 }] });
  assert.equal(member.membership[0].end_date, date);
  assert.equal(member.membership[0].total_amount, undefined);
  assert.equal(member.membership[1].total_amount, 2000);
});
test('administrator permissions cover the complete catalog', async () => {
  const { api } = authorization(['system_admin']);
  for (const [code] of catalog.PRIVILEGES) await api.requirePrivilege(code);
});
test('another administrator cannot open or edit company prices, but calculation prices remain readable', async () => {
  const { api } = authorization(['system_admin'], 8, false);
  await api.requirePrivilege('prices.view');
  await api.requirePrivilege('users.roles.manage');
  await assert.rejects(() => api.requirePrivilege('prices.manage'), { status: 403 });
  await assert.rejects(() => api.requirePrivilege('prices.edit'), { status: 403 });
});
test('unauthorized server actions reject before database or file writes', async () => {
  const { api } = authorization(['auditor']);
  const noWrites = new Proxy({}, { get(target, key) { if (key === '__esModule') return false; throw new Error('Database touched before authorization'); } });
  const member = h.evaluateModule(h.root, 'components/Members/member.js', {
    '@app/api/db': noWrites, '@lib/accessControl': api, '@lib/memberLookup': {}, '@lib/phoneLookup': {},
    '@lib/separationRenewalContext': {}, '@lib/newMembershipInstallmentGuards': {}, '@lib/paymentClock': {},
    '@components/MembershipPrices/priceSettingsActions': {},
  });
  await assert.rejects(() => member.createMember('create', {}), { status: 403 });
  await assert.rejects(() => member.createRefMember('create', {}), { status: 403 });
  await assert.rejects(() => member.createMembership({}, null), { status: 403 });
  await assert.rejects(() => member.cancelReciept('receipt', 'spoofed', 'reason'), { status: 403 });
  await assert.rejects(() => member.reverse(123, 'spoofed'), { status: 403 });
});
