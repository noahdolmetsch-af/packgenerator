// «Kalender und Achsen» (Noah 07.11.2026 «6 ja», thread «UI-Test Analyse-Seite»): in «Jeder Tag ein Feld» every
// field is the same size (at least 24 px to tap), weekday names sit on their rows, the months on their columns, and
// a small legend says what the shades mean. The axis of a count (ticks per week) only has whole numbers.
// German, phone + desktop; fictional ticks written into IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Analyse: calendar fields are even and tappable, count axes are whole numbers', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  // one sauna tick on every 6th day (so a week has 0 to 2 ticks: an axis in halves would show «0,5»)
  const flowLog = [];
  for (let i = 0; i < 90; i += 6) flowLog.push({ id: `test_data_kal_${i}`, actId: 'sauna', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, min: 30 });
  await put(page, { flowLog });
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);

  for (const range of ['30 Tage', '90 Tage']) {
    await page.getByRole('button', { name: range }).or(page.getByRole('radio', { name: range })).first().click();
    const cal = page.locator('.cal');
    await expect(cal).toBeVisible();
    // every field: the same size, a square of at least 24 px
    const sizes = await cal.locator('button.cell').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    expect(sizes.length).toBeGreaterThan(20);
    expect(new Set(sizes.map((s) => s.join('x'))).size, `one size for ${range}`).toBe(1);
    expect(sizes[0][0]).toBeGreaterThanOrEqual(24);
    expect(sizes[0][0]).toBe(sizes[0][1]);
    // the weekday names sit on their rows: «Mo» level with the first row of fields
    const mo = await cal.locator('.wd span').nth(1).boundingBox();
    const first = await cal.locator('button.cell, span.cell.none').first().boundingBox();
    expect(Math.abs(mo.y + mo.height / 2 - (first.y + first.height / 2))).toBeLessThanOrEqual(3);
    // the legend explains the shades
    await expect(page.locator('.scale')).toContainText(T('fewer|overview'));
    await expect(page.locator('.scale')).toContainText(T('more|overview'));
    // the page itself never scrolls sideways
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (process.env.ANALYSE_SHOTS) await page.locator('.hm').first().screenshot({ path: `qa/analyse/kalender-${range.slice(0, 2)}-${info.project.name}.png` });
  }

  // a count axis: whole numbers only
  const ticks = await page.locator('[data-weekly] [data-yticks] span').allTextContents();
  expect(ticks.length).toBeGreaterThan(1);
  for (const x of ticks) expect(x.trim(), 'tick of ticks per week').toMatch(/^\d+$/);
  expect(errors).toEqual([]);
});
