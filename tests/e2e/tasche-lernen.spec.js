// «Tasche lernen» (Noah 23.11.2026 «3a»): an item you put into another bag than its usual one on three finished trips gets a line
// in the card «Bereit zur Abfahrt?»; the window changes the usual bag (with Undo) or stops asking. German UI, fictional data
// (tests/e2e/fixture.json), nothing leaves the preview server. TASCHE_SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const TRIP = 'trip-test_data_gtp_tasche';
const SHOTS = process.env.TASCHE_SHOTS;

const zurich = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plusDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};


// the power bank (EL02, usual bag: top tube bag) lay in the seat pack on three finished trips
function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const day = plusDays(zurich(), 5);
  const ids = ['EL01', 'EL02', 'LI01', 'LI02', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03', 'HY02'];
  // every other item lies where its usual bag puts it (else in the seat pack), so only the power bank is «moved»
  const usual = (id) => {
    const b = data.tables.items.find((x) => x.id === id)?.defaultBag;
    return b === 'mounted' || b === 'body' || bike.setup[b] ? b : 'seat';
  };
  const mk = (id, title, startDate, slotOf) => ({
    id, domain: 'bikepacking', title, startDate, days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: ids.map((itemId) => ({ itemId, slot: itemId === 'EL02' ? slotOf : usual(itemId), qty: 1, packed: true })),
    ready: [], charge: {}, ride: null, hours: null, sets: {}, purpose: {}, status: 'done', copiedFrom: null, createdAt: '2026-08-01T08:00:00.000Z', wx: { min: 15, max: 15, rain: 'none' },
  });
  for (const [n, d] of [[1, -40], [2, -30], [3, -20]]) {
    data.tables.trips.push(mk(`trip-test_data_gtp_alt${n}`, `test_data_gtp_ Runde ${n}`, plusDays(zurich(), d), 'seat'));
    data.tables.debriefs.push({ id: `deb-test_data_gtp_alt${n}`, tripId: `trip-test_data_gtp_alt${n}`, status: 'done', answers: {}, createdAt: '2026-09-01T08:00:00.000Z' });
  }
  data.tables.trips.push({ ...mk(TRIP, 'test_data_gtp_ Jura Runde', day, 'top'), status: 'planned', entries: ids.map((itemId, i) => ({ itemId, slot: itemId === 'EL02' ? 'top' : usual(itemId), qty: 1, packed: i < 6 })) });
  const today = zurich();
  data.tables.settings.push({ key: 'homeWindows', value: { eve: { done: today }, week: { done: today } } });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info) {
  const file = info.outputPath('tasche-lernen.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
}
const rec = (page, store, id) =>
  page.evaluate(
    ([s, k]) =>
      new Promise((res) => {
        const q = indexedDB.open('pack-generator');
        q.onsuccess = () => {
          const r = q.result.transaction(s).objectStore(s).get(k);
          r.onsuccess = () => res(r.result);
        };
      }),
    [store, id],
  );
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png` });
};

test('Usual bag - the line names the item, the window changes the usual bag, Undo brings it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  const row = card.locator('[data-ampel-row="tasche"]');
  await expect(row).toContainText(T('Usual bag: you often pack {name} elsewhere', { name: 'Power bank 10000 mAh' }));
  await shot(page, info, 'tasche-zeile');
  await row.locator('button').click();
  const sheet = page.locator('[data-tasche-sheet]');
  await expect(sheet).toBeVisible();
  const r = sheet.locator('[data-tasche-row="EL02"]');
  await expect(r).toContainText(T('On {n} of your last {of} trips in the {bag}', { n: 3, of: 3, bag: T('Seat pack / Tailfin') }));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'tasche-fenster');
  await r.locator('[data-tasche-apply]').click();
  await expect.poll(async () => (await rec(page, 'items', 'EL02')).defaultBag).toBe('seat');
  await expect(sheet).toBeHidden();
  await expect(card.locator('[data-ampel-row="tasche"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(async () => (await rec(page, 'items', 'EL02')).defaultBag).toBe('top');
  await expect(card.locator('[data-ampel-row="tasche"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Usual bag - do not ask again keeps the item out', async ({ page, context }, info) => {
  await start(page, context, info);
  const card = page.locator('[data-ampel]');
  await card.locator('summary').click();
  await card.locator('[data-ampel-row="tasche"] button').click();
  await page.locator('[data-tasche-row="EL02"] [data-tasche-off]').click();
  await expect(page.locator('[data-tasche-sheet]')).toBeHidden();
  await expect(card.locator('[data-ampel-row="tasche"]')).toHaveCount(0);
  expect((await rec(page, 'settings', 'bagLearnOff')).value).toEqual(['EL02']);
  expect((await rec(page, 'items', 'EL02')).defaultBag).toBe('top'); // nothing else changed
});
