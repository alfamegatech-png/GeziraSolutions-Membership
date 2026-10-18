# Role-Based Access

## Deployment

The local deployment uses `clubNew`. Existing member data, prices, financial receipts and ledger rows are not changed by the role migration.

```powershell
cd D:\GeziraMemberShip\Membership-GeziraNew\Server
npx prisma db execute --file scripts/apply-rbac.sql --schema prisma/schema.prisma
node scripts/bootstrap-rbac-admin.cjs m.saeed@gmail.com
npx prisma db execute --file scripts/apply-company-price-admin.sql --schema prisma/schema.prisma
npm run build
npm start
```

Back up the deployment first. Apply SQL and initialize the explicitly designated administrator before starting the new build. The bootstrap command is local-only, idempotent for the same administrator and refuses to add a different administrator after bootstrap. There is no public bootstrap endpoint.

Copy changed `app`, `components`, `lib`, and deployment scripts together. Prisma schema/generation is unchanged: this module uses parameterized SQL against additive tables, like the existing price settings module. Do not reset or push the Prisma schema over the database.

## Tables

- `privileges`: 37 named permissions.
- `roles`: five predefined roles.
- `role_privileges`: permissions assigned to each role.
- `user_roles`: zero or more roles per user, assignment actor and timestamp.
- `security_audit`: role changes and price edits, before/after snapshots and the server-authenticated actor.
- `access_screen_owners`: exclusive owner of the membership-prices settings screen.

No existing user receives a guessed role. On this deployment `m.saeed@gmail.com` and the explicitly designated company account `Admin@gmail.com` have the system-administrator role. All other real users require an administrator to assign roles before they can open the membership workspace. New users also start with no access. Combining roles is supported; arbitrary per-user permission exceptions are not implemented.

The owner explicitly restricted the membership-prices settings screen and editing to `Admin@gmail.com`. Other administrators retain their other permissions but cannot open this screen or edit prices. The server filters `prices.manage` and `prices.edit` according to `access_screen_owners`; assigning another administrator does not bypass this policy. `prices.view` remains available to authorized operators for calculation, through `/api/membership-prices?mode=calculation`, so saved prices still drive renewal and reporting calculations. The full settings endpoint requires `prices.manage`, and PUT requires effective `prices.edit`.

## Operator Workflow

1. Log out and log in using `m.saeed@gmail.com` and its existing password.
2. Open **أدوار المستخدمين** (`/club/user-roles`) from the right-hand menu.
3. Search for a user, click the user-edit icon, select roles, enter a reason and confirm.
4. Review the resulting permissions before confirming. Empty roles revoke workspace access.
5. Review **سجل الصلاحيات** (`/club/security-audit`) for role and price changes.

Roles:

| Role | Scope |
| --- | --- |
| مدير النظام | All catalog permissions; user-role administration and prices |
| موظف العضويات | Member/dependent records, attachments, separation, contract creation, no cash collection |
| محصل الخزينة | Subscription/renewal/swimming, installment/deposit collection, own-safe reports |
| مراجع الحسابات | Read-only member/financial data, all-safe reports and export, audit |
| مشرف الحسابات | Collection plus authorized financial cancellation and all-safe review |

Paid dependent creation requires both dependent-creation permission and subscription-collection permission, and a valid safe. Assign both membership-staff and cashier roles when a person performs both jobs. Registering an unpaid dependent does not create a zero-value cash receipt. Contract creation does not require a safe, but any collection does. Existing installment reversal restrictions, latest-payment rule and same-safe requirements remain in force.

## Enforcement

- Signed HttpOnly session, validated on the server; localStorage is not an authorization source.
- Permissions reloaded from the database for every protected action; role changes take effect on the next server action, without trusting stale browser roles.
- Server actions and local export, pricing, upload and card-print APIs are protected. Generic table/lookup functions have explicit allowlists; user passwords cannot be selected through the generic data endpoints or nested user includes.
- Cashier identity and safe on receipts/ledgers are overridden from the authenticated database user, not the request body.
- Financial report/receipt queries are scoped to the user's safe unless all-safe reporting is granted. Old membership end dates remain available for correct arrears calculations without exposing other-safe receipt monetary fields.
- Price and role changes are audited. Existing financial receipt/history records retain their authenticated user attribution.
- Last-administrator removal is prevented under a serialized database lock; stale role edits and unauthorized self-escalation are rejected.
- Unknown users/roles/permissions and missing authorization tables fail closed.

Preserve `.runtime/installment-session.key`, or set the same strong `INSTALLMENT_SESSION_SECRET` across instances. Existing session signing is reused, with eight-hour HttpOnly/SameSite=Strict cookies. Set `INSTALLMENT_COOKIE_SECURE=true` for HTTPS deployments. Re-login is required for sessions created before signed-cookie support. The password-storage mechanism is unchanged; hashing migration and external locker-system authorization remain separate projects. The external locker service continues to enforce its own bearer-token permissions.

## Verification

```powershell
node --test tests/rbac.test.cjs tests/regression/payment-date.test.cjs
node scripts/verify-rbac-transactions.cjs
node scripts/verify-new-membership-installments.cjs
```

The PostgreSQL integration tests deliberately roll back, including test users, contract payments and journals; financial receipt sequences are not advanced. `verify-rbac-ui.cjs` additionally exercises the actual browser UI and HTTP denial paths using temporary users with random unusable passwords. It removes those accounts in `finally`, does not collect money or change real users' roles, and retains genuine security-audit entries for the temporary test-role changes. It requires the local bundled Playwright path configured in that script.
