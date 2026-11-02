// «Daten und Backup aufräumen» (Noah 01.11.2026 «1a 2a 3a 4a 5b»), in German, fictional data (clock Friday 9 October 2026).
// 1. Status line first, the six dots behind «Einzelheiten»; the sync question once; Yes shows the sync, No folds it.
// 2. «Mit einer Backup-Datei sichern» and «Mehr» are folded; no Google button; Fitbit is a link row.
// 3. «Neu beginnen» offers a backup first; an old backup makes the status line orange with «Jetzt sichern».
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

test('Daten aufräumen: status, question, folds, backup first', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info, { data: homeFixture() });
  const main = page.locator('main');

  await page.evaluate(() => localStorage.removeItem('pg.twoDevices')); // openHome answered the question once
  await page.goto('./#/me/data');
  await page.reload();
  const status = main.locator('[data-section="status"]');
  await expect(status).toBeVisible();
  // no backup yet on a fresh fixture: orange, with «Jetzt sichern»
  await expect(status.locator('[data-status]')).toHaveAttribute('data-status', 'warn');
  await expect(status.getByRole('button', { name: T('Back up now') })).toBeVisible();

  // the dots are behind «Einzelheiten»
  await expect(main.locator('.light').first()).toHaveCount(0);
  await status.locator('[data-status-details]').click();
  await expect(main.locator('.light').first()).toBeVisible();

  // the question, once
  const ask = main.locator('[data-section="two-devices"]');
  await expect(ask).toBeVisible();
  await expect(main.locator('[data-section="sync"]')).toHaveCount(0);
  await ask.locator('[data-two="no"]').click();
  await expect(ask).toHaveCount(0);
  const folded = main.locator('[data-morefold="sync"]');
  await expect(folded).toBeVisible();
  await folded.locator('summary').click();
  await expect(main.locator('[data-section="sync"]')).toBeVisible();
  await expect(main.locator('[data-sync-google]')).toHaveCount(0);

  // the answer stays after a reload
  await page.reload();
  await expect(main.locator('[data-section="two-devices"]')).toHaveCount(0);

  // folds: file way and More
  const file = main.locator('[data-morefold="backup-file"]');
  await expect(file.getByRole('button', { name: T('Save backup') })).toBeHidden();
  await file.locator('summary').click();
  await expect(file.getByRole('button', { name: T('Save backup') })).toBeVisible();
  const more = main.locator('[data-morefold="more"]');
  await more.locator('summary').click();
  await expect(more.getByRole('button', { name: T('Start fresh …') })).toBeVisible();

  // Fitbit has its own page
  await expect(main.locator('[data-row="fitbit-page"]')).toHaveAttribute('href', '#/me/fitbit');

  // «Neu beginnen» offers a backup first
  await more.getByRole('button', { name: T('Start fresh …') }).click();
  await expect(more.locator('[data-sf-backup]')).toContainText(T('First save a backup, then delete.'));
  await expect(more.locator('[data-sf-save]')).toBeVisible();
  await more.getByRole('button', { name: T('Cancel') }).click();

  expect(errors).toEqual([]);
});
