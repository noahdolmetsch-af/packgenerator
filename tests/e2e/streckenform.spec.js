// «Strecke als Bild» (Paket E, Idee 23): a trip with a route shows its shape in the lists of Touren;
// a trip without a route shows none. Fictional data, German UI.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const LINE = [[46.5, 7.5], [46.6, 7.7], [46.55, 8.0], [46.7, 8.2], [46.65, 8.5]];
const trip = (id, title, f) => ({ id, domain: 'bikepacking', title: `test_data_gtp_ ${title}`, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: {}, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: true }], ready: [], status: 'planned', hours: 2, overnight: 'none', ...f });

test('Touren: the planned trip with a route shows its shape, the one without shows none', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = structuredClone(base);
  data.tables.trips.push(
    trip('gtp-mit', 'Mit Strecke', { startDate: day(5), route: { name: 'x', km: 80, gainM: 900, line: LINE, profile: [[0, 500], [40, 900], [80, 600]] } }),
    trip('gtp-ohne', 'Ohne Strecke', { startDate: day(6) }),
  );
  const file = info.outputPath('streckenform.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/trips');
  const withLine = page.locator('[data-planned] li[data-trip="gtp-mit"]');
  await expect(withLine).toBeVisible();
  await expect(withLine.locator('[data-route-shape]')).toHaveCount(1);
  await expect(withLine.locator('[data-route-shape] path')).toHaveAttribute('d', /^M[\d.]+,[\d.]+L/);
  await expect(page.locator('[data-planned] li[data-trip="gtp-ohne"] [data-route-shape]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
