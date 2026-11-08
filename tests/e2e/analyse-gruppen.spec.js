// «Gruppen mit Vorschau» (Noah 08.11.2026 «3a», thread «UI-Test Analyse-Seite»): in «Alle Werte» a closed group says
// what is inside it (up to three values with their latest state); an open group shows its tiles instead.
// German, phone + desktop; fictional Fitbit values for 90 days; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, aktivRows, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Analyse: a closed group of All values shows a preview of its values', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const healthDays = [];
  for (let i = 0; i < 90; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, rhr: 52 + (i % 5), hrZones: { light: 220 + (i % 7) * 10, mod: 30 + (i % 6) * 6, vig: 8 + (i % 5) * 4, peak: 2 + (i % 4) * 2 }, azm: 20 + (i % 9) * 6, steps: 6000 + (i % 8) * 900, src: 'google', at: `${date}T08:00:00Z` });
  }
  await put(page, { ...aktivRows(), healthDays });
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  await page.locator('[data-tab="werte"]').click();

  const groups = page.locator('[data-group]');
  expect(await groups.count()).toBeGreaterThan(1);
  // closed groups: a preview with a name and a number, never wider than the card
  const pre = page.locator('[data-group-preview]');
  expect(await pre.count()).toBeGreaterThan(0);
  const first = pre.first();
  await expect(first).toBeVisible();
  expect(await first.textContent()).toMatch(/\d/);
  const card = await page.locator('[data-group]').first().boundingBox();
  const box = await first.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.ANALYSE_SHOTS) await page.locator('.gall').first().locator('xpath=..').screenshot({ path: `qa/analyse/gruppen-${info.project.name}.png` });

  // open it: the tiles show and the preview goes away
  const g = page.locator('[data-group]:has([data-group-preview])').first();
  await g.locator('summary').click();
  await expect(g.locator('[data-group-preview]')).toBeHidden();
  await expect(g.locator('.tile').first()).toBeVisible();
  expect(errors).toEqual([]);
});
