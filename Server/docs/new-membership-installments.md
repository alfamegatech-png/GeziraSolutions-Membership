# New Membership Installments

## Deployment

This is a separate lifecycle at `/club/new-membership-installments`. Existing renewal and legacy installment screens retain their calculations.

1. Back up the target database and application.
2. Confirm `DATABASE_URL` points to the intended database. The local deployment was verified against `clubNew`.
3. Apply the additive tables before starting the updated application:

```powershell
cd D:\GeziraMemberShip\Membership-GeziraNew\Server
npx prisma db execute --file scripts/apply-new-membership-installments.sql --schema prisma/schema.prisma
npm run build
npm start
```

The SQL creates three tables and their constraints/indexes. It does not update historic member, receipt or ledger data. No Prisma generation or reset is needed.

Set `INSTALLMENT_SESSION_SECRET` to a strong random secret, identical across application instances. Without this environment variable, the app creates `.runtime/installment-session.key`; preserve it across restarts/deployments and restrict filesystem access. Do not commit it. Set `INSTALLMENT_COOKIE_SECURE=true` when served exclusively over HTTPS. Users must log in again to obtain the new signed, HttpOnly cashier session. Cashier identity and safe number are reloaded from the database for every installment action.

## Workflow

- Create the unpaid member and dependents first. A previously paid membership cannot enter this new-membership cycle.
- Create a contract: manual membership price **before VAT**, principal deposit at least EGP20,000, monthly/quarterly/semiannual schedule. Saving the contract does not collect cash.
- Collect the deposit separately. Full VAT on the membership price plus current annual family renewal, maintenance, cards, fellowship and their applicable VAT are collected upfront. These extras do not reduce the financed principal.
- Example without dependents: price75,000, deposit20,000, financed55,000; upfront30,704.10 at the current120/50/15/10 annual settings and14%VAT. Changes to existing pricing settings apply to new contracts, not saved contract snapshots.
- First installment is the first day of the following month. Monthly:12 installments; quarterly:4 spaced3 months; semiannual:2 spaced6 months. Exact cents are reconciled in the last installment. Whole installments are paid oldest first; early settlement is allowed.
- Grace lasts through day10. From day11, calculate each overdue installment independently: its principal x20% /360 x actual calendar days inclusive of due date and payment date. March1 to April11 is42 days; the April1 installment separately accrues11 days. March1 to April5 is36 days while the April installment remains in grace.
- No activation, normal renewal, swimming renewal, separation or new dependents while the contract is pending. Activation occurs only after every installment and its accrued fine is paid, through the fiscal June30. A suspended member cannot be collected from.
- Receipts use the regular membership receipt sequence and accounting system. Principal uses the existing installment account; fines use the delay account; upfront fees use their existing accounts. Contract, receipt, allocations and ledger are written in one transaction. Reports include the normal receipt fields; the dedicated screen prints the contract, schedule and each receipt.
- Only the latest posted payment can be voided, from the same safe, with a reason. Receipt and ledger are cancelled together; installments reopen and activation is revoked. Subsequent independent renewal blocks automatic reversal. Cancel all payments newest first before cancelling a contract. Legacy receipt reversal cannot bypass this workflow.

## Verification

```powershell
node --test tests/new-membership-installments.test.cjs
node scripts/verify-new-membership-installments.cjs --check
node scripts/verify-new-membership-installments.cjs
```

The last integration command is explicitly restricted to `clubNew`. It uses a temporary fixture inside a transaction, explicit negative receipt/ledger identifiers, real accounting writes and a deliberate rollback. No test member/payment remains and receipt sequences are not advanced. Never adapt this into a committed production test.
