// Hilfen 3b (Noah 22.11.2026 «1a»): the tip line «Gut zu wissen» under the page titles is off by default; the tips stay
// at the end of the page («Tipps für diese Seite»); Ich › Eigene Werte has the switch «Tipp-Zeile unter dem Seitentitel».
// German UI, the clock fixed in Europe/Zurich, no network, an empty app (fictional data only).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test.use({ cardsOpen: false }); // the app as it is: no test switch for the tip line

test('the tip line is off by default, the switch in Eigene Werte brings it back', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  const line = page.locator('main [data-tip]');
  await expect(line).toHaveCount(0);

  await page.goto('./#/me/werte');
  await ready(page);
  const sw = page.locator('[data-own-line]');
  await expect(sw).not.toBeChecked();
  await sw.check();

  await page.goto('./#/me');
  await ready(page);
  await expect(line).toBeVisible();

  await page.goto('./#/me/werte');
  await ready(page);
  await page.locator('[data-own-line]').uncheck();
  await page.goto('./#/me');
  await ready(page);
  await expect(line).toHaveCount(0);
  // the tips are still one tap away: in the «?» window (26.11.2026, no longer at the page end)
  await expect(page.getByRole('button', { name: T('Tips for this page ›') })).toHaveCount(0);
  await page.locator('[data-help-open]:visible').first().click();
  await expect(page.locator('dialog[data-help] [data-help-tips]')).toBeVisible();
  expect(errors).toEqual([]);
});
