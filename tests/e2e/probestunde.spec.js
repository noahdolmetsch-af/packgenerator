// Probestunde (Noah 04.11.2026 «10a», 08.11.2026 «ja»): Noah switches «Schnupperstunde anbieten» on under «So wird gebucht»,
// opens two trial times, Mia asks for the first and Noah confirms it; Mia asks for the second one too: the request says
// she had one already and the answer offers a normal lesson. Same server as termine.spec.js (api/booking.js, Redis in
// memory); names are fictional.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
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

test('Probestunde: eine Art im Angebot, einmal pro Person, die zweite Anfrage ist markiert', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // the switch under «How booking works»: a kind with one place and half the price of «Single» (60 CHF → 30)
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  const sw = rules.locator('[data-trial-switch]');
  await expect(sw).not.toBeChecked();
  await sw.check();
  await expect(rules.locator('fieldset.of-type')).toHaveCount(3);
  await expect(rules.getByLabel(T('Price in CHF')).last()).toHaveValue('30');
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();

  // it stays on after a reload and the switch is on again in the sheet
  await page.reload();
  await page.getByRole('button', { name: T('Change') }).click();
  await expect(page.getByRole('dialog', { name: T('How booking works') }).locator('[data-trial-switch]')).toBeChecked();
  await page.getByRole('dialog', { name: T('How booking works') }).getByRole('button', { name: T('Cancel') }).click();

  // two trial times next Monday: 17:00 and 18:30
  await page.getByRole('button', { name: T('Next week') }).click();
  for (const time of ['17:00', '18:30']) {
    await page.locator('.of-dc').first().locator('.of-sl.add').click();
    const add = page.getByRole('dialog', { name: T('Open a time') });
    await add.locator('input[type=time]').fill(time);
    await add.getByRole('button', { name: new RegExp(`^${T('Trial lesson')}`) }).click();
    await add.getByLabel(T('Every week the same (the next 8 weeks)')).uncheck();
    await add.getByRole('button', { name: T('Open the time') }).click();
    await expect(add).toBeHidden();
  }
  await expect(page.locator('.of-dc').first().locator('.of-sl.free')).toHaveCount(2);

  // Mia asks for the first time, Noah confirms
  const ask = async (time, name) => {
    await page.goto(`./buchen/#${id}`);
    await page.reload();
    await page.locator('.tm', { hasText: time }).click();
    await page.getByLabel(T('Your name')).fill(name);
    await page.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
    await expect(page.locator('form .sum')).toContainText('30 CHF');
    await page.getByRole('button', { name: T('Send request') }).click();
    await expect(page.getByRole('heading', { name: T('Request sent') })).toBeVisible();
  };
  await ask('17:00', 'Mia Muster');
  await page.goto(`./#/me/offers/${id}`);
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc .of-sl.free', { hasText: '17:00' }).click();
  const first = page.getByRole('dialog');
  await expect(first).toContainText(T('Trial lesson'));
  await expect(first.locator('[data-trial-used]')).toHaveCount(0);
  await first.getByRole('button', { name: T('Confirm') }).click();
  await expect(first).toContainText(T('Confirmed. Now tell {name}:', { name: 'Mia Muster' }));
  await first.getByRole('button', { name: T('Close') }).click();
  await expect(first).toBeHidden(); // the window closes through the history: wait before the next page

  // the second request of the same person (written differently) is marked; the answer offers a normal lesson
  await ask('18:30', 'mia  muster');
  await page.goto(`./#/me/offers/${id}`);
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc .of-sl.free', { hasText: '18:30' }).click();
  const second = page.getByRole('dialog');
  await expect(second.locator('[data-trial-used]')).toContainText('Hatte schon eine Schnupperstunde');
  await second.getByRole('button', { name: T('Decline') }).click();
  await expect(second).toContainText(T('Declined. Now tell {name}:', { name: 'mia  muster' }));
  await expect(second.locator('.of-note')).toContainText('einmal pro Person');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

  // switched off: the times of the kind stay as times of the first kind, none is lost
  await second.getByRole('button', { name: T('Close') }).click();
  await expect(second).toBeHidden();
  await page.getByRole('button', { name: T('Change') }).click();
  const again = page.getByRole('dialog', { name: T('How booking works') });
  await again.locator('[data-trial-switch]').uncheck();
  await expect(again.locator('[data-trial-moves]')).toBeVisible();
  await again.getByRole('button', { name: T('Save') }).click();
  await expect(again).toBeHidden();
  await expect(page.locator('.of-dc').first().locator('.of-sl')).toHaveCount(3); // 2 trial times kept + the add button
});
