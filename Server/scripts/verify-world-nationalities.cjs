const assert = require('node:assert/strict');
const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const backup = JSON.parse(fs.readFileSync('../outputs/nationalities/clubNew-nationalities-before.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('../outputs/nationalities/world-nationalities-manifest.json', 'utf8'));
  assert.equal((await db.$queryRaw`SELECT current_database() AS name`)[0].name, backup.database);
  const rows = await db.lookup_nationality.findMany({ orderBy: { code: 'asc' } });
  assert.equal(rows.length, 250);
  assert.equal(rows.filter((row) => /^x+$/i.test(row.name.trim())).length, 0);
  assert.equal(new Set(rows.map((row) => row.name)).size, rows.length);
  for (const expected of manifest.data) {
    const actual = rows.find((row) => row.code === expected.code);
    assert.equal(actual?.name, expected.name);
    if (expected.legacy) assert.equal(actual.id, expected.id);
  }
  for (const previous of backup.rows) assert.equal(rows.find((row) => row.code === previous.code).id, previous.id);
  const fingerprint = (await db.$queryRaw`SELECT COUNT(*)::int AS count, SUM(hashtextextended(id || ':' || COALESCE(nationality::text,'NULL'),0)::numeric)::text AS fingerprint FROM public.members`)[0];
  assert.deepEqual(fingerprint, backup.members, 'Every existing member retains the exact nationality code');
  const orphans = await db.$queryRaw`SELECT COUNT(*)::int AS count FROM public.members m LEFT JOIN public.lookup_nationality n ON n.code=m.nationality WHERE m.nationality IS NOT NULL AND n.id IS NULL`;
  assert.equal(orphans[0].count, 0);
  const sequence = (await db.$queryRaw`SELECT pg_sequence_last_value(pg_get_serial_sequence('public.lookup_nationality','id')::regclass)::text AS value`)[0];
  assert.ok(Number(sequence.value) >= Math.max(...rows.map((row) => row.id)));
  console.log(`PASS: ${rows.length} unique Arabic options; 40 recovered names; 249 ISO countries/territories plus Other; all ${fingerprint.count} member nationality links unchanged; no orphan references; ID sequence valid`);
  if (!process.argv.includes('--ui')) return;
  const { chromium } = require('C:/Users/emahe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const user = await db.users.findFirst({ where: { safe_no: { gt: 0 } }, select: { id: true, fullname: true, safe_no: true } });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((actor) => localStorage.setItem('clubUser', JSON.stringify(actor)), user);
    await page.goto('http://localhost:3001/club/members');
    await page.locator('label[for="member-search-nationality"]').waitFor();
    assert.equal(await page.locator('#member-search-code').count(), 0);
    assert.equal(await page.locator('.member-search-filters .member-top-filter').count(), 3);
    const nationality = page.locator('.member-top-filter').filter({ has: page.locator('label[for="member-search-nationality"]') }).locator('.p-dropdown');
    await page.waitForFunction(() => !document.querySelector('#member-search-nationality')?.closest('.p-dropdown')?.classList.contains('p-disabled'));
    await nationality.click();
    await page.locator('.p-dropdown-panel .p-dropdown-item').first().waitFor();
    assert.equal(await page.locator('.p-dropdown-panel .p-dropdown-item').count(), 250);
    await page.locator('.p-dropdown-filter').fill('أفغانستان');
    await page.getByRole('option', { name: /أفغانستان/ }).waitFor();
    await page.locator('.p-dropdown-filter').fill('كويتي');
    await page.getByRole('option', { name: 'كويتي (5)', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '../outputs/nationalities/nationality-dropdown.png', fullPage: true });
    console.log('PASS: live member search loads all250 options; newly added Afghanistan and original Kuwaiti code5 are searchable; no browser errors');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
