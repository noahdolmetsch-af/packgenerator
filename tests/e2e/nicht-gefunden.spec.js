// «Seite nicht gefunden» (Gesamttest 19.11.2026, Noah «a»): eine falsche Adresse zeigt die Karte mit «Zu Heute»,
// Heute selbst nicht. Erfundene Daten, kein echtes Netz.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('falsche Adresse: Seite nicht gefunden, «Zu Heute» führt nach Heute', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/does-not-exist');
  await ready(page);
  const card = page.locator('main [data-not-found]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible();
  await card.getByRole('link', { name: 'Zu Heute' }).click();
  await expect(page.locator('main [data-not-found]')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  expect(errors).toEqual([]);
});

test('Heute und bekannte Seiten zeigen die Karte nicht', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  for (const h of ['./#/', './#/timer', './#/me/mini']) {
    await page.goto(h);
    await ready(page);
    await expect(page.locator('main [data-not-found]'), h).toHaveCount(0);
  }
});
