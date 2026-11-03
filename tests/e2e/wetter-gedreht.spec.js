// «Wetter gedreht: was ändert sich» (idea C2, Noah 02.11.2026 «3b»), German UI: a trip packed for 15 °C, the forecast says 4 °C:
// the notice in Packen names the new items (cold kit) and what can stay at home (warm kit). Fictional data only.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const P = 'test_data_gtp_';
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const cloth = (id, name, set) => ({ id, sourceId: `M${id}`, name, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, sets: [set], kits: [], domains: ['bikepacking'] });
const entry = (itemId, slot = 'body') => ({ itemId, slot, qty: 1, packed: false });

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items.push(cloth('WG1', 'Kurze Hose', 'u-warm'), cloth('WG2', 'Winterjacke', 'u-cold'), cloth('WG3', 'Winterhandschuhe', 'u-cold'));
  t.settings.push(MARK, { key: 'sets', value: [{ key: 'u-warm', name: `${P} Warm`, minC: 12, maxC: 40 }, { key: 'u-cold', name: `${P} Kalt`, minC: -20, maxC: 11 }] });
  t.trips = [{
    id: 'gtp-wx', title: 'Wetterwechsel', domain: 'bikepacking', bikeId: 'bike-test', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' },
    status: 'planned', wx: { min: 15, max: 20, rain: 'none' }, hours: 6, ready: [], startDate: day(1), days: 1, entries: [entry('WG1')],
    forecast: { fetchedAt: `${day(0)}T06:00:00.000Z`, place: { name: '', lat: 47.39, lon: 8.04 }, days: [{ date: day(1), min: 4, max: 9, rainMm: 0, rainPct: 5 }] },
  }];
  return data;
}

test('the notice names what is new on the list and what can stay at home', async ({ page, context }, info) => {
  const file = info.outputPath('wx.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-wx'));
  await page.goto('./#/pack?day');
  const diff = page.locator('[data-wx-diff]');
  await expect(diff).toBeVisible();
  await expect(diff.locator('[data-wx-add]')).toContainText('Winterjacke');
  await expect(diff.locator('[data-wx-add]')).toContainText('Winterhandschuhe');
  await expect(diff.locator('[data-wx-leave]')).toContainText('Kurze Hose');
  await expect(diff.locator('[data-wx-add]')).toContainText(T('New on the list'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
