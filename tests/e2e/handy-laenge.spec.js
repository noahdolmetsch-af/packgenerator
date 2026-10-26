// UI-Ziele #7 «Handy-Längenbudget» (Noah 20.10.2026 «freigabe»): on a phone every place, every tab and Ich are at most
// three screens high, or at most their number in TOO_LONG (src/lib/laenge.js) until they are shortened. Fictional data:
// the Gesamttest set plus 47 fictional Strava activities, like handy-kurz.spec.js.
import { test, expect } from '@playwright/test';
import { start, fixture, day } from './gesamttest/lib.js';
import { at1Acts } from './at1-acts.js';
import { PLACES, PLACE_TABS } from '../../src/lib/nav.js';
import { budgetOf } from '../../src/lib/laenge.js';

function data() {
  const d = structuredClone(fixture().data);
  const acts = at1Acts(day, 'test_hl_');
  for (let i = 0; i < 40; i++) acts.push({ ...acts[5], id: `test_hl_m${i}`, name: `test_hl_ Runde ${i}`, day: day(-21 - i * 3) });
  d.tables.activities = acts;
  return d;
}

test('phone: every place, tab and Ich within its length budget', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the budget is for the phone');
  test.setTimeout(300_000);
  // Heute shows more or less by the hour (morning, a trip ending today by day, night): measure at midday so the run's hour
  // does not decide (CI at 06:22 measured 6.24, by day 6.03–6.18; see TOO_LONG['#/'] in src/lib/laenge.js)
  await page.clock.setFixedTime(new Date(`${day()}T11:00:00Z`));
  const errors = await start(page, context, info, { data: data() });
  const vh = page.viewportSize().height;
  const pages = [...new Set([...PLACES.map((p) => p.href), ...Object.values(PLACE_TABS).flat().map((x) => x.href), '#/me'])];
  for (const h of pages) {
    await page.goto(`./${h}`);
    await page.locator('main h1').first().waitFor();
    await page.waitForTimeout(800);
    const screens = (await page.evaluate(() => document.documentElement.scrollHeight)) / vh;
    expect.soft(Math.round(screens * 100) / 100, `${h} at most ${budgetOf(h)} screens`).toBeLessThanOrEqual(budgetOf(h));
  }
  expect(errors).toEqual([]);
});
