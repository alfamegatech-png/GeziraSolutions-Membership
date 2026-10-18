const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
const db = new (require('@prisma/client').PrismaClient)();
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const token = h.evaluateModule(h.root, 'lib/installmentSessionToken.js');
const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function main() {
  const user = await db.users.findUnique({ where: { email: 'Admin@gmail.com' }, select: { id: true, fullname: true, email: true, safe_no: true } });
  const before = await db.$queryRaw`SELECT envelope FROM public.system_license WHERE id='membership'`;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: token.INSTALLMENT_COOKIE, value: token.signInstallmentSession(user), url: 'http://localhost:3001', httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript(actor => localStorage.setItem('clubUser', JSON.stringify(actor)), user);
    const page = await context.newPage();
    let responses = 0;
    // Browser-only simulation: shorten the returned duration, then simulate the lock response.
    // The real server clock, signed license, database and business functions are not modified.
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch();
      const text = await response.text();
      const body = text.split('\n').map(line => {
        const match = /^([0-9a-f]+):(.+)$/.exec(line.trim());
        if (!match) return line;
        let value;
        try { value = JSON.parse(match[2]); } catch { return line; }
        function rewrite(node) {
          if (!node || typeof node !== 'object') return node;
          if (node.ok && Number.isFinite(node.data?.licenseRemainingMs)) {
            responses++;
            if (responses === 1) { node.data.licenseRemainingMs = 1200; return node; }
            return { ok: false, status: 423, licenseRequired: true, message: 'برجاء تحديث المنظومة. يُرجى تسجيل الدخول بحساب الشركة لإعادة التفعيل.' };
          }
          for (const key of Object.keys(node)) node[key] = rewrite(node[key]);
          return node;
        }
        value = rewrite(value);
        return match[1] + ':' + JSON.stringify(value);
      }).join('\n');
      await route.fulfill({ response, body });
    });
    await page.goto('http://localhost:3001/club/landing');
    await page.getByRole('heading', { name: 'برجاء تحديث المنظومة', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.workspace-content'));
    assert.ok(responses >= 1);
    await page.screenshot({ path: '../outputs/system-license/expiry-lock-simulation.png', fullPage: true });
    const status = await context.request.get('http://localhost:3001/api/system-license');
    assert.equal((await status.json()).active, true);
    assert.deepEqual(await db.$queryRaw`SELECT envelope FROM public.system_license WHERE id='membership'`, before);
    console.log('PASS: an already-open screen closes at the expiry timer, with no warning; browser-only time simulation; real server license and clock unchanged');
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
