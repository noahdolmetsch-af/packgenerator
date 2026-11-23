// «Zurück am Eingang» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): wer die App mit einer Adresse tief in der App
// öffnet, kommt mit Zurück auf Heute und nicht aus der App hinaus. Ein Neuladen legt kein zweites Heute darunter.
// German UI, no network, an empty app (fictional data only).
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test.skip(({ isMobile }) => isMobile, 'the history is the same on the phone: the computer run is enough');

const hash = (page) => page.evaluate(() => location.hash || '#/');

test('opened deep: Back goes to Heute, a reload adds nothing', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/weight');
  await ready(page);
  expect(await hash(page)).toBe('#/me/weight');
  // the first tap puts Heute underneath (not at the start: Chrome skips entries a page adds without a tap)
  expect(await page.evaluate(() => history.length)).toBe(2);
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => history.length);
  expect(before, 'Heute is under the page now').toBe(3);
  expect(await hash(page)).toBe('#/me/weight');

  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => history.length), 'a reload adds no Heute').toBe(before);
  expect(await hash(page)).toBe('#/me/weight');

  await page.goBack();
  await page.waitForTimeout(300);
  expect(await hash(page), 'Back from a page opened deep lands on Heute').toBe('#/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main h1, main h2').first()).toBeVisible();
});

test('opened deep, never tapped: Back goes where you came from (nothing added)', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/weight');
  await ready(page);
  expect(await page.evaluate(() => history.length)).toBe(2);
});

test('opened deep: a window closes with Back and the page stays', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/weight');
  await ready(page);
  await page.keyboard.press('n'); // the first key puts Heute underneath, then «Neu» opens
  await expect(page.locator('dialog[open]').first()).toBeVisible();
  await page.goBack();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(await hash(page), 'Back closed the window, the page stays').toBe('#/me/weight');
  await page.goBack();
  await page.waitForTimeout(300);
  expect(await hash(page), 'the next Back lands on Heute').toBe('#/');
});

test('opened on Heute: nothing is added below', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);
  const n = await page.evaluate(() => history.length);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => history.length)).toBe(n);
});
