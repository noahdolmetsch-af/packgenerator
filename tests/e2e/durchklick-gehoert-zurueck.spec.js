// Durchklick 2 and 3 (Noah 22.11.2026 «2a», «3a»), changed 26.11.2026 (Noah «Ja»): «Belongs to …» stands in the «?» window, not on the page;
// the one-step path of a page names where you came from, and a page opened directly names the place it belongs to. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test.use({ cardsOpen: false });

test('Belongs to: no line on the page, the links stand in the help window', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  await expect(page.locator('h1').first()).toBeVisible();
  // 26.11.2026 (Noah «Ja»): nothing of it on the page, content first
  await expect(page.locator('[data-card-line="gd:trips"]')).toHaveCount(0);
  await expect(page.locator('[data-gehoert-host]')).toHaveCount(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/gehoert-zu-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await page.locator('[data-help-open]:visible').first().click();
  const row = page.locator('dialog[data-help] [data-gehoert="planen"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Belongs to {moment}', { moment: T('Planning a trip|moment') }));
  expect(errors).toEqual([]);
});

test('Back: a page with a one-step path opened from Heute names Heute, opened directly it names its own place', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 9 });
  await page.evaluate(() => (location.hash = '#/trips/compare'));
  // since «Wege» (23.11.2026) a page under a tab starts with place and tab; only a one-step path names where you came from
  const back = page.locator('nav.crumbs a, nav.pcrumbs a').first();
  await expect(back).toBeVisible();
  await expect(back).toContainText(T('Today|place'));
  if (process.env.SHOTS) {
    await page.screenshot({ path: `${process.env.SHOTS}/zurueck-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await page.goto('./#/trips/compare');
  await page.reload();
  await expect(page.locator('nav.crumbs a, nav.pcrumbs a').first()).toContainText(T('Trips|place'));
});
