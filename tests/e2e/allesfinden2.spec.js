// «Alles finden 2» (Noah 22.10.2026 «1a 2a 3a 4a 5a», then «1a» for all proposals): one «?» per page with the
// help of that page, «Alle n» as a grid with one sentence per page, Ich keeps data, settings and help, the
// emergency and the checks in «+ Neu», new tabs (Vorrat, Ausgeliehen, Reise-Links, Werkzeugkasten).
// Fictional data (home0460-fixture.js), German UI, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { PLACE_TABS } from '../../src/lib/nav.js';

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('AF2-1 the help button opens the help of this page, with the way to all help', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/trips');
  const btn = page.locator('[data-help-open]').filter({ visible: true }).first();
  await expect(btn).toBeVisible();
  await btn.click();
  const sheet = page.locator('dialog[data-help]');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name: T('Help for this page') })).toBeVisible();
  await expect(sheet.locator('[data-help-all]')).toHaveText(new RegExp(T('Help and functions')));
  await page.screenshot({ path: info.outputPath('af2-hilfe.png') });
  await sheet.locator('[data-help-all]').click();
  await expect(page).toHaveURL(/#\/features/);
  await expect(page.getByRole('heading', { name: T('Help and functions'), level: 1 })).toBeVisible();
  await expect(page.locator('[data-block="help"] [data-intro-again]')).toBeVisible();
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('AF2-2 All n shows every page of Planen as a tile with one sentence', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a computer lists the tabs in the sidebar');
  const T = await openHome(page, context, info);
  await page.goto('./#/week');
  const more = page.locator('nav.ptabs .pmore');
  await expect(more).toBeVisible();
  await expect(more).toContainText(T('All {n}|tabs', { n: PLACE_TABS.week.length }));
  await more.click();
  const tiles = page.locator('dialog.ptsheet [data-all-pages] a[data-page-tile]');
  await expect(tiles).toHaveCount(PLACE_TABS.week.length);
  await page.screenshot({ path: info.outputPath('af2-alle.png') });
  // sorting is one step away, with arrows
  await page.locator('dialog.ptsheet [data-sort-pages]').click();
  await expect(page.locator('dialog.ptsheet [data-all-pages]')).toHaveCount(0);
  await expect(page.locator('dialog.ptsheet').getByRole('button', { name: T('Done|tabs') })).toBeVisible();
  await noSideScroll(page);
});

test('AF2-3 Ich is short, the new tabs exist, New has the emergency and the checks', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/me');
  await expect(page.locator('a.ich-row[href="#/me/tools"]')).toHaveCount(0);
  await expect(page.locator('a.ich-row[href="#/inspiration"]')).toHaveCount(0);
  for (const [place, href] of [['gear', '#/gear/supplies'], ['gear', '#/gear/lend'], ['trips', '#/travel'], ['trips', '#/me/tools']]) {
    expect(PLACE_TABS[place].some((x) => x.href === href)).toBe(true);
  }
  await page.goto('./#/gear');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new')));
  const sheet = page.locator('dialog.sheet.new');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-new-sos]')).toContainText(T('Emergency: show my location'));
  await expect(sheet.locator('[data-new-check]')).toHaveCount(2);
});
