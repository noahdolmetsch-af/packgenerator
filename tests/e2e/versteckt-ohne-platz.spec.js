// «Versteckte Funktionen» Schritt 1 (Noah 03.11.2026 «4b»): three functions get a visible way in.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';

const T = tr('de');
const open = async (page, hash) => {
  await page.goto('./' + hash);
  await page.locator('main').first().waitFor();
  await settle(page);
};

test('plant passport, daily list and mountain pages are one tap away', async ({ page, context }, info) => {
  await start(page, context, info);
  // Planen › Merken: the plant passport shows also without a plant (the test data has none)
  await open(page, '#/calendar');
  const pass = page.locator('[data-plant-pass-open]');
  await expect(pass).toBeVisible();
  await pass.click();
  await expect(page).toHaveURL(/#\/calendar\/pflanzen/);
  // Aktiv › Erholung: the daily list «Was mir gut tut»
  await open(page, '#/flow/rest');
  const routine = page.locator('[data-rest-routine]');
  await expect(routine).toBeVisible();
  await expect(routine).toContainText(T('Your daily list «What does me good»'));
  await routine.click();
  await expect(page).toHaveURL(/#\/routine/);
  // Touren › Skitouren: the three mountain pages straight from the start page
  await open(page, '#/ski');
  for (const [k, h] of [['qr', /#\/mountain\/qr/], ['scales', /#\/mountain\/scales/], ['map', /#\/mountain\/map/]]) {
    await open(page, '#/ski');
    const a = page.locator(`[data-mountain-direct] [data-direct="${k}"]`);
    await expect(a).toBeVisible();
    await a.click();
    await expect(page).toHaveURL(h);
  }
});
