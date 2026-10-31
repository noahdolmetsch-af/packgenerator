// «Pfad auf jeder Seite» Schritt 4 (Noah 28.10.2026 «1a und c und d alle»): in «Listen und Typen» a list shows by
// who made its entries: Standard, adapted by me, new from me. Filters with counts; none while nothing is changed.
// German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('a list shows Standard, adapted by me and new from me, and filters by them', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/lists?noteTopics');
  await ready(page);
  await expect(page.locator('[data-list-filter]')).toHaveCount(0);
  const all = await page.locator('main li[data-id]').count();

  await page.getByRole('button', { name: T('Own topic') }).click();
  const own = page.getByRole('dialog', { name: T('Own topic') });
  await own.getByLabel(T('Name')).fill('test_data_gtp_ Mein Thema');
  await own.getByRole('button', { name: T('Save') }).click();
  const chips = page.locator('[data-list-filter]');
  await expect(chips).toBeVisible();
  await expect(chips.locator('[data-filter="all"]')).toContainText(`${all + 1}`);
  await expect(chips.locator('[data-filter="own"]')).toContainText('1');

  await chips.locator('[data-filter="own"]').click();
  await expect(page.locator('main li[data-id]')).toHaveCount(1);
  await expect(page.locator('main li[data-id]')).toContainText('test_data_gtp_ Mein Thema');
  await chips.locator('[data-filter="std"]').click();
  await expect(page.locator('main li[data-id]')).toHaveCount(all);
  await chips.locator('[data-filter="all"]').click();
  await expect(page.locator('main li[data-id]')).toHaveCount(all + 1);
});
