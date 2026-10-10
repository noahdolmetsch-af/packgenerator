// Gesamttest round 1, part 2: end-to-end scenarios on the big fictional data set, the way a person
// taps, with a data-integrity check after each (no duplicates, ticks kept, references intact, backup
// before/after equal where expected).
//   S1 day ride · S2 3-day bikepacking with tent and GPX debrief · S3 event with preparation and
//   workshop order · S4 new item → weigh → wardrobe → block → trip · S5 empty app → gear import
//   step 1 → merge → step 2 → first trip · S6 backup round trip · S8 demo clock +12 months.
// Fictional data only (tests/fixtures/gesamttest/make.mjs); Open-Meteo mocked. Failing checks that
// are real findings carry the G-ID of /mnt/project-files/design/gesamttest/befunde-runde1.md.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { start, prepare, openData, importBackup, table, snapshot, integrity, ticks, comparable, fixture, tr, esc, day, P, step1, step2, track, gpxText, gearFile, shot, sideways, brokenWords } from './lib.js';
import { fitRide } from '../../fixtures/fit.js';

const LANG = 'de';
const T = tr(LANG);
// v0.67.0 «Übergänge 1»: the one main button of a trip page sits in the band's main bar (src/lib/ui/MainBar)
const go = (page) => page.locator('.trip-band .mainbar .go');
/**
 * v0.67.0 (U004, U22a): the main button of the last day ends the trip. While the day's riding is
 * still ahead by the plan (the real clock runs here) it asks first: then «Tour beenden» in the sheet.
 * Either way the interstitial «Tour beendet» (#/trip/<id>/ended) comes next.
 */
