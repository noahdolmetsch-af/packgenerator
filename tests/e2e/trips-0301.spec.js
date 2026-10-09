// v0.30.1: Noah's phone test of 0.29.2, findings E5, E6, A2, C1, C2, C3, C5 (German UI).
// Fictional fixture plus test_data_gtp_ bikes, items and trips; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'other', weightG: 150, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const BIKE_B = { id: 'bike-gtp-b', name: 'test_data_gtp_ Rennvelo Zwei', weightG: 8200, slots: ['seat', 'frame', 'top'], setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, fixtures: [] };
const trip = (id, title, f) => ({ id, domain: 'bikepacking', title: `test_data_gtp_ ${title}`, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: {}, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: true }], ready: [], status: 'planned', hours: 2, overnight: 'none', ...f });

function fixture(path, { trips = [], bikes = [], settings = [] } = {}) {
  const data = structuredClone(base);
  data.tables.items.push(item('GTP1', 'Regenjacke', { sets: ['u-regen'] }));
  data.tables.bikes.push(...bikes);
  data.tables.trips.push(...trips);
  data.tables.settings.push(...settings);
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, opts = {}) {
  const file = info.outputPath('trips-0301.json');
  fixture(file, opts);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  // A trip on its ride day takes Today straight to On the way, so wait for the data, not the message.
  await expect.poll(async () => (await table(page, 'items')).some((i) => i.id === 'GTP1')).toBe(true);
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

/** A day ride from Today. v0.38.0 (Noah 13a): "Day ride now" is in "New" (+), once. */
async function dayRideFromToday(page) {
  await page.goto('./#/');
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(`^${T('Day ride now')}`) }).click();
  await expect(page.locator('.made-card')).toBeVisible();
}

test('E5, E6: the day ride takes the bike of the last trip; every day ride is listed', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Yesterday on bike B; a trip planned weeks ahead on the other bike (made long ago).
  await start(page, context, info, {
    bikes: [BIKE_B],
    trips: [
      trip('gtp-yesterday', 'Gestern', { bikeId: BIKE_B.id, bike: BIKE_B.name, startDate: day(-1), createdAt: `${day(-2)}T08:00:00.000Z` }),
      trip('gtp-later', 'Später', { startDate: day(40), days: 3, overnight: 'outdoor', createdAt: `${day(-30)}T08:00:00.000Z` }),
    ],
  });
  await dayRideFromToday(page);
  let made = (await table(page, 'trips')).filter((x) => !x.id.startsWith('gtp-'));
  expect(made).toHaveLength(1);
  expect(made[0].bikeId).toBe(BIKE_B.id);
  const title = made[0].title;
  expect(title).toContain('test_data_gtp_ Rennvelo');

  // A second day ride: a trip of its own, with a name of its own.
  await dayRideFromToday(page);
  made = (await table(page, 'trips')).filter((x) => !x.id.startsWith('gtp-'));
  expect(made).toHaveLength(2);
  expect(made.map((x) => x.title).sort()).toEqual([title, `${title} (2)`]);

  // Today lists both (and the trip ahead), each opens its own list.
  await page.goto('./#/');
  const tile = page.locator('.hub').filter({ has: page.getByRole('heading', { name: T('Trips|place') }) });
  if (await page.locator('details.hub').count()) await tile.locator('summary').click();
  const rows = tile.locator('ul.rows a');
  await expect(rows.filter({ hasText: `${title} (2)` })).toHaveCount(1);
  await expect(rows.filter({ hasText: title })).toHaveCount(2);
  await expect(rows.filter({ hasText: 'test_data_gtp_ Später' })).toHaveCount(1);
  // In Pack's trip chooser too.
  await page.goto('./#/pack');
  const names = await page.locator('.list-menu select option').allTextContents();
  expect(names).toEqual(expect.arrayContaining([title, `${title} (2)`, 'test_data_gtp_ Gestern', 'test_data_gtp_ Später']));
  expect(errors).toEqual([]);
});

test('A2: "+ Rain" in the trip brings the rain gear with its reason and Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { trips: [trip('gtp-a2', 'Regenrunde', { startDate: day(3), wx: { min: 10, max: 18, rain: 'none' } })] });
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-a2'));
  await page.goto('./#/pack');
  await page.locator('.calm-pack .cell').first().click(); // Duration: the trip's details
  const dlg = page.getByRole('dialog', { name: T('Trip details') });
  const rain = dlg.getByRole('button', { name: `+ ${T('Rain')}` });
  await rain.click();
  await expect(rain).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  const card = page.locator('.wxcard');
  const row = card.locator('li').filter({ hasText: 'test_data_gtp_ Regenjacke' });
  await expect(row).toContainText(T('Rain'));
  await expect(card).toContainText(T('Changed: {list}', { list: '+ test_data_gtp_ Regenjacke' }));
  expect((await table(page, 'trips'))[0].entries.map((e) => e.itemId)).toContain('GTP1');
  await row.getByRole('button', { name: T('Undo for {name}', { name: 'test_data_gtp_ Regenjacke' }) }).click();
  await expect.poll(async () => (await table(page, 'trips'))[0].entries.map((e) => e.itemId)).not.toContain('GTP1');
  expect(errors).toEqual([]);
});

