// «Heatmap» (Noah 20.10.2026 «1a+b 2b+a 3 alle Fahrten von Strava 4a 5a»): fictional Strava rides and a
// run on one map, clouds and lines, filters by sport and year, a tap names the rides there; the way in
// from Rückblick and from «Neuland». Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const yearBefore = () => String(Number(today().slice(0, 4)) - 1);
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// a fictional loop and a road two rides share
const ROAD = [[47.05, 8.3], [47.06, 8.32], [47.07, 8.34], [47.08, 8.36]];
const RUN = [[47.02, 8.28], [47.025, 8.29], [47.03, 8.285]];

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('activities', 'readwrite');
          for (const row of list) tx.objectStore('activities').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    rows,
  );
}

/** The canvas pixel with the strongest colour, in page coordinates, and how many pixels are coloured. */
const hottest = (page) =>
  page.locator('[data-heatmap] canvas').evaluate((c) => {
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let best = -1;
    let at = 0;
    let n = 0;
    const r = c.getBoundingClientRect();
    // not under the buttons on the right
    const maxX = c.width * (1 - 64 / r.width);
    for (let i = 3; i < d.length; i += 4) {
      if (d[i]) n++;
      if (((i - 3) / 4) % c.width > maxX) continue;
      // the darkest red: low green
      if (d[i] > 200 && 255 - d[i - 2] > best) {
        best = 255 - d[i - 2];
        at = (i - 3) / 4;
      }
    }
    const x = at % c.width;
    const y = Math.floor(at / c.width);
    return { n, x: r.left + (x / c.width) * r.width, y: r.top + (y / c.height) * r.height };
  });

test('Heatmap: rides on one map, clouds and lines, filters, a tap names the rides', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/heatmap');
  await ready(page);
  const main = page.locator('main');

  // 1. nothing yet: the page says what to do
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('Heatmap'));
  await expect(main).toContainText(T('No rides with a route yet'));

  // 2. two rides on the same road, one run last year
  await seed(page, [
    { id: '9001', day: dayBefore(2), kind: 'bike', type: 'Ride', name: `${P}Feierabend`, km: 20, line: encodePolyline(ROAD) },
    { id: '9002', day: dayBefore(3), kind: 'bike', type: 'GravelRide', name: `${P}Schotter`, km: 22, line: encodePolyline(ROAD) },
    { id: '9003', day: `${yearBefore()}-06-01`, kind: 'run', type: 'Run', name: `${P}Seelauf`, km: 6, line: encodePolyline(RUN) },
  ]);
  await page.reload();
  await ready(page);
  const map = main.locator('[data-heatmap]');
  await expect(map).toHaveAttribute('data-lines', '3');
  await expect(main.getByTestId('heat-sum')).toContainText(T('{n} rides', { n: 3 }));
  await expect(map).toHaveAttribute('data-mode', 'clouds');
  await expect.poll(async () => (await hottest(page)).n).toBeGreaterThan(50);
  await noSideways(page);
  await shot(page, info, 'heatmap-wolken');

  // 3. lines instead of clouds; the choice stays on this device
  await main.locator('[data-heat-filters]').getByRole('button', { name: T('Lines|heat') }).click();
  await expect(map).toHaveAttribute('data-mode', 'lines');
  await expect.poll(async () => (await hottest(page)).n).toBeGreaterThan(20);
  await shot(page, info, 'heatmap-linien');

  // 4. filters: only runs, then only last year
  const filters = main.locator('[data-heat-filters]');
  await filters.getByRole('button', { name: T('Run|kind') }).click();
  await expect(map).toHaveAttribute('data-lines', '1');
  await filters.getByRole('button', { name: T('All sports') }).click();
  await filters.getByRole('button', { name: yearBefore() }).click();
  await expect(map).toHaveAttribute('data-lines', '1');
  await filters.getByRole('button', { name: T('All years') }).click();
  await expect(map).toHaveAttribute('data-lines', '3');

  // 5. a tap on the strongest spot names both rides on the road, newest first, with their pages
  await map.scrollIntoViewIfNeeded();
  const spot = await hottest(page);
  if (info.project.name === 'phone') await page.touchscreen.tap(spot.x, spot.y);
  else await page.mouse.click(spot.x, spot.y);
  const picked = main.locator('[data-heat-picked]');
  await expect(picked.getByRole('heading', { level: 2 })).toHaveText(T('{n} rides here', { n: 2 }));
  const links = picked.locator('a.rv-row');
  await expect(links).toHaveCount(2);
  await expect(links.first()).toContainText(`${P}Feierabend`);
  await expect(links.first()).toHaveAttribute('href', '#/flow/training/a/9001');
  await picked.getByRole('button', { name: T('Close') }).click();
  await expect(picked).toHaveCount(0);

  // 6. the way in from «Neuland» (Rückblick lists it under «Mehr» once there are tours)
  await page.goto('./#/neuland');
  await ready(page);
  await page.locator('main a[data-neuland-heatmap]').click();
  await expect(page.locator('main [data-heatmap]')).toBeVisible();

  expect(errors).toEqual([]);
});
