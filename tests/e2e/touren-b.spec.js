// Paket «Touren b» (996 Ideen 50, 51, 53, 54): a rule with an end, the little stories while packing, a check from
// a real breakdown, «Später prüfen» on the way. Fictional data only (test_data_gtp_), the clock on 9 October 2026.
import { test, expect } from '@playwright/test';
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