async function endLastDay(page, trip, label) {
  await expect(go(page)).toHaveText(T(label));
  await go(page).click();
  const sheet = page.locator('dialog.endsheet');
  await expect(page.locator(`dialog.endsheet[open]`).or(page.getByRole('heading', { level: 1, name: T('Trip ended') }))).toBeVisible();
  if (await sheet.isVisible()) await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${esc(encodeURIComponent(trip.id))}/ended$`));
  await expect(page.getByRole('heading', { level: 1, name: T('Trip ended') })).toBeVisible();
}
const noProblems = async (page, where) => expect(integrity(await snapshot(page)), `${where}: data integrity`).toEqual([]);

/** New → Plan a trip: the New trip window. */
async function newTrip(page) {
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  return dlg;
}
/** The trip made last (by createdAt). */
const lastTrip = async (page) => (await table(page, 'trips')).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

/** Tick n unticked items on the packing day (#/pack?day); returns their names. */
async function tickItems(page, n, tripId) {
  const packed = async () => (await table(page, 'trips')).find((t) => t.id === tripId).entries.filter((e) => e.packed).length;
  const was = await packed();
  await page.goto('./#/pack?day');
  const rows = page.locator('.pd ul.items button[aria-pressed]');
  await expect(rows.first()).toBeVisible();
  const names = [];
  for (let k = 0, tapped = 0; tapped < n && k < (await rows.count()); k++) {
    const row = rows.nth(k);
    if ((await row.getAttribute('aria-pressed')) === 'true') continue;
    names.push((await row.textContent()).trim().slice(0, 60));
    const h = await row.elementHandle();
    await h.click();
    await page.waitForFunction((el) => !el.isConnected || el.getAttribute('aria-pressed') === 'true', h);
    tapped++;
    // a person needs a moment to find the next thing; PackDay ignores a second tap on the same spot
    // within 400 ms as a double tap (on purpose), so tap at a human pace here (S2b checks 250 ms)
    await page.waitForTimeout(450);
  }
  // every tap is stored (a tap must never get lost)
  await expect.poll(packed, { message: `${n} taps on the packing day` }).toBe(was + n);
}

test.describe.configure({ timeout: 240_000 });

test('S1 day ride: one tap, pack, ride, debrief', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const before = await table(page, 'trips');
  await page.goto('./#/');
  // v0.46.0: "Day ride" is the first button of "What do you want to do?" (the quick row is gone)
  await page.locator('[data-section="actions"] .grid [data-fn="dayride"]').click();
  await expect(page).toHaveURL(/#\/pack/);
  await expect(page.locator('.made-card')).toContainText(T('Day ride created'));
  await expect.poll(async () => (await table(page, 'trips')).length).toBe(before.length + 1);
  const trip = await lastTrip(page);
  expect(trip).toMatchObject({ days: 1, overnight: 'none' });
  expect(trip.entries.length).toBeGreaterThan(3);
  // no night-only items on a day ride
  const items = await table(page, 'items');
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  expect(trip.entries.filter((e) => (byId[e.itemId]?.sets ?? []).some((s) => ['sleep', 'cook', 'firstaid'].includes(s))).map((e) => e.itemId), 'night items on a day ride').toEqual([]);
  // no gone item comes into a new trip
  expect(trip.entries.filter((e) => byId[e.itemId]?.ownership === 'gone').map((e) => e.itemId), 'gone items on a new trip').toEqual([]);

  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), trip.id);
  await tickItems(page, 3, trip.id);
  await page.reload();
  const stored = (await table(page, 'trips')).find((t) => t.id === trip.id);
  expect(stored.entries.filter((e) => e.packed).length, 'three ticks kept after a reload').toBe(3);

  // On the way → «Tour abschliessen» → «Tour beendet» → «Alles gut» (v0.67.0 Ü5a: a day ride's short debrief)
  await page.goto('./#/ride');
  await page.reload();
  if (stored.startDate === day()) {
    // v0.45.2: the base check waits on the ride page as a reminder; one tap ticks it all
    const check = page.getByRole('region', { name: T('Base check') });
    await check.getByRole('button', { name: T('All with me') }).click();
    await expect(check.getByRole('button', { name: T('All with me') })).toBeHidden();
    await expect.poll(async () => (await table(page, 'trips')).find((t) => t.id === trip.id).ready.every((r) => r.done || r.itemId)).toBe(true);
    await endLastDay(page, trip, 'Finish the trip');
    await page.locator('main .mainbar .btn.hi').click(); // «Alles gut»
    await expect(page.locator('.celebrate.small')).toContainText(T('Debrief saved'));
    await expect.poll(async () => (await table(page, 'debriefs')).find((d) => d.tripId === trip.id)?.status).toBe('done');
    const after = (await table(page, 'trips')).find((t) => t.id === trip.id);
    expect(after.entries.filter((e) => e.packed).length, 'ticks kept after the debrief').toBe(3);
    expect(after.status).toBe('done');
  }
  await noProblems(page, 'S1');
  expect(errors).toEqual([]);
});

test('S2 3-day bikepacking with tent, GPX debrief', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const { summary } = fixture();
  await page.goto('./#/');
  const dlg = await newTrip(page);
  const gravel = fixture().data.tables.bikes.find((b) => b.id === summary.bikeIds[2]);
  await dlg.getByRole('group', { name: T('Bike') }).getByRole('button', { name: gravel.name, exact: true }).click();
  await dlg.getByLabel(T('Start date')).fill(day(-2));
  await dlg.getByRole('button', { name: T('More'), exact: true }).click();
  await dlg.getByRole('spinbutton', { name: T('Days') }).fill('3');
  await dlg.getByRole('button', { name: T('Bivouac + tent'), exact: true }).click();
  await dlg.getByLabel(T('Cooking')).check();
  await dlg.getByRole('button', { name: new RegExp(`^${T('Mild')}`) }).click();
  await dlg.getByLabel(T('Name')).fill(`${P} S2 Zelt 3 Tage`);
  await shot(page, 's2-new-trip');
  await dlg.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click();
  await expect(dlg).toBeHidden();
  const trip = await lastTrip(page);
  expect(trip).toMatchObject({ title: `${P} S2 Zelt 3 Tage`, days: 3, overnight: 'outdoor', cook: true, bikeId: gravel.id });
  const items = await table(page, 'items');
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const sets = new Set(trip.entries.flatMap((e) => byId[e.itemId]?.sets ?? []));
  for (const s of ['sleep', 'cook']) expect(sets.has(s), `the ${s} block on a tent trip`).toBe(true);
  expect(new Set(trip.entries.map((e) => `${e.itemId}|${e.slot}`)).size, 'no item twice in a bag').toBe(trip.entries.length);

  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), trip.id);
  await tickItems(page, 5, trip.id);
  // the trip is on its last day (started 2 days ago): On the way → «Letzten Tag abschliessen» →
  // «Tour beendet» → «Weiter zum Rückblick» (v0.67.0)
  await page.goto('./#/ride');
  await page.reload();
  await endLastDay(page, trip, 'Finish the last day');
  await expect(page.locator('main .mainbar .btn.hi')).toHaveText(T('Continue to Debrief'));
  await page.locator('main .mainbar .btn.hi').click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${esc(trip.id)}`));

  // the recorded ride of day 1 (GPX), saved to this trip
  const gpx = info.outputPath(`${P}s2.gpx`);
  writeFileSync(gpx, gpxText(track({ seed: 42, date: day(-2), km: 55, pauseMin: 30 }), `${P} S2 Tag 1`));
  await page.goto('./#/debrief/ride');
  await page.locator('.pickbtn input[type=file]').setInputFiles(gpx);
  await expect(page.getByRole('button', { name: `${P} S2 Zelt 3 Tage` })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  const ride = (await table(page, 'rides')).find((r) => r.tripId === trip.id);
  expect(ride, 'the ride is saved to the trip').toBeTruthy();
  expect(ride.km).toBeGreaterThan(50);
  expect(ride.pauses.length).toBeGreaterThanOrEqual(1);

  await page.goto(`./#/debrief/${trip.id}`);
  await page.reload();
  await expect(page.getByRole('link', { name: new RegExp(T('Planned vs real')) })).toBeVisible();
  await page.getByRole('button', { name: T('Save debrief') }).first().click();
  await expect.poll(async () => (await table(page, 'debriefs')).find((d) => d.tripId === trip.id)?.status).toBe('done');
  const after = (await table(page, 'trips')).find((t) => t.id === trip.id);
  expect(after.entries.filter((e) => e.packed).length, 'ticks kept').toBe(5);
  // the bike km: the debrief adds the trip km once
  const bikeAfter = (await table(page, 'bikes')).find((b) => b.id === gravel.id);
  expect(bikeAfter.km).toBeGreaterThanOrEqual(gravel.km);
  await noProblems(page, 'S2');
  expect(errors).toEqual([]);
});

