// v0.26.1 (M4: AP17–AP20, Noah 14a–20a): suggested places on an outdoor trip (Apply all + Undo, no
// volume text without litres), update or new template, a ride-day note in the debrief and in the
// Inbox, and a missing item that becomes a learning. Fictional fixture plus test_data_gtp_ records;
// nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { endToDebrief } from './ending.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const OUT = 'test_data_gtp_bivvy';
const RIDE = 'test_data_gtp_ride';
const TPL = 'tpl-gtp-bivvy';

function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  data.tables.items.push({ id: 'CO90', name: 'test_data_gtp_ Stove', category: 'cook', weightG: 90, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: ['cook'], kits: [], domains: ['bikepacking'] });
  const trip = (id, title, startDate, days, entries, extra = {}) => ({ id, domain: 'bikepacking', title, startDate, days, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup }, entries, ready: [{ id: 'kit', label: 'Helmet, shoes, gloves', done: false }], status: 'planned', ...extra });
  data.tables.trips = [
    // An outdoor weekend: the sleeping bag on the body, the stove where the bike has no bag.
    trip(OUT, 'test_data_gtp_ Bivvy weekend', day(5), 3, [
      { itemId: 'SL01', slot: 'body', qty: 1, packed: false },
      { itemId: 'CO90', slot: 'bar', qty: 1, packed: false },
      { itemId: 'TO01', slot: 'frame', qty: 1, packed: false },
    ], { overnight: 'outdoor', cook: true, hours: 4, templateId: TPL }),
    // A trip that runs today (2 days), for the ride day.
    trip(RIDE, 'test_data_gtp_ Two days', day(0), 2, [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: true }, { itemId: 'RA01', slot: 'seat', qty: 1, packed: true }], { overnight: 'lodging', hours: 3 }),
  ];
  data.tables.settings.push({ key: 'templates', value: [{ id: TPL, name: 'test_data_gtp_ Bivvy', setup: { ...bike.setup }, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1 }], ready: [], ride: null, hours: 2, sets: {}, purpose: {}, fromTrip: null, updatedAt: '2026-10-01T10:00:00.000Z' }] });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang, tripId) {
  const file = info.outputPath('m4b-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  // The start page opens the ride day once a day during a trip; here the test decides where to go.
  await context.addInitScript(([l, id, ride]) => { localStorage.setItem('lang', l); localStorage.setItem('pack.currentTrip', id); localStorage.setItem('ride.autoOpened', ride); }, [lang, tripId, `${RIDE}:${day(0)}`]);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    // the app opens this panel by itself on an empty start: make sure it ends up open
    await expect(async () => {
      if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
      expect(await data.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

/** All records of a table, read straight from IndexedDB. */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

/** Where the three fixture items of the outdoor trip sit (start-up steps may add other entries). */
const slots = (trip) => ['SL01', 'CO90', 'TO01'].map((id) => trip.entries.find((e) => e.itemId === id)?.slot);
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

for (const lang of ['en', 'de']) {
  test(`outdoor trip: suggested places, Apply all and Undo, no volume claims, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang, OUT);
    await page.goto('./#/pack');
    const card = page.getByRole('region', { name: T('Suggested places') });
    await expect(card).toBeVisible();
    await expect(card.locator('li')).toHaveCount(2);
    // Sleeping bag → its usual bag; the stove (no bag at the handlebar) → the first cook place with a bag.
    await expect(card.locator('li').nth(0)).toContainText('Sleeping bag → Test seat pack');
    await expect(card.locator('li').nth(1)).toContainText('test_data_gtp_ Stove → Test frame bag');
    await noSideScroll(page);
    // 15b: the fixture has no item litres, so nothing about volume.
    await expect(page.getByText(/\d+ (of|von) \d+ L/)).toHaveCount(0);
    await expect(page.getByText(/too full|zu voll/i)).toHaveCount(0);

    await card.getByRole('button', { name: T('Apply all') }).click();
    await expect(card).toBeHidden();
    let trip = (await table(page, 'trips')).find((x) => x.id === OUT);
    expect(slots(trip)).toEqual(['seat', 'frame', 'frame']);

    await page.locator('.calm-pack').getByRole('button', { name: T('Undo'), exact: true }).click();
    await expect(page.getByRole('region', { name: T('Suggested places') })).toBeVisible();
    trip = (await table(page, 'trips')).find((x) => x.id === OUT);
    expect(slots(trip)).toEqual(['body', 'bar', 'frame']);

    // One row: Apply moves only that item; × dismisses the other for this trip.
    const again = page.getByRole('region', { name: T('Suggested places') });
    await again.getByRole('button', { name: T('Dismiss the suggestion for {name}', { name: 'test_data_gtp_ Stove' }) }).click();
    await expect(again.locator('li')).toHaveCount(1);
    await again.getByRole('button', { name: T('Apply') }).first().click();
    await expect(page.getByRole('region', { name: T('Suggested places') })).toBeHidden();
    trip = (await table(page, 'trips')).find((x) => x.id === OUT);
    expect(slots(trip)).toEqual(['seat', 'bar', 'frame']);
    expect(trip.placesDismissed).toEqual(['CO90']);
    const bike = (await table(page, 'bikes'))[0];
    expect(bike.setup).toEqual(base.tables.bikes[0].setup); // the bike's standard setup is unchanged
    expect(errors).toEqual([]);
  });
}

test('template from a trip: update or save as new, and the new trip takes days and overnight', async ({ page, context }, info) => {
  const T = tr('en');
  await start(page, context, info, 'en', OUT);
  await page.goto('./#/pack');
  await expect(page.getByRole('heading', { name: 'test_data_gtp_ Bivvy weekend' })).toBeVisible();
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.getByRole('button', { name: T('Save as template') }).click();
  const dlg = page.getByRole('dialog', { name: T('Template') });
  await expect(dlg.getByRole('button', { name: T('Update template «{name}»', { name: 'test_data_gtp_ Bivvy' }) })).toBeVisible();
  await expect(dlg.getByRole('button', { name: T('Save as new template') })).toBeVisible();
  await expect(dlg.getByText(/Trips made from it before stay unchanged/)).toBeVisible();
  await noSideScroll(page);
  await dlg.getByRole('button', { name: T('Update template «{name}»', { name: 'test_data_gtp_ Bivvy' }) }).click();
  await expect(dlg).toBeHidden();
  let list = (await table(page, 'settings')).find((x) => x.key === 'templates').value;
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ id: TPL, days: 3, hours: 4, overnight: 'outdoor', cook: true, bikeId: 'bike-test' });
  const trip = (await table(page, 'trips')).find((x) => x.id === OUT);
  expect(list[0].entries.map((e) => e.itemId)).toEqual(trip.entries.map((e) => e.itemId));
  expect(list[0].entries.map((e) => e.itemId)).toEqual(expect.arrayContaining(['SL01', 'CO90', 'TO01']));

  // Save as new: a second template; the first stays.
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.getByRole('button', { name: T('Save as template') }).click();
  await dlg.getByLabel(T('Name')).fill('test_data_gtp_ Bivvy 2');
  await dlg.getByRole('button', { name: T('Save as new template') }).click();
  await expect(dlg).toBeHidden();
  list = (await table(page, 'settings')).find((x) => x.key === 'templates').value;
  expect(list.map((x) => x.name)).toEqual(['test_data_gtp_ Bivvy', 'test_data_gtp_ Bivvy 2']);

  // A new trip from the template: 3 days, Outdoor with cooking, 4 h per day as defaults (still changeable).
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.getByRole('button', { name: T('New trip'), exact: true }).click();
  const nt = page.getByRole('dialog', { name: T('New trip') });
  // v0.30.0: the templates are folded in the New trip window; v0.40.0: under "Start differently".
  await nt.getByText(T('Start differently')).click();
  await nt.getByText(T('Start from a template')).click();
  await nt.getByRole('button', { name: /^test_data_gtp_ Bivvy/ }).first().click();
  await expect(nt.getByLabel(T('Days')).first()).toHaveValue('3');
  await expect(nt.getByLabel(T('Riding hours per day'))).toHaveValue('4');
  await expect(nt.getByRole('button', { name: T('Bivouac + tent') })).toHaveAttribute('aria-pressed', 'true');
  await expect(nt.getByLabel(T('Cooking'))).toBeChecked();
  await nt.getByRole('button', { name: T('Cancel') }).click();
});

test('On the way note: in the Inbox and in the debrief; a missing item becomes a learning', async ({ page, context }, info) => {
  const T = tr('en');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'en', RIDE);
  await page.goto('./#/ride');
  const box = page.getByRole('region', { name: T('Note for the debrief') });
  // v0.29.0 (Noah 8a): next to the three quick answers, a free note.
  await box.getByRole('button', { name: T('Free text') }).click();
  await box.getByRole('textbox').fill('test_data_gtp_ Gloves too thin');
  await box.getByRole('button', { name: T('Save note') }).click();
  await expect(box.getByText(T('Saved. It shows in the debrief and in the Inbox.'))).toBeVisible();
  await expect(box.getByText('test_data_gtp_ Gloves too thin')).toBeVisible();
  const note = (await table(page, 'notes')).find((n) => n.text === 'test_data_gtp_ Gloves too thin');
  expect(note).toMatchObject({ tripId: RIDE, day: 0, status: 'open', page: 'ride' });

  await page.goto('./#/inbox');
  await expect(page.getByText('test_data_gtp_ Gloves too thin')).toBeVisible();

  await page.goto('./#/ride');
  await endToDebrief(page, T); // v0.67.0: the trip ends («Tour beendet»), then its debrief
  await expect(page).toHaveURL(new RegExp(`#/debrief/${RIDE}`));
  const way = page.locator('.ridenotes');
  await expect(way.getByText(T('Notes on the way'))).toBeVisible();
  await expect(way.getByText('test_data_gtp_ Gloves too thin')).toBeVisible();
  await expect(way.getByText(T('Day {n}', { n: 1 }), { exact: false })).toBeVisible();

  // What was missing, from the search: "Add … as new" (v0.29.0: on the same page).
  await page.getByLabel(T('What you missed')).fill('test_data_gtp_ Head torch');
  await page.getByRole('button', { name: T('Add "{q}" as new (not in your gear)', { q: 'test_data_gtp_ Head torch' }) }).click();
  await expect(page.locator('ul.exc li').filter({ hasText: 'test_data_gtp_ Head torch' })).toBeVisible();
  await noSideScroll(page);
  // Both become suggestions, all ticked: one shown as "For next time", the others under "More suggestions".
  const more = page.locator('details.tp-fold').filter({ hasText: T('More suggestions') });
  if (await more.count()) await more.locator('summary').click();
  for (const label of [T('Take {name} next time', { name: 'test_data_gtp_ Head torch' }), 'From the ride: "test_data_gtp_ Gloves too thin"']) {
    const box = page.getByRole('checkbox', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
    if (await box.count()) await expect(box).toBeChecked();
    else {
      await expect(page.locator('.learn')).toContainText(label);
      // v0.30.1 (Noah C3): "Yes, remember" saves it at once; untouched, "Save debrief" applies it too.
      await expect(page.locator('.learn').getByRole('button', { name: T('Yes, remember') })).toBeVisible();
    }
  }
  await page.getByRole('button', { name: T('Save debrief') }).click();
  // v0.67.0 (U006): a trip of two days closes its loop on «Rückblick fertig»
  await expect(page).toHaveURL(new RegExp(`#/trip/${RIDE}/debriefed$`));
  await expect(page.getByRole('heading', { level: 1, name: T('Debrief finished|title') })).toBeVisible();
  const learnings = await table(page, 'learnings');
  expect(learnings.map((l) => l.rule)).toEqual(expect.arrayContaining(['Take test_data_gtp_ Head torch next time', 'test_data_gtp_ Gloves too thin']));
  expect(learnings.find((l) => l.rule.startsWith('Take')).source).toBe('test_data_gtp_ Two days');
  // The Inbox note that became a learning is sorted there (no second learning later).
  expect((await table(page, 'notes')).find((n) => n.id === note.id)).toMatchObject({ status: 'sorted', to: { kind: 'learning' } });
  expect(errors).toEqual([]);
});

test('packing day: packed and ready counted apart, kept after a reload; a raised amount stays packed', async ({ page, context }, info) => {
  const T = tr('en');
  await start(page, context, info, 'en', OUT);
  await page.goto('./#/pack?day');
  // v0.29.0: Pack is a page (no dialog); the bags fold, a tap opens one.
  const pd = page.locator('.pd');
  await expect(pd).toHaveAttribute('aria-label', T('Packing day: {title}', { title: 'test_data_gtp_ Bivvy weekend' }));
  const frame = pd.locator('.bagh').filter({ hasText: 'Frame bag' });
  if ((await frame.getAttribute('aria-expanded')) !== 'true') await frame.click();
  const tool = pd.getByRole('button', { name: /Multi tool/ });
  await tool.click();
  await expect(tool).toHaveAttribute('aria-pressed', 'true');
  const stored = (await table(page, 'trips')).find((x) => x.id === OUT);
  const total = stored.entries.length;
  const checks = stored.ready.length;
  const ring = pd.getByRole('img', { name: T('{n} of {total} items packed', { n: 1, total }) });
  await expect(ring.filter({ visible: true }).first()).toBeVisible();
  // The ready check is its own count: still none done.
  await expect(pd.locator('.bagh').filter({ hasText: T('Ready check') })).toContainText(`0/${checks}`);

  await page.goto('./#/');
  await page.reload();
  await page.goto('./#/pack?day');
  await expect(ring.filter({ visible: true }).first()).toBeVisible();
  await page.goto('./#/pack');

  // Noah 18b: one more Multi tool keeps it packed.
  const list = page.locator('.calm-pack');
  await list.locator('section.bag-group').filter({ hasText: 'Multi tool' }).locator('button.bag-heading').click();
  await list.getByRole('button', { name: T('Amount, move or take out: {name}', { name: 'Multi tool' }) }).click();
  await list.getByRole('button', { name: T('One more {name}', { name: 'Multi tool' }) }).click();
  await expect(list.locator('.planning-row').filter({ hasText: 'Multi tool' }).getByText('× 2')).toBeVisible();
  const entry = (await table(page, 'trips')).find((x) => x.id === OUT).entries.find((e) => e.itemId === 'TO01');
  expect(entry).toMatchObject({ qty: 2, packed: true });
});
