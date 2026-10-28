// Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a»): Ich › Erinnerungen aufs Handy.
// Everything is off at the start; a kind switch is kept; the main switch asks the server first and
// says so when it is not set up (the server is mocked, nothing leaves the preview). Fictional data only.
import { test, expect } from '@playwright/test';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';
import { readFileSync } from 'node:fs';

// the switches, read from the app source (schedule.js KINDS) instead of a copy
const KIND_COUNT = (readFileSync(new URL('../../src/lib/push/schedule.js', import.meta.url), 'utf8').match(/export const KINDS = \[([\s\S]*?)\n\];/)?.[1].match(/\{ key: '/g) ?? []).length;

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
  // headless Chromium always answers «denied», even with grantPermissions (the page then rightly says
  // «blocked»); here it plays a phone that was never asked
  await context.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'default' }));
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
  expect(KIND_COUNT).toBeGreaterThan(6);
  await expect(kinds).toHaveCount(KIND_COUNT);
  for (const s of await kinds.all()) await expect(s).not.toBeChecked();
  await box.getByRole('switch', { name: T('Birthdays') }).check();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ kinds: { birthday: true } });
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-push-page]').getByRole('switch', { name: T('Birthdays') })).toBeChecked();
});

test('In the morning: «One message in the morning» is on at the start, switched off it is kept', async ({ page, context }) => {
  // Idee A1 (Noah 27.10.2026 «3a»): the 08:00 reminders as one message at 07:00
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const sec = page.locator('[data-push-morning]');
  await expect(sec.getByRole('heading', { name: T('In the morning') })).toBeVisible();
  const sw = sec.getByRole('switch', { name: T('One message in the morning') });
  await expect(sw).toBeChecked();
  await sw.uncheck();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ morning: false });
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-push-morning]').getByRole('switch', { name: T('One message in the morning') })).not.toBeChecked();
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

// Paket B «Server» (anleitung.md Teil 7): «Adresse für cron-job.org kopieren». The server is mocked; the
// device key and the tick code are fictional.
const CRON = 'https://packgen-three.vercel.app/api/push?a=tick&key=test_tick_code_not_real';

test('the copy button puts the tick address on the clipboard, with this device’s key', async ({ page, context }) => {
  await open(page, context);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  let auth = null;
  await context.route(`${PUSH}?a=cron`, (route) => {
    auth = route.request().headers().authorization ?? null;
    return route.fulfill({ json: { ok: true, url: CRON } });
  });
  await page.evaluate(() => localStorage.setItem('pg.strava.key', 'test-device-key-not-real'));
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-cron]');
  await expect(box.getByRole('heading', { name: T('Wake-up call for the server') })).toBeVisible();
  await box.getByRole('button', { name: T('Copy the address for cron-job.org') }).click();
  await expect(box.getByRole('status')).toHaveText(T('Address copied. In cron-job.org, paste it as the URL.'));
  expect(auth).toBe('Bearer test-device-key-not-real');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CRON);
});

test('without a device key or helper code the copy button says what to do first', async ({ page, context }) => {
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-cron]');
  await box.getByRole('button', { name: T('Copy the address for cron-job.org') }).click();
  await expect(box.getByRole('alert')).toHaveText(T('First connect Strava or enter the helper code on this device.'));
});
