// «Woche» (Schritt V1 der Vereinfachung, Noah 21.11.2026 «1a 2a 3a 4a 5a»): the week page counts «n von m Einheiten erledigt»
// and shows the goals of the week next to the days (what stood only on Aktiv). German UI, fictional data, phone + desktop.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded } from './wall-fixture.js';
import { put, D0 } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
// the clock stands on Friday 9 Oct 2026: the week is Mon 5 … Sun 11 Oct
const tick = (day) => ({ id: `test_wz_${day}`, actId: 'meditation', day, at: `${day}T07:05:00+02:00`, min: 15 });

test('Woche: «n von m Einheiten erledigt» and the goals of the week stand on the page of the week', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await put(page, { flowLog: [tick('2026-10-05'), tick('2026-10-06')] });
  await page.goto('./#/week');
  await page.reload();
  await ready(page);
  // two ticked units this week, both done
  await expect(page.locator('[data-week-units]')).toContainText('2 von 2 Einheiten erledigt');
  // the goals of the week: empty at first, a tap adds one, the bar counts the two ticks
  const goals = page.locator('[data-week-goals]');
  await expect(goals).toBeVisible();
  await expect(goals.locator('[data-wg-empty]')).toBeVisible();
  await goals.locator('[data-wg-add="meditation"]').click();
  await expect(goals.locator('[data-wg="act:meditation"] [data-wg-line]')).toHaveText(T('Reached'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  // next week: no goals there (they count the running week)
  await page.getByRole('button', { name: T('Next week') }).first().click();
  await expect(goals).toHaveCount(0);
  expect(errors).toEqual([]);
});