test('S2b packing day: two quick taps on two rows both count', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const tripId = fixture().summary.tripIds.tent;
  const packed = async () => (await table(page, 'trips')).find((t) => t.id === tripId).entries.filter((e) => e.packed).length;
  const was = await packed();
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), tripId);
  await page.goto('./#/pack?day');
  await page.reload();
  const open = page.locator('.pd ul.items button[aria-pressed="false"]');
  await expect(open.first()).toBeVisible();
  // tap the first open row, then 250 ms later the row that is now first (it slid into the same place)
  await open.first().click();
  await page.waitForTimeout(250);
  await open.first().click();
  await expect.poll(packed, { message: 'two taps, two ticks' }).toBe(was + 2);
  expect(errors).toEqual([]);
});

test('S3 event with preparation tasks and workshop order', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const { summary } = fixture();
  const hardtail = fixture().data.tables.bikes.find((b) => b.id === summary.bikeIds[0]);
  await page.goto('./#/');
  const dlg = await newTrip(page);
  await dlg.getByRole('group', { name: T('Bike') }).getByRole('button', { name: hardtail.name, exact: true }).click();
  await dlg.getByLabel(T('Start date')).fill(day(14));
  await dlg.getByRole('button', { name: T('2 days'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Hotel/hut'), exact: true }).click();
  await dlg.getByLabel(T('Name')).fill(`${P} S3 Rennen`);
  await dlg.getByLabel(T('Event (race or organised ride)')).check();
  await dlg.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click();
  await expect(dlg).toBeHidden();
  const trip = await lastTrip(page);
  expect(trip).toMatchObject({ event: true, bikeId: hardtail.id, days: 2 });

  // Plan: "Before the trip" counts the bike care of the hardtail
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), trip.id);
  await page.goto('./#/pack');
  await page.reload();
  const before = page.locator('summary, button').filter({ hasText: T('Before the trip') }).first();
  await expect(before).toBeVisible();
  const planLine = (await before.textContent()).replace(/\s+/g, ' ');

  // Bike care, this trip: tick two preparation tasks, open the workshop order
  await page.goto(`./#/bikes?tab=care&trip=${encodeURIComponent(trip.id)}`);
  await page.reload();
  const block = page.locator(`#before-${CSS_ESC(trip.id)}`);
  await expect(block).toBeVisible();
  if (!(await block.evaluate((d) => d.open))) await block.locator('> summary').click();
  const prep = block.locator('details.prep');
  if (!(await prep.evaluate((d) => d.open))) await prep.locator('> summary').click();
  const done = prep.getByRole('button', { name: T('Done|task'), exact: true });
  await expect(done.first()).toBeVisible();
  const open0 = await done.count();
  await done.first().click();
  await expect(done).toHaveCount(open0 - 1);
  await done.first().click();
  await expect(done).toHaveCount(open0 - 2);
  await expect.poll(async () => Object.keys((await table(page, 'trips')).find((t) => t.id === trip.id).prep ?? {}).length).toBe(2);

  const order = block.getByRole('button', { name: new RegExp(esc(T('Workshop order · about CHF {chf}', { chf: '' }).trim())) });
  await expect(order, 'a workshop order for a bike with due work').toBeVisible();
  await order.click();
  const od = page.locator('dialog[open]').filter({ hasText: T('Workshop order') });
  await expect(od).toBeVisible();
  const rows = await od.locator('li').count();
  expect(rows).toBeGreaterThan(0);
  expect((await sideways(page)).sw).toBeLessThanOrEqual((await sideways(page)).w);
  await shot(page, 's3-order');
  await od.getByRole('button', { name: T('Close') }).click();

  // the ticks are kept after a reload, Plan says the same
  await page.reload();
  expect(Object.keys((await table(page, 'trips')).find((t) => t.id === trip.id).prep ?? {}).length).toBe(2);
  info.annotations.push({ type: 'plan-before', description: planLine });
  await noProblems(page, 'S3');
  expect(errors).toEqual([]);
});
const CSS_ESC = (s) => s.replace(/([^a-zA-Z0-9_-])/g, '\\$1');

