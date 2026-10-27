// Kontakt-QR-Code (Noah 27.10.2026 «1a 2b 3a 4a 5a»), PR 1: the card carries e-mail, WhatsApp, Strava, Komoot,
// web and address; the page the QR code opens shows a row for each and «In Kontakte speichern» gives a contact
// file made on the device. The address stays off until ticked. Fictional data only.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};
const cardOf = (link) => JSON.parse(Buffer.from(link.slice(link.indexOf('#/karte/') + 8), 'base64url').toString());

test('Kontakt-QR: tick the parts, the address stays off until ticked', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/me/freunde?tab=card');
  await page.locator('[data-card-name]').fill('test_data_gtp_ Sam');
  for (const [f, v] of [['email', 'sam@example.test'], ['strava', '123'], ['addr', 'Testweg 1, 0000 Testdorf']]) {
    await page.locator(`[data-card-field="${f}"]`).fill(v);
    await page.locator(`[data-card-field="${f}"]`).blur();
  }
  const qrLink = () => page.evaluate(() => {
    const el = document.querySelector('[data-contact-card] [data-qr-text]');
    return el?.getAttribute('data-qr-text') ?? '';
  });
  await expect.poll(async () => cardOf(await qrLink()).strava).toBe('123');
  expect(cardOf(await qrLink()).addr).toBeUndefined();
  await page.locator('[data-card-show="addr"]').check();
  await expect.poll(async () => cardOf(await qrLink()).addr).toBe('Testweg 1, 0000 Testdorf');
  await page.locator('[data-card-show="email"]').uncheck();
  await expect.poll(async () => cardOf(await qrLink()).email).toBeUndefined();
  await noSideways(page, 'contact card');
});

test('Kontakt-QR: the card page shows the ways to reach and saves a contact file', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const card = Buffer.from(JSON.stringify({ v: 1, name: 'test_data_gtp_ Lea', phone: '+41 79 000 00 00', wa: '+41 79 000 00 00', email: 'lea@example.test', insta: '@test_data_lea', strava: '123', komoot: 'lea-k', web: 'example.test', addr: 'Testweg 1, 0000 Testdorf', bike: 'Gravel' })).toString('base64url');
  await page.goto(`./#/karte/${card}`);
  await expect(page.getByRole('heading', { level: 1, name: 'test_data_gtp_ Lea' })).toBeVisible();
  for (const f of ['phone', 'wa', 'email', 'insta', 'strava', 'komoot', 'web', 'addr']) await expect(page.locator(`[data-card-way="${f}"]`)).toBeVisible();
  await expect(page.locator('[data-card-way="wa"]')).toHaveAttribute('href', 'https://wa.me/41790000000');
  await expect(page.locator('[data-card-way="email"]')).toHaveAttribute('href', 'mailto:lea@example.test');
  await noSideways(page, 'card page');
  const [download] = await Promise.all([page.waitForEvent('download'), tap(page.locator('[data-card-vcf]'), info)]);
  expect(download.suggestedFilename()).toBe('test_data_gtp_ Lea.vcf');
  const text = await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
  expect(text).toContain('FN:test_data_gtp_ Lea');
  expect(text).toContain('EMAIL;TYPE=INTERNET:lea@example.test');
});

test('Kontakt-QR step 2: end day, straight to contacts, show big', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/me/freunde?tab=card');
  await page.locator('[data-card-name]').fill('test_data_gtp_ Sam');
  await page.locator('[data-card-field="email"]').fill('sam@example.test');
  await page.locator('[data-card-field="email"]').blur();
  const qrText = () => page.locator('[data-qr-text]').getAttribute('data-qr-text');
  // a week is the start: the clock stands on Friday 9 October 2026, so the card shows until Thursday 15 October
  await expect.poll(async () => cardOf(await qrText()).until).toBe('2026-10-15');
  await tap(page.locator('[data-card-days="1"]'), info);
  await expect.poll(async () => cardOf(await qrText()).until).toBe('2026-10-09');
  await tap(page.locator('[data-card-days="0"]'), info);
  await expect.poll(async () => cardOf(await qrText()).until).toBeUndefined();
  // straight to contacts: the code holds the contact itself, without an end day
  await tap(page.locator('[data-card-mode="vcard"]'), info);
  await expect.poll(qrText).toContain('BEGIN:VCARD');
  await expect(page.locator('[data-card-days]')).toHaveCount(0);
  await tap(page.locator('[data-card-mode="link"]'), info);
  await expect.poll(qrText).toContain('#/karte/');
  // show big: the code alone, closes again
  await tap(page.locator('[data-card-big]'), info);
  await expect(page.locator('[data-card-bigview] svg')).toBeVisible();
  await tap(page.locator('[data-card-bigview] .cc-big-x'), info);
  await expect(page.locator('[data-card-bigview]')).not.toBeVisible();
  await noSideways(page, 'contact card step 2');
});

test('Kontakt-QR step 2: after its last day the card page says expired', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const at = (until) => Buffer.from(JSON.stringify({ v: 1, name: 'test_data_gtp_ Lea', email: 'lea@example.test', until })).toString('base64url');
  await page.goto(`./#/karte/${at('2026-10-09')}`);
  await expect(page.locator('[data-card-valid]')).toBeVisible();
  await expect(page.locator('[data-card-way="email"]')).toBeVisible();
  await page.goto(`./#/karte/${at('2026-10-08')}`);
  await expect(page.locator('[data-card-expired]')).toBeVisible();
  await expect(page.locator('[data-card-way]')).toHaveCount(0);
  await expect(page.locator('[data-card-vcf]')).toHaveCount(0);
});
