// Erinnerung an die Kunden (Noah 04.11.2026 «2a»/«2b», 08.11.2026): the card in the offer shows the ready text and a
// switch, Noah changes the text, Heute shows the reminder row with that text in a mail ready to send (subject and
// body), and with the switch off the row is gone. Same server as termine.spec.js; names are fictional.
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

test('Erinnerung: fertiger Text, eigener Text, Mail mit Betreff auf Heute, ausschaltbar', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // the ready text: greeting, lesson, the cancel rule and the closing
  const card = page.locator('[data-reminder-card]');
  await expect(card.locator('[data-reminder-switch]')).toBeChecked();
  await expect(card.locator('[data-reminder-sample]')).toContainText('Hallo Mia! Zur Erinnerung: Tennis-Lektion morgen um 17:00.');
  await expect(card.locator('[data-reminder-sample]')).toContainText('bis 24 Stunden vorher');
  await expect(card.locator('[data-reminder-sample]')).toContainText('Bis dann!');

  // Noah's own text with German words; the preview follows while he types
  await card.getByRole('button', { name: T('Own text') }).click();
  const sheet = page.getByRole('dialog', { name: T('Reminder text') });
  await expect(sheet).toContainText('{Name} {Angebot} {Tag} {Zeit} {Ort} {Stunden}');
  await sheet.getByLabel(T('Your own text (empty: the ready text)')).fill('Hoi {Name}, morgen ist {Angebot} um {Zeit}!');
  await expect(sheet.locator('[data-reminder-preview]')).toHaveText('Hoi Mia, morgen ist Tennis-Lektion um 17:00!');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toBeHidden();
  await expect(card.locator('[data-reminder-sample]')).toContainText('Hoi Mia, morgen ist Tennis-Lektion um 17:00!');
  await page.reload();
  await expect(page.locator('[data-reminder-card] [data-reminder-sample]')).toContainText('Hoi Mia');

  // book at once and open a time tomorrow (the fixed day is a Wednesday: tomorrow is the Thursday column)
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

  // Heute: the row opens a mail with a subject and Noah's text
  await page.goto('./#/');
  await ready(page);
  const remind = page.locator('li.row[data-row="remind"]');
  const link = remind.getByRole('link', { name: T('Remind') });
  const href = decodeURIComponent((await link.getAttribute('href')) ?? '');
  expect(href).toContain('mailto:mia@example.test?subject=Erinnerung: Tennis-Lektion morgen um 18:00');
  expect(href).toContain('body=Hoi Mia Muster, morgen ist Tennis-Lektion um 18:00!');

  // switched off: no row on Heute
  await page.goto(`./#/me/offers/${id}`);
  await page.locator('[data-reminder-switch]').uncheck();
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('li.row[data-row="remind"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
