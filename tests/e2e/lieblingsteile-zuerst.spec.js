// «Lieblingsteile zuerst» (Noah 23.11.2026 «2a»): on the packing list the onion offers the starred piece for a gap, with
// «★ Dein Liebling»; the swap window puts the starred piece first. German UI, phone and desktop, fictional data only.
// LIEB_SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const SHOTS = process.env.LIEB_SHOTS;
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const cloth = (id, sid, name, category, weightG, f = {}) => ({ id, sourceId: sid, name: `${P} ${name}`, category, weightG, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
// two leg pieces that both hold 6 °C: the thin one is lighter, the warm one has the star
const CLOTHES = [
  cloth('CL01', 'M0001', 'Merino Langarm', 'onbike', 180, { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 15 }),
  cloth('CL02', 'M0002', 'Thermotrikot', 'onbike', 240, { layer: 'mid', zone: 'torso', tempMin: 4, tempMax: 12 }),
  cloth('CL03', 'M0003', 'Weste winddicht', 'rain', 95, { layer: 'outer', zone: 'torso', tempMin: 8, tempMax: 20 }),
  cloth('CL04', 'M0004', 'Regenjacke leicht', 'rain', 190, { layer: 'outer', zone: 'torso', tempClass: 'mittel' }),
  cloth('CL05', 'M0005', 'Beinlinge duenn', 'onbike', 110, { layer: 'mid', zone: 'legs', tempMin: 4, tempMax: 15 }),
  cloth('CL13', 'M0013', 'Beinlinge Winter', 'onbike', 260, { layer: 'mid', zone: 'legs', tempMin: 2, tempMax: 15, favorite: true, favNote: 'warm und bequem' }),
  cloth('CL07', 'M0007', 'Langfingerhandschuhe', 'rain', 60, { layer: 'accessory', zone: 'hands', tempMin: 4, tempMax: 14 }),
  cloth('CL08', 'M0008', 'Buff Merino', 'rain', 35, { layer: 'accessory', zone: 'neck', tempMin: 0, tempMax: 15 }),
  cloth('CL09', 'M0009', 'Stirnband', 'rain', 25, { layer: 'accessory', zone: 'head', tempMin: 4, tempMax: 12 }),
];
const entry = (itemId, slot = 'body') => ({ itemId, slot, qty: 1, packed: false });

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items.push(...CLOTHES);
  t.settings.push(MARK);
  t.trips = [
    { id: 'gtp-lieb', title: `${P} Jura-Wochenende`, domain: 'bikepacking', bikeId: 'bike-test', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, status: 'planned', wx: { min: 6, max: 14, rain: 'none' }, hours: 6, ready: [], startDate: day(1), days: 2, entries: ['CL01', 'CL02', 'CL03', 'CL07', 'CL08', 'CL09'].map((id) => entry(id)) },
  ];
  return data;
}

test('Lieblingsteil zuerst: Zwiebel und Tauschen', async ({ page, context }, info) => {
  const file = info.outputPath('base.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);

  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-lieb'));
  await page.goto('./#/pack');
  const cond = page.getByLabel(T('Trip conditions'));
  await expect(cond.getByRole('button', { name: T('Onion: {n} gap', { n: 1 }) })).toBeVisible();
  await cond.getByRole('button', { name: T('Onion: {n} gap', { n: 1 }) }).click();
  const legs = cond.locator('.orows li', { hasText: T('Legs') });
  await expect(legs).toContainText('Beinlinge Winter');
  await expect(legs.locator('[data-onion-fav]')).toHaveText(`★ ${T('Your favourite')}`);
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await legs.locator("[data-onion-fav]").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: `${SHOTS}/zwiebel-${info.project.name}.png` });
  }
  // the piece it brings stands first in the swap window of a worn piece of the same place too
  await legs.getByRole('button', { name: /Beinlinge Winter dazu/ }).click();
  await expect(cond.locator('.orows li', { hasText: T('Legs') })).toContainText('Beinlinge Winter');
  await cond.locator('[data-onion-swap]').first().waitFor({ state: 'attached' });
  await cond.locator('.orows li', { hasText: T('Legs') }).locator('[data-onion-swap]').click();
  const dlg = page.locator('dialog[open].swap-sheet');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('.alt').first()).toContainText('Beinlinge duenn');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/tauschen-${info.project.name}.png` });
  expect(errors).toEqual([]);
});
