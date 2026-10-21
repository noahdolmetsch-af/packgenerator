// v0.144.0 RE «Regeln einheitlich» (mockups RE1–RE3, Noah 14.10.2026 «1a 2a 3a 4a 5a», «RE1–RE3 freigegeben»):
// - RE1: one rain limit, set in Bausteine › Regen (standard 30 %); Packen says «40 % Regen», suggests Regen and
//   names why the rain jacket is on the list; a new limit counts at once on the other pages;
// - RE2: the debrief starts with nothing ticked; the one button says «Fertig · N von M übernehmen»;
// - RE3: the card «Pflege für …» above the parts: switch a care off, own interval (km and/or days), a note, reset.
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
// SHOTS=<folder> saves the screenshots for Noah (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { PHONE_ROWS } from '../../src/lib/touren/kurz.js';

// the lists come from the app source (they need Svelte, so they are read as text)
const src = (f) => readFileSync(fileURLToPath(new URL(`../../src/lib/${f}`, import.meta.url)), 'utf8');
const RAIN_LIMIT = Number(src('rainlimit.svelte.js').match(/export const RAIN_LIMIT = (\d+);/)[1]);
const CARE = [...src('care/plan.js').matchAll(/\{ key: '(\w+)', kind: '(\w+)', parts: \[([^\]]*)\], name: '([^']+)'/g)].map((m) => ({ key: m[1], kind: m[2], parts: [...m[3].matchAll(/'(\w+)'/g)].map((x) => x[1]), name: m[4] }));

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const RAIN_TRIP = 'test_data_gtp_herbst';
const PAST = 'test_data_gtp_past';
const GRAVEL = 'test_data_gtp_gravel';
const JACKET = 'test_data_gtp_KL05';

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/regeln-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const ev = data.tables.trips[0];
  // RE1: a weekend tomorrow with 40 % rain (over the limit), the packing weather still «none»
  data.tables.trips.push({
    ...ev, id: RAIN_TRIP, title: 'test_data_gtp_ Herbstrunde Emmental', startDate: day(1), days: 2, event: false, bikeId: GRAVEL, bike: 'test_data_gtp_ Gravel Grinder',
    createdAt: `${day(-1)}T08:00:00.000Z`, wx: { min: 8, max: 15, rain: 'none', rainPct: 40 },
    entries: [...ev.entries.filter((e) => e.itemId !== JACKET).map((e) => ({ ...e, packed: false })), { itemId: JACKET, slot: 'seat', qty: 1, packed: false, src: 'context' }],
  });
  // RE2: a debrief begun on the past day ride: two things were missing that are not in the gear
  data.tables.debriefs.push({
    tripId: PAST, status: 'draft', weather: 'planned', amount: null, bags: null, note: 'test_data_gtp_ Windweste reicht bei 20 Grad', items: {},
    missing: [{ id: 'm1', name: 'test_data_gtp_ Stirnlampe' }, { id: 'm2', name: 'test_data_gtp_ Kettenoel' }],
    applied: [], km: null, kmApplied: 0, createdAt: `${day(-19)}T18:00:00.000Z`, updatedAt: `${day(-19)}T18:00:00.000Z`,
  });
  // RE3: the Gravel Grinder with its chain waxed 288 km ago
  const gravel = data.tables.bikes.find((b) => b.id === GRAVEL);
  gravel.parts = [{ key: 'chain', model: '', history: [{ date: day(-25), km: gravel.km - 288, action: 'service', result: 'done', by: 'self', note: '' }] }];
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto(hash);
  return errors;
}

const dbAll = (page, store) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    store,
  );
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  await (el ? el.screenshot({ path }) : page.screenshot({ path, fullPage: true }));
}

