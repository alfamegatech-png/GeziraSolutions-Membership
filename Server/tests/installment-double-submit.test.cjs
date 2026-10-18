const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const h = require('./regression/calculation-baseline/harness.cjs');

test('rapid second confirmation cannot issue a second request while the first is pending', async () => {
  const source = fs.readFileSync('components/NewMembershipInstallments/InstallmentCycle.jsx', 'utf8');
  const inFlight = { current: false };
  const busy = [], messages = [];
  const execute = vm.runInNewContext(`(${h.functionCode(source, 'execute')})`, {
    inFlight, setBusy: value => busy.push(value), setMessage: value => messages.push(value),
  });
  let release, operations = 0, callbacks = 0;
  const pending = new Promise(resolve => { release = resolve; });
  const operation = async () => { operations++; await pending; return { ok: true, data: { paymentId: 'same-payment' } }; };
  const done = () => { callbacks++; };
  const first = execute(operation, done);
  await execute(operation, done);
  assert.equal(operations, 1);
  release();
  await first;
  assert.equal(callbacks, 1);
  assert.equal(inFlight.current, false);
  assert.deepEqual(busy, [true, false]);
});

test('network failure releases the button and does not automatically retry payment', async () => {
  const source = fs.readFileSync('components/NewMembershipInstallments/InstallmentCycle.jsx', 'utf8');
  const inFlight = { current: false };
  const messages = [];
  const execute = vm.runInNewContext(`(${h.functionCode(source, 'execute')})`, {
    inFlight, setBusy() {}, setMessage: value => messages.push(value),
  });
  let operations = 0;
  await execute(async () => { operations++; throw new Error('offline'); });
  assert.equal(operations, 1);
  assert.equal(inFlight.current, false);
  assert.ok(messages.at(-1).includes('تعذر الاتصال'));
});
