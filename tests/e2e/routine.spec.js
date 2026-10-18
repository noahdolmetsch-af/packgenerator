// Routine «Das tut mir gut» (mockups D1 + D2, Noah 12.10.2026 «d1-d5 freigeben», 1a: a wide tile at the
// top of Heute). Fictional data only (test_data_gtp_); the clock stands on Friday 9 October 2026, 09:00
// (Europe/Zurich, home0460-fixture.js). The examples and the record come from the app source.
// SHOTS=<folder> saves the pictures (viewport shots, light mode).
import { test, expect } from '@playwright/test';
import { D0, openHome, homeFixture } from './home0460-fixture.js';
import { ROUTINE_KEY, seedItems, addDays } from '../../src/lib/routine.js';
import { READY, HEAD_0155 } from '../../src/lib/home/tiles.js';

const back = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => addDays(D0, -(from + i)));
/** The examples, «A walk» ticked the 11 days before today, the banana today and yesterday, a meditation today in Im Flow. */
function data() {
  const d = homeFixture();
  const items = [...seedItems(), { id: 'test_data_gtp_swim', name: 'test_data_gtp_ Schwimmen', days: [4], link: null, time: null }];
  d.tables.settings.push({ key: ROUTINE_KEY, value: { items, ticks: { walk: back(1, 11), banana: back(0, 1) } } });
  d.tables.flowActs = [{ id: 'meditation', name: 'Meditation', icon: 'lotus', ring: 'mind', order: 0, perTap: 1, minMin: 10, paused: false, goals: [{ id: 'g', count: 1, days: 1 }], season: null, counts: [] }];
  d.tables.flowLog = [{ id: 'test_data_gtp_fl1', actId: 'meditation', day: D0, at: `${D0}T06:30:00.000Z`, n: 1, min: 20 }];
  return d;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  // Heute shows the tile from its top (the greeting and the day card above it are not part of the picture)
  if (name === 'heute') await page.locator('.wall [data-tile="routine"]').evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 64));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('Heute: the routine on top, tick and take back, streak, weekday items, milestone', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: data() });
  // HN4: right under the tiles on top (meditation, day card, Important today); the fixture has no stored wall
  expect(READY.map((x) => x.id).slice(0, HEAD_0155.length + 1)).toEqual([...HEAD_0155, 'routine']);
  const tile = page.locator('.wall [data-tile="routine"]');
  await expect(tile).toBeVisible();
  const shown = await page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile));
  expect(shown[shown.indexOf('routine') - 1]).toBe('important');
  await expect(tile.locator('[data-routine-hint]')).toHaveText(T('Tick off what did you good today. No must: an empty day does not count against you.'));
  await expect(tile).toHaveAttribute('data-size', 'long');
  await expect(tile.getByRole('heading', { name: T('What does me good') })).toBeVisible();
  // Friday: six examples (yoga is for Thursday) and the Friday item; banana and meditation done
  await expect(tile.locator('[data-routine-count]')).toHaveText(`${T('{n} of {m}', { n: 2, m: 7 })} · ${T('Fri|short')}`);
  await expect(tile.locator('li[data-item]')).toHaveCount(7);
  await expect(tile.locator('li[data-item="yoga"]')).toHaveCount(0);
  await expect(tile.locator('li[data-item="test_data_gtp_swim"]')).toContainText(T('only on {day}', { day: 'Freitag' }));
  await expect(tile.getByText(T('Up before {time}', { time: '5:55' }))).toBeVisible();
  // the meditation ticks itself (Im Flow · 20 min) and cannot be taken back here
  const med = tile.locator('li[data-item="meditate"] button');
  await expect(med).toHaveAttribute('aria-pressed', 'true');
  await expect(med).toBeDisabled();
  await expect(med).toContainText(T('linked with Im Flow · {min} min', { min: 20 }));
  // days in a row from 2 on: the walk 11 days (today still open), the banana 2
  await expect(tile.locator('li[data-item="walk"] [data-streak]')).toHaveText(T('{n} days', { n: 11 }));
  await expect(tile.locator('li[data-item="banana"] [data-streak]')).toHaveText(T('{n} days', { n: 2 }));
  await expect(tile.locator('li[data-item="shower"] [data-streak]')).toHaveCount(0);
  await expect(tile.locator('[data-milestone]')).toHaveText(T('Milestone: {left} more to «{name}: {goal} days in a row»', { left: T('{n} days', { n: 3 }), name: T('A walk'), goal: 14 }));
  await shot(page, info, 'heute');

  // a tap ticks, a second tap takes it back
  const walk = tile.locator('li[data-item="walk"] button');
  await walk.click();
  await expect(walk).toHaveAttribute('aria-pressed', 'true');
  await expect(tile.locator('[data-routine-count]')).toContainText(T('{n} of {m}', { n: 3, m: 7 }));
  await expect(tile.locator('li[data-item="walk"] [data-streak]')).toHaveText(T('{n} days', { n: 12 }));
  await walk.click();
  await expect(walk).toHaveAttribute('aria-pressed', 'false');
  await expect(tile.locator('[data-routine-count]')).toContainText(T('{n} of {m}', { n: 2, m: 7 }));
  // kept after a reload
  await walk.click();
  await expect(walk).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.wall [data-tile="routine"] li[data-item="walk"] button')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  // tap targets: the rows and «Change list» at least 44 px high
  for (const el of [page.locator('.wall [data-tile="routine"] li[data-item="shower"] button'), page.locator('.wall [data-tile="routine"] [data-to="routine"]')]) expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});