test('S4 new item, weigh, wardrobe, block, trip', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const NAME = `${P} S4 Regenjacke neu`;
  await page.goto('./#/gear');
  await page.reload();
  // the New button works on every screen (on the phone the inventory is look-up and weigh only)
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Gear item') }).click();
  const dlg = page.locator('dialog[open]');
  await dlg.getByRole('textbox', { name: new RegExp(`^${T('Name')}`) }).fill(NAME);
  await dlg.getByRole('combobox', { name: new RegExp(`^${T('Category')}`) }).selectOption('rain');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect.poll(async () => (await table(page, 'items')).filter((i) => i.name === NAME).length).toBe(1);
  const item = (await table(page, 'items')).find((i) => i.name === NAME);
  expect(item.weightG).toBeNull();

  // weigh: skip to the new item, 245 g
  await page.goto('./#/gear');
  await page.reload();
  await page.getByRole('button', { name: new RegExp(esc(T('{n} without weight · weigh', { n: 'X' })).replace('X', '\\d+')) }).click();
  const weigh = page.locator('section.weigh');
  const name = weigh.locator('.name');
  await expect(name).toBeVisible();
  for (let k = 0; k < 80 && (await name.textContent()).trim() !== NAME; k++) {
    await weigh.getByRole('button', { name: T('Skip') }).click();
    await page.waitForTimeout(60);
  }
  await expect(name).toHaveText(NAME);
  await weigh.getByLabel(T('Weight in grams')).fill('245');
  await weigh.getByRole('button', { name: T('Save & next') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === item.id).weightG).toBe(245);

  // wardrobe: "Noch einordnen" → outer, upper body
  await page.goto('./#/wardrobe');
  await page.reload();
  await page.getByRole('button', { name: T('All|use') }).click().catch(() => {});
  const row = page.locator('li, .row, div').filter({ hasText: NAME }).last();
  await expect(row).toBeVisible();
  // v0.47.0 (Noah 3b): a compact row with a suggestion chip; "anders …" opens layer and zone
  await row.getByRole('button', { name: /^(Andere Schicht oder Zone|Other layer or zone): / }).click();
  await row.getByRole('button', { name: T('Outer|short') }).or(row.getByRole('button', { name: /^Aussen$|^Outer$/ })).first().click();
  await row.getByRole('button', { name: /^Oberkörper$|^Upper body$/ }).first().click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === item.id)).toMatchObject({ layer: 'outer', zone: 'torso' });

  // block: the item into the first own building block ("Rain")
  const setsRec = (await table(page, 'settings')).find((s) => s.key === 'sets').value;
  const rain = setsRec.find((s) => s.key === fixture().summary.blockKeys[0]);
  await page.goto(`./#/gear?q=${encodeURIComponent('S4 Regenjacke')}`);
  await page.reload();
  await page.getByRole('button', { name: T('Select'), exact: true }).click();
  await page.getByRole('checkbox', { name: NAME }).check();
  await page.getByRole('button', { name: T('Into a building block …') }).click();
  const assign = page.locator('dialog[open]');
  await assign.getByRole('combobox').first().selectOption({ label: rain.name });
  await assign.getByRole('button', { name: /^(Zuordnen|Assign)$/ }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === item.id).sets ?? []).toContain(rain.key);

  // trip: a new trip with that block
  await page.goto('./#/');
  const nt = await newTrip(page);
  await nt.getByRole('button', { name: new RegExp(`^\\+ ${esc(rain.name)}`) }).click();
  await nt.getByLabel(T('Name')).fill(`${P} S4 Tour`);
  await nt.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click();
  await expect(nt).toBeHidden();
  const trip = await lastTrip(page);
  expect(trip.title).toBe(`${P} S4 Tour`);
  expect(trip.entries.map((e) => e.itemId), 'the new item comes with its block').toContain(item.id);
  await noProblems(page, 'S4');
  expect(errors).toEqual([]);
});

