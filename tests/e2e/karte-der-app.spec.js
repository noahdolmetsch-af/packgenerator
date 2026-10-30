// «Pfad auf jeder Seite» Schritt 5 (Noah 28.10.2026): Ich › Karte der App lists the places with their functions
// and paths, a search narrows it and a tap goes there. German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('the map of the app lists places, searches and leads to a function', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me');
  await ready(page);
  await page.locator('[data-me-row="karte"]').click();
  await expect(page.locator('[data-appmap]')).toBeVisible();
  expect(await page.locator('[data-am-place]').count()).toBeGreaterThan(2);

  await page.locator('[data-am-search]').fill('verstehen');
  const item = page.locator('[data-am-item="f.verstehen"]');
  await expect(item).toBeVisible();
  await expect(item).toContainText(`${T('Me|place')} › ${T('Understand the app')}`);
  await item.locator('a').click();
  await expect(page.locator('[data-verstehen]')).toBeVisible();
});
