// «Nebelgrenze am Morgen» (Noah 05.11.2026 «1a 2b 3a»): the switch in Ich › Erinnerungen aufs Handy is on once push is on
// and can be switched off; the server is mocked, nothing leaves the preview. Fictional data only.
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

test('Fog line in the morning: on once push is on, can be switched off and stays off', async ({ page, context }, info) => {
  await context.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'granted' }));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (route.request().url().startsWith(PUSH) ? route.fulfill({ json: { publicKey: null, ready: false } }) : route.abort()));
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00+01:00'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [{ key: 'push', value: { on: true, kinds: { ice: true } } }];
  await importAndSettle(page, { name: 'push.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/me');
  await settle(page);
  await page.getByRole('link', { name: new RegExp(T('Reminders on the phone')) }).click();
  const box = page.locator('[data-push-page]');
  const fog = box.getByRole('switch', { name: 'Nebelgrenze am Morgen' });
  await expect(fog).toBeChecked();
  await expect(box.getByRole('switch', { name: T('Ice in the morning') })).toBeChecked();
  await expect(box.getByRole('switch', { name: T('Birthdays') })).not.toBeChecked();
  await fog.scrollIntoViewIfNeeded();
  await box.locator('[data-push-kind]').filter({ hasText: 'Nebelgrenze am Morgen' }).first().screenshot({ path: info.outputPath(`nebel-push-${info.project.name}.png`) });
  await fog.uncheck();
  await expect.poll(() => stored(page, 'push')).toMatchObject({ kinds: { fog: false } });
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-push-page]').getByRole('switch', { name: 'Nebelgrenze am Morgen' })).not.toBeChecked();
});
