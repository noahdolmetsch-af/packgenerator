// Touren-Ideen 60–70 (996 Ideen, Noah 25.10.2026), the small ones in the browser:
//   60 «Pausengrund»: in your own pause a chip says why; it is kept with the recording.
//   65 «Schlecht erreichbar»: the debrief tells «not needed» from «hard to reach»; «Fertig» suggests a learning.
//   67 «Alte Reise ohne GPS»: Vergangene Touren › «Alte Reise nachtragen», a finished trip without numbers.
//   70 «Gefühl vor den Zahlen»: the debrief asks how hard it was first.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const PAST = 'test_data_gtp_Zurueck-C';
const getAll = (page, table) =>
  page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction(name).objectStore(name).getAll();
          g.onsuccess = () => resolve(g.result);
          g.onerror = () => reject(g.error);
        };
      }),
    table,
  );

function data() {
  const d = homeFixture();
  d.tables.trips = [trip('Zurueck-C', day(-3), { days: 2, finished: day(-2) }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  return d;
}

test('60 Live: the reason of a pause is kept with the recording', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-pause]'), info);
  const why = page.locator('[data-live-why]');
  await expect(why).toBeVisible();
  const fix = why.locator('[data-live-why-key="fix"]');
  await expect(fix).toHaveText(T('Repair|pause'));
  await tap(fix, info);
  await expect(fix).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => {
    const row = (await getAll(page, 'tracks')).find((r) => r.kind === 'rec' && r.open);
    return row?.whys?.[String(row.breaks[0][0])] ?? '';
  }).toBe('fix');
  expect(await noSideways(page)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('65 + 70 Debrief: the feeling first, hard to reach is not the same as not needed', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data(), hour: 9 });
  await page.goto(`./#/debrief/${PAST}`);
  const feel = page.locator('[data-debrief-feel]');
  await expect(feel).toContainText(T('How hard was it?'));
  await tap(feel.locator('[data-feel="7"]'), info);
  await expect(feel.locator('[data-feel="7"]')).toHaveAttribute('aria-pressed', 'true');
  const reach = page.locator('[data-debrief-reach]');
  await tap(reach.locator('summary'), info);
  const chip = reach.locator('[data-reach-item]').first();
  const name = (await chip.textContent()).trim();
  await tap(chip, info);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(reach.locator('summary')).toContainText(T('{n} marked', { n: 1 }));
  // the suggestion for next time
  await expect(page.locator('section.miss-fold')).toContainText(T('Pack {name} within reach', { name }));
  await expect.poll(async () => (await getAll(page, 'debriefs')).find((x) => x.tripId === PAST)?.feel ?? null).toBe(7);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('67 Past trips: an old trip from memory, without numbers', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data(), hour: 9 });
  await page.goto('./#/pack/past');
  await tap(page.locator('[data-memory-open]'), info);
  const sheet = page.locator('[data-memory-sheet]');
  await expect(sheet).toBeVisible();
  await tap(sheet.locator('[data-memory-save]'), info);
  await expect(sheet.locator('.err')).toHaveText(T('Give it a name.'));
  await sheet.locator('[data-memory-title]').fill('test_data_gtp_ Jura 2019');
  await sheet.locator('[data-memory-start]').fill('2019-06-01');
  await sheet.locator('[data-memory-days]').fill('3');
  await sheet.locator('[data-memory-place]').fill('test_data_gtp_ Jura');
  await sheet.locator('[data-memory-text]').fill('test_data_gtp_ Regen am zweiten Tag');
  expect(await noSideways(page)).toBe(0);
  await tap(sheet.locator('[data-memory-save]'), info);
  await expect(sheet).toHaveCount(0);
  const trips = await getAll(page, 'trips');
  const made = trips.find((x) => x.title === 'test_data_gtp_ Jura 2019');
  expect(made.status).toBe('done');
  expect(made.route).toBeUndefined();
  await page.goto(`./#/debrief/${made.id}`);
  await expect(page.locator('[data-memory-line]')).toContainText(T('From memory, without GPS: no numbers made up'));
  await expect(page.locator('[data-memory-line]')).toContainText('test_data_gtp_ Regen am zweiten Tag');
  expect(errors).toEqual([]);
});
