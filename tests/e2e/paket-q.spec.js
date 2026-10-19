// Paket Q «App klarer» (Noah 19.10.2026 «1a 2a … 3 … 4a 5a»), German UI:
// - the backup lock: switch on, set a password, the exported file is locked; on a device without the
//   password the app asks for it, a wrong one changes nothing, the right one opens the backup;
// - Ich › Hinweise: news of the sources (the server is mocked), add and delete a source with Undo;
// - the calm offline line comes and goes;
// - «Stimmt das noch?» opens from Ich › Daten.
// Fictional data only; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('backup with a password: locked file, wrong password changes nothing, right one opens it', async ({ page }, info) => {
  await page.goto('./');
  const data = await openData(page);
  const lock = data.locator('[data-section="backup-lock"]');
  await lock.locator('[data-lock-switch]').check();
  await lock.locator('[data-lock-pw]').fill('test-pw-123');
  await lock.locator('[data-lock-pw2]').fill('test-pw-999');
  await lock.locator('[data-lock-save]').click();
  await expect(lock.getByRole('status')).toHaveText(T('The two passwords are not the same.'));
  await lock.locator('[data-lock-pw2]').fill('test-pw-123');
  await lock.locator('[data-lock-save]').click();
  await expect(lock.locator('[data-lock-switch]')).toBeChecked();

  const wait = page.waitForEvent('download');
  await data.getByRole('button', { name: T('Export backup'), exact: true }).first().click();
  const file = info.outputPath('locked.json');
  await (await wait).saveAs(file);
  const text = readFileSync(file, 'utf8');
  expect(JSON.parse(text).locked).toBeTruthy();
  expect(text).not.toContain('"tables"');

  // this device forgets the password: the file now asks for it
  await lock.locator('[data-lock-switch]').uncheck();
  await expect(lock.locator('[data-lock-switch]')).not.toBeChecked();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  const pw = data.locator('[data-unlock-pw]');
  await expect(pw).toBeVisible();
  await pw.fill('falsch-123');
  await data.getByRole('button', { name: T('Open'), exact: true }).click();
  await expect(data.getByRole('alert')).toHaveText(T('Wrong password. Try again; nothing was changed.'));
  await pw.fill('test-pw-123');
  await data.getByRole('button', { name: T('Open'), exact: true }).click();
  await expect(pw).toHaveCount(0);
  await expect(data.getByRole('button', { name: T('Replace all data') })).toBeVisible();
});

test('Hinweise: news of the sources, add and delete a source with Undo', async ({ page }) => {
  await page.route(/packgen-three\.vercel\.app\/api\/news/, (route) => {
    const q = new URL(route.request().url()).searchParams;
    const body = q.get('alerts') === 'weather' ? { ok: true, warnings: [] }
      : q.get('alerts') === 'avalanche' ? { ok: true, level: null, link: 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/' }
      : { ok: true, title: 'Test', items: [{ title: `test_data_gtp_ Meldung ${new URL(q.get('feed')).hostname}`, link: 'https://example.org/a', date: '2026-10-19T08:00:00.000Z' }] };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  });
  await page.goto('./#/me/hinweise');
  await settle(page, { sameTrips: false });
  const hw = page.locator('[data-page="hinweise"]');
  await expect(hw.getByRole('heading', { name: T('Alerts and news'), level: 1 })).toBeVisible();
  await expect(hw.getByText('test_data_gtp_ Meldung bikepacking.com')).toBeVisible();

  await hw.locator('[data-feed-add]').click();
  await hw.locator('[data-feed-name]').fill('test_data_gtp_ Quelle');
  await hw.locator('[data-feed-url]').fill('example.org/feed');
  await hw.locator('[data-feed-save]').click();
  await expect(hw.getByText('test_data_gtp_ Meldung example.org')).toBeVisible();

  await hw.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Quelle' }) }).click();
  await expect(hw.getByText('test_data_gtp_ Meldung example.org')).toHaveCount(0);
  await hw.getByRole('button', { name: T('Undo') }).click();
  await expect(hw.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Quelle' }) })).toBeVisible();
});

test('offline line comes and goes by itself', async ({ page, context }) => {
  await page.goto('./');
  await settle(page);
  const line = page.locator('[data-offline-line]');
  await expect(line).toHaveCount(0);
  await context.setOffline(true);
  await expect(line).toHaveText(T('Offline. Weather, Strava, Google and the exchange come back when you are online; everything else works.'));
  await context.setOffline(false);
  await expect(line).toHaveAttribute('data-offline-line', 'back');
  await expect(line).toHaveCount(0, { timeout: 10_000 });
});

test('«Stimmt das noch?» opens from Ich › Daten', async ({ page }) => {
  await page.goto('./');
  await settle(page);
  await page.goto('./#/me/data?yearcheck');
  const win = page.getByRole('dialog', { name: T('Still right?') });
  await expect(win).toBeVisible();
  await win.getByRole('button', { name: T('All checked') }).click();
  await expect(win).toHaveCount(0);
  await expect(page).toHaveURL(/#\/me\/data$/);
});
