// «Aktiv und Auswerten» 1a (Noah 03.11.2026): «Alles hier» on top of Aktiv, ten tiles one tap away; «Belongs to …» is gone
// there. German UI, fictional wall (wall-fixture.js), phone + desktop.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const D0 = '2026-10-09T07:52:00+02:00';

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await putWall(page);
  await page.goto('./#/flow');
}

test('AAH-1 Aktiv starts with ten tiles; a tile opens its page; no «Gehört zu»', async ({ page, context }) => {
  await open(page, context);
  const box = page.locator('[data-all-here="aktiv"]');
  await expect(box).toBeVisible();
  await expect(box.getByRole('heading', { name: T('All here') })).toBeVisible();
  const tiles = box.locator('[data-all-here-tile]');
  await expect(tiles).toHaveCount(10);
  await expect(page.locator('[data-gehoert]')).toHaveCount(0);
  // the field stands above the ticking
  const top = await box.evaluate((el) => el.getBoundingClientRect().top);
  const tick = await page.locator('#tick-h').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeLessThan(tick);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const href = await box.locator('[data-all-here-tile="f.milestones"]').getAttribute('href');
  expect(href).toBe('#/flow/milestones');
  await box.locator('[data-all-here-tile="f.milestones"]').click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(href);
});

test('AAH-2 a tile can be hidden with Undo and shown again', async ({ page, context }) => {
  await open(page, context);
  const box = page.locator('[data-all-here="aktiv"]');
  await expect(box).toBeVisible();
  await box.locator('[data-all-here-edit]').click();
  const row = box.locator('li[data-sort-id="f.gipfelbuch"]');
  await row.getByRole('button', { name: T('Hide {name}').replace('{name}', T('Summit book')), exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(box.locator('li[data-sort-id="f.gipfelbuch"]')).toHaveCount(1);
});

test('AAH-5 the list of «Change» fits a 390 px phone (E5-001)', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, context);
  const box = page.locator('[data-all-here="aktiv"]');
  await box.locator('[data-all-here-edit]').click();
  await expect(box.locator('li[data-sort-id="f.gipfelbuch"]')).toBeVisible();
  // before: the column grew to the widest row and the page was 446 px wide
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  for (const li of await box.locator('li[data-sort-id]').all()) {
    const r = await li.evaluate((el) => el.getBoundingClientRect().right);
    expect(r).toBeLessThanOrEqual(390);
    const hide = await li.locator('button.btn').evaluate((el) => el.getBoundingClientRect().right);
    expect(hide).toBeLessThanOrEqual(390);
  }
});
