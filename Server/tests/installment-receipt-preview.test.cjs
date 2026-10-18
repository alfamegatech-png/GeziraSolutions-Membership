const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const h = require('./regression/calculation-baseline/harness.cjs');
const source = fs.readFileSync('components/NewMembershipInstallments/InstallmentCycle.jsx', 'utf8');
const handler = h.functionCode(source, 'showCollectedReceipt');
function setup(load) {
  const changes = {};
  const show = vm.runInNewContext(`(${handler})`, { load,
    setQuote: (value) => { changes.quote = value; }, setNotice: (value) => { changes.notice = value; },
    setMessage: (value) => { changes.message = value; }, setPaper: (value) => { changes.paper = value; } });
  return { show, changes };
}
test('successful collection opens the exact saved receipt rather than the newest unrelated payment', async () => {
  const target = { id: 'saved-payment', serial_no: 452109 };
  const { show, changes } = setup(async () => ({ ok: true, data: { payments: [{ id: 'other-payment' }, target] } }));
  await show({ paymentId: 'saved-payment' });
  assert.equal(changes.quote, null);
  assert.equal(changes.paper.payment, target);
  assert.match(changes.notice, /بنجاح/);
  assert.equal(changes.message, undefined);
});
for (const failure of ['offline', 'denied', 'missing']) test(`saved payment with ${failure} preview never prompts another payment`, async () => {
  const { show, changes } = setup(async () => {
    if (failure === 'offline') throw new Error('offline');
    return failure === 'denied' ? { ok: false } : { ok: true, data: { payments: [] } };
  });
  await show({ paymentId: 'already-saved' });
  assert.equal(changes.quote, null);
  assert.match(changes.notice, /بنجاح/);
  assert.match(changes.message, /ولا تعِد الدفع/);
  assert.equal(changes.paper, undefined);
  assert.equal(handler.includes('postPayment('), false);
});