test('Change list: weekday chips, add, rename, delete with Undo, back on Heute', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  const tile = page.locator('.wall [data-tile="routine"]');
  // without a record: the seven examples, six of them on a Friday, nothing done yet
  await expect(tile.locator('[data-routine-count]')).toHaveText(`${T('{n} of {m}', { n: 0, m: 6 })} · ${T('Fri|short')}`);
  await expect(tile.locator('[data-milestone]')).toHaveText(T('Milestone: {goal} days in a row', { goal: 14 }));
  await tile.getByRole('link', { name: T('Change list') }).click();
  await expect(page).toHaveURL(/#\/routine$/);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('What does me good') })).toBeVisible();
  await expect(main.getByText(T('Put what does you good on your list. It counts every day until you change it.'))).toBeVisible();
  const list = main.locator('.rtp-list > li');
  // «Every day»: six; Thursday: «Do · +1» and seven, with «Hüt Yoga?»
  await expect(main.locator('[data-view="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(list).toHaveCount(6);
  await expect(main.locator('[data-view="3"]')).toHaveText(`${T('Thu|short')} · +1`);
  await main.locator('[data-view="3"]').click();
  await expect(list).toHaveCount(7);
  await expect(main.locator('li[data-item="yoga"]')).toContainText(T('Yoga today?'));
  await main.locator('[data-view="all"]').click();
  await shot(page, info, 'liste');

  // add a suggestion with one tap, and an own one
  await main.locator('[data-add="invite"]').click();
  await expect(list).toHaveCount(7);
  await expect(main.locator('.rtp-list')).toContainText(T('Invite someone'));
  await expect(main.locator('[data-add="invite"]')).toHaveCount(0);
  await main.locator('[data-add="own"]').click();
  await main.locator('[data-own]').fill('test_data_gtp_ Lesen');
  await main.locator('[data-own]').press('Enter');
  await expect(list).toHaveCount(8);
  // rename: tap the item, change its name; its days
  await main.locator('li[data-item="shower"] .rtp-open').click();
  const edit = main.locator('[data-edit="shower"]');
  await edit.locator('[data-rename]').fill('test_data_gtp_ Kalt duschen');
  await edit.locator('[data-rename]').press('Enter');
  await expect(main.locator('li[data-item="shower"] .rtp-name')).toHaveText('test_data_gtp_ Kalt duschen');
  await edit.getByRole('button', { name: T('Done') }).click();
  await expect(edit).toHaveCount(0);
  // ↓ moves one place down
  const order = () => list.evaluateAll((els) => els.map((e) => e.dataset.item));
  const before = await order();
  // on a phone the arrows sit in the opened item, on a computer in the row
  if (info.project.name === 'phone') await main.locator(`li[data-item="${before[0]}"] .rtp-open`).click();
  await main.locator(`li[data-item="${before[0]}"]`).getByRole('button', { name: new RegExp(T('Move {name} down', { name: '.*' })) }).click();
  await expect.poll(order).toEqual([before[1], before[0], ...before.slice(2)]);

  // delete, then Undo brings it back (with its place)
  const ordered = await order();
  await main.locator('li[data-item="walk"] [data-del]').click();
  await expect(main.locator('li[data-item="walk"]')).toHaveCount(0);
  await expect(page.getByText(T('«{name}» deleted', { name: T('A walk') }))).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(order).toEqual(ordered);

  // back on Heute: the new items are there
  await page.goto('./#/');
  await expect(tile.locator('.rt-list')).toContainText('test_data_gtp_ Lesen');
  await expect(tile.locator('.rt-list')).toContainText('test_data_gtp_ Kalt duschen');
  await expect(tile.locator('[data-routine-count]')).toContainText(T('{n} of {m}', { n: 0, m: 8 }));
  expect(errors).toEqual([]);
});

test('everything is a suggestion: the tile can leave the wall', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await expect(page.locator('.wall [data-tile="routine"]')).toBeVisible();
  await page.getByRole('button', { name: T('Customise the start page') }).first().click();
  await page.getByRole('button', { name: T('Take {name} off the start page', { name: T('What does me good') }) }).click();
  await expect(page.locator('.wall [data-tile="routine"]')).toHaveCount(0);
});
