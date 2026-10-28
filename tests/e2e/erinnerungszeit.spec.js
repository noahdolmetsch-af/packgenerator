// Idee A2 «Erinnerung zur Zeit, wann du es machst» (Noah 27.10.2026): from 3 evenings the app offers to
// move the evening reminder to the usual time; «Move it» stores it with Undo, «No, thanks» hides the offer.
// Fictional data only; the server is not called.
import { test, expect } from '@playwright/test';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
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
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00+02:00'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [
    { key: 'push', value: { on: false, kinds: { eve: true } } },
    { key: 'remindLearn', value: { eve: [{ day: '2026-10-10', min: 1280 }, { day: '2026-10-12', min: 1300 }, { day: '2026-10-15', min: 1290 }] } },
  ];
  await importAndSettle(page, { name: 'zeit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/me/push');
  await settle(page);
}

test('the offer moves the evening reminder to the usual time, with Undo', async ({ page, context }) => {
  await open(page, context);
  const box = page.locator('[data-eve-offer]');
  await expect(box).toContainText(T('You usually do the evening check at {usual}. Move the reminder to {at}?').replace('{usual}', '21:30').replace('{at}', '21:15'));
  await box.getByRole('button', { name: T('Move it') }).click();
  await expect.poll(() => stored(page, 'ownValues')).toMatchObject({ eveRemindAt: 1275 });
  await expect(box).toContainText(T('The evening reminder now comes at {time}.').replace('{time}', '21:15'));
  await box.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await stored(page, 'ownValues'))?.eveRemindAt ?? 1140).toBe(1140);
});

test('«No, thanks» hides the offer and it stays away', async ({ page, context }) => {
  await open(page, context);
  const box = page.locator('[data-eve-offer]');
  await box.getByRole('button', { name: T('No, thanks') }).click();
  await expect(box).toHaveCount(0);
  await expect.poll(() => stored(page, 'remindLearn')).toMatchObject({ no: { eve: 1275 } });
  await page.reload();
  await settle(page);
  await expect(page.locator('[data-eve-offer]')).toHaveCount(0);
});
