// Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a»): Ich › Erinnerungen aufs Handy.
// Everything is off at the start; a kind switch is kept; the main switch asks the server first and
// says so when it is not set up (the server is mocked, nothing leaves the preview). Fictional data only.
import { test, expect } from '@playwright/test';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const PUSH = 'https://packgen-three.vercel.app/api/push';
const stored = (page, key) =>
  page.evaluate((k) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction('settings').objectStore('settings').get(k);
      get.onsuccess = () => { req.result.close(); done(get.result?.value ?? null); };
    };
  }), key);

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (route.request().url().startsWith(PUSH) ? route.fulfill({ json: { publicKey: null, ready: false } }) : route.abort()));
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00+02:00'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [];
  await importAndSettle(page, { name: 'push.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
}

test('Ich: the row leads to «Erinnerungen aufs Handy»; all off at the start; a kind switch is kept', async ({ page, context }) => {
  await open(page, context);
  await page.goto('./#/me');
  await settle(page);
  await page.getByRole('link', { name: new RegExp(T('Reminders on the phone')) }).click();
  await expect(page.getByRole('heading', { name: T('Reminders on the phone'), level: 1 })).toBeVisible();
  const box = page.locator('[data-push-page]');
  const main = box.locator('[data-push-main]');
  await expect(main).not.toBeChecked();
  await expect(box.getByRole('status')).toHaveText(T('Off. Nothing goes to the phone.'));
  const kinds = box.locator('[data-push-kind] input[role="switch"]');
  await expect(kinds).toHaveCount(7);
  for (const s of await kinds.all()) await expect(s).not.toBeChecked();
  await box.getByRole('switch', { name: T('Birthdays') }).check();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ kinds: { birthday: true } });
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-push-page]').getByRole('switch', { name: T('Birthdays') })).toBeChecked();
});

test('the main switch says so when the server is not set up, and stays off', async ({ page, context }) => {
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-page]');
  await box.locator('[data-push-main]').click();
  await expect(box.getByRole('alert')).toHaveText(T('The server is not set up for this yet.'));
  await expect(box.locator('[data-push-main]')).not.toBeChecked();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ on: false });
  await expect(box.locator('[data-push-test]')).toHaveCount(0);
});
