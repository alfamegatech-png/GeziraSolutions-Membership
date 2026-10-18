const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const clock = h.evaluateModule(h.root, 'lib/paymentClock.js');
const math = h.evaluateModule(h.root, 'lib/newMembershipInstallments.js');
const fees = h.evaluateModule(h.root, 'lib/newMembershipInstallmentFees.js');
const settings = h.evaluateModule(h.root, 'components/MembershipPrices/priceSettingsConfig.js');
const invoiceSource = h.functionCode(fs.readFileSync('components/Members/member.js', 'utf8'), 'InvoiceWithTransaction');
let testActor;
const InvoiceWithTransaction = vm.runInNewContext(`(${invoiceSource})`, { console: { error() {} }, requireAnyPrivilege: async () => ({ user: testActor }), requireSafe: (access) => access.user.safe_no });
const api = h.evaluateModule(h.root, 'lib/newMembershipInstallmentService.js', {
  './paymentClock': clock, './newMembershipInstallments': math, './newMembershipInstallmentFees': fees,
  '@components/MembershipPrices/priceSettingsConfig': settings,
  '@components/Members/member': { InvoiceWithTransaction },
});
const guards = h.evaluateModule(h.root, 'lib/newMembershipInstallmentGuards.js');
const db = new PrismaClient();
const rollback = new Error('INTENTIONAL_TEST_ROLLBACK');
async function main() {
  const identity = await db.$queryRaw`SELECT current_database() AS name`;
  console.log('Database:', identity[0].name);
  if (process.argv.includes('--check')) return;
  assert.equal(identity[0].name, 'clubNew', 'Test is restricted to the explicitly selected database');
  const sequenceValues = () => db.$queryRaw`SELECT schemaname, sequencename, last_value FROM pg_sequences WHERE schemaname IN ('public','clubtheclub') ORDER BY schemaname, sequencename`;
  const sequencesBefore = await sequenceValues();
  const memberId = crypto.randomUUID();
  const actor = await db.users.findFirst({ where: { safe_no: { gt: 0 } }, select: { id: true, safe_no: true } });
  assert.ok(actor);
  testActor = actor;
  let serial = -1500000000;
  let ledger = -1500000000;
  let failNextLedger = false;
  try {
    await db.$transaction(async (tx) => {
      const code = 1500000000;
      await tx.members.create({ data: { id: memberId, member_code: code, name: 'ROLLBACK INSTALLMENT TEST', birth_date: new Date('1990-01-01'), section: 1, member_type: 7, suspended: '-' } });
      // Explicit negative identifiers avoid advancing real receipt/ledger sequences.
      const testDb = { accountNumbers: tx.accountNumbers, transaction_AccountNumbers: tx.transaction_AccountNumbers };
      testDb.$transaction = async (callback) => {
        await tx.$executeRaw`SAVEPOINT installment_test_operation`;
        try {
          const result = await callback(testDb);
          await tx.$executeRaw`RELEASE SAVEPOINT installment_test_operation`;
          return result;
        } catch (error) {
          await tx.$executeRaw`ROLLBACK TO SAVEPOINT installment_test_operation`;
          await tx.$executeRaw`RELEASE SAVEPOINT installment_test_operation`;
          throw error;
        }
      };
      testDb.$queryRaw = tx.$queryRaw.bind(tx);
      testDb.$executeRaw = tx.$executeRaw.bind(tx);
      testDb.members = tx.members;
      testDb.memberships = { ...tx.memberships, create: ({ data }) => tx.memberships.create({ data: { ...data, serial_no: serial++ } }) };
      testDb.transactions = { ...tx.transactions, create: ({ data }) => {
        if (failNextLedger) { failNextLedger = false; throw new Error('SIMULATED_LEDGER_FAILURE'); }
        return tx.transactions.create({ data: { ...data, Id: ledger++ } });
      } };
      const counts = async () => ({
        receipts: await tx.memberships.count({ where: { member_code: code } }),
        journals: await tx.transactions.count({ where: { Id: { gte: -1500000000, lt: -1499999000 } } }),
        payments: Number((await tx.$queryRaw`SELECT count(*) AS n FROM public.membership_installment_payments p JOIN public.membership_installment_contracts c ON c.id=p.contract_id WHERE c.member_id=${memberId}`)[0].n),
      });
      const input = { memberCode: 1500000000, price: '75000', deposit: '20000', frequency: 'monthly' };
      const application = new Date('2026-02-15T10:00:00Z');
      const preview = await api.previewContract(testDb, input, application);
      assert.equal(preview.upfront_cents, 3070410);
      const contract = await api.createContract(testDb, { ...actor, safe_no: null }, { ...input, expectedUpfrontCents: preview.upfront_cents }, application);
      let detail = await api.contractDetail(testDb, contract.id, application);
      assert.equal(detail.status, 'awaiting_deposit');
      assert.equal(detail.items.length, 12);
      await assert.rejects(() => guards.assertNoPendingInstallments(testDb, code));
      const deposit = await api.quotePayment(testDb, contract.id, 'deposit', 0, application);
      const key = crypto.randomUUID();
      const paid = await api.collectPayment(testDb, actor, { contractId: contract.id, kind: 'deposit', expectedTotalCents: deposit.total_cents, requestKey: key }, application);
      const afterDeposit = await counts();
      const repeated = await api.collectPayment(testDb, actor, { contractId: contract.id, kind: 'deposit', expectedTotalCents: deposit.total_cents, requestKey: key }, application);
      assert.equal(repeated.paymentId, paid.paymentId);
      assert.deepEqual(await counts(), afterDeposit, 'retry after lost response must not create another receipt or journal');
      await assert.rejects(() => api.collectPayment(testDb, actor, { contractId: contract.id, kind: 'deposit', expectedTotalCents: deposit.total_cents, requestKey: crypto.randomUUID() }, application));
      assert.deepEqual(await counts(), afterDeposit);
      detail = await api.contractDetail(testDb, contract.id, application);
      assert.equal(detail.status, 'pending');
      assert.equal(detail.payments.length, 1);
      const depositReceipt = await tx.memberships.findUnique({ where: { id: detail.payments[0].receipt_id } });
      assert.equal(depositReceipt.value_added_tax, 10509.1);
      assert.equal(depositReceipt.start_date, null);
      const payDate = new Date('2026-04-11T10:00:00Z');
      const quote = await api.quotePayment(testDb, contract.id, 'installment', 2, payDate);
      assert.deepEqual(JSON.parse(JSON.stringify(quote.items.map((item) => item.penalty.days))), [42, 11]);
      await assert.rejects(() => api.collectPayment(testDb, actor, { contractId: contract.id, kind: 'installment', count: 2, expectedNumbers: [2, 3], expectedTotalCents: quote.total_cents, requestKey: crypto.randomUUID() }, payDate));
      const partInput = { contractId: contract.id, kind: 'installment', count: 2, expectedNumbers: [1, 2], expectedTotalCents: quote.total_cents, requestKey: crypto.randomUUID() };
      failNextLedger = true;
      await assert.rejects(() => api.collectPayment(testDb, actor, partInput, payDate));
      assert.deepEqual(await counts(), afterDeposit, 'financial failure rolls back receipt, payment and ledger');
      const afterFailure = await api.contractDetail(testDb, contract.id, payDate);
      assert.equal(afterFailure.status, 'pending');
      assert.equal(afterFailure.items.filter(item => item.paid_payment_id).length, 0);
      const part = await api.collectPayment(testDb, actor, partInput, payDate);
      const afterPart = await counts();
      assert.equal((await api.collectPayment(testDb, actor, partInput, payDate)).paymentId, part.paymentId);
      assert.deepEqual(await counts(), afterPart);
      await assert.rejects(() => api.collectPayment(testDb, actor, { ...partInput, requestKey: crypto.randomUUID() }, payDate));
      assert.deepEqual(await counts(), afterPart);
      assert.equal((await api.contractDetail(testDb, contract.id, payDate)).status, 'pending');
      await assert.rejects(() => api.voidPayment(testDb, actor, contract.id, paid.paymentId, 'test cancellation', payDate));
      const finalDate = new Date('2027-04-11T10:00:00Z');
      const finalQuote = await api.quotePayment(testDb, contract.id, 'installment', 10, finalDate);
      assert.ok(finalQuote.penalty_cents > 0);
      const finalInput = { contractId: contract.id, kind: 'installment', count: 10, expectedNumbers: finalQuote.items.map((item) => item.number), expectedTotalCents: finalQuote.total_cents, requestKey: crypto.randomUUID() };
      await assert.rejects(() => api.collectPayment(testDb, actor, { ...finalInput, expectedTotalCents: finalQuote.principal_cents }, finalDate));
      assert.deepEqual(await counts(), afterPart, 'principal without fines must not be accepted');
      assert.equal((await api.contractDetail(testDb, contract.id, finalDate)).status, 'pending');
      const final = await api.collectPayment(testDb, actor, finalInput, finalDate);
      const afterFinal = await counts();
      assert.equal((await api.collectPayment(testDb, actor, finalInput, finalDate)).paymentId, final.paymentId);
      assert.deepEqual(await counts(), afterFinal);
      detail = await api.contractDetail(testDb, contract.id, finalDate);
      assert.equal(detail.status, 'active');
      assert.equal(detail.outstanding_cents, 0);
      assert.equal(detail.outstanding_penalty_cents, 0);
      assert.ok(detail.items.every(item => item.paid_payment_id));
      const finalPayment = detail.payments.find(payment => payment.id === final.paymentId);
      assert.equal(finalPayment.penalty_cents, finalQuote.penalty_cents);
      assert.equal(finalPayment.amount_cents, finalQuote.total_cents);
      await guards.assertNoPendingInstallments(testDb, code);
      const posted = await tx.memberships.findMany({ where: { member_code: code } });
      assert.equal(posted.filter((row) => row.status === 1).length, 1);
      assert.equal(posted.reduce((sum, row) => sum + Math.round(row.installment * 100), 0), 7500000);
      for (const row of posted) {
        const journal = await tx.transactions.findFirst({ where: { ReceiptNumber: row.serial_no }, include: { Transaction_AccountNumbers: true } });
        assert.equal(Math.round(journal.Transaction_AccountNumbers.reduce((sum, account) => sum + account.Money, 0) * 100), Math.round(row.total_amount * 100));
      }
      await assert.rejects(() => api.voidPayment(testDb, { ...actor, safe_no: actor.safe_no + 1000 }, contract.id, final.paymentId, 'test cancellation', finalDate));
      await api.voidPayment(testDb, actor, contract.id, final.paymentId, 'test cancellation', finalDate);
      detail = await api.contractDetail(testDb, contract.id, finalDate);
      assert.equal(detail.status, 'pending');
      assert.equal(detail.outstanding_cents, finalQuote.principal_cents);
      assert.equal(detail.outstanding_penalty_cents, finalQuote.penalty_cents);
      assert.equal(detail.activated_at, null);
      const voided = await tx.memberships.findUnique({ where: { id: finalPayment.receipt_id } });
      assert.equal(voided.canceled, 1);
      assert.equal(voided.status, 4);
      assert.equal(voided.start_date, null);
      assert.equal(voided.end_date, null);
      assert.equal((await tx.transactions.findFirst({ where: { ReceiptNumber: voided.serial_no } })).Canceled, true);
      assert.equal(await tx.memberships.count({ where: { member_code: code, canceled: 0, status: 1 } }), 0);
      await assert.rejects(() => api.voidPayment(testDb, actor, contract.id, final.paymentId, 'test cancellation', finalDate));
      await guards.assertNoPendingInstallments(testDb, code).then(() => assert.fail('pending agreement should block renewal'), () => {});
      await api.voidPayment(testDb, actor, contract.id, part.paymentId, 'test cancellation', payDate);
      await api.voidPayment(testDb, actor, contract.id, paid.paymentId, 'test cancellation', payDate);
      await api.cancelContract(testDb, actor, contract.id, payDate);
      assert.equal((await api.contractDetail(testDb, contract.id, payDate)).status, 'cancelled');
      console.log('PASS: deposit, VAT, ledger balance, duplicate prevention, grace, activation, reversal and cancellation');
      throw rollback;
    }, { timeout: 60000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await db.members.findUnique({ where: { id: memberId } }), null);
  assert.equal(Number((await db.$queryRaw`SELECT count(*) AS n FROM public.membership_installment_contracts WHERE member_id=${memberId}`)[0].n), 0);
  assert.deepEqual(await sequenceValues(), sequencesBefore);
  console.log('PASS: all test writes rolled back; real receipt sequences unchanged');
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
