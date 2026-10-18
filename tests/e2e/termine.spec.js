// Termine buchen (mockups BU1–BU5, Noah 14.10.2026 «BU1–BU5 freigegeben»): Noah opens a tennis
// offer under Ich › Angebote and opens a free time (BU5, BU1); a student books it on the booking
// page without the app (BU2, BU3); Heute shows «Neue Buchung» (BU4, 9a) and the offer shows who
// comes; Noah cancels the time and gets the person to write to. The server is the real
// api/booking.js with a Redis in memory (tests/booking-fake.js); names and numbers are fictional.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { makeHandler } from '../../api/booking.js';
import { BOOKING_URL } from '../../src/lib/booking/client.js';
import { KINDS } from '../../src/lib/booking/model.js';
import { fakeRedis } from '../booking-fake.js';

const T = tr('de');
const REDIS = 'https://redis.example.test';

test.beforeEach(async ({ context }) => {
  const r = fakeRedis();
  const handler = makeHandler({
    env: () => ({ mode: 'off', redisUrl: REDIS, redisToken: 't' }),
    doFetch: async (url, init) => (url === REDIS ? Response.json({ result: r.run(JSON.parse(init.body)) }) : new Response('{}', { status: 404 })),
  });
  // only the booking server answers (in memory); every other outside address is blocked
  await context.route(/^https?:\/\/(?!localhost[:/])/, async (route) => {
    const req = route.request();
    if (!req.url().startsWith(BOOKING_URL)) return route.abort();
    const res = await handler(new Request(req.url(), { method: req.method(), headers: { ...req.headers(), origin: 'http://localhost' }, body: req.method() === 'POST' ? req.postData() : undefined }));
    await route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('an offer, a booking without the app, the note on Heute and cancelling', async ({ page }) => {
  // BU5: Ich › Angebote
  await page.goto('./#/me');
  await ready(page);
  const row = page.locator('a.ich-row[href="#/me/offers"]');
  await expect(row).toContainText(T('Offers'));
  await row.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Your offers'));
  const kinds = page.locator('.of-chips .btn');
  await expect(kinds).toHaveCount(KINDS.length);
  for (const [i, k] of KINDS.entries()) await expect(kinds.nth(i)).toContainText(T(k.label));
  await kinds.first().click();

  // BU1: the offer with its week, the link and the rules
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Tennis lesson'));
  await expect(page.locator('.of-link')).toContainText(`buchen/#${id}`);
  await expect(page.locator('.of-rules')).toContainText(T('on site (cash, TWINT)'));
  await expect(page.locator('section[aria-labelledby="of-bk-h"]')).toContainText(T('Nobody has booked yet.'));

  // open a time next Monday, 18:00, group, every week
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc').first().locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: new RegExp(`^${T('Group')}`) }).click();
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  const slot = page.locator('.of-dc').first().locator('.of-sl.free');
  await expect(slot).toHaveCount(1);
  await expect(slot).toContainText('18:00');
  await page.getByRole('button', { name: T('Next week') }).click();
  await expect(page.locator('.of-dc').first().locator('.of-sl.free')).toContainText('18:00'); // weekly
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

  // BU2 + BU3: the student books on the booking page, without the app
  await page.goto(`./buchen/#${id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Tennis lesson'));
  await expect(page.locator('.tm[aria-pressed="true"]')).toContainText('18:00');
  await page.getByLabel(T('Your name')).fill('Mia Muster');
  await page.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
  await expect(page.locator('form .sum')).toContainText(T('on site, cash or TWINT'));
  await page.getByRole('button', { name: T('Book the time') }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();
  await expect(page.locator('.conf')).toContainText('Mia Muster');
  await expect(page.locator('.conf')).toContainText('25 CHF');
  await expect(page.getByRole('button', { name: T('Add to calendar') })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  // nobody else's name on the page for the next person
  await page.reload();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeHidden();
  await expect(page.locator('.tm').first()).toContainText(T('{n} places left', { n: 3 }));
  await expect(page.locator('body')).not.toContainText('Mia Muster');

  // BU4: Heute shows the new booking in «Heute wichtig»
  await page.goto('./#/');
  await ready(page);
  const note = page.locator('li.row[data-row="book"]');
  await expect(note).toContainText(T('New booking: {name} · {title} · {when}', { name: 'Mia Muster', title: T('Tennis lesson'), when: '' }).replace(/ · $/, ''));
  await note.getByRole('link', { name: T('Look') }).click();
  await expect(page).toHaveURL(new RegExp(`#/me/offers/${id}$`));
  const booked = page.locator('section[aria-labelledby="of-bk-h"]');
  await expect(booked).toContainText('Mia Muster');

  // seen: the note is gone
  await page.goto('./#/');
  await ready(page);
  await page.waitForTimeout(500);
  await expect(page.locator('li.row[data-row="book"]')).toHaveCount(0);

  // Noah cancels the time and writes to Mia
  await page.goto(`./#/me/offers/${id}`);
  await booked.getByRole('button').first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('Mia Muster');
  await expect(sheet).toContainText(T('pays on site'));
  await sheet.getByRole('button', { name: T('Cancel the time') }).click();
  await sheet.getByRole('button', { name: T('Yes, cancel') }).click();
  await expect(sheet).toContainText(T('The time is cancelled. Tell {n} person:', { n: 1 }));
  await expect(sheet.getByRole('link', { name: T('Write') })).toHaveAttribute('href', /^sms:0790000000\?body=/);
});
