// Bestätigung an die Kunden (Noah 05.11.2026 «5c», 09.11.2026): the card in the offer shows the ready text; Noah writes
// the meeting point, the pick-up and the rain rule once (the preview follows), and the lesson list opens a mail with a
// subject and exactly this text. After he confirms a wish time, the message to the parents has the same lines.
// Same server as termine.spec.js; names are fictional.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { makeHandler } from '../../api/booking.js';
import { BOOKING_URL } from '../../src/lib/booking/client.js';
import { fakeRedis } from '../booking-fake.js';

const T = tr('de');
const REDIS = 'https://redis.example.test';

test.beforeEach(async ({ context }) => {
  const r = fakeRedis();
  const handler = makeHandler({
    env: () => ({ mode: 'off', redisUrl: REDIS, redisToken: 't' }),
    doFetch: async (url, init) => (url === REDIS ? Response.json({ result: r.run(JSON.parse(init.body)) }) : new Response('{}', { status: 404 })),
  });
  await context.route(/^https?:\/\/(?!localhost[:/])/, async (route) => {
    const req = route.request();
    if (!req.url().startsWith(BOOKING_URL)) return route.abort();
    const res = await handler(new Request(req.url(), { method: req.method(), headers: { ...req.headers(), origin: 'http://localhost' }, body: req.method() === 'POST' ? req.postData() : undefined }));
    await route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Bestätigung: fertiger Text, drei Zeilen, Mail mit Betreff in der Stundenliste', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // the ready text: no lines yet, the cancel rule of the offer is in
  const card = page.locator('[data-confirm-card]');
  await expect(card.locator('[data-confirm-sample]')).toContainText('Hallo Mia! Die Stunde ist gebucht: Tennis-Lektion am');
  await expect(card.locator('[data-confirm-sample]')).toContainText('bis 24 Stunden vorher');
  await expect(card.locator('[data-confirm-sample]')).not.toContainText('Besammlung');

  // the three lines; the preview follows while he types
  await card.getByRole('button', { name: T('Add details') }).click();
  const sheet = page.getByRole('dialog', { name: T('Details for the confirmation') });
  await sheet.getByLabel(T('Meeting point|lesson')).fill('beim Clubhaus');
  await sheet.getByLabel(T('Pick-up|lesson')).fill('Eltern holen am Platz ab');
  await expect(sheet.locator('[data-confirm-preview]')).toContainText('Besammlung: beim Clubhaus.');
  await expect(sheet.locator('[data-confirm-preview]')).toContainText('Abholung: Eltern holen am Platz ab.');
  await expect(sheet.locator('[data-confirm-preview]')).not.toContainText('Bei Regen');
  await sheet.getByLabel(T('If it rains')).fill('Ich schreibe dir bis 14:00');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toBeHidden();
  await expect(card.locator('[data-confirm-sample]')).toContainText('Bei Regen: Ich schreibe dir bis 14:00.');
  await page.reload();
  await expect(page.locator('[data-confirm-card] [data-confirm-sample]')).toContainText('Besammlung: beim Clubhaus.');

  // book at once, open a time tomorrow, one booking
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByRole('button', { name: T('Booked at once') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await page.locator('.of-dc').nth(3).locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  await page.goto(`./buchen/#${id}`);
  await page.getByLabel(T('Your name')).fill('Mia Muster');
  await page.getByLabel(T('Phone or e-mail')).fill('mia@example.test');
  await page.getByRole('button', { name: T('Book the time') }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();

  // the lesson list: «Bestätigung» opens a mail with a subject and the text
  await page.goto(`./#/me/offers/${id}`);
  await page.locator('.of-dc').nth(3).locator('.of-sl:not(.add)').filter({ hasText: '18:00' }).first().click();
  const link = page.locator('[data-confirm-link]');
  await expect(link).toHaveCount(1);
  const href = decodeURIComponent((await link.getAttribute('href')) ?? '');
  expect(href).toContain('mailto:mia@example.test?subject=Bestätigt: Tennis-Lektion');
  expect(href).toContain('body=Hallo Mia Muster! Die Stunde ist gebucht: Tennis-Lektion am');
  expect(href).toContain('Besammlung: beim Clubhaus. Abholung: Eltern holen am Platz ab. Bei Regen: Ich schreibe dir bis 14:00.');
  expect(href).toContain('Bis dann!');
  // the new button must not push the row wider than the window (on a phone the buttons go below the name)
  const box = page.locator('dialog[open].of-sheet');
  expect(await box.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
