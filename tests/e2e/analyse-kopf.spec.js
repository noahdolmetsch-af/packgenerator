// «Kurzer Kopf» (Noah 08.11.2026 «4a», thread «UI-Test Analyse-Seite»): the sentence under the title of Analyse is one
// short line; the card «Was du hier tun kannst» above it keeps the explanation (no second copy of it).
// German, phone + desktop; no data needed; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Analyse: the sentence under the title is short', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  const head = page.locator('.an > header');
  await expect(head.getByRole('heading', { level: 1 })).toHaveText(T('Analyse|page'));
  await expect(head).toContainText(T('Only to look at, nothing is rated.|analyse'));
  // the long sentence is gone from the header; the card above keeps the explanation
  await expect(head).not.toContainText('Tippe einen Wert an');
  await expect(page.getByText('Was du hier tun kannst').first()).toBeVisible();
  // the sentence takes one line on a phone
  const sub = head.getByText(T('Only to look at, nothing is rated.|analyse'));
  const h = await sub.evaluate((e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight));
  expect(h).toBeLessThan(1.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/kopf-${info.project.name}.png` });
});
