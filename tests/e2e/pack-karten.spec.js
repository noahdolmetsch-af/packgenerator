// «Pack-Karten» (Warteliste 4; Noah 22.11.2026 «4a»): Trips begins with the tours being prepared as cards; «Continue with …» opens the
// packing list in Steps at the waiting step; «New trip» opens its window. Fictional data (home0460 fixture), German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Trips: pack cards on top, Continue opens the list in Steps', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  const cards = page.locator('[data-pack-card]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeLessThanOrEqual(3);
  await expect(page.locator('[data-pack-new]')).toBeVisible();
  // the content is not pushed: the cards stand right behind the title block
  // (relative to the title: the path, the closed help lines and the search of the place stand between them since the day-one layout of Touren)
  const gap = (await page.locator('[data-pack-cards]').boundingBox()).y - (await page.locator('main h1').first().boundingBox()).y;
  expect(gap).toBeLessThan(500);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/karten-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await expect(cards.first().locator('[data-pack-continue]')).toContainText(T('Continue with {step}', { step: '' }).trim().split(' ')[0]);
  await cards.first().locator('[data-pack-continue]').click();
  await expect(page).toHaveURL(/#\/pack/);
  await expect(page.locator('[data-pack-view]')).toHaveValue('steps');
  await expect(page.locator('.bag-group .bag-heading[aria-expanded="true"]').first()).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('pg.packStep'))).toBeNull();
  expect(errors).toEqual([]);
});

test('Trips: the card New trip opens the window', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  await page.locator('[data-pack-new]').click();
  await expect(page.locator('dialog[open], [role="dialog"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
