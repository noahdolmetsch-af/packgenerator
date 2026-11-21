// «Rekorde: Wann lesbar» (Noah 08.11.2026 «2a», thread «UI-Test Analyse-Seite»): in the card «Rekorde» the date stands
// under the best value, so nothing is cut off on a phone and the card does not swipe sideways.
// German, phone + desktop; fictional ticks written into IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Analyse: the records card shows its date and fits the screen', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  await page.locator('[data-tab="rekorde"]').click();
  const rec = page.locator('[data-records]');
  await expect(rec).toBeVisible();
  const rows = rec.locator('[data-record]');
  expect(await rows.count()).toBeGreaterThan(0);
  const card = await rec.boundingBox();
  for (let i = 0; i < (await rows.count()); i++) {
    const when = await rows.nth(i).locator('.when').boundingBox();
    expect(when, `date of row ${i}`).not.toBeNull();
    expect(when.x).toBeGreaterThanOrEqual(card.x - 1);
    expect(when.x + when.width, `date of row ${i} inside the card`).toBeLessThanOrEqual(card.x + card.width + 1);
    await expect(rows.nth(i).locator('.when')).not.toHaveText('');
  }
  // the table does not swipe sideways
  expect(await rec.locator('.tw').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.ANALYSE_SHOTS) await rec.screenshot({ path: `qa/analyse/rekorde-${info.project.name}.png` });
});
