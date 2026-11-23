// Navigation ohne Sackgassen (Noah 23.11.2026 «ja»): a race that does not exist (deleted, or on another device) said «Loading…» for
// ever, with no way on. Now it says so and leads back to the races. German UI, no network, an empty app.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('ein Rennen, das es nicht gibt, sagt es und führt zurück', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/race/gibt-es-nicht');
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Dieses Rennen ist nicht da' })).toBeVisible();
  await page.getByRole('link', { name: 'Zu den Rennen' }).click();
  await expect(page).toHaveURL(/#\/race$/);
});

test('Unterwegs ohne Tour führt zu den Touren', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/ride');
  await ready(page);
  await page.locator('main').getByRole('link', { name: 'Zu den Touren' }).click();
  await expect(page).toHaveURL(/#\/trips$/);
});
