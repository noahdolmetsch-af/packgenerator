// Paket N idea 5 (Noah 19.10.2026 «1-5 a»): «Woche planen» shows a dream that fits now and can hide the
// card; Touren › Träume brings it back. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Woche: a dream that fits now, hide, back from Träume', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await page.evaluate(() => new Promise((res, rej) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const p = r.result.transaction('settings', 'readwrite').objectStore('settings').put({ key: 'dreams', value: { dreams: [{ id: 'd1', title: 'test_data_gtp_ Rundfahrt', kind: 'other', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], days: 2, note: '', url: '' }] } });
      p.onsuccess = () => (r.result.close(), res());
      p.onerror = rej;
    };
  }));
  await page.goto('./#/week');
  await ready(page);
  const card = page.locator('[data-week-dreams]');
  // on a Sunday the Saturday of this week is past: then the card stays away
  const sunday = await page.evaluate(() => new Date().toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/Zurich' }) === 'Sunday');
  if (sunday) {
    await expect(card).toHaveCount(0);
    return;
  }
  await expect(card.locator('[data-wd="dream"]')).toContainText('Rundfahrt');
  await card.getByRole('button', { name: T('Hide|week') }).click();
  await expect(card).toHaveCount(0);
  await page.goto('./#/trips/dreams');
  await page.locator('[data-week-show]').check();
  await page.goto('./#/week');
  await expect(page.locator('[data-week-dreams]')).toBeVisible();
  expect(errors).toEqual([]);
});
