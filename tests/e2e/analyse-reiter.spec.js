// «Alle Reiter sichtbar» (Noah 08.11.2026 «1a», thread «UI-Test Analyse-Seite»): the six parts of Analyse are all
// on screen at once, on a phone in two rows of three, never a strip that has to be swiped.
// German, phone + desktop; no data needed; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0 } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Analyse: all six tabs are on screen at once', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  const tabs = page.locator('[role="tablist"] [data-tab]');
  await expect(tabs).toHaveCount(6);
  const boxes = await tabs.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: Math.round(r.top) }; }));
  // every tab lies inside the screen: nothing is hidden behind a sideways swipe
  for (const b of boxes) {
    expect(b.l).toBeGreaterThanOrEqual(0);
    expect(b.r).toBeLessThanOrEqual(page.viewportSize().width);
  }
  const strip = await page.locator('[role="tablist"]').evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
  expect(strip, 'no sideways strip').toBe(true);
  if (info.project.name === 'phone') {
    expect(new Set(boxes.map((b) => b.t)).size, 'two rows of three').toBe(2);
  }
  // a tap still opens the part
  await tabs.nth(5).click();
  await expect(tabs.nth(5)).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.ANALYSE_SHOTS) await page.locator('[role="tablist"]').screenshot({ path: `qa/analyse/reiter-${info.project.name}.png` });
});
