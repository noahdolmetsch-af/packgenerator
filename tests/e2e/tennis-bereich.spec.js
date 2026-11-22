// Bereich «Tennis» (Noah 05.11.2026 «ok Mockup»): Angebote und Kunden liegen unter einer Kopfzeile mit zwei Tabs.
// Die neue Adresse #/me/tennis und die alte #/me/offers zeigen dieselben Seiten. Fiktive Daten, kein Netz.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';

const T = tr('de');

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Tennis: Tabs Angebote und Kunden, alte Adresse bleibt', async ({ page }) => {
  await page.goto('./#/me/tennis');
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Tennis'));
  const tabs = page.locator('[data-tennis-tabs]');
  await expect(tabs.getByRole('button', { name: T('Offers') })).toHaveAttribute('aria-pressed', 'true');

  await tabs.getByRole('button', { name: T('Customers') }).click();
  await expect(page).toHaveURL(/#\/me\/tennis\/customers$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Customers'));
  await expect(page.locator('[data-tennis-tabs]').getByRole('button', { name: T('Customers') })).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-tennis-tabs]').getByRole('button', { name: T('Offers') }).click();
  await expect(page).toHaveURL(/#\/me\/tennis$/);

  // the old addresses still work
  await page.goto('./#/me/offers');
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Tennis'));
  await page.goto('./#/me/offers/customers');
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Customers'));
});