test('C1, C2: On the way shows the Now card without a route; one tap is one note', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { trips: [trip('gtp-c1', 'Heute', { startDate: day(0), hours: 2 })] });
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-c1'));
  await page.goto('./#/ride');
  const now = page.locator('section.now');
  await expect(now).toBeVisible();
  await expect(now.locator('.tt')).toContainText(T('Now'));
  for (const lab of ['Wear', 'Eat', 'Drink', 'Light']) await expect(now.getByText(T(lab), { exact: true })).toBeVisible();
  await expect(now).toContainText(T('{n} h riding', { n: '2' }));
  await page.screenshot({ path: info.outputPath('ride-now.png') });

  // "Broken", then one item, tapped twice quickly: one note.
  await page.getByRole('button', { name: T('Broken'), exact: true }).click();
  const chip = page.locator('.pick .tp-chip').filter({ hasText: 'Multi tool' });
  await chip.evaluate((b) => { b.click(); b.click(); });
  await expect(page.getByRole('status').filter({ hasText: T('Saved: {text}. It is in the debrief and in the Inbox.', { text: T('{name} broken', { name: 'Multi tool' }) }) })).toBeVisible();
  await expect.poll(async () => (await table(page, 'notes')).length).toBe(1);
  // The same answer again: said, not written twice.
  await page.getByRole('button', { name: T('Broken'), exact: true }).click();
  await page.locator('.pick .tp-chip').filter({ hasText: 'Multi tool' }).click();
  await expect(page.getByRole('status').filter({ hasText: T('Already noted: {text}', { text: T('{name} broken', { name: 'Multi tool' }) }) })).toBeVisible();
  expect(await table(page, 'notes')).toHaveLength(1);
  await expect(page.locator('ul.notes li')).toHaveCount(1);
  expect((await table(page, 'debriefs'))[0].items).toEqual({ TO01: 'broken' });
  expect(errors).toEqual([]);
});

test('C3, C5: "Yes, remember" saves the suggestion; a debrief saved early makes the trip past', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // A two-day trip that started today, ended early on the way and debriefed today (L7: the debrief
  // itself opens only from the last day; "Next: Debrief" on the way ends the trip and opens it).
  await start(page, context, info, { trips: [trip('gtp-c5', 'Morgen', { startDate: day(0), days: 2, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: true }, { itemId: 'TO02', slot: 'frame', qty: 1, packed: true }] })] });
  await page.goto('./#/debrief/gtp-c5');
  await expect(page.locator('section.early')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-c5'));
  await page.goto('./#/ride');
  await page.locator('.trip-band .act .go').click();
  await expect(page).toHaveURL(/#\/debrief\/gtp-c5/);
  await page.getByPlaceholder(T('What you missed, e.g. Headlamp')).fill('test_data_gtp_ Kettenöl');
  await page.getByRole('button', { name: T('Add'), exact: true }).click();
  const learn = page.locator('section.learn');
  await expect(learn).toContainText(T('Take {name} next time', { name: 'test_data_gtp_ Kettenöl' }));
  await learn.getByRole('button', { name: T('Yes, remember') }).click();
  await expect(page.getByRole('status').filter({ hasText: T('Remembered: {label}', { label: T('Take {name} next time', { name: 'test_data_gtp_ Kettenöl' }) }) })).toBeVisible();
  await expect.poll(async () => (await table(page, 'learnings')).map((l) => l.rule)).toEqual([T('Take {name} next time', { name: 'test_data_gtp_ Kettenöl' })]);
  // The next suggestion takes its place; "No" leaves it out.
  await expect(learn).toContainText(T('{name} (missing)', { name: 'test_data_gtp_ Kettenöl' }));
  await page.waitForTimeout(800);
  await learn.getByRole('button', { name: T('No'), exact: true }).click();
  await page.locator('input[aria-label="' + T('km of this trip') + '"]').fill('42');
  await page.locator('input[aria-label="' + T('km of this trip') + '"]').press('Tab');
  await page.getByRole('button', { name: T('Save debrief') }).first().click();
  await expect(page.locator('.saved-card')).toBeVisible();
  const [tr] = await table(page, 'trips');
  expect(tr.finished).toBe(day(0));
  expect((await table(page, 'items')).filter((i) => i.ownership === 'wishlist')).toEqual([]);
  expect((await table(page, 'learnings'))).toHaveLength(1);
  expect((await table(page, 'bikes'))[0].km).toBe(42);

  await page.goto('./#/pack/past');
  await expect(page.locator('.past .card').filter({ hasText: 'test_data_gtp_ Morgen' })).toContainText(T('Debrief done'));
  await page.goto('./#/');
  await expect(page.locator('#next-h')).toHaveText(T('No trip planned'));
  expect(errors).toEqual([]);
});

