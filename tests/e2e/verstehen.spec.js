// «App verstehen» (Noah 26.10.2026 «mini kurs … in der app einsehbar mit links und übungen … unter ich - app verstehen»):
// Ich › App verstehen (#/me/verstehen): seven lessons from lib/verstehen.js, each folded with steps, an exercise
// and links; «Done» ticks and unticks, stays after a reload. German UI, fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { LESSONS, HANDBOOK } from '../../src/lib/verstehen.js';

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('App verstehen: from Ich to the lessons, one exercise, tick done and take it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me');
  const row = page.locator('a[data-me-row="verstehen"]');
  await expect(row).toContainText(T('Understand the app'));
  await row.click();
  await expect(page).toHaveURL(/#\/me\/verstehen$/);
  const root = page.locator('[data-verstehen]');
  await expect(root.getByRole('heading', { level: 1 })).toHaveText(T('Understand the app'));
  await expect(root.locator('[data-lesson]')).toHaveCount(LESSONS.length);
  await expect(root.getByRole('link', { name: T('Emergency handbook') })).toHaveAttribute('href', HANDBOOK);
  const count = root.locator('[data-vs-count]');
  await expect(count).toHaveText(T('{n} of {total} done', { n: 0, total: LESSONS.length }));
  expect(await noSideScroll(page)).toBe(true);

  // lesson 2: open it, it shows its exercise and an in-app link; tick it
  const l2 = root.locator('[data-lesson="backup"]');
  await l2.locator('summary').click();
  await expect(l2).toContainText(T(LESSONS[1].exercise));
  await expect(l2.getByRole('link', { name: T('Data and backup') })).toHaveAttribute('href', '#/me/data');
  await l2.getByRole('button', { name: T('Mark as done') }).click();
  await expect(count).toHaveText(T('{n} of {total} done', { n: 1, total: LESSONS.length }));
  await expect(l2.getByRole('button', { name: T('Done|lesson') })).toHaveAttribute('aria-pressed', 'true');
  expect(await noSideScroll(page)).toBe(true);

  // it stays after a reload, and can be taken back
  await page.reload();
  await expect(count).toHaveText(T('{n} of {total} done', { n: 1, total: LESSONS.length }));
  await l2.locator('summary').click();
  await l2.getByRole('button', { name: T('Done|lesson') }).click();
  await expect(count).toHaveText(T('{n} of {total} done', { n: 0, total: LESSONS.length }));
  expect(errors).toEqual([]);
});
