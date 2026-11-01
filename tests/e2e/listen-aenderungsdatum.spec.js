// «Pfad auf jeder Seite» Schritt 6 (Noah 28.10.2026): a changed list says when it was last changed.
// German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('a changed list shows the date of its last change', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/lists?noteTopics');
  await ready(page);
  await expect(page.locator('[data-list-changed]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Own topic') }).click();
  const own = page.getByRole('dialog', { name: T('Own topic') });
  await own.getByLabel(T('Name')).fill('test_data_gtp_ Mein Thema');
  await own.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('[data-list-changed]')).toContainText('Zuletzt von dir geändert');
});