test('N8, N9: rename a past trip in its band; past trips are easy to find', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { trips: [trip('gtp-old', 'Alt', { startDate: day(-4), finished: day(-4) }), trip('gtp-next', 'Bald', { startDate: day(5) })] });
  // Today: the Trips tile names the past trips with their count as a row; "More" has the page.
  const tile = page.locator('.hub').filter({ has: page.getByRole('heading', { name: T('Trips|place') }) });
  if (await page.locator('details.hub').count()) await tile.locator('summary').click();
  await expect(tile.locator('ul.rows a').filter({ hasText: T('Past trips ({n})', { n: 1 }) })).toHaveAttribute('href', '#/pack/past');
  // v0.38.0 (Noah 13a): the button moved into "More" › Look back (one place per target).
  await page.locator('.more-btn').click();
  await expect(page.locator('dialog.more').getByRole('link', { name: T('Past trips') })).toHaveAttribute('href', '#/pack/past');
  await page.keyboard.press('Escape');
  // Pack: next to the trip chooser.
  await page.goto('./#/pack');
  await page.locator('.list-menu summary').click();
  await page.locator('.list-menu-content').getByRole('link', { name: T('Past trips ({n})', { n: 1 }) }).click();
  await expect(page).toHaveURL(/#\/pack\/past/);

  // Open the past trip and rename it: tap the name, type, Enter.
  await page.locator('.past .card a.open').filter({ hasText: 'test_data_gtp_ Alt' }).click();
  const band = page.locator('.trip-band');
  await band.getByRole('button', { name: 'test_data_gtp_ Alt' }).click();
  const field = band.getByRole('textbox', { name: T('Trip name') });
  await field.fill('test_data_gtp_ Seerunde');
  await field.press('Enter');
  await expect(band.getByRole('heading', { name: 'test_data_gtp_ Seerunde' })).toBeVisible();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === 'gtp-old').title).toBe('test_data_gtp_ Seerunde');
  // Escape keeps the name; an empty name is not saved; leaving the field saves.
  await band.getByRole('button', { name: 'test_data_gtp_ Seerunde' }).click();
  await field.fill('');
  await field.press('Escape');
  await band.getByRole('button', { name: 'test_data_gtp_ Seerunde' }).click();
  await field.fill('');
  await field.blur();
  await expect(band.getByRole('heading', { name: 'test_data_gtp_ Seerunde' })).toBeVisible();
  expect((await table(page, 'trips')).find((x) => x.id === 'gtp-old').title).toBe('test_data_gtp_ Seerunde');
  const box = await band.getByRole('button', { name: 'test_data_gtp_ Seerunde' }).boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('N10, N11: New trip shows "Copy the last trip: name" at once; templates in building blocks', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const std = ['EL01', 'EL02', 'EL03', 'LI01', 'LI02', 'ON01', 'ON02', 'OF01', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03', 'HY02'];
  const tpl = { id: 'tpl-gtp', name: 'test_data_gtp_ Regenrunde', days: 1, hours: 2, setup: {}, entries: [...std, 'GTP1', 'LX01'].map((itemId) => ({ itemId, slot: 'seat', qty: 1 })), ready: [], sets: {}, purpose: {}, updatedAt: '2026-10-01T08:00:00.000Z' };
  await start(page, context, info, {
    trips: [trip('gtp-last', 'Letzte', { startDate: day(-2), createdAt: `${day(-3)}T08:00:00.000Z` })],
    settings: [{ key: 'templates', value: [tpl] }, { key: 'sets', value: [{ key: 'u-regen', name: 'test_data_gtp_ Regen' }] }],
  });
  // The standard set as the app has it after its own updates of the fixture (they run on start, e.g.
  // the light set): write the template with it.
  await page.reload();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'LI01')?.lightSetDone).toBe(true);
  const all = await table(page, 'items');
  const stdNow = all.filter((i) => ['owned', 'unclear'].includes(i.ownership) && (['standard', 'worn'].includes(i.role) || i.always) && (!i.domains?.length || i.domains.includes('bikepacking')) && !i.sets?.includes('firstaid')).map((i) => i.id);
  const value = [{ ...tpl, entries: [...stdNow, 'GTP1', 'LX01'].map((itemId) => ({ itemId, slot: 'seat', qty: 1 })) }];
  await page.evaluate((v) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'templates', value: v });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), value);
  await page.evaluate(() => { localStorage.setItem('pack.startFrom', 'standard'); location.hash = '#/pack'; window.dispatchEvent(new Event('pg:newtrip')); });
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  const copy = dlg.getByRole('button', { name: T('Copy the last trip: {title}', { title: 'test_data_gtp_ Letzte' }) });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(copy).toHaveAttribute('aria-pressed', 'true');
  // Templates stay folded; open, the row says what is in it in building blocks.
  await dlg.locator('details summary').filter({ hasText: T('Start from a template') }).click();
  await expect(dlg.locator('.opt').filter({ hasText: 'test_data_gtp_ Regenrunde' })).toContainText(/Standard \+ test_data_gtp_ Regen \+ 1 Extra$/);
  await expect(dlg.locator('.opt').filter({ hasText: 'test_data_gtp_ Regenrunde' })).toContainText(`${T('{n} day', { n: 1 })} · ${T('{n} h', { n: '2' })}`);
  await page.screenshot({ path: info.outputPath('new-trip.png') });
  expect(errors).toEqual([]);
});
