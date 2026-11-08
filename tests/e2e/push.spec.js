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

// the switches sit in four folds (7b-08): open one by its key before touching its switches
const openGroup = async (page, key) => {
  const g = page.locator(`[data-push-group="${key}"]`);
  if (!(await g.evaluate((el) => el.open))) await g.locator('summary').click();
  await expect(g).toHaveJSProperty('open', true);
};

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
  await openGroup(page, 'day');
  await box.getByRole('switch', { name: T('Birthdays') }).check();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ kinds: { birthday: true } });
  await page.reload();
  await settle(page);
  await openGroup(page, 'day');
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

// Arbeitsliste 7b-07 (Impeccable-Test 08.11.2026): with the main switch off, the page no longer says «on» and
// «Nothing is sent» at once. The switches below are only «saved» (grey) and a line says so.
test('main switch off: the morning switch is marked as saved only, the wait line shows, and goes with the main switch', async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'default' }));
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-page]');
  await expect(box.locator('[data-push-main]')).not.toBeChecked();
  await expect(box.locator('[data-push-wait]')).toHaveText(T('First switch on «On the phone». Until then your choices are only saved; nothing is sent.'));
  await expect(box.locator('[data-push-morning]')).toHaveClass(/ps-wait/);
  await expect(box.locator('[data-push-retry]')).toHaveCount(0);
  // the choice still works while the main switch is off (nothing is blocked)
  await box.getByRole('switch', { name: T('One message in the morning') }).uncheck();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ morning: false });
});

test('notifications blocked by the browser: the steps and a «Try again» button show', async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'denied' }));
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-page]');
  await expect(box.getByRole('status')).toHaveText(T('Your browser blocks notifications.'));
  await expect(box.locator('[data-push-steps]')).toHaveText(T('Tap the lock next to the address, then «Notifications», then «Allow».'));
  const retry = box.locator('[data-push-retry]');
  await expect(retry).toHaveText(T('Try again'));
  await retry.click();
  await expect(box.locator('[data-push-main]')).not.toBeChecked();
});

// 7b-08 (Noah «alles»): four folds, closed at the start, each with «n von m an»; a tap opens one
test('the switches sit in four closed folds with a count; a tap opens one', async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'default' }));
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const groups = page.locator('[data-push-group]');
  await expect(groups).toHaveCount(4);
  await expect(groups.locator('summary .ps-gl')).toHaveText([T('Around the tour'), T('Weather and light'), T('Bikes and gear'), T('Everyday life')]);
  for (const g of await groups.all()) {
    expect(await g.evaluate((el) => el.open)).toBe(false);
    await expect(g.locator('summary .ps-gs')).toHaveText(T('All off'));
  }
  // a switch inside a closed fold is not on screen; opening the fold shows it
  const birthdays = page.getByRole('switch', { name: T('Birthdays') });
  await expect(birthdays).toBeHidden();
  await openGroup(page, 'day');
  await birthdays.check();
  await expect(page.locator('[data-push-group="day"] summary .ps-gs')).toHaveText(T('{n} of {m} on', { n: 1, m: 5 }));
  await expect(page.locator('[data-push-group="weather"] summary .ps-gs')).toHaveText(T('All off'));
});

// 7b-08 (Noah «alles»): the wake-up call box says it in plain words; the steps sit in a fold, closed at the start
test('the wake-up call box has its steps in a closed fold «Step by step»', async ({ page, context }) => {
  await open(page, context);
  await page.goto('./#/me/push');
  await settle(page);
  const box = page.locator('[data-push-cron]');
  await expect(box).toContainText(T('The reminders only come on time if someone wakes the server every minute. The free service cron-job.org does that. You set it up once, then you have nothing more to do.'));
  const fold = box.locator('[data-push-cron-steps]');
  await expect(fold.locator('summary')).toHaveText(T('Step by step'));
  expect(await fold.evaluate((el) => el.open)).toBe(false);
  await expect(fold.locator('li')).toHaveCount(4);
  await expect(fold.locator('li').first()).toBeHidden();
  await fold.locator('summary').click();
  await expect(fold.locator('li').first()).toBeVisible();
});
