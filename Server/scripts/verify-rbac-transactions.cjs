const assert = require('node:assert/strict');
const crypto = require('node:crypto');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
class AccessError extends Error { constructor(message) { super(message); this.status = 403; } }
const { assignRoles, readAdministration } = h.evaluateModule(h.root, 'lib/roleAdministration.js', { './accessControl': { AccessError } });
const db = new PrismaClient();
const rollback = new Error('ROLLBACK_RBAC_TEST');
async function main() {
  const admin = await db.users.findUnique({ where: { email: 'm.saeed@gmail.com' }, select: { id: true } });
  const fixture = crypto.randomUUID();
  const company = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true } });
  const before = await db.$queryRaw`SELECT COUNT(*)::int AS count FROM public.security_audit`;
  try {
    await db.$transaction(async (tx) => {
      const testDb = { users: tx.users, $queryRaw: tx.$queryRaw.bind(tx), $executeRaw: tx.$executeRaw.bind(tx) };
      testDb.$transaction = (fn) => fn(testDb);
      assert.equal((await readAdministration(testDb, 'Admin@gmail.com')).users.length, 0);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: company.id, roles: [], expectedRoles: ['system_admin'], reason: 'protected company account test' }), /حساب الشركة محمي/);
      await assert.rejects(() => assignRoles(testDb, company, { userId: company.id, roles: ['system_admin'], expectedRoles: ['system_admin'], overrides: [{ code: 'users.roles.manage', effect: 'deny' }], expectedOverrides: [], reason: 'protected company self change test' }), /حساب الشركة محمي/);
      await tx.users.create({ data: { id: fixture, name: 'RBAC-ROLLBACK-' + fixture, email: fixture + '@test.invalid', fullname: 'RBAC rollback fixture', national_id: '', password: crypto.randomBytes(32).toString('hex'), safe_no: 1 } });
      // Isolate the last-admin condition inside this rolled-back transaction only.
      await tx.$executeRaw`DELETE FROM public.user_roles WHERE role_code='system_admin' AND user_id<>${admin.id}`;
      await assert.rejects(() => assignRoles(testDb, admin, { userId: admin.id, roles: [], expectedRoles: ['system_admin'], reason: 'last administrator test' }), /آخر مدير/);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: admin.id, roles: ['system_admin'], expectedRoles: ['system_admin'], overrides: [{ code: 'users.roles.manage', effect: 'deny' }], expectedOverrides: [], reason: 'last administrator override test' }), /آخر مدير/);
      await assignRoles(testDb, admin, { userId: fixture, roles: ['cashier'], expectedRoles: [], reason: 'cashier test assignment' });
      await assert.rejects(() => assignRoles(testDb, { id: fixture }, { userId: fixture, roles: ['system_admin'], expectedRoles: ['cashier'], reason: 'forged administrator test' }), /صلاحية/);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: fixture, roles: ['auditor'], expectedRoles: [], reason: 'stale data test' }), /مستخدم آخر/);
      await assignRoles(testDb, admin, { userId: fixture, roles: ['auditor', 'membership_staff'], expectedRoles: ['cashier'], reason: 'multiple roles test' });
      const data = await readAdministration(testDb, 'RBAC-ROLLBACK-' + fixture);
      assert.equal(data.users.length, 1);
      assert.equal(data.users[0].password, undefined);
      assert.equal(data.roles.length, 5);
      assert.deepEqual(JSON.parse(JSON.stringify(data.users[0].roles)).sort(), ['auditor', 'membership_staff']);
      const logs = await tx.$queryRaw`SELECT action,before_value,after_value FROM public.security_audit WHERE target_id=${fixture} ORDER BY created_at,id`;
      assert.equal(logs.length, 2);
      assert.ok(logs.every((row) => row.action === 'user_roles.changed'));
      const custom = [{ code: 'members.create', effect: 'deny' }, { code: 'receipts.cancel', effect: 'allow' }];
      await assignRoles(testDb, admin, { userId: fixture, roles: ['auditor', 'membership_staff'], expectedRoles: ['auditor', 'membership_staff'], overrides: custom, expectedOverrides: [], reason: 'individual permissions test' });
      const customData = await readAdministration(testDb, 'RBAC-ROLLBACK-' + fixture);
      assert.equal(customData.users[0].overrides.length, 2);
      assert.equal(customData.privileges.length, 37);
      const helpers = h.evaluateModule(h.root, 'lib/userPrivilegeOverrides.js');
      const access = h.evaluateModule(h.root, 'lib/accessControl.js', {
        './systemLicense': { assertSystemLicense: async () => ({ remainingMs: 86400000 }) },
        '@app/api/db': testDb,
        'next/headers': { cookies: () => ({ get: () => ({ value: 'signed-test-session' }) }) },
        './installmentSessionToken': { INSTALLMENT_COOKIE: 'fixture', readInstallmentSession: () => ({ id: fixture }) },
        './userPrivilegeOverrides': helpers,
      });
      await access.requirePrivilege('receipts.cancel');
      await assert.rejects(() => access.requirePrivilege('members.create'), { status: 403 });
      assert.equal((await access.getAccess()).privileges.includes('prices.edit'), false);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: fixture, roles: ['cashier'], expectedRoles: ['auditor', 'membership_staff'], overrides: [], expectedOverrides: [], reason: 'stale overrides test' }), /مستخدم آخر/);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: fixture, roles: ['auditor', 'membership_staff'], expectedRoles: ['auditor', 'membership_staff'], overrides: [{ code: 'prices.edit', effect: 'allow' }], expectedOverrides: custom, reason: 'company price policy test' }), /الشركة/);
      await assert.rejects(() => assignRoles(testDb, admin, { userId: fixture, roles: ['auditor', 'membership_staff'], expectedRoles: ['auditor', 'membership_staff'], overrides: [{ code: 'invented.permission', effect: 'allow' }], expectedOverrides: custom, reason: 'unknown permission test' }), /غير معروفة/);
      await assignRoles(testDb, admin, { userId: fixture, roles: ['membership_staff'], expectedRoles: ['auditor', 'membership_staff'], overrides: [], expectedOverrides: custom, reason: 'restore role defaults test' });
      await access.requirePrivilege('members.create');
      await assert.rejects(() => access.requirePrivilege('receipts.cancel'), { status: 403 });
      const customLogs = await tx.$queryRaw`SELECT before_value,after_value FROM public.security_audit WHERE target_id=${fixture} AND action='user_access.changed'`;
      assert.equal(customLogs.length, 2);
      assert.ok(customLogs.some(row => row.after_value.overrides.length === 2));
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await db.users.findUnique({ where: { id: fixture } }), null);
  assert.equal((await db.$queryRaw`SELECT COUNT(*)::int AS count FROM public.security_audit`)[0].count, before[0].count);
  console.log('PASS: assignments, individual grants/denials enforced on server, reset, audit, last-admin override protection, company-price policy, stale-write and escalation rejection; all test writes rolled back');
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
