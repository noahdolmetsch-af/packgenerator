// V3 «Eine Zahl für die Woche»: the head of Aktiv, «Heute abhaken» and the week card say the SAME «k von n Einheiten (Mo bis So)»;
// the week page leads to the one Woche. Fictional data only; the clock stands on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('one number for the week on Aktiv, and the week page leads to Woche', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  const card = (await main.locator('[data-week-glance] .wgl').innerText()).trim();
  const m = card.match(/^(\d+) von (\d+) Einheiten diese Woche \(Mo bis So\)$/);
  expect(m, card).not.toBeNull();
  await expect(main.locator('[data-today-line]')).toContainText(`diese Woche ${m[1]} von ${m[2]} Einheiten (Mo bis So)`);
  // no second count of goals next to it
  await expect(main.locator('[data-week-glance]')).not.toContainText(/Wochenziel/);
  await main.locator('[data-week-glance] .go').click();
  await expect(page).toHaveURL(/#\/flow\/week$/);
  await main.locator('a[data-to-week]').click();
  await expect(page).toHaveURL(/#\/week$/);
  expect(errors).toEqual([]);
});
