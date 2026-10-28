// Paket «Touren b» (996 Ideen 50, 51, 53, 54): a rule with an end, the little stories while packing, a check from
// a real breakdown, «Später prüfen» on the way. Fictional data only (test_data_gtp_), the clock on 9 October 2026.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const PAST = 'test_data_gtp_Jura';
const VOICE = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAAA';

function data() {
  const d = homeFixture();
  const it = d.tables.items[3];
  d.tables.items[3] = { ...it, inputs: { voices: [{ id: 'test_data_gtp_v1', src: VOICE, s: 9, at: `${day(-5)}T10:00:00.000Z` }] } };
  // the rule of «Regen» held only for the tour of last week: it is over and asks
  d.tables.settings = [...d.tables.settings, { key: 'sets', value: [{ key: 'rain', until: { tripId: PAST } }] }];
  return d;
}
const read = (page, store, key) => page.evaluate(async ([s, k]) => {
  const req = indexedDB.open('pack-generator');
  const db = await new Promise((ok) => (req.onsuccess = () => ok(req.result)));
  return new Promise((ok) => {
    const os = db.transaction(s).objectStore(s);
    const r = k == null ? os.getAll() : os.get(k);
    r.onsuccess = () => ok(r.result);
  });
}, [store, key]);

test('Touren b: a rule that held for one tour asks whether it stays', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: data() });
  await page.goto('./#/blocks');
  const card = page.locator('[data-rules-over]');
  await expect(card).toContainText(T('Should the rule stay?'));
  await expect(card.locator('[data-rule-over="rain"]')).toContainText(T('held only for {trip}', { trip: 'test_data_gtp_ Jura' }));
  await tap(card.locator('[data-rule-keep]'), info);
  await expect(card.getByRole('status')).toBeVisible();
  await expect.poll(async () => (await read(page, 'settings', 'sets')).value.some((s) => s.key === 'rain' && s.until)).toBe(false);
  await expect(card.locator('[data-rule-over]')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Touren b: the little stories while packing, check later on the way', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: data() });
  await page.goto(`./#/pack?day`);
  const st = page.locator('[data-stories]');
  await expect(st).toContainText(T('Little stories'));
  await expect(st.locator('audio')).toHaveCount(1);
  await tap(st.locator('[data-story-hide]'), info);
  await expect(st).toContainText(T('Undo'));
  await expect(st.locator('audio')).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);

  await page.goto('./#/ride');
  const box = page.getByRole('region', { name: T('Note for the debrief') });
  await tap(box.locator('[data-note-later]'), info);
  await expect(box).toContainText(T('What do you want to check later?'));
  await tap(box.locator('.pick .tp-chip').first(), info);
  await expect.poll(async () => (await read(page, 'notes')).filter((n) => n.check?.itemId && n.tripId && n.day === 0 && n.text.length && n.status === 'open').length).toBe(1);
  expect(errors).toEqual([]);
});

test('Touren b: a breakdown suggests a check for next time', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: data() });
  await page.goto(`./#/debrief/${PAST}`);
  const card = page.locator('[data-tour-learn]');
  await tap(card.locator('[data-break-add]'), info);
  await tap(card.locator('[data-break-kind="chain"]'), info);
  await expect(card.locator('[data-break-check-text]')).toHaveValue(T('Check and oil the chain'));
  await card.locator('[data-break-check-text]').fill('test_data_gtp_ Kettenschloss prüfen');
  await tap(card.locator('[data-break-save]'), info);
  await expect(card).toContainText(T('The check comes the evening before every next tour of this type.'));
  await expect(card.locator('[data-learn-break]')).toContainText(T('in the evening-before check'));
  await expect.poll(async () => (await read(page, 'settings', 'eveStandard'))?.value?.some((r) => r.label === 'test_data_gtp_ Kettenschloss prüfen')).toBe(true);
  expect(errors).toEqual([]);
});

