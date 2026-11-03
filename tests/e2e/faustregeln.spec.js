// «Faustregeln aus deinen Rückblicken» (idea D2, Noah 02.11.2026 «3b»), German UI: four finished trips show that an own
// block was used only when it was cold; the card on «So entscheidet die App» suggests the rule; Undo takes it back.
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
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items.push({ id: 'FR1', sourceId: 'MFR1', name: 'Wärmejacke', category: 'rain', weightG: 300, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, sets: ['u-warm'], kits: [], domains: ['bikepacking'] });
  t.settings.push(MARK, { key: 'sets', value: [{ key: 'u-warm', name: 'Warmes' }] });
  const mins = [2, 4, 12, 16];
  t.trips = mins.map((min, i) => ({ id: `gtp-fr${i}`, title: `Tour ${i + 1}`, domain: 'bikepacking', bikeId: 'bike-test', setup: {}, status: 'done', wx: { min, max: min + 8, rain: 'none' }, hours: 5, ready: [], startDate: day(-30 + i * 5), days: 1, entries: [{ itemId: 'FR1', slot: 'body', qty: 1, packed: true }] }));
  t.debriefs = mins.map((min, i) => ({ id: `gtp-frd${i}`, tripId: `gtp-fr${i}`, status: 'done', items: { FR1: min < 8 ? 'used' : 'unused' } }));
  return data;
}

test('the card suggests a rule from four debriefs and Undo takes it back', async ({ page, context }, info) => {
  const file = info.outputPath('fr.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/me/regeln');
  const card = page.locator('[data-faust-row="u-warm"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Used on {used} of {n} trips.', { used: '2', n: '4' }));
  // the person sees which items the block holds and what the app does with the rule
  await card.locator('[data-faust-parts] summary').click();
  await expect(card.locator('[data-faust-parts]')).toContainText('Wärmejacke');
  await expect(card.locator('[data-faust-then]')).toContainText(T('If you make it a rule: Packen puts all items of the block on the list when {rule}, and leaves them out otherwise. You can untick any item on a trip and change the rule any time on Blocks.').split('{')[0].trim());
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await card.locator('[data-faust-yes]').click();
  const rule = async () => ((await table(page, 'settings')).find((s) => s.key === 'sets')?.value ?? []).find((s) => s.key === 'u-warm')?.rule;
  await expect.poll(rule).toMatchObject({ metric: 'minC', cmp: 'lt' });
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect.poll(rule).toBeUndefined();
});
