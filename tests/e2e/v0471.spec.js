// v0.47.1 (Noah tested a day ride, dry, 10–16 °C, 2 h, on the trip page): fictional data only (test_data_gtp_).
// a) The top trip card shows the duration; date, bike, weather and duration are chips that change the value in place.
// b) A one-day ride without a night shows no «Dauer 1 Tag, keine Übernachtung» field, and the made-card
//    does not repeat what the top card shows.
// c) «Ans Wetter angepasst» has one row of quick ranges (the weather presets) and dry/rain, one tap with Undo.
// d) The forecast range stays as the forecast says (it was rounded to the nearest preset: 10–16 became 10–18),
//    and the trip says where its range comes from.
// SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { v038Data, SPARK } from './v038-fixture.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const shots = process.env.SHOTS;

// A plain file name (some test titles with «» made the import of the file silently do nothing).
const plainPath = (info, name) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  return `${info.project.outputDir}/v0471-${name}-${info.testId}.json`;
};

function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const path = plainPath(info, 'fixture');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

/** Open-Meteo answer: 16 days from today (Zurich), 10–16 °C and dry. */
function meteo() {
  const day0 = new Date(`${day(0)}T00:00:00Z`);
  const time = Array.from({ length: 16 }, (_, n) => new Date(day0.getTime() + n * 864e5).toISOString().slice(0, 10));
  return { daily: { time, temperature_2m_min: time.map(() => 10.2), temperature_2m_max: time.map(() => 15.8), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) } };
}

async function start(page, context, info, { forecast = false, file = fixtureFile(info) } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  if (forecast) await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => route.fulfill({ json: meteo() }));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

/** A day ride in one tap (the «Tagestour» button of Today sends this event). */
async function dayRide(page) {
  await page.goto('./#/pack');
  await expect(page.locator('.trip-band')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.made-card')).toBeVisible();
  await expect.poll(async () => (await allTrips(page)).length).toBe(3);
  return (await allTrips(page)).find((x) => x.id !== `${P}event` && x.id !== `${P}past`);
}

const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));
const tripById = async (page, id) => (await allTrips(page)).find((x) => x.id === id);
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const band = (page) => page.locator('.trip-band');
const fact = (page, name) => band(page).getByRole('button', { name: new RegExp(`^${name}`) });

