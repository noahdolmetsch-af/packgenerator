// Klick-Rundgang 22.10.2026, Durchspiel-Test «Packen» (Noah «5a»: a robot plays every finished flow before
// each release): New trip → Plan → pack in one tap → On the way → «Losfahren» → finish the trip.
// It checks what the click walk found broken: one count of items (H01), the sport's own name (H02),
// the main button names the next step (H03, H06), «Ausfahrt starten» only once packed (H04), the start
// time is the real one (H09), food from the bag (H08) and the step Plan with open points (H35).
// Fictional fixture plus test_data_gtp_ items; nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'other', weightG: 50, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: 'standard', sets: [], kits: [], domains: ['bikepacking'], ...f });

/** Today in Zurich, calendar-day arithmetic (never Date.now() + n days). */
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));

async function start(page, context, info) {
  const data = structuredClone(base);
  // a bar without «1 per N h»: it still counts as food on the way (H08)
  data.tables.items.push(item('AP01', 'Riegel', { category: 'food', defaultBag: 'frame' }));
  const file = info.outputPath('ablauf-packen.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
}

test('Ablauf Packen: new trip, pack, set off, finish, every step names the next one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  const day = today();

  // 1. New trip: one count for the bags in the list and on the button (H01); a draft is the step Plan with open points (H35)
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await dlg.getByLabel(T('Start date')).fill(day);
  await dlg.getByRole('button', { name: T('Day ride'), exact: true }).click();
  const head = dlg.locator('.num').filter({ hasText: new RegExp(esc(T('{n} items to pack', { n: 'X' })).replace('X', '(\\d+)')) }).first();
  const headN = Number((await head.textContent()).match(/\d+/)[0]);
  const split = dlg.locator('[data-count-split]');
  await expect(split).toContainText(T('{n} in the bags', { n: headN }));
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();

  // 2. Plan: the sport's own name (H02), «Alles einpacken, los» while nothing is packed (H03), no «Ausfahrt starten» yet (H04)
  const go = page.locator('main .mainbar .btn.hi').first();
  await expect(go).toHaveText(new RegExp(esc(T("Pack everything, let's go"))));
  await expect(page.locator('main [data-live-start]')).toHaveCount(0);
  await expect(page.getByText(T('Suggestion list {sport}', { sport: T('Cycling|sport') })).first()).toBeVisible();
  await expect(page.getByText(T('Suggestion list {sport}', { sport: 'Bikepacking' }))).toHaveCount(0);

  // 3. One tap packs everything and leads to On the way, where «Losfahren» is the next step (H06)
  await go.click();
  await expect(page).toHaveURL(/#\/ride/);
  const ride = page.locator('main .mainbar .btn.hi').first();
  await expect(ride).toHaveText(new RegExp(esc(T('Start riding'))));
  // food from the bag, not «Nichts geplant» (H08)
  const eat = page.locator('.now .tiles li').filter({ hasText: T('Eat') });
  if (await eat.count()) await expect(eat).not.toContainText(T('Nothing planned'));

  // 4. «Losfahren»: the start time is now (H09), the trip is under way, the next step is to finish
  const before = await page.evaluate(() => new Date().toTimeString().slice(0, 5));
  await ride.click();
  await expect(ride).toHaveText(new RegExp(esc(T('Finish the trip'))));
  const [trip] = await allTrips(page);
  expect(trip.entries.every((e) => e.packed)).toBe(true);
  expect(trip.goDays?.[0]).toMatch(/^\d\d:\d\d$/);
  expect(trip.rideStart?.[0]).toBe(trip.goDays[0]);
  expect(trip.goDays[0] >= before.slice(0, 4)).toBe(true);
  // «Ausfahrt starten» comes back on Plan once everything is packed (H04)
  await page.goto('./#/pack');
  await expect(page.locator('main [data-live-start]')).toHaveCount(1);
  // Versteckte Funktionen (Noah 22.10.2026 «1a»): «Per Foto abhaken» is a visible camera button on the Pack tab
  await page.goto('./#/pack?day');
  await expect(page.locator('main a.btn[data-pack-photo]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