test('RE1: one rain limit, Pack names it and the rain jacket, a new limit counts at once', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './');
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), RAIN_TRIP);
  await page.goto('./#/pack');
  const main = page.locator('main');
  // the trip head says the rain chance, not «trocken»
  await expect(main.locator('.trip-band')).toContainText(T('{n} % rain', { n: 40 }));
  // the rain jacket is on the list with its reason (and can be taken out like any row)
  await expect(main.getByText(T('{n} % rain · rain from {limit} %', { n: 40, limit: RAIN_LIMIT })).first()).toBeVisible();
  expect(await noSideways(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'packen');
  // Packen: the block Regen is suggested with the limit and the way to the rule
  await page.goto('./#/pack?day');
  const hint = main.locator('[data-rain-limit]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(T('Rain from {limit} %', { limit: RAIN_LIMIT }));
  await expect(hint.getByRole('link', { name: T('Change rule') })).toHaveAttribute('href', '#/blocks');
  expect(await noSideways(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'packen-bausteine');

  // Bausteine › Regen: the box says the limit counts everywhere
  await page.goto('./#/blocks');
  const rainRow = main.locator('button.sitrow', { has: page.locator('#blk-rain') });
  // Impeccable 0.174: empty blocks wait in a fold «n leere Bausteine»; open it when Regen is in there
  const fold = main.locator('details', { has: page.locator('#blk-rain') });
  await expect(page.locator('#blk-rain')).toHaveCount(1);
  if (await fold.count()) await tap(fold.locator('summary').first(), info);
  await tap(rainRow, info);
  const sheet = page.locator('dialog.rsheet[open]');
  const box = sheet.locator('[data-rain-everywhere]');
  await expect(box).toContainText(T('Counts everywhere in the app:'));
  await expect(box).toContainText(T('One limit for everything: from {n} % a trip counts as wet.', { n: RAIN_LIMIT }));
  await shot(page, info, 'regen-block', sheet.locator('form'));
  // 50 %: the 40 % trip is no longer wet anywhere
  await sheet.getByLabel(T('Limit')).fill('50');
  await expect(box).toContainText(T('One limit for everything: from {n} % a trip counts as wet.', { n: 50 }));
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toHaveCount(0);
  await page.goto('./#/pack');
  await expect(main.locator('.trip-band')).not.toContainText(T('{n} % rain', { n: 40 }));
  await expect(main.getByText(T('{n} % rain · rain from {limit} %', { n: 40, limit: 50 }))).toHaveCount(0);
  await page.goto('./#/pack?day');
  await expect(main.locator('.pblocks')).toBeVisible();
  await expect(main.locator('[data-rain-limit]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('RE2: the debrief starts with nothing ticked; the button counts what is taken over', async ({ page, context }, info) => {
  const errors = await start(page, context, info, `./#/debrief/${PAST}`);
  const main = page.locator('main');
  const more = main.locator('.moresugs');
  await expect(more).toBeVisible();
  const boxes = more.getByRole('checkbox');
  const m = await boxes.count();
  expect(m).toBeGreaterThan(1);
  for (let i = 0; i < m; i++) await expect(boxes.nth(i)).not.toBeChecked();
  await expect(more).toContainText(T('{n} of {m} ticked', { n: 0, m }));
  await expect(more).toContainText(T('Nothing is ticked to start with. Tick what you want to take over; the rest stays as it is.'));
  const done = page.locator('[data-done-take]');
  await expect(done).toHaveText(T('Done · take over nothing'));
  await shot(page, info, 'rueckblick-leer');
  // tick the first wish: one of M
  const wish = more.locator('label.chk', { hasText: 'test_data_gtp_ Stirnlampe' }).first();
  await tap(wish.getByRole('checkbox'), info);
  await expect(more).toContainText(T('{n} of {m} ticked', { n: 1, m }));
  await expect(done).toHaveText(T('Done · take over {n} of {m}', { n: 1, m }));
  await shot(page, info, 'rueckblick');
  await tap(done, info);
  // only the ticked suggestion was taken over
  await expect.poll(async () => (await dbAll(page, 'debriefs')).find((d) => d.tripId === PAST)?.status).toBe('done');
  const wishes = (await dbAll(page, 'items')).filter((i) => i.ownership === 'wishlist').map((i) => i.name);
  expect(wishes.some((n) => n.includes('Stirnlampe'))).toBe(true);
  expect(wishes.some((n) => n.includes('Kettenoel'))).toBe(false);
  expect(errors).toEqual([]);
});

test('RE3: Care for the bike: switch off, own interval in km and days, a note, reset', async ({ page, context }, info) => {
  const errors = await start(page, context, info, `./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  const card = page.locator(`#care-${GRAVEL} [data-care-plan]`);
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toHaveText(T('Care for {bike}', { bike: 'test_data_gtp_ Gravel Grinder' }));
  // a gravel bike has no suspension: fork and shock are not offered
  const fitting = CARE.filter((c) => !['fork', 'shock'].includes(c.key));
  // Gesamttest 21.10.2026 C7 (changed on purpose): on a phone five cares first, the rest after «n weitere zeigen»
  if (info.project.name === 'phone') {
    await expect(card.locator('li[data-care]')).toHaveCount(PHONE_ROWS);
    await card.locator('[data-care-plan-more]').click();
  }
  await expect(card.locator('li[data-care]')).toHaveCount(fitting.length);
  await expect(card.locator('.foot')).toContainText(T('{on} of {n} on', { on: fitting.length, n: fitting.length }));
  const wax = card.locator('li[data-care="wax"]');
  await expect(wax).toContainText(T('every {v}', { v: '150 km' }));
  await expect(wax).toContainText(T('Standard'));

  // the sealant off: no reminder, stored on the part
  const seal = card.locator('li[data-care="sealant"]');
  await tap(seal.getByRole('switch'), info);
  await expect(seal).toContainText(T('off: no reminder'));
  await expect.poll(async () => (await dbAll(page, 'bikes')).find((b) => b.id === GRAVEL).parts.find((p) => p.key === 'tyres')?.everyDays).toBeNull();

  // the chain: every 300 km and/or 30 days, with a note
  await tap(wax.locator('button.main'), info);
  const sheet = page.locator('dialog[data-care-sheet][open]');
  await expect(sheet.getByRole('heading')).toHaveText(T('Wax the chain'));
  await sheet.getByLabel(T('Every … km')).fill('300');
  await sheet.getByLabel(T('Every … days')).fill('30');
  await sheet.getByLabel(T('Note|care')).fill('test_data_gtp_ Heisswachs');
  await shot(page, info, 'pflege-blatt', sheet.locator('form'));
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(wax).toContainText(T('every {a} or {b}, whichever comes first', { a: '300 km', b: T('{n} days', { n: 30 }) }));
  await expect(wax).toContainText(T('changed by you'));
  await expect(wax).toContainText('test_data_gtp_ Heisswachs');
  const chain = (await dbAll(page, 'bikes')).find((b) => b.id === GRAVEL).parts.find((p) => p.key === 'chain');
  expect(chain).toMatchObject({ everyKm: 300, everyDays: 30 });
  expect(chain.history).toHaveLength(1);
  expect(await noSideways(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'pflege', card);

  // all back to the standard: the numbers go, the note stays
  await tap(card.getByRole('button', { name: T('Reset all to the standard') }), info);
  await expect(wax).toContainText(T('every {v}', { v: '150 km' }));
  await expect(seal).not.toContainText(T('off: no reminder'));
  await expect(card.locator('.foot')).toContainText(T('{on} of {n} on', { on: fitting.length, n: fitting.length }));
  await expect(wax).toContainText('test_data_gtp_ Heisswachs');
  expect(errors).toEqual([]);
});