test('shots: the trip page of a day ride (SHOTS only)', async ({ page, context }, info) => {
  test.skip(!shots, 'only with SHOTS=<folder>');
  await start(page, context, info);
  await dayRide(page);
  await page.waitForTimeout(400);
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/trip-${info.project.name}.png`, fullPage: true });
});

test('a: the top card shows the duration; date, duration, weather and bike change in place with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const ride = await dayRide(page);
  // The last day ride (fictional fixture) had 3 h: the duration is in the top card as hours.
  await expect(band(page).locator('[data-fact="duration"]')).toHaveText('3 h');
  for (const name of ['Datum', 'Dauer', 'Velo', 'Wetter']) {
    const chip = fact(page, name);
    await expect(chip).toBeVisible();
    if (info.project.name === 'phone') expect((await chip.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }

  // Duration: one tap on 5 h; the amounts follow (context change), Undo in the sheet takes it back.
  await tap(fact(page, 'Dauer'), info);
  let sheet = page.getByRole('dialog', { name: 'Dauer ändern' });
  await expect(sheet.getByRole('button', { name: '3 h', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tap(sheet.getByRole('button', { name: '5 h', exact: true }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).hours).toBe(5);
  await expect(band(page).locator('[data-fact="duration"]')).toHaveText('5 h');
  await expect(page.locator('.wxcard .change-note')).toContainText('→');
  if (shots) await page.screenshot({ path: `${shots}/sheet-duration-${info.project.name}.png` });
  expect(await noSideScroll(page)).toBe(true);
  await tap(sheet.getByRole('button', { name: 'Rückgängig' }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).hours).toBe(3);
  await tap(sheet.getByRole('button', { name: 'Fertig' }), info);
  await expect(sheet).toBeHidden();

  // Weather: a preset in one tap.
  await tap(fact(page, 'Wetter'), info);
  sheet = page.getByRole('dialog', { name: 'Wetter ändern' });
  await tap(sheet.getByRole('button', { name: /^Warm/ }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).wx).toMatchObject({ min: 16, max: 24, rain: 'none' });
  await expect(sheet.locator('[data-wx-source]')).toHaveText('Vorgabe: Warm');
  await tap(sheet.getByRole('button', { name: 'Fertig' }), info);
  await expect(fact(page, 'Wetter')).toContainText('16–24 °C');

  // Bike: another bike from the list.
  await tap(fact(page, 'Velo'), info);
  sheet = page.getByRole('dialog', { name: 'Velo ändern' });
  await tap(sheet.getByRole('button', { name: `${P} Gravel Grinder` }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).bikeId).toBe(`${P}gravel`);
  await tap(sheet.getByRole('button', { name: 'Fertig' }), info);
  await expect(fact(page, 'Velo')).toContainText(`${P} Gravel Grinder`);

  // Date: today.
  await tap(fact(page, 'Datum'), info);
  sheet = page.getByRole('dialog', { name: 'Datum ändern' });
  await tap(sheet.getByRole('button', { name: 'Heute' }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).startDate).toBe(day(0));
  await tap(sheet.getByRole('button', { name: 'Fertig' }), info);

  // No sideways scrolling, also on a 320 px phone.
  expect(await noSideScroll(page)).toBe(true);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await noSideScroll(page)).toBe(true);
    for (const name of ['Datum', 'Dauer', 'Velo', 'Wetter']) expect((await fact(page, name).boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  expect(errors).toEqual([]);
});

test('b: a one-day ride has no «1 Tag · keine Übernachtung» field; a trip of more days keeps it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await dayRide(page);
  const cond = page.locator('section.cond');
  await expect(cond).toBeVisible();
  await expect(cond).not.toContainText('keine Übernachtung');
  await expect(cond).not.toContainText('Dauer');
  await expect(cond).not.toContainText('pro Tag');
  // The green card says what was made, without repeating bike, date, hours and weather of the top card.
  const made = page.locator('.made-card');
  await expect(made).toContainText('Tagestour erstellt');
  await expect(made).not.toContainText(`${P} Scott`);
  await expect(made).not.toContainText('3 h');
  await expect(made).not.toContainText('Mild');

  // A trip of two days with lodging: unchanged.
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), `${P}event`);
  await page.goto('./#/');
  await page.goto('./#/pack');
  await expect(page.locator('.trip-band h1')).toContainText('Jura event');
  await expect(band(page).locator('[data-fact="duration"]')).toHaveText('2 Tage');
  await expect(cond).toContainText('2 Tage · Unterkunft');
  await expect(cond).toContainText('pro Tag');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('c: «Ans Wetter angepasst» switches the range and dry/rain in one tap, with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const ride = await dayRide(page);
  const card = page.locator('section.wxcard');
  const quick = card.getByRole('group', { name: 'Wetter schnell wählen' });
  await expect(quick.getByRole('button', { name: /^Mild/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(quick.getByRole('button', { name: 'Trocken' })).toHaveAttribute('aria-pressed', 'true');
  if (info.project.name === 'phone') for (const b of await quick.getByRole('button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await tap(quick.getByRole('button', { name: /^Kühl/ }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).wx).toMatchObject({ min: 6, max: 12, rain: 'none' });
  await expect(quick.getByRole('button', { name: /^Kühl/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(quick.getByRole('button', { name: /^Mild/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(card.locator('h2 .r')).toContainText('6–12 °C');
  await expect(band(page)).toContainText('6–12 °C');
  // Rain in one tap; the whole change goes back with one Undo.
  await tap(quick.getByRole('button', { name: 'Regen' }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).wx.rain).toBe('rain');
  await expect(quick.getByRole('button', { name: 'Regen' })).toHaveAttribute('aria-pressed', 'true');
  await tap(card.getByRole('button', { name: 'Ganze Änderung rückgängig' }), info);
  await expect.poll(async () => (await tripById(page, ride.id)).wx).toMatchObject({ min: 6, max: 12, rain: 'none' });
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('d: the forecast range stays as it is (10–16, not 10–18), and the page says where a range comes from', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { forecast: true });
  const ride = await dayRide(page);
  expect(ride.wx).toMatchObject({ min: 10, max: 16, rain: 'none' });
  expect(ride.wxFrom).toBe('forecast');
  await expect(fact(page, 'Wetter')).toContainText('10–16 °C · trocken');
  await expect(page.locator('.wxcard [data-wx-source]')).toHaveText('Aus der Wettervorhersage');
  // No preset is marked: 10–16 is none of them.
  const quick = page.getByRole('group', { name: 'Wetter schnell wählen' });
  await expect(quick.locator('[aria-pressed="true"]')).toHaveText(['Trocken']);
  // A range set by hand says so.
  await tap(fact(page, 'Wetter'), info);
  const sheet = page.getByRole('dialog', { name: 'Wetter ändern' });
  await sheet.getByLabel('Max °C').fill('15');
  await sheet.getByLabel('Max °C').press('Enter');
  await expect.poll(async () => (await tripById(page, ride.id)).wx.max).toBe(15);
  await expect(sheet.locator('[data-wx-source]')).toHaveText('Von dir gesetzt');
  expect(errors).toEqual([]);
});

test('d: without a forecast the range of the last day ride is named as its source', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const ride = await dayRide(page);
  expect(ride).toMatchObject({ wx: { min: 10, max: 18 }, wxFrom: 'last' });
  await expect(page.locator('.wxcard [data-wx-source]')).toHaveText('Wie deine letzte Tagestour');
  expect(errors).toEqual([]);
});

/* ---------- the owner's small fixes (Mehr, Inbox, Bike care) ---------- */

function extrasFile(info) {
  const fix = v038Data();
  const T = fix.tables;
  T.maintenance.push({ id: 9301, area: 'Bike', bikeId: SPARK, subject: `${P} Scott Spark 960`, task: `${P} Bremse quietscht`, category: 'Repair', source: 'Quick note', logDate: day(0), leadWeeks: null, priority: 'medium', status: 'open', note: '', done: false, photo: null });
  T.notes.push(
    { id: `${P}n3`, text: `${P} Bremse quietscht`, status: 'sorted', at: `${day(0)}T09:00:00.000Z`, to: { kind: 'repair', label: 'Repair · Spark', ref: 9301 }, sortedAt: `${day(0)}T09:05:00.000Z` },
    { id: `${P}n4`, text: `${P} Neue Handschuhe`, status: 'sorted', at: `${day(-2)}T07:00:00.000Z`, to: { kind: 'wish', label: 'Wishlist', ref: `${P}KL13` }, sortedAt: `${day(-2)}T07:05:00.000Z` },
    { id: `${P}n5`, text: `${P} Erledigt schon`, status: 'sorted', at: `${day(-3)}T07:00:00.000Z`, to: { kind: 'done', label: 'Done', ref: null }, sortedAt: `${day(-3)}T07:05:00.000Z` },
  );
  // The chain's history stored out of order: the dialog still shows the newest first.
  const chain = T.bikes.find((b) => b.id === SPARK).parts.find((p) => p.key === 'chain');
  chain.history = [{ ...chain.history[1], note: `${P} neu` }, { ...chain.history[0], note: `${P} alt` }];
  const path = plainPath(info, 'extras');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

test('extras: «Mehr» shows a dot, the Inbox is newest first and a sorted note opens what it became', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { file: extrasFile(info) });
  await page.goto('./#/');
  const more = page.locator('.more-btn');
  await expect(more).toHaveAttribute('aria-label', 'Mehr, Eingang: 2 zum Ablegen');
  await expect(more.locator('.mdot')).toBeVisible();
  expect(await more.innerText()).not.toMatch(/\d/);

  // v0.48.0 «Eingang»: the note filed today stays in the list, faint, its chip links to the repair;
  // «Abgelegt» lists everything filed, a row opens where it lives, one that went nowhere does not.
  await page.goto('./#/inbox');
  const filedToday = page.locator(`li.filed[data-note-id="${P}n3"]`);
  const repair = filedToday.locator('a.tchip');
  await expect(repair).toHaveAttribute('href', `#/bikes?tab=care&bike=${encodeURIComponent(SPARK)}&open=1`);
  if (info.project.name === 'phone') expect((await repair.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.locator(`li[data-note-id="${P}n4"]`)).toHaveCount(0);
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: /Abgelegt/ }).click();
  const rows = page.locator('.frow');
  await expect(rows).toHaveCount(3);
  await expect(rows.filter({ hasText: `${P} Neue Handschuhe` })).toHaveAttribute('href', `#/gear?item=${encodeURIComponent(`${P}KL13`)}`);
  await expect(page.locator('div.frow').filter({ hasText: `${P} Erledigt schon` })).toHaveCount(1);
  expect(await noSideScroll(page)).toBe(true);
  await page.getByRole('group', { name: 'Anzeigen' }).getByRole('button', { name: /Offen/ }).click();
  await tap(page.locator(`li.filed[data-note-id="${P}n3"] a.tchip`), info);
  await expect(page).toHaveURL(/#\/bikes\?tab=care/);
  await expect(page.locator('section.problems')).toContainText(`${P} Bremse quietscht`);
  expect(errors).toEqual([]);
});

