import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-packgenerator/88b9db23-75a1-55a4-910f-9b03a2db267c/scratchpad/m13/';
const TAG = process.env.SHOT_TAG || 'nach';
const HERE = { lat: 47.36, lon: 8.55 };
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
test('m13 shots', async ({ page, context }, info) => {
  const phone = info.project.name === 'phone';
  const w = phone ? '390' : '1440';
  await openHome(page, context, info);
  await context.route(/overpass/, (r) => r.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 8 });
  await page.setViewportSize(phone ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}${TAG}-karte-${w}.png` });
  await tap(page.locator('[data-dp-next]'), info);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}${TAG}-seite2-${w}.png` });
  await tap(page.locator('[data-dp-prev]'), info);
  if (process.env.SHOT_MORE) {
    const more = page.locator('[data-live-all-open], [data-live-sheet-toggle]').first();
    await tap(more, info);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}${TAG}-alles-${w}.png` });
  }
});
test('menu during', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/overpass/, (r) => r.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await tap(page.locator('[data-live-menu]'), info);
  const d = page.locator('[data-live-menu-during]');
  await d.scrollIntoViewIfNeeded();
  await tap(d.locator('summary'), info);
  await page.waitForTimeout(500);
  await page.locator('[data-live-menu-panel]').screenshot({ path: `${OUT}${TAG}-menu-${info.project.name}.png` });
});
