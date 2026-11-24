// «Touren: laufende Tour zuerst» (impeccable F2, Noah «1-5a» 24.11.2026): on the overview the band of the running (or packing) trip
// stands right under the title, then the pack cards, then «Planned»; «Upload ride» is a quiet link under
// «Planned» («Tour from komoot» stays the quiet link in the head); the band «New: every trip has a sport» waits at the page end. German UI, phone 390 and desktop 1440, fictional data
// (sn4plus-fixture.js, with no planned trip, so the band «Packing» shows).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, D0 } from './sn4plus-fixture.js';
import { openData, settle } from './settle.js';
import { openShort } from './kurz-open.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Trips: the band comes first, then Planned; Upload ride is a quiet link under Planned', async ({ page, context }, info) => {
  const d = sn4plusData();
  d.tables.trips = d.tables.trips.filter((x) => x.status !== 'planned'); // nothing open: the band «Packing» shows
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/touren-laufende-zuerst-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (x) => x.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/trips');
  await openShort(page);
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  await expect(page.locator('[data-pack-band]')).toBeVisible();
  const y = async (sel) => (await page.locator(sel).first().boundingBox()).y + (await page.evaluate(() => window.scrollY));
  const h1 = await y('main h1');
  const band = await y('[data-pack-band]');
  const planned = await y('[data-planned]');
  const quiet = await y('[data-trips-quiet]');
  expect(h1).toBeLessThan(band);
  expect(band).toBeLessThan(planned);
  expect(planned).toBeLessThan(quiet);
  // the band stands high: under the title block, behind no button, card or hint
  if (info.project.name === 'phone') expect(band - h1).toBeLessThan(480);
  // the link exists (upload leads to the ride page), and the head has no button for it any more
  await expect(page.locator('[data-trips-quiet] [data-upload-ride]')).toHaveText(T('Upload ride'));
  await expect(page.locator('[data-to-komoot]')).toBeVisible();
  expect(await page.locator('header a[href="#/debrief/ride"]').count()).toBe(0);
  // «New: every trip has a sport» (when there are old bike trips) stands after Planned
  if (await page.locator('.sa-band').count()) expect(await y('.sa-band')).toBeGreaterThan(planned);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
