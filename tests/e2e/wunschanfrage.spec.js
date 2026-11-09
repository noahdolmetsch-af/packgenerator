// Wunschzeit-Anfrage (Noah 08.11.2026 «1c», «1a 2a»): the parents of a tennis offer in mode «wish»
// tick places, name wish times, the number of children and the source; Heute shows a row, Noah
// confirms one wish time and gets the message for the parents. The server is the real api/booking.js
// with a Redis in memory (tests/booking-fake.js); names and numbers are fictional.
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

test('a wish request with places and times: Heute shows it, Noah confirms one wish time', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // mode «Wish time, I answer», two places
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByLabel(T('Places to choose from (separated by commas)')).fill('Mythenquai, Lengg Halle');
  await rules.getByRole('button', { name: T('Wish time, I answer') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await expect(page.locator('.of-rules')).toContainText(T('wish times, you answer within 24 h'));

  // the parents: no fixed times, a form
  await page.goto(`./buchen/#${id}`);
  const form = page.locator('[data-wish-form]');
  await expect(form).toBeVisible();
  await expect(page.locator('.tm')).toHaveCount(0);
  await form.getByRole('button', { name: 'Mythenquai' }).click();
  await form.getByRole('button', { name: 'Lengg Halle' }).click();
  await form.locator('[data-wish-add]').click();
  await expect(form.locator('[data-wish-row]')).toHaveCount(2);
  await form.locator('[data-wish-kids]').locator('xpath=following-sibling::button').click();
  await expect(form.locator('[data-wish-kids]')).toHaveText('2');
  await form.getByLabel(T('First names and ages of the children')).fill('Mia (8), Leo (7)');
  await form.getByLabel(T('Your name|formal')).fill('Anna Beispiel');
  await form.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
  await form.locator('[data-wish-source]').selectOption('flyer');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await form.getByRole('button', { name: T('Send request') }).click();
  const sent = page.locator('[data-wish-sent]');
  await expect(sent).toContainText(T('Request sent'));
  await expect(sent).toContainText('Anna Beispiel');
  await expect(sent).toContainText('Mythenquai · Lengg Halle');

  // Heute: one row for the wish request
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('li.row[data-row="book"]')).toContainText(T('New wish request: {name} · {title}', { name: 'Anna Beispiel', title: T('Tennis lesson') }));

  // the offer: the card with the request; Noah confirms the first wish time
  await page.goto(`./#/me/offers/${id}`);
  const card = page.locator('[data-wishes]');
  await expect(card).toContainText('Anna Beispiel');
  await expect(card).toContainText('Mia (8), Leo (7)');
  await expect(card).toContainText('Flyer');
  await expect(card.locator('[data-wish-pick]')).toHaveCount(2);
  await card.locator('[data-wish-pick]').first().click();
  await expect(card).toContainText(T('Confirmed. Now tell {name}:', { name: 'Anna Beispiel' }));
  await expect(card.getByRole('link', { name: T('Write') })).toHaveAttribute('href', /^sms:0790000000\?body=/);
  await expect(card.locator('[data-wish]')).toHaveCount(0);
});

test('an offer in mode request shows no wish form', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  const id = page.url().split('/').at(-1);
  await page.goto(`./buchen/#${id}`);
  await expect(page.locator('[data-wish-form]')).toHaveCount(0);
});

test('the price follows the number of children and the hall (Noah 1a)', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // wish mode shows the suggested table; Lengg Halle is a hall
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByLabel(T('Places to choose from (separated by commas)')).fill('Mythenquai, Lengg Halle');
  await rules.getByRole('button', { name: T('Wish time, I answer') }).click();
  const table = rules.locator('[data-wish-prices]');
  await expect(table.locator('#of-po-0')).toHaveValue('100');
  await expect(table.locator('#of-ph-1')).toHaveValue('90');
  await table.locator('#of-po-1').fill('72');
  await table.locator('[data-hall-place]').nth(1).check();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await expect(page.locator('.of-rules')).toContainText(T('wish times, you answer within 24 h'));

  // the parents: outdoors 2 children = 72 per child; with the hall ticked the hall price counts
  await page.goto(`./buchen/#${id}`);
  const form = page.locator('[data-wish-form]');
  await expect(form).toBeVisible();
  await form.getByRole('button', { name: 'Mythenquai' }).click();
  await expect(form.locator('[data-wish-price]')).toContainText('CHF 100');
  await form.locator('[data-wish-kids]').locator('xpath=following-sibling::button').click();
  await expect(form.locator('[data-wish-price]')).toContainText('CHF 72');
  await expect(form.locator('[data-wish-price]')).toContainText('CHF 144');
  await form.getByRole('button', { name: 'Lengg Halle' }).click();
  await expect(form.locator('[data-wish-price]')).toContainText('CHF 90');
  await expect(form.locator('[data-wish-price]')).toContainText('CHF 180');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await form.getByLabel(T('Your name|formal')).fill('Anna Beispiel');
  await form.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
  await form.getByRole('button', { name: T('Send request') }).click();
  await expect(page.locator('[data-wish-sent]')).toContainText('CHF 90');

  // Noah sees the price on the request and in the message
  await page.goto(`./#/me/offers/${id}`);
  const card = page.locator('[data-wishes]');
  await expect(card.locator('[data-wish-price]')).toContainText('CHF 90');
  await card.locator('[data-wish-pick]').first().click();
  await expect(card.getByRole('link', { name: T('Write') })).toHaveAttribute('href', /body=.*90/);
});

test('a confirmed wish request goes to the invoice with the price the parents saw (part 3)', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByLabel(T('Places to choose from (separated by commas)')).fill('Mythenquai, Lengg Halle');
  await rules.getByRole('button', { name: T('Wish time, I answer') }).click();
  await rules.locator('[data-wish-prices] [data-hall-place]').nth(1).check();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();

  // the parents: two children, outdoors = 2 x 70
  await page.goto(`./buchen/#${id}`);
  const form = page.locator('[data-wish-form]');
  await form.getByRole('button', { name: 'Mythenquai' }).click();
  await form.locator('[data-wish-kids]').locator('xpath=following-sibling::button').click();
  await form.getByLabel(T('Your name|formal')).fill('Anna Beispiel');
  await form.getByLabel(T('Phone or e-mail')).fill('anna@example.test');
  await form.getByRole('button', { name: T('Send request') }).click();
  await expect(page.locator('[data-wish-sent]')).toContainText('CHF 140');

  // Noah confirms; the confirmed list names the total and says where the invoice comes
  await page.goto(`./#/me/offers/${id}`);
  const card = page.locator('[data-wishes]');
  await card.locator('[data-wish-pick]').first().click();
  await expect(card).toContainText('CHF 140');
  await expect(card.locator('[data-wish-next]')).toBeVisible();
  await expect(page.locator('[data-lessons-over]')).toHaveCount(0);

  // the lesson is over: the draft carries the price the parents saw
  await page.goto('./#/me');
  await page.evaluate(() => {
    globalThis.__pgShift = (globalThis.__pgShift || 0) + 20 * 24 * 3600_000;
    localStorage.setItem('pg.pay.account', JSON.stringify({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Tennis', street: '', house: '', zip: '8000', town: 'Zürich', twint: '079 000 00 00' }));
  });
  await page.goto(`./#/me/offers/${id}`);
  const over = page.locator('[data-lessons-over]');
  await expect(over).toContainText('Anna Beispiel');
  await over.getByRole('button', { name: T('Prepare invoice') }).click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('140');
  await expect(page.getByLabel(T('What for?'))).toHaveValue(new RegExp(T('Tennis lesson')));
});
