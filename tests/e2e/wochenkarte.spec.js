// «Wochenrückblick» card on Heute (Noah 10.11.2026 «1b»): Sunday 17:00 to Monday 12:00, three numbers, the tasks that
// slide to Monday, three buttons. Fictional data only; the clock stands on Sunday 15 November 2026, 18:30 (Zürich).
// SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const SUNDAY = '2026-11-15T18:30:00+01:00';
const MONDAY = '2026-11-16T08:00:00+01:00';

const act = (id, day, movingS, km, hm) => ({ id: `test_wk_${id}`, day, kind: 'bike', name: 'Test ride', movingS, km, hm, hist: null });
const rows = {
  activities: [
    act('a', '2026-11-09', 7200, 60, 400), act('b', '2026-11-11', 5400, 45, 300), act('c', '2026-11-13', 7200, 37, 200), // this week: 5:30 h, 142 km
    act('d', '2026-11-02', 3600, 80, 500), act('e', '2026-11-04', 3600, 62, 300), // the week before: 2:00 h, 142 km
  ],
};
const settings = [{ key: 'week.items', value: [
  { id: 'test_wk_t1', kind: 'todo', title: 'Test: oil the chain', day: '2026-11-14', time: '', done: false },
  { id: 'test_wk_t2', kind: 'todo', title: 'Test: send invoice', day: '2026-11-15', time: '', done: false },
] }];

async function open(page, context, at) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(at) });
  await page.goto('./#/');
  await ready(page);
  await put(page, { ...rows, settings });
  await page.reload();
  await ready(page);
}

test('on Sunday evening Heute shows the week in three numbers and what slides to Monday', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, SUNDAY);
  const card = page.locator('[data-section="week-card"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Your week in three numbers'));
  await expect(card.locator('[data-wk-num]')).toHaveCount(3);
  await expect(card.locator('[data-wk-num="km"]')).toContainText('142');
  await expect(card.locator('[data-wk-num="hours"]')).toContainText('5:30');
  await expect(card.locator('[data-wk-open]')).toContainText('2');
  for (const sel of ['[data-wk-go]', '[data-wk-plan]', '[data-wk-today]']) {
    const box = await card.locator(sel).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  if (process.env.SHOTS) {
    await page.waitForTimeout(1200);
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${process.env.SHOTS}/wochenkarte-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: false });
  }
  expect(errors).toEqual([]);
});

test('«Not today» puts the card away, also after a reload', async ({ page, context }) => {
  await open(page, context, SUNDAY);
  const card = page.locator('[data-section="week-card"]');
  await card.locator('[data-wk-today]').click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-section="week-card"]')).toHaveCount(0);
});

test('«Open the review» opens the week review and keeps the card away', async ({ page, context }) => {
  await open(page, context, MONDAY);
  const card = page.locator('[data-section="week-card"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-wk-open]')).toHaveCount(0); // tasks slide only on Sundays
  await card.locator('[data-wk-go]').click();
  await expect(page).toHaveURL(/#\/flow\/review/);
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('[data-section="week-card"]')).toHaveCount(0);
});