test('Touren b: a new tour from an intent, its questions come back in the look back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: data() });
  await page.evaluate(() => { localStorage.setItem('pack.startFrom', 'standard'); location.hash = '#/pack'; window.dispatchEvent(new Event('pg:newtrip')); });
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  const step = dlg.locator('[data-intent-step]');
  await expect(step).toContainText(T('What do you have in mind?'));
  await tap(step.locator('[data-intent="night"]'), info);
  const prop = step.locator('[data-intent-proposal]');
  await expect(prop).toContainText(T('Test night'));
  await expect(prop).toContainText(T('How warm was the sleeping bag?'));
  await tap(step.getByRole('button', { name: T('Cooking'), exact: true }), info);
  await expect(prop).toContainText(T('Did the cooking work?'));
  expect(await noSideways(page)).toBe(0);
  await tap(step.locator('[data-intent-create]'), info);
  await expect(dlg).toBeHidden();
  let made;
  await expect.poll(async () => (made = (await read(page, 'trips')).find((x) => x.intent?.key === 'night'))?.days).toBe(2);
  expect(made).toMatchObject({ overnight: 'outdoor', tent: true, cook: true });
  // the tour is over: the look back opens
  await page.evaluate(async ([rec]) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((ok) => (req.onsuccess = () => ok(req.result)));
    await new Promise((ok) => { const tx = db.transaction('trips', 'readwrite'); tx.objectStore('trips').put(rec); tx.oncomplete = ok; });
  }, [{ ...made, startDate: day(-4) }]);
  await page.goto(`./#/debrief/${made.id}`);
  await page.reload();
  const asks = page.locator('[data-intent-asks]');
  await expect(asks).toContainText(T('Did the cooking work?'));
  await asks.locator('textarea').first().fill('test_data_gtp_ warm genug');
  await expect.poll(async () => (await read(page, 'trips', made.id)).intent.after?.[0]).toBe('test_data_gtp_ warm genug');
  expect(errors).toEqual([]);
});

test('Touren b: the day to listen to and booking what was used', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = data();
  const past = d.tables.trips.find((x) => x.id === PAST);
  const gel = { id: 'test_data_gtp_gel', name: 'test_data_gtp_ Gel', category: 'Food', ownership: 'owned', stock: 6, minStock: 2 };
  d.tables.items = [...d.tables.items, gel];
  past.entries = [...past.entries, { itemId: gel.id, slot: 'seat', qty: 3, packed: true }];
  d.tables.notes = [...d.tables.notes, ...[1, 2].map((n) => ({ id: `test_data_gtp_vn${n}`, tripId: PAST, day: 0, text: `test_data_gtp_ Stimme ${n}`, status: 'open', at: `${past.startDate}T1${n}:00:00.000Z`, inputs: { place: { name: `test_data_gtp_ Ort ${n}`, lat: 47 + n / 100, lon: 8 + n / 50 }, voices: [{ id: `test_data_gtp_vv${n}`, src: VOICE, s: 5 + n, at: `${past.startDate}T1${n}:00:00.000Z` }] } }))];
  const T = await openHome(page, context, info, { data: d });
  await page.goto(`./#/debrief/${PAST}`);
  const dl = page.locator('[data-day-listen]');
  await expect(dl).toContainText(T('Your day to listen to'));
  await expect(dl.locator('[data-listen-clip]')).toHaveCount(2);
  await expect(dl.locator('[data-listen-clip]').first()).toContainText('test_data_gtp_ Stimme 1');
  await expect(dl.locator('[data-listen-map]')).toContainText(T('Where you spoke them'));
  await expect(dl.locator('[data-listen-map] .dl-dot')).toHaveCount(2);
  await tap(dl.locator('[data-listen-clip]').first().getByRole('button', { name: T('Move {name} down', { name: 'test_data_gtp_ Ort 1' }) }), info);
  await expect(dl.locator('[data-listen-clip]').first()).toContainText('test_data_gtp_ Stimme 2');
  await expect.poll(async () => (await read(page, 'trips', PAST)).clipOrder?.[0]?.[0]).toBe(`notes:test_data_gtp_vn2:test_data_gtp_vv2`);

  const uc = page.locator('[data-used]');
  const row = uc.locator(`[data-used-row="test_data_gtp_ Gel"]`);
  await tap(row.locator('[data-used-plus]'), info);
  await tap(row.locator('[data-used-plus]'), info);
  await tap(uc.locator('[data-used-book]'), info);
  await expect.poll(async () => (await read(page, 'items', gel.id)).stock).toBe(4);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
