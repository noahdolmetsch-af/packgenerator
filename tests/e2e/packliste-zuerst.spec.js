// «Ganze App neu denken» Schritt 4b (Noah 18.11.2026 «1a»): on the page «Plan» of a trip the packing list comes
// first; route, bike and bags, weight, stages and notes follow below it. Fictional data only.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const TRIP = 'trip-test_data_gtp_zuerst';
const tomorrow = () => new Date(Date.now() + 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

test('Plan page: the packing list comes before the route, bike, weight and stages cards', async ({ page, context }, info) => {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const ids = data.tables.items.filter((i) => i.category !== 'bags').slice(0, 12).map((i) => i.id);
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Seerunde', startDate: tomorrow(), days: 2, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: ids.map((itemId, i) => ({ itemId, slot: ['top', 'frame', 'seat'][i % 3], qty: 1, packed: false })),
    ready: [], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  const file = info.outputPath('zuerst.json');
  writeFileSync(file, JSON.stringify(data));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(DE['Import backup'] ?? 'Import backup').setInputFiles(file);
  await panel.getByRole('button', { name: DE['Replace all data'] ?? 'Replace all data' }).press('Enter');
  await settle(page);
  await page.goto(`./#/pack/${TRIP}`);
  await settle(page);
  const list = page.locator('.list-head');
  const plan = page.locator('.plan-top');
  await expect(list).toBeVisible();
  await expect(plan).toBeVisible();
  const [a, b] = await Promise.all([list.boundingBox(), plan.boundingBox()]);
  expect(a.y).toBeLessThan(b.y); // the list is above the planning cards
  // the cards are still there: the bike drawing and the weight
  await expect(plan.locator('svg').first()).toBeAttached();
  expect(errors).toEqual([]);
});