test('S5 empty app, gear import step 1, merge, step 2, first trip', async ({ page, context }, info) => {
  const errors = await prepare(page, context, LANG);
  await page.goto('./');
  const panel = await openData(page);
  const f1 = gearFile(info, 'step1.json', step1());
  await panel.locator('input[type=file]').setInputFiles(f1);
  await panel.getByRole('dialog', { name: T('Check import') }).getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);
  await shot(page, 's5-step1');
  // G001 (fixed in 0.45.1): the second line of the same item waits under "Unsure", never a second item
  await expect(page.locator('ul.rows.unsure li').filter({ hasText: T('is twice in the file') })).toHaveCount(3);
  await page.getByRole('button', { name: T('Apply all safe ones') }).click();
  await expect(page.getByRole('button', { name: T('Undo') }).first()).toBeVisible();
  const items = await table(page, 'items');
  // the broken row without a name is left out; everything else is there once
  expect(items.some((i) => !String(i.name ?? '').trim()), 'an item without a name').toBe(false);
  const norm = (s) => String(s).replace(P, '').trim().toLowerCase();
  const names = items.map((i) => norm(i.name));
  const dups = names.filter((n, k) => names.indexOf(n) !== k);
  expect.soft(dups, 'G001: rows that are the same item twice in the file become two items').toEqual([]);
  if (dups.length) {
    await page.goto(`./#/gear?q=${encodeURIComponent(dups[0])}`);
    await page.reload();
    await shot(page, 's5-doubles');
  }
  // weights that are text or 0 are not stored as numbers
  for (const i of items) if (i.weightG != null) expect(Number.isFinite(i.weightG) && i.weightG > 0, `${i.name}: weight ${i.weightG}`).toBe(true);
  for (const i of items) expect(i.qty >= 1, `${i.name}: quantity ${i.qty}`).toBe(true);
  for (const i of items) expect(Array.isArray(i.domains), `${i.name}: areas`).toBe(true);
  expect((await table(page, 'learnings')).filter((l) => l.sourceId === 'GTP-L01').length, 'a learning twice in the file is stored once').toBe(1);

  // merge the duplicates in Gear (item → Merge with …); v0.45.1 (G014a) on the phone too
  const twice = [...new Set(dups)];
  for (const n of twice) {
    const both = (await table(page, 'items')).filter((i) => norm(i.name) === n && i.ownership !== 'gone');
    if (both.length < 2) continue;
    await page.goto(`./#/gear?q=${encodeURIComponent(n)}&item=${encodeURIComponent(both[1].id)}`);
    await page.reload();
    const dlg = page.locator('dialog[open]');
    await expect(dlg).toBeVisible();
    await dlg.getByRole('button', { name: T('Merge with …') }).click();
    const sheet = page.locator('dialog[open]').last();
    await sheet.getByRole('button', { name: T('Merge|items'), exact: true }).click();
    await expect.poll(async () => (await table(page, 'items')).filter((i) => norm(i.name) === n && i.ownership !== 'gone').length).toBe(1);
  }

  // step 2: the same file again with kits, blocks, tasks, old trips
  await page.goto('./#/');
  const p2 = await openData(page);
  const f2 = gearFile(info, 'step2.json', step2());
  await p2.locator('input[type=file]').setInputFiles(f2);
  await p2.getByRole('dialog', { name: T('Check import') }).getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);
  await shot(page, 's5-step2');
  const countBefore = (await table(page, 'items')).filter((i) => i.ownership !== 'gone').length;
  const tab2 = page.getByRole('tab', { name: /Schritt 2|Step 2|Bausteine|Kits/ }).or(page.getByRole('button', { name: /Schritt 2|Step 2/ }));
  if (await tab2.count()) await tab2.first().click();
  const apply2 = page.getByRole('button', { name: /übernehmen|Apply/i }).first();
  await apply2.click();
  await page.waitForTimeout(800);
  const after = await table(page, 'items');
  expect(after.filter((i) => i.ownership !== 'gone').length, 'step 2 adds no copies of step-1 items').toBeLessThanOrEqual(countBefore + 3);
  const sets = (await table(page, 'settings')).find((s) => s.key === 'sets')?.value ?? [];
  info.annotations.push({ type: 'step2-sets', description: JSON.stringify(sets.map((s) => [s.key, s.name, s.minC, s.maxC])) });

  // first trip: a bike is needed; the dialog adds one inline
  await page.goto('./#/pack');
  await page.reload();
  const create = page.getByRole('button', { name: T('Create a trip') });
  if (await create.count()) await create.click();
  else await newTrip(page);
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  const addBike = dlg.getByRole('button', { name: `+ ${T('Add a bike')}` });
  if (await addBike.count()) {
    await addBike.click();
    await dlg.getByLabel(T('Name of the bike')).fill(`${P} S5 Velo`);
    await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
    // the new bike is chosen before the trip is made (under load the save can take a moment)
    await expect(dlg.getByRole('button', { name: `${P} S5 Velo` })).toHaveAttribute('aria-pressed', 'true');
  }
  // a click that lands while the dialog still settles is tried again (stable under CI load)
  await expect(async () => {
    if ((await dlg.isVisible()) && !(await table(page, 'trips')).length) await dlg.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click({ timeout: 3000 });
    await expect(dlg).toBeHidden({ timeout: 3000 });
  }).toPass({ timeout: 20_000 });
  const trips = await table(page, 'trips');
  expect(trips.length).toBe(1);
  expect(trips[0].entries.length, 'the first trip has items from the import').toBeGreaterThan(0);
  await noProblems(page, 'S5');
  expect(errors).toEqual([]);
});

/** Short list of what differs between the file's records and the stored ones (by id, by field). */
function changes(before, after) {
  const by = (rows) => new Map(rows.map((r) => [String(r.id ?? r.tripId ?? r.key), r]));
  const a = by(after), out = [];
  for (const [id, r] of by(before)) {
    const s = a.get(id);
    if (!s) { out.push(`${id} gone`); continue; }
    for (const k of new Set([...Object.keys(r), ...Object.keys(s)])) {
      if (JSON.stringify(r[k]) === JSON.stringify(s[k])) continue;
      if (k === 'entries') {
        const ids = (es) => (es ?? []).map((e) => e.itemId);
        const lost = ids(r[k]).filter((x) => !ids(s[k]).includes(x));
        out.push(`${id}.entries lost [${lost.join(',')}]`);
      } else out.push(`${id}.${k}`);
    }
  }
  return out.slice(0, 12).join('; ') + (out.length > 12 ? ` (+${out.length - 12})` : '');
}

