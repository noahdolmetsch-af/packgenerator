// Planungs-Notizen (IS 246–249, Noah «1-3 erarbeiten» 15.10.2026): notes in the Plan step of a trip,
// «Daraus wird …» a ready-check task, an evening-check task, an item on the list, a workshop job, a row
// for all trips of the kind; in the debrief «Hat es geholfen?» and «Als Erkenntnis merken».
// Fictional data only (test_data_gtp_ records); words are read from the app's German texts.
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const D0 = '2026-10-14';
const day = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const ID = (s) => `test_data_gtp_${s}`;
const entries = (n) => base.tables.items.slice(3, 3 + n).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: false }));
const trip = (id, start, extra = {}) => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 2, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(4), ready: [], status: 'planned', createdAt: `${day(-10)}T08:00:00.000Z`, ...extra,
});
function data(trips, current, debriefs = []) {
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = debriefs;
  d.tables.notes = [];
  d.tables.maintenance = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }, { key: 'pack.currentTrip', value: current }];
  return d;
}
async function open(page, context, trips, current, debriefs) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+02:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await importAndSettle(page, { name: 'plannotes.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data(trips, current, debriefs))) });
}
const go = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
  await settle(page);
};
const stored = (page, store, key) =>
  page.evaluate(([s, k]) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction(s).objectStore(s).get(k);
      get.onsuccess = () => { req.result.close(); done(get.result); };
    };
  }), [store, key]);
const all = (page, store) =>
  page.evaluate((s) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction(s).objectStore(s).getAll();
      get.onsuccess = () => { req.result.close(); done(get.result); };
    };
  }), store);

test('Plan step: planning notes become a ready task, an item, a workshop job and a standard row', async ({ page, context }) => {
  await open(page, context, [trip('Alpen', day(6))], ID('Alpen'));
  await go(page, '#/pack');
  const card = page.locator('[data-plan-notes]');
  await expect(card.getByRole('heading', { name: T('Planning notes') })).toBeVisible();
  // empty: the examples to tap
  const ex = card.locator('[data-example]').first();
  const first = await ex.getAttribute('data-example');
  expect(first).toBeTruthy();
  await ex.click();
  await expect(card.locator('[data-plan-note]')).toHaveCount(1);
  for (const words of ['test_data_gtp_ Ersatzschlauch', 'test_data_gtp_ Bremsen prüfen', 'test_data_gtp_ Kettenöl']) {
    await card.getByLabel(T('New planning note')).fill(words);
    await card.getByRole('button', { name: T('Add') }).click();
  }
  await expect(card.locator('[data-plan-note]')).toHaveCount(4);
  const row = (text) => card.locator('[data-plan-note]').filter({ hasText: text });
  const make = async (text, kind, word) => {
    await row(text).getByRole('button', { name: T('Turn into …') }).click();
    await row(text).locator(`[data-make="${kind}"]`).click();
    await expect(row(text)).toContainText(T(word));
    await expect(row(text).getByRole('button', { name: T('Turn into …') })).toHaveCount(0);
  };
  await make(first, 'ready', 'In the ready check');
  await make('test_data_gtp_ Ersatzschlauch', 'item', 'On the packing list');
  await make('test_data_gtp_ Bremsen prüfen', 'repair', 'In bike care');
  await make('test_data_gtp_ Kettenöl', 'all', 'In the ready check of all trips of this kind');

  const t = await stored(page, 'trips', ID('Alpen'));
  expect(t.planNotes.map((n) => n.made.kind)).toEqual(['ready', 'item', 'repair', 'all']);
  expect(t.ready.map((r) => r.label)).toEqual(expect.arrayContaining([first, 'test_data_gtp_ Kettenöl']));
  const itemId = t.planNotes[1].made.ref;
  expect(t.entries.some((e) => e.itemId === itemId)).toBe(true);
  expect(await stored(page, 'items', itemId)).toMatchObject({ name: 'test_data_gtp_ Ersatzschlauch', weightStatus: 'missing' });
  const jobs = await all(page, 'maintenance');
  expect(jobs).toEqual([expect.objectContaining({ task: 'test_data_gtp_ Bremsen prüfen', bikeId: 'bike-test', status: 'open', dueDate: day(5) })]);
  const std = await stored(page, 'settings', 'readyStandard');
  expect(std.value.at(-1).label).toBe('test_data_gtp_ Kettenöl');
  // a note can be removed
  await row(first).getByRole('button', { name: T('Remove the note «{text}»', { text: first }) }).click();
  await expect(card.locator('[data-plan-note]')).toHaveCount(3);
});

test('Plan step: a note becomes a task for the evening before', async ({ page, context }) => {
  await open(page, context, [trip('Jura', day(3))], ID('Jura'));
  await go(page, '#/pack');
  const card = page.locator('[data-plan-notes]');
  await card.getByLabel(T('New planning note')).fill('test_data_gtp_ Akku laden');
  await card.getByRole('button', { name: T('Add') }).click();
  await card.getByRole('button', { name: T('Turn into …') }).click();
  await card.locator('[data-make="eve"]').click();
  await expect(card).toContainText(T('In the evening check'));
  const t = await stored(page, 'trips', ID('Jura'));
  expect(t.eve.at(-1)).toMatchObject({ label: 'test_data_gtp_ Akku laden', done: false });
  expect(t.eve.length).toBeGreaterThan(1);
});

test('Debrief: «Did it help?» and a helpful note kept as a learning', async ({ page, context }) => {
  const notes = [
    { id: 'pn-a', text: 'test_data_gtp_ Sonnencreme', at: `${day(-8)}T08:00:00.000Z`, made: { kind: 'ready', ref: 'plan-pn-a' }, helped: null },
    { id: 'pn-b', text: 'test_data_gtp_ Regenhose', at: `${day(-8)}T08:00:00.000Z`, made: null, helped: null },
  ];
  const past = trip('Napf', day(-3), { status: 'done', planNotes: notes });
  const deb = { tripId: past.id, status: 'open', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: {}, missing: [], applied: [], km: 0, kmApplied: 0 };
  await open(page, context, [past], past.id, [deb]);
  await go(page, `#/debrief/${past.id}`);
  const sec = page.locator('[data-debrief-plan-notes]');
  await expect(sec.getByRole('heading', { name: T('Planning notes') })).toBeVisible();
  await expect(sec).toContainText(T('Did it help?'));
  const a = sec.locator('[data-plan-note="pn-a"]');
  await a.getByRole('button', { name: T('Yes|helped') }).click();
  await expect(a.getByRole('button', { name: T('Yes|helped') })).toHaveAttribute('aria-pressed', 'true');
  await sec.locator('[data-plan-note="pn-b"]').getByRole('button', { name: T('No|helped') }).click();
  await a.getByRole('button', { name: T('Keep as a learning') }).click();
  await expect(a).toContainText(T('Kept as a learning'));
  const t = await stored(page, 'trips', past.id);
  expect(t.planNotes.map((n) => n.helped)).toEqual([true, false]);
  const learned = await all(page, 'learnings');
  expect(learned.find((l) => l.id === t.planNotes[0].learned)).toMatchObject({ rule: 'test_data_gtp_ Sonnencreme', topic: 'Planning' });
});
