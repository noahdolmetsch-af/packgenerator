// «Meine Datenquellen» (Noah 07.11.2026 «1a»): Ich › Verbindungen leads to #/auswerten/quellen; the page shows its sources or
// says why it is empty. Fictional data, German UI.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('My data sources: the way in from Connections, the page and the way on', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  await page.goto('./#/me/connections');
  await ready(page);
  await page.locator('[data-conn-quellen]').click();
  await expect(page).toHaveURL(/#\/auswerten\/quellen/);
  await expect(page.locator('[data-quellen] h1')).toHaveText(T('My data sources'));

  // either the sources (with the limits that are always named) or the empty page that offers to connect
  const list = page.locator('[data-quelle="wetter"]');
  if (await list.count()) {
    await expect(list).toContainText(T('Only day values at your home place. No weather per hour of a ride.'));
    await page.locator('[data-quellen-verbinden]').click();
    await expect(page).toHaveURL(/#\/me\/connections/);
  } else {
    await expect(page.locator('[data-empty]')).toContainText(T('No data source yet'));
    await page.locator('[data-empty] a', { hasText: T('Manage connections') }).click();
    await expect(page).toHaveURL(/#\/me\/connections/);
  }
  expect(errors).toEqual([]);
});
