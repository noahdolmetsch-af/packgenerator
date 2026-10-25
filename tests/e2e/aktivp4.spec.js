// Paket P4 «Aktiv» (Noah 21.10.2026, mockups TN1–TN5, ME4, E4, E5): the top of the tennis page (cover photo,
// played like last time, a planned time and «Gespielt?», the booking link), the yoga card on Meditation
// (a regular class, «War dort», the studio), «Diesen Tag merken» in the evening review and the kept days and
// «Gewünscht und erlebt» in Was mir gut tut. German UI, fictional data (test_data_gtp_), the clock on Fri 9.10.2026 09:00.
import { test, expect } from '@playwright/test';
import { openHome, D0 } from './home0460-fixture.js';

const TENNIS = '#/flow/sport/act%3Atennis';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function put(page, store, rows) {
  await page.evaluate(
    ([store, rows]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction([store], 'readwrite');
          for (const x of rows) tx.objectStore(store).put(x);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}
const count = (page, store, fn) => page.evaluate(
  ([store, src]) =>
    new Promise((ok) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => {
        const q = r.result.transaction([store]).objectStore(store).getAll();
        q.onsuccess = () => (r.result.close(), ok(q.result.filter(new Function('x', `return ${src}`)).length));
      };
    }),
  [store, fn],
);

test('Tennis: played like last time, a planned time asks Gespielt, booking link, cover photo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto(`./${TENNIS}`);
  const top = page.locator('[data-tennis-top]');
  await expect(top).toBeVisible();
  // played: the sheet, a match on clay, saved; it shows in the history and counts in Aktiv
  await page.locator('[data-tennis-played]').click();
  const sheet = page.locator('[data-played-sheet="played"]');
  await expect(sheet.getByRole('heading', { name: T('Tennis played') })).toBeVisible();
  await sheet.locator('[data-ps-type]').getByRole('radio', { name: T('Match|tennis') }).click();
  await sheet.locator('[data-ps-court]').getByRole('radio', { name: T('Hard court|court') }).click();
  await sheet.locator('[data-ps-worked]').fill('test_data_gtp_ Aufschlag');
  await sheet.locator('[data-ps-save]').click();
  await expect(sheet).toHaveCount(0);
  const entries = page.locator('[data-tennis-entry="played"]');
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toContainText('test_data_gtp_ Aufschlag');
  await expect(page.locator('[data-tennis-log]')).toContainText(T('played this month'));
  expect(await count(page, 'flowLog', "x.actId === 'tennis'")).toBe(1);
  // like last time in one tap
  const like = page.locator('[data-tennis-like]');
  await expect(like).toContainText(T('Like last time: {line}', { line: `${T('Match|tennis')} · ${T('{n} min', { n: 90 })} · ${T('Hard court|court')}` }));
  await like.click();
  await expect(entries).toHaveCount(2);
  // a planned time this morning: «Gespielt?» → not played
  await put(page, 'sportItems', [{ id: 'slot-test_data_gtp_1', sport: 'act:tennis', kind: 'slot', day: D0, time: '08:00', min: 60, court: 'clay', at: `${D0}T06:00:00.000Z` }]);
  await page.reload(); // written past the app: the page reads it again
  await expect(top).toBeVisible();
  const ask = page.locator('[data-tennis-ask]');
  await expect(ask).toContainText(T('{day} {time} booked · Played?', { day: T('today'), time: '08:00' }));
  await ask.locator('[data-ask-no]').click();
  await expect(ask).toHaveCount(0);
  // enter a time tomorrow; it shows as planned
  await page.locator('[data-tennis-slot]').click();
  const ss = page.locator('[data-slot-sheet="slot"]');
  await ss.locator('[data-slot-time]').fill('18:00');
  await ss.locator('[data-slot-save]').click();
  await expect(page.locator('[data-tennis-next]')).toContainText(`${T('tomorrow')} 18:00`);
  // the booking link, set once
  await page.locator('[data-tennis-book-set]').click();
  const bs = page.locator('[data-slot-sheet="book"]');
  await bs.locator('[data-book-url]').fill('www.example.ch/test_data_gtp_platz');
  await bs.locator('[data-slot-save]').click();
  await expect(page.locator('[data-tennis-book]')).toHaveAttribute('href', 'https://www.example.ch/test_data_gtp_platz');
  // a cover photo from the device
  await page.locator('[data-cover-edit]').click();
  const cs = page.locator('[data-cover-sheet]');
  await expect(cs.locator('[data-cover-empty]')).toBeVisible();
  await cs.locator('input[type=file]').last().setInputFiles({ name: 'test_data_gtp_cover.png', mimeType: 'image/png', buffer: PNG });
  await expect(cs.locator('[data-cover-preview]')).toBeVisible();
  await cs.locator('[data-cover-save]').click();
  await expect(page.locator('[data-tennis-cover]')).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Yoga on Meditation: a regular class, War dort counts as yoga, the studio link', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/flow/act/meditation');
  const card = page.locator('[data-yoga-card]');
  await expect(card).toBeVisible();
  await card.locator('[data-yoga-more]').click();
  // Friday 08:00, already over at 09:00
  await card.locator('[data-yoga-add]').click();
  await card.locator('[data-yoga-wd]').selectOption({ label: T('Fri|weekday') });
  await card.locator('[data-yoga-time]').fill('08:00');
  await card.locator('[data-yoga-name]').fill('test_data_gtp_ Hatha');
  await card.locator('[data-yoga-class-save]').click();
  await expect(card.locator('[data-yoga-class]')).toHaveCount(1);
  const ask = card.locator('[data-yoga-ask]');
  await expect(ask).toContainText('test_data_gtp_ Hatha');
  await ask.locator('[data-yoga-went]').click();
  await expect(ask).toHaveCount(0);
  await expect(card).toContainText(T('last 30 days: {went}× there, {skipped}× skipped', { went: 1, skipped: 0 }));
  expect(await count(page, 'flowLog', "x.actId === 'yoga'")).toBe(1);
  // next week the same class is next
  await expect(card.locator('[data-yoga-next]')).toContainText('test_data_gtp_ Hatha');
  // a second class and the order
  await card.locator('[data-yoga-add]').click();
  await card.locator('[data-yoga-name]').fill('test_data_gtp_ Yin');
  await card.locator('[data-yoga-class-save]').click();
  await expect(card.locator('[data-yoga-class]')).toHaveCount(2);
  await card.getByRole('button', { name: T('Move {name} up', { name: `${T('Thu|weekday')} 18:30 · test_data_gtp_ Yin` }) }).click();
  await expect(card.locator('[data-yoga-class]').first()).toContainText('test_data_gtp_ Yin');
  // the studio
  await card.locator('[data-yoga-studio-edit]').click();
  await card.locator('[data-yoga-url]').fill('example.ch/test_data_gtp_stundenplan');
  await card.locator('[data-yoga-studio-save]').click();
  await expect(card.locator('[data-yoga-studio]')).toHaveAttribute('href', 'https://example.ch/test_data_gtp_stundenplan');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Keep a good day in the evening, plan it again; wished and lived with minus and plus', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 21 });
  await page.goto('./#/check/evening');
  const gd = page.locator('[data-good-day]').first();
  await gd.locator('[data-good-day-open]').click();
  await gd.locator('[data-good-day-text]').fill('test_data_gtp_ Morgens Ruhe, nachmittags raus');
  await gd.locator('[data-good-day-save]').click();
  await expect(gd.locator('[data-good-day-kept]')).toContainText('test_data_gtp_ Morgens Ruhe');
  await page.goto('./#/me/wohl');
  const list = page.locator('[data-good-days]');
  const row = list.locator('[data-good-day-row]');
  await expect(row).toHaveCount(1);
  await row.locator('[data-good-day-short]').click();
  await expect(row).toContainText('test_data_gtp_ Morgens Ruhe');
  await expect(row).not.toContainText('nachmittags raus');
  await row.locator('[data-good-day-plan]').click();
  await expect(row.locator('[data-good-day-again]')).toBeVisible();
  // wished and lived: + on «Spass» sets a wish of 60
  const mix = page.locator('[data-mix]');
  // on a phone the bars wait behind «Alle n zeigen» (phone length budget)
  if (await mix.locator('[data-mix-more]').count()) await mix.locator('[data-mix-more]').click();
  await expect(mix.locator('[data-mix-row]')).toHaveCount(9);
  await mix.locator('[data-mix-row="fun"] [data-mix-plus]').click();
  await expect(mix.locator('[data-mix-row="fun"] [data-mix-wish]')).toHaveAttribute('data-mix-wish', '60');
  expect(await noSideScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
