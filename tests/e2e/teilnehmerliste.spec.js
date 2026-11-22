// Teilnehmerliste (Noah 05.11.2026 «5c», 09.11.2026): the card in the offer lists every coming time with a person or a waiting
// list: names, free places, waiting list; the deadline is Noah's note and survives a reload; the list can be copied.
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

test('Teilnehmerliste: leer, dann Namen, voll mit Warteliste, Anmeldeschluss, Liste kopieren', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  const card = page.locator('[data-roster-card]');

  // empty: it says why and offers the next step (the link)
  await expect(card.locator('[data-roster-empty]')).toBeVisible();
  await expect(card.getByRole('button', { name: T('Copy link') })).toBeVisible();
  await expect(card.locator('[data-roster-copy]')).toHaveCount(0);

  // the deadline is a note: it counts the days, shows «over» in the warning colour and survives a reload
  await card.locator('[data-deadline]').fill('2099-01-01');
  await expect(card.locator('[data-deadline-state]')).toContainText(/noch \d+ Tage/);
  await card.locator('[data-deadline]').fill('2020-01-01');
  await expect(card.locator('[data-deadline-state]')).toContainText(/Vorbei seit \d+ Tagen/);
  await page.reload();
  await expect(page.locator('[data-roster-card] [data-deadline]')).toHaveValue('2020-01-01');

  // book at once, open a single time tomorrow, one booking: the time is full
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

  // the list: one time, one name, full; the row opens the time
  await page.goto(`./#/me/offers/${id}`);
  const row = page.locator('[data-roster-row]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Mia Muster');
  await expect(row).toContainText('1 von 1');
  await expect(row).toContainText('voll');
  await expect(page.locator('[data-roster-sum]')).toContainText('1 Person');

  // somebody on the waiting list shows up in the list too
  await row.locator('.of-row').click();
  const slot = page.locator('dialog[open].of-sheet');
  await slot.locator('#of-wn').fill('Finn Fiktiv');
  await slot.locator('[data-wait-add]').click();
  await slot.getByRole('button', { name: T('Close') }).first().click();
  await expect(page.locator('[data-roster-wait]')).toContainText('Finn Fiktiv');

  // copy: names only, the deadline, the waiting list
  await page.locator('[data-roster-copy]').click();
  const status = page.locator('[data-roster-card] [role=status]');
  await expect(status).toContainText(/Liste kopiert\.|Teilnehmerliste/);
  const text = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
  if (text) {
    expect(text).toContain('Anmelden bis');
    expect(text).toContain('1. Mia Muster');
    expect(text).toContain('Warteliste: Finn Fiktiv');
    expect(text).not.toContain('mia@example.test');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
