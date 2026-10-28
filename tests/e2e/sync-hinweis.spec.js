// «Abgleich aus» (Noah 19.10.2026 «1a»): while the automatic sync is off, Ich › «Wartet auf dich» shows a line
// «Abgleich Handy und Computer: aus» with «Einschalten» (opens Daten und Backup at «Handy und Computer») and
// «Nur ein Gerät» (hides the line on this device). Fictional data only (tests/e2e/v048-fixture.js).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Ich: the sync line opens Phone and computer, Only one device hides it', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);

  await page.goto('./#/me');
  const line = page.locator('[data-section="waiting"] [data-wait="sync"]');
  await expect(line).toContainText(T('Sync phone and computer: off'));
  await line.getByRole('button', { name: T('Switch on') }).click();
  await expect(page).toHaveURL(/#\/me\/data$/);
  await expect(page.locator('[data-section="sync"]')).toBeInViewport();

  await page.goto('./#/me');
  await line.getByRole('button', { name: T('Only one device') }).click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-section="waiting"]')).toBeVisible();
  await expect(line).toHaveCount(0);
  expect(errors).toEqual([]);
});
