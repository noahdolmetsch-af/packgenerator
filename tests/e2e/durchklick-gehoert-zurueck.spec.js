// Durchklick 2 and 3 (Noah 22.11.2026 «2a», «3a»): «Belongs to …» is a closed line behind the title and behind the line «What you can do here»;
// the one-step path of a page names where you came from, and a page opened directly names the place it belongs to. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test.use({ cardsOpen: false });

test('Belongs to: a closed line behind the title, one tap opens the links', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  const line = page.locator('[data-card-line="gd:trips"]');
  await expect(line).toBeVisible();
  await expect(line).toContainText(T('Belongs to {moment}', { moment: T('Planning a trip|moment') }));
  // behind the title, never above it
  const y = async (sel) => (await page.locator(sel).first().boundingBox()).y;
  expect(await y('h1')).toBeLessThan(await y('[data-card-line="gd:trips"]'));
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/gehoert-zu-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await line.click();
  await expect(page.locator('[data-gehoert="planen"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Back: Wetter opened from Heute names Heute, opened directly it names Touren', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 9 });
  await page.evaluate(() => (location.hash = '#/wetter'));
  const back = page.locator('nav.crumbs a, nav.pcrumbs a').first();
  await expect(back).toBeVisible();
  await expect(back).toContainText(T('Today|place'));
  if (process.env.SHOTS) {
    await page.screenshot({ path: `${process.env.SHOTS}/zurueck-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await page.goto('./#/wetter');
  await page.reload();
  await expect(page.locator('nav.crumbs a, nav.pcrumbs a').first()).toContainText(T('Trips|place'));
});
