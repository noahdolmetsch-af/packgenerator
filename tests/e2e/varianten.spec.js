// «Wechsel-Varianten» (Noah 04./05.11.2026, «2a» 23.11.2026): a question asks in other words from day to day; Ich › Deine Fragen
// has the switch «Immer die Hauptfrage». On a phone and a computer, in German, fixed clock in Europe/Zurich. Fictional data only.
// SHOTS=<folder> saves full-page screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { flowSeeded, putWall } from './wall-fixture.js';
import { QUESTION } from '../../src/lib/abfragen.js';
import { askVariant } from '../../src/lib/abfragen/varianten.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const Q = QUESTION['erholung.schlaf'];
// a day on which the sleep question asks in other words than its main text
const DAY = ['2026-10-15', '2026-10-16', '2026-10-17'].find((d) => askVariant(Q, d) !== Q.text);

async function shot(page, name) {
  if (!process.env.SHOTS) return;
  const w = page.viewportSize().width;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
}

test('Varianten: the morning page asks in the wording of the day; the switch brings the main question back', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T07:52:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page);
  await putWall(page);
  await ready(page);

  await page.goto('./#/check/morning');
  await ready(page);
  const q = page.locator('[data-round-questions="morning"] [data-q="erholung.schlaf"]');
  await expect(q.locator('b').first()).toHaveText(T(askVariant(Q, DAY)));
  await shot(page, 'varianten-anders');

  // the switch on Ich › Deine Fragen
  await page.goto('./#/me/abfragen');
  await ready(page);
  const sw = page.locator('[data-words] [data-main-only]');
  await expect(page.locator('[data-words]')).toContainText(T('Always the main question'));
  await sw.check();
  await shot(page, 'varianten-schalter');
  await page.waitForTimeout(700);
  await page.goto('./#/check/morning');
  await ready(page);
  await expect(page.locator('[data-round-questions="morning"] [data-q="erholung.schlaf"] b').first()).toHaveText(T(Q.text));
  await shot(page, 'varianten-haupt');
  expect(errors).toEqual([]);
});
