# Server Stability Update

No database migration or historical financial correction is part of this update.
Existing renewal calculations and receipt totals are unchanged.

## Deploy

1. Back up the application, `.env`, database and `public/uploads` separately.
2. Stop only the process/service running this Server application. Do not kill all Node processes.
3. Deploy the updated source, preserving `.env` and `public` assets.
4. Run `npm ci` when dependency installation is required, then `npm run build`.
5. Start `start-production.cmd` or use `npm start -- -p 3001`.
6. Configure the existing IIS reverse proxy/service to use that port and this production command, not `npm run dev`.

Do not build or run development mode against the same `.next` directory as a running production instance.
Do not clear `.next` while the application is serving requests. Build failures must be resolved before starting.

## Verify

- Login with valid/invalid credentials; a database outage must not create a browser session.
- Open member 234272 through search and open a member whose photo is missing.
- Open renewal history and the daily report, including dependent receipts and renewal receipt count.
- Confirm existing receipt totals against the accounting ledger.
- Watch the Node process working set and private memory under normal concurrent use. Removing debug logs does not guarantee that every possible memory issue is resolved.

Diagnostic output no longer prints user records, credentials, tokens, request bodies or full exceptions.
Errors retain a static operation message and a short error code where available.
Rotate passwords exposed in old logs and restrict/archive those logs according to your retention policy.

Password hashing and server-validated authentication/session authorization require a separate migration.
Browser storage validation is crash protection, not a replacement for server-side authorization.
This update does not change existing receipt dates or timezone conventions.