test('extras: Bike care shows a part\'s history with the newest action first', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { file: extrasFile(info) });
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}&open=1`);
  const care = page.locator(`#care-${SPARK}`);
  // v0.48.0: a row of the part table opens the part.
  await care.locator('button.prow').filter({ has: page.locator('.nm').getByText('Kette', { exact: true }) }).click();
  const dlg = page.getByRole('dialog', { name: 'Kette' });
  const hist = dlg.locator('ol.hist > li');
  await expect(hist).toHaveCount(2);
  await expect(hist.first()).toContainText(`${P} neu`);
  await expect(hist.last()).toContainText(`${P} alt`);
  expect(errors).toEqual([]);
});

test('extras: Bike care lists the problems of all bikes flat, newest on top, with a bike and a route chip', async ({ page, context }, info) => {
  const fix = v038Data();
  const T = fix.tables;
  const rep = (id, bikeId, task, logDate, fix) => ({ id, area: 'Bike', bikeId, subject: '', task: `${P} ${task}`, category: 'Repair', source: 'Problem', logDate, leadWeeks: null, priority: 'medium', status: 'open', note: '', done: false, photo: null, topic: null, fix, part: null, dueDate: null, beforeRide: false });
  T.maintenance.push(rep(9401, SPARK, 'Sattel knarzt', day(-6), 'self'), rep(9402, `${P}gravel`, 'Lager tauschen', day(-1), 'shop'), rep(9403, SPARK, 'Licht lose', day(-3), 'part'));
  const file = plainPath(info, 'problems');
  writeFileSync(file, JSON.stringify(fix));
  const errors = await start(page, context, info, { file });
  await page.goto('./#/bikes?tab=care');
  const list = page.locator('section.problems').getByRole('list', { name: 'Probleme, neueste zuerst' });
  const rows = list.locator(':scope > li');
  const ours = rows.filter({ hasText: P });
  await expect(ours.locator('.rn')).toHaveText([`${P} Lager tauschen`, `${P} Licht lose`, `${P} Sattel knarzt`]);
  // No per-bike grouping: rows of two bikes alternate in one list, each with its chips.
  const first = ours.first();
  await expect(first.locator('.nbadge').first()).toHaveText(`${P} Gravel Grinder`);
  await expect(first.locator('.route')).toHaveText('Velomech');
  await expect(ours.nth(1).locator('.nbadge').first()).toHaveText(`${P} Scott Spark 960`);
  await expect(page.locator(`#care-${SPARK} li.pt`).filter({ hasText: `${P} Sattel knarzt` })).toHaveCount(0);
  // Done still works in the row.
  await tap(first.getByRole('button', { name: 'Erledigt' }), info);
  await expect(ours.locator('.rn')).toHaveText([`${P} Licht lose`, `${P} Sattel knarzt`]);
  if (info.project.name === 'phone') {
    for (const w of [390, 320]) {
      await page.setViewportSize({ width: w, height: 800 });
      expect(await noSideScroll(page)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
