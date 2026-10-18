const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const h = require('./regression/calculation-baseline/harness.cjs');
const { PRODUCT, nextJune, cairoDay, expiryInstant, verifyLicense } = require('../lib/licenseFormat.cjs');
const pair = crypto.generateKeyPairSync('ed25519');
const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' });
const fingerprint = 'GZR1-' + 'A'.repeat(64);
function signed(changes = {}, privateKey = pair.privateKey) {
  const payload = Buffer.from(JSON.stringify({ version: 1, product: PRODUCT, id: crypto.randomUUID(), fingerprint, issuedAt: '2026-10-19T10:00:00Z', expiresOn: '2027-06-01', ...changes }));
  return JSON.stringify({ payload: payload.toString('base64url'), signature: crypto.sign(null, payload, privateKey).toString('base64url') });
}
test('signed license works until Cairo midnight then expires, no grace or warning window', () => {
  const cutoff = expiryInstant('2027-06-01');
  const license = signed();
  assert.equal(cairoDay(new Date(cutoff - 1)), '2027-05-31');
  assert.equal(cairoDay(new Date(cutoff)), '2027-06-01');
  verifyLicense(license, publicKey, fingerprint, new Date(cutoff - 1));
  assert.throws(() => verifyLicense(license, publicKey, fingerprint, new Date(cutoff)), /EXPIRED/);
});
test('next June stays annual, including renewal on June 1', () => {
  assert.equal(nextJune(new Date('2026-05-31T10:00:00Z')), '2026-06-01');
  assert.equal(nextJune(new Date('2026-06-01T10:00:00Z')), '2027-06-01');
  assert.throws(() => verifyLicense(signed({ expiresOn: '2028-06-01' }), publicKey, fingerprint, new Date('2026-10-19T12:00:00Z')), /INVALID_LICENSE/);
});
test('copied license, tampered expiry, wrong signer and future clock are rejected', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  assert.throws(() => verifyLicense(signed(), publicKey, 'GZR1-' + 'B'.repeat(64), now), /WRONG_SERVER/);
  const tampered = JSON.parse(signed());
  const payload = JSON.parse(Buffer.from(tampered.payload, 'base64url'));
  payload.expiresOn = '2028-06-01';
  tampered.payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  assert.throws(() => verifyLicense(JSON.stringify(tampered), publicKey, fingerprint, now), /INVALID_SIGNATURE/);
  assert.throws(() => verifyLicense(signed({}, crypto.generateKeyPairSync('ed25519').privateKey), publicKey, fingerprint, now), /INVALID_SIGNATURE/);
  assert.throws(() => verifyLicense(signed(), publicKey, fingerprint, new Date('2026-10-18T00:00:00Z')), /CLOCK_INVALID/);
  for (const text of ['', '{}', 'null', 'x'.repeat(16001)]) assert.throws(() => verifyLicense(text, publicKey, fingerprint, now));
});
function licensing() {
  let rows = [], writes = 0;
  const db = { $queryRaw: async () => rows, $executeRaw: async () => { writes++; }, $transaction: async callback => callback(db) };
  const api = h.evaluateModule(h.root, 'lib/systemLicense.js', {
    fs: { readFileSync: () => publicKey },
    './licenseFormat.cjs': require('../lib/licenseFormat.cjs'),
    './serverFingerprint.cjs': { getServerFingerprint: () => fingerprint },
  });
  return { db, api, setRows: value => { rows = value; }, writes: () => writes };
}
test('missing license fails closed, rollback of clock fails closed', async () => {
  const state = licensing();
  assert.equal((await state.api.licenseStatus(state.db)).active, false);
  await assert.rejects(() => state.api.assertSystemLicense(state.db), error => error.status === 423 && error.licenseRequired);
  state.setRows([{ envelope: signed(), last_seen_at: new Date('2026-10-20T10:00:00Z') }]);
  const result = await state.api.licenseStatus(state.db, new Date('2026-10-19T12:00:00Z'));
  assert.equal(result.code, 'CLOCK_INVALID');
  assert.equal(state.writes(), 0);
});
test('only the real company identity may activate, even if someone else has an admin role', async () => {
  const state = licensing();
  await assert.rejects(() => state.api.activateLicense(state.db, { id: 'other', email: 'm.saeed@gmail.com', roles: ['system_admin'] }, signed()), error => error.status === 403);
  assert.equal(state.writes(), 0);
  assert.equal(state.api.isCompanyAccount({ email: ' Admin@gmail.com ' }), true);
});
test('all normal privileges, including company business actions, stop before role queries when unlicensed', async () => {
  let roleReads = 0;
  const db = { users: { findUnique: async () => ({ id: 'company', email: 'Admin@gmail.com' }) }, $queryRaw: async () => { roleReads++; return []; } };
  const api = h.evaluateModule(h.root, 'lib/accessControl.js', {
    '@app/api/db': db,
    'next/headers': { cookies: () => ({ get: () => ({ value: 'session' }) }) },
    './installmentSessionToken': { INSTALLMENT_COOKIE: 'fixture', readInstallmentSession: () => ({ id: 'company' }) },
    './userPrivilegeOverrides': h.evaluateModule(h.root, 'lib/userPrivilegeOverrides.js'),
    './systemLicense': { assertSystemLicense: async () => { const error = new Error('locked'); error.status = 423; throw error; } },
  });
  assert.equal((await api.getIdentity()).email, 'Admin@gmail.com');
  await assert.rejects(() => api.requirePrivilege('memberships.renew'), { status: 423 });
  await assert.rejects(() => api.requirePrivilege('users.roles.manage'), { status: 423 });
  await assert.rejects(() => api.requireAnyPrivilege(['receipts.print', 'reports.export']), { status: 423 });
  assert.equal(roleReads, 0);
});