test('S6a import keeps the records as they are in the file', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const fix = fixture().data.tables;
  const db1 = await snapshot(page);
  // v0.66.0: the one-time update «Bausteine neu» (blocksplit.js) runs on an old file. It only adds:
  // the old block keys stay and the new ones come after them, a Warm item gets coldBelow, and the
  // marker split2026. Check that, then compare the rest as it is in the file.
  const fixItems = new Map(fix.items.map((i) => [i.id, i]));
  db1.items = db1.items.map((i) => {
    const f = fixItems.get(i.id);
    if (!f || f.split2026 || !i.split2026) return i;
    expect.soft(i.sets?.slice(0, f.sets?.length ?? 0), `${i.id}: the old blocks stay`).toEqual(f.sets ?? []);
    const { split2026, coldBelow, ...rest } = i;
    return { ...rest, sets: f.sets, ...(f.coldBelow !== undefined ? { coldBelow } : {}) };
  });
  // the import keeps the user's records as they are (only the app's own markers are added)
  for (const name of ['items', 'debriefs', 'learnings', 'notes', 'rides', 'visits', 'maintenance', 'events', 'containers', 'trips', 'bikes'])
    expect.soft(comparable({ [name]: db1[name] })[name], `import changed ${name}: ${changes(fix[name], db1[name])}`).toEqual(comparable({ [name]: fix[name] })[name]);
  expect(errors).toEqual([]);
});

// 'tips' is the app's own "tip of the day" memory, rewritten whenever Today is shown: not user data.
// v0.45.1 (G015a): it is no longer in a backup; the stored data is compared without it.
const noTips = (db) => ({ ...db, settings: db.settings.filter((r) => r.key !== 'tips') });

