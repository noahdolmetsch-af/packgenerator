// «Wegweiser statt Katalog» PR 23 (plan Noah 01.11.2026 «freigabe»): at the end of a page a quiet fold lists the functions that
// show only in the right situation, each with when it appears; «Show it in the example» starts the playground. German, phone and
// computer, fictional data (home0460-fixture), no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Appears when: Touren lists Arrive well with its moment, Packen starts the example', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  const fold = page.locator('[data-erscheint-wenn-fold]');
  await fold.scrollIntoViewIfNeeded();
  await expect(fold.locator('summary')).toContainText(T('Only in the right situation · {n}', { n: '' }).replace(/\s*$/, ''));
  await tap(fold.locator('summary'), info);
  const line = fold.locator('[data-erscheint-wenn="f.homecoming"]');
  await expect(line).toContainText(T('Arrive well'));
  await expect(line).toContainText(T('Appears once a trip has ended, on its page «Trip ended».'));
  expect(await noScroll(page)).toBe(0);

  await page.goto('./#/');
  await page.goto('./#/pack');
  const pack = page.locator('[data-erscheint-wenn-fold]');
  await pack.scrollIntoViewIfNeeded();
  await tap(pack.locator('summary'), info);
  await expect(pack.locator('[data-erscheint-wenn="f.laundry"]')).toBeVisible();
  expect(await noScroll(page)).toBe(0);
  await tap(pack.locator('[data-erscheint-play="f.laundry"]'), info);
  await expect(page).toHaveURL(/#\/me$/);
  expect(errors).toEqual([]);
});

test('Appears when: never on Heute', async ({ page, context }, info) => {
  await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-erscheint-wenn-fold]')).toHaveCount(0);
});
