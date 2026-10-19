// «Strava-Fahrt vollständig» (Noah 19.10.2026 «1a 2a 3a 4a 5b»): the activity page shows what else Strava
// knows (kind, device, bests, «How hard?», comment, laps, splits per km, segment times); Ich › Verlauf names
// the activity and opens its page; an uploaded GPX shows heart rate, cadence, power and temperature from the
// file. Fictional data only; everything outside the preview server is blocked.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { P, GEAR, ZONES, day, routeStrava, seedActivities } from './leistung-data.js';
import { makeGpx } from '../test_data_gtp_gpx.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// what a detail call of the new kind brings for the main ride 3001 (made up)
const EXTRA = {
  workout: 'race', prs: 2, achv: 5, elevHigh: 1184, elevLow: 512, device: `${P}Velocomputer`, rpe: 7, tempMin: 9, tempMax: 17, steep: 11.4,
  desc: `${P}Wind von vorn, zweite Hälfte locker.`,
  laps: [1, 2, 3].map((n) => ({ n, name: `Lap ${n}`, km: 14.1, s: 1920, hm: 220, hr: 136 + n, w: 185 + n, kmh: 26.4 })),
  splits: Array.from({ length: 12 }, (_, i) => ({ k: i + 1, km: 1, s: 140 + i * 3, hm: i % 3 ? 12 : -8, hr: 130 + i, kmh: 25.7 - i * 0.4 })),
  segs: Array.from({ length: 12 }, (_, i) => ({ name: `${P}Segment ${i + 1}`, s: 120 + i * 30, pr: i === 0 ? 1 : i === 1 ? 3 : null })),
};

async function seed(page, context, baseURL) {
  await routeStrava(context, { log: [], app: baseURL });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await seedActivities(page);
  await page.evaluate(
    ({ gear, zones, extra }) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(['settings', 'activities'], 'readwrite');
          tx.objectStore('settings').put({ key: 'strava', value: { gear, lastSync: new Date().toISOString() } });
          tx.objectStore('settings').put({ key: 'strava.zones', value: { hr: zones, at: new Date().toISOString() } });
          const acts = tx.objectStore('activities');
          const g = acts.get('3001');
          g.onsuccess = () => acts.put({ ...g.result, ...extra });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    { gear: GEAR, zones: ZONES, extra: EXTRA },
  );
}

test('the activity page: kind, device, bests, «How hard?», comment, laps, splits and segment times', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page, context, baseURL);
  await page.goto('./#/flow/training/a/3001');
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  const facts = main.locator('[data-section="ride-facts"]');
  await expect(facts.locator('[data-tag="workout"]')).toHaveText(T('Race|kind'));
  await expect(facts.locator('[data-tag="device"]')).toHaveText(`${P}Velocomputer`);
  await expect(facts.locator('[data-fact="prs"]')).toContainText(`2${T('new best times')}`);
  await expect(facts.locator('[data-fact="rpe"]')).toContainText('7 / 10');
  await expect(facts.locator('[data-fact="high"]')).toContainText(/512–1.?184 m/);
  await expect(facts.locator('[data-fact="temp"]')).toContainText('9–17 °C');
  await expect(facts.locator('[data-fact="steep"]')).toContainText('11.4 %');
  await expect(facts.locator('[data-strava-desc]')).toContainText(`${P}Wind von vorn`);

  const laps = main.locator('[data-ana="laps"]');
  await expect(laps.getByRole('heading', { name: T('Laps of this ride') })).toBeVisible();
  await expect(laps.locator('tbody tr')).toHaveCount(3);
  await expect(laps.locator('tbody tr').first()).toContainText(T('Lap {n}', { n: 1 }));

  const splits = main.locator('[data-ana="splits"]');
  await expect(splits.locator('tbody tr')).toHaveCount(10);
  await splits.locator('[data-splits-all]').click();
  await expect(splits.locator('tbody tr')).toHaveCount(12);

  const segs = main.locator('[data-ana="segs"]');
  await expect(segs.locator('[data-pr="1"]')).toHaveText(T('your best time'));
  await expect(segs.locator('[data-pr="3"]')).toHaveText(T('your 3rd best time'));
  await expect(segs.locator('tbody tr')).toHaveCount(10);
  await noSideways(page);
  await shot(page, info, 'SF1-fahrt-seite');
  expect(errors).toEqual([]);
});

test('Ich › Verlauf names the Strava activity and opens its page', async ({ page, context, baseURL }) => {
  await seed(page, context, baseURL);
  await page.goto('./#/me/history');
  await page.reload();
  await ready(page);
  const link = page.locator('main [data-act-link="3001"]');
  await expect(link).toHaveText(`${P}Abendrunde Hügel`);
  await link.click();
  await expect(page).toHaveURL(/#\/flow\/training\/a\/3001$/);
  await expect(page.getByRole('heading', { level: 1, name: `${P}Abendrunde Hügel` })).toBeVisible();
});

test('an uploaded GPX shows heart rate, cadence, power and temperature from the file', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const p = info.outputPath('test_data_gtp_sensoren.gpx');
  writeFileSync(p, makeGpx({ name: `${P} Sensorrunde`, start: `${day(-1)}T15:00:00Z`, legs: [{ km: 20, kmh: 24, gainM: 200 }], sensors: true }));
  await page.goto('./#/debrief/ride');
  await ready(page);
  const main = page.locator('main');
  await main.locator('.pickbtn input[type=file]').setInputFiles(p);
  await main.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  await expect(main.locator('[data-file-hr]')).toContainText('/ 149');
  await expect(main.locator('[data-file-cad]')).toContainText('85');
  await expect(main.locator('[data-file-w]')).toContainText('200 / 200 W');
  await expect(main.locator('[data-file-temp]')).toContainText('15 °C');
  await expect(main.locator('[data-file-zones] .szr')).toHaveCount(5);
  await noSideways(page);
  await shot(page, info, 'SF2-gpx-sensoren');
  expect(errors).toEqual([]);
});