test('S6 backup round trip: export, replace, export again, merge', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const db1 = await snapshot(page);
  const panel = await openData(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: T('Export backup') }).click()]);
  const path = info.outputPath('export1.json');
  await dl.saveAs(path);
  const exp1 = JSON.parse(readFileSync(path, 'utf8'));
  expect(Object.keys(exp1.tables).sort()).toEqual(Object.keys(db1).sort());
  expect(exp1.tables.settings.map((r) => r.key), 'G015a: the backup holds no tips memory').not.toContain('tips');
  expect(comparable(exp1.tables), 'export = stored data').toEqual(comparable(noTips(db1)));

  await importBackup(page, info, exp1, { lang: LANG, name: 'export1.json' });
  await page.waitForTimeout(800);
  const db2 = await snapshot(page);
  expect(comparable(noTips(db2)), 'export → replace → the same data').toEqual(comparable(noTips(db1)));
  expect(ticks(db2)).toEqual(ticks(db1));
  await noProblems(page, 'S6');

  // G015a: Today shown again (the tips memory is written), a second export is the same as the first
  await page.goto('./#/');
  await page.reload();
  await page.waitForTimeout(800);
  const panel2 = await openData(page);
  const [dl2] = await Promise.all([page.waitForEvent('download'), panel2.getByRole('button', { name: T('Export backup') }).click()]);
  const path2 = info.outputPath('export2.json');
  await dl2.saveAs(path2);
  const exp2 = JSON.parse(readFileSync(path2, 'utf8'));
  expect(comparable(exp2.tables), 'G015a: two backups without a change are the same').toEqual(comparable(exp1.tables));

  // merge the same file again: nothing doubles, nothing changes
  await importBackup(page, info, exp1, { lang: LANG, name: 'export1.json', mode: 'merge' });
  await page.waitForTimeout(800);
  const db3 = await snapshot(page);
  for (const name of Object.keys(db1)) {
    const key = name === 'debriefs' ? 'tripId' : name === 'settings' ? 'key' : name === 'flowChecks' ? 'day' : 'id';
    const ids = (db) => db[name].map((r) => String(r[key]));
    const extra = ids(db3).filter((k) => !ids(db1).includes(k) && k !== 'tips');
    expect(new Set(ids(db3)).size, `merge twice: ${name} has no doubles`).toBe(ids(db3).length);
    expect(extra, `merge twice: new ${name} records`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('S8 demo clock +12 months', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const db1 = await snapshot(page);
  await page.evaluate(() => localStorage.setItem('demo.clockOffset', String(365 * 864e5)));
  const pages = ['#/', '#/pack', '#/pack/past', '#/debrief', '#/review', '#/gear', '#/wardrobe', '#/bikes', '#/care', '#/inbox', '#/pack/templates'];
  for (const h of pages) {
    const n = errors.length;
    await page.goto(`./${h}`);
    await page.reload();
    await page.waitForTimeout(700);
    expect.soft(errors.slice(n), `${h} a year later: errors`).toEqual([]);
    const s = await sideways(page);
    expect.soft(s.sw, `${h} a year later: sideways`).toBeLessThanOrEqual(s.w);
  }
  const shifted = await page.evaluate(() => new Date().getFullYear());
  expect(shifted).toBe(new Date().getFullYear() + 1);
  await page.goto('./#/');
  await page.reload();
  await shot(page, 's8-today');
  // every planned trip is over now: they wait for a debrief; the "Last 12 months" count none of the old ones
  await page.goto('./#/review');
  await page.reload();
  await shot(page, 's8-review');
  // only looking must not change the user's records
  const db2 = await snapshot(page);
  for (const name of ['items', 'trips', 'debriefs', 'learnings', 'notes', 'rides', 'bikes'])
    expect.soft(comparable({ [name]: db2[name] })[name], `a year later, only looking changed ${name}`).toEqual(comparable({ [name]: db1[name] })[name]);
  await noProblems(page, 'S8');
  await page.evaluate(() => localStorage.removeItem('demo.clockOffset'));
});

/* ---------- v0.69.1 Gesamttest-Runde: the 0.68 ride ledger and the 0.69 Velo-Blätter on the big data set ---------- */

/** A Strava CSV date («Oct 9, 2026, 7:00:00 AM», UTC) for a Zurich calendar day and an hour. */
const stravaDate = (iso, h) => {
  const d = new Date(`${iso}T${String(h).padStart(2, '0')}:00:00Z`);
  return `"${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${h % 12 || 12}:00:00 ${h < 12 ? 'AM' : 'PM'}"`;
};

test('S9 import rides: a ride type rule places the ride, take over, undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const { summary } = fixture();
  const [HT, , GRAVEL] = summary.bikeIds;
  const bikes0 = await table(page, 'bikes');
  const name = Object.fromEntries(bikes0.map((b) => [b.id, b.name]));
  // the migrated counters start their ledgers on bike.kmDate (fixture: 2 to 5 days ago): rides after that
  const csv = [
    'Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Distance,Commute,Activity Gear',
    `9101,${stravaDate(day(0), 6)},${P} Albis gravel,Gravel Ride,7200,41.2,false,${name[GRAVEL]}`,
    `9102,${stravaDate(day(0), 15)},${P} Trail abend,Mountain Bike Ride,3000,14.0,false,`,
    `9103,${stravaDate(day(0), 5)},${P} Arbeitsweg,Ride,1800,9.5,true,`,
    `9104,${stravaDate(day(0), 17)},${P} Lauf,Run,1800,8.0,false,`,
  ].join('\n');
  const csvFile = info.outputPath('activities.csv');
  writeFileSync(csvFile, csv);
  const fitFile = info.outputPath('gravel.fit');
  writeFileSync(fitFile, fitRide({ start: `${day(0)}T12:00:00Z`, km: 33.3, profile: `${P} Sonst`, subSport: 46 }));

  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  await page.getByRole('link', { name: T('Import rides') }).or(page.getByRole('button', { name: T('Import rides') })).first().click();
  await expect(page).toHaveURL(/view=import/);
  await page.getByLabel(T('Choose files')).setInputFiles([csvFile, fitFile]);
  const check = page.locator('section.check');
  // without a rule the type decides nothing: the MTB ride, the commute and the FIT ride wait in «Check»
  await expect(check.locator('li.ir')).toHaveCount(3);
  // a ride type rule, made here (nothing is pre-filled): Mountain Bike Ride → Hardtail, Gravel Ride → Gravel
  for (const [type, bike] of [['Mountain Bike Ride', HT], ['Gravel Ride', GRAVEL]]) {
    await page.getByRole('button', { name: `+ ${T('Rule')}` }).click();
    const nr = page.locator('.newrule');
    await nr.locator('select').selectOption('type');
    await nr.getByLabel(T('Ride type, as in Strava (e.g. Gravel Ride)')).fill(type);
    await nr.getByRole('button', { name: name[bike] }).click();
    await nr.getByRole('button', { name: T('Add') }).click();
  }
  const rules = page.locator('ol.rules');
  await expect(rules).toContainText(T('Ride type «{type}»', { type: 'Mountain Bike Ride' }));
  await expect(rules).toContainText(T('Ride type «{type}»', { type: 'Gravel Ride' }));
  // only the commute («Ride», no rule) is left to check; the rules are stored with the backup
  await expect(check.locator('li.ir')).toHaveCount(1);
  await expect(check).toContainText(`${P} Arbeitsweg`);
  expect((await table(page, 'settings')).find((x) => x.key === 'kmRules').value.map((r) => [r.kind, r.value, r.bikeIds])).toEqual([['type', 'Mountain Bike Ride', [HT]], ['type', 'Gravel Ride', [GRAVEL]]]);
  const ht = page.locator(`section.pb[aria-labelledby="pb-${HT}"]`);
  await ht.getByRole('button', { name: T('show') }).click().catch(() => {});
  await expect(ht).toContainText(T('Ride type rule'));
  expect(await brokenWords(page), 'import: words broken in the middle').toEqual([]);
  await shot(page, 's9-import');
  await page.getByRole('button', { name: T('Take over'), exact: true }).click();
  await expect(page).toHaveURL(/tab=care/);
  const mine = async () => (await table(page, 'kmBook')).filter((e) => e.importId);
  await expect.poll(async () => (await mine()).length).toBe(4);
  const got = Object.fromEntries((await mine()).map((e) => [e.name || e.source, [e.bikeId, e.by, e.state, e.type]]));
  expect(got).toEqual({
    [`${P} Albis gravel`]: [GRAVEL, 'gear', 'counted', 'Gravel Ride'],
    [`${P} Trail abend`]: [HT, 'type', 'counted', 'Mountain Bike Ride'],
    [`${P} Arbeitsweg`]: [null, null, 'open', 'Ride'],
    fit: [GRAVEL, 'type', 'counted', 'Gravel Ride'],
  });
  const km = async (id) => (await table(page, 'bikes')).find((b) => b.id === id).km;
  expect(await km(GRAVEL)).toBe(Math.round(bikes0.find((b) => b.id === GRAVEL).km + 41.2 + 33.3));
  expect(await km(HT)).toBe(bikes0.find((b) => b.id === HT).km + 14);
  // Undo on the bike page takes it all back
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(async () => (await mine()).length).toBe(0);
  expect(await km(GRAVEL)).toBe(bikes0.find((b) => b.id === GRAVEL).km);
  expect(await km(HT)).toBe(bikes0.find((b) => b.id === HT).km);
  await noProblems(page, 'S9');
  expect(errors).toEqual([]);
});

// the sheets in the folder's order, read from the app source (sheets.js imports the Svelte i18n, so it is read as text)
const SHEETS_SRC = readFileSync(new URL('../../../src/lib/sheets.js', import.meta.url), 'utf8');
const SHEETS = [...SHEETS_SRC.slice(SHEETS_SRC.indexOf('export const SHEETS'), SHEETS_SRC.indexOf('];', SHEETS_SRC.indexOf('export const SHEETS'))).matchAll(/\{ key: '(\w+)', name: '([^']+)'/g)].map((m) => ({ key: m[1], name: m[2] }));

test('S10 Velo-Blaetter: every sheet, copy as text, pick-up check into care, undo', async ({ page, context }, info) => {
  await context.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(Navigator.prototype, 'clipboard', { value: { writeText: async (s) => window.__copied.push(s) }, configurable: true });
  });
  const errors = await start(page, context, info, { lang: LANG });
  const { summary } = fixture();
  const GRAVEL = summary.bikeIds[2];
  const bike0 = (await table(page, 'bikes')).find((b) => b.id === GRAVEL);
  expect(SHEETS.length).toBeGreaterThanOrEqual(4);
  for (const sh of SHEETS) {
    await page.goto(`./#/bikes?bike=${GRAVEL}&sheet=${sh.key}`);
    await expect(page.locator('main')).toContainText(T(sh.name));
    await page.getByRole('button', { name: T('Copy text') }).click();
    await expect.poll(() => page.evaluate(() => window.__copied.length)).toBeGreaterThan(0);
    const text = await page.evaluate(() => window.__copied.at(-1));
    // the copied text starts with the sheet and names the bike; km as the app shows them
    expect(text.split('\n')[0].length, `${sh.key}: copied text`).toBeGreaterThan(3);
    expect(text, `${sh.key}: the bike`).toContain(bike0.name);
    expect(await brokenWords(page), `${sh.key}: words broken in the middle`).toEqual([]);
    const s = await sideways(page);
    expect(s.sw, `${sh.key}: sideways`).toBeLessThanOrEqual(s.w);
  }
  // Pick-up check: tick the first job, take the ticked work into care, then undo
  await page.goto(`./#/bikes?bike=${GRAVEL}&sheet=pickup`);
  const boxes = page.locator('main label.ck input[type=checkbox]');
  await boxes.first().check();
  await expect(page.getByRole('button', { name: T('Take the ticked work into care') })).toBeEnabled();
  const histories = async () => ((await table(page, 'bikes')).find((b) => b.id === GRAVEL).parts ?? []).reduce((n, p) => n + (p.history ?? []).length, 0);
  const h0 = await histories();
  await page.getByRole('button', { name: T('Take the ticked work into care') }).click();
  await expect.poll(histories).toBeGreaterThan(h0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(histories).toBe(h0);
  await noProblems(page, 'S10');
  expect(errors).toEqual([]);
});

test('S11 Setup: the chosen bike tab is fully in view; a cut row fades instead of a hard edge (G008)', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { lang: LANG });
  const { summary } = fixture();
  for (const id of summary.bikeIds) {
    await page.goto(`./#/bikes?bike=${id}`);
    const strip = page.locator('.strip[role="tablist"]');
    const sel = strip.locator('[aria-selected="true"]');
    await expect(sel).toBeVisible();
    await expect
      .poll(async () => {
        const [a, b] = await Promise.all([sel.boundingBox(), strip.boundingBox()]);
        return a.x >= b.x - 1 && a.x + a.width <= b.x + b.width + 1;
      }, { message: `${id}: chosen tab inside the row` })
      .toBe(true);
    // a row scrolled away from its start fades at the left (no tab cut hard at the edge)
    const st = await strip.evaluate((el) => ({ left: el.scrollLeft, less: el.classList.contains('less') }));
    expect(st.less, `${id}: fade at the left when scrolled`).toBe(st.left > 2);
  }
  expect(errors).toEqual([]);
});
