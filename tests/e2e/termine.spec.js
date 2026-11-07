// Termine buchen (mockups BU1–BU5, Noah 14.10.2026 «BU1–BU5 freigegeben»): Noah opens a tennis
// offer under Ich › Angebote and opens a free time (BU5, BU1); a student books it on the booking
// page without the app (BU2, BU3); Heute shows «Neue Buchung» (BU4, 9a) and the offer shows who
// comes; Noah cancels the time and gets the person to write to. The server is the real
// api/booking.js with a Redis in memory (tests/booking-fake.js); names and numbers are fictional.
import { test, expect } from './clock.js';
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
  // Klick-Rundgang Q05 (Noah 22.10.2026 «3a», changed on purpose): «App verkaufen» is dropped, Ich no longer lists this page; it opens by its address
  await expect(page.locator('a.ich-row[href="#/me/offers"]')).toHaveCount(0);
  await page.goto('./#/me/offers');
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

  // Tennis starts as «Request, I answer» (Noah 03.11.2026 «1b»); this test books at once, so switch it
  await expect(page.locator('.of-rules')).toContainText(T('request, you answer within 24 h'));
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByRole('button', { name: T('Booked at once') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await expect(page.locator('.of-rules')).toContainText(T('booked at once'));

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
  await expect(sheet).toContainText(T('{price} CHF per person', { price: '25' })); // group: the price is per person
  await expect(sheet.locator('[data-mail-group]')).toHaveCount(0); // one person: no group e-mail
  await sheet.getByRole('button', { name: T('Cancel the time') }).click();
  await sheet.getByRole('button', { name: T('Yes, cancel') }).click();
  await expect(sheet).toContainText(T('The time is cancelled. Tell {n} person:', { n: 1 }));
  await expect(sheet.getByRole('link', { name: T('By SMS') })).toHaveAttribute('href', /^sms:0790000000\?body=/);
  // the offered times can be ticked off: the message follows
  await expect(sheet.locator('[data-alts] input[type=checkbox]')).toHaveCount(5); // five offered, the first three ticked
  await expect(sheet.locator('[data-alts] input[type=checkbox]:checked')).toHaveCount(3);
  await sheet.locator('[data-alts] input[type=checkbox]').first().uncheck();
  await expect(sheet.locator('[data-alts] input[type=checkbox]:checked')).toHaveCount(2);
  await expect(sheet.locator('[data-tell-text]')).toContainText(T('Free times:'));
  await expect(sheet.locator('[data-mail-all]')).toHaveCount(0); // Mia gave a phone number, no e-mail
  // the message is shown too, so Noah sees what he sends
  await expect(sheet.locator('[data-tell-text]')).toContainText(T('Free times:'));
});

test('a request with places and a note: Noah confirms it and writes back', async ({ page }) => {
  await page.goto('./#/me/offers');
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);

  // two places to choose from
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByLabel(T('Places to choose from (separated by commas)')).fill('Platz am See, Halle');
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await expect(page.locator('.of-rules')).toContainText('Platz am See · Halle');

  // a time in the hall, next Monday 18:00, single, one week only
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc').first().locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: 'Halle' }).click();
  await add.getByLabel(T('Every week the same (the next 8 weeks)')).uncheck();
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();

  // the student chooses a place and a time and sends a request with a note
  await page.goto(`./buchen/#${id}`);
  await page.getByRole('button', { name: 'Halle' }).click();
  await expect(page.locator('.tm[aria-pressed="true"]')).toContainText('18:00');
  await page.getByLabel(T('Your name')).fill('Mia Muster');
  await page.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
  await page.locator('#bk-note').fill('Anfängerin, eigener Schläger');
  await expect(page.locator('form .sum')).toContainText(T('after the lesson, you get an invoice'));
  await page.getByRole('button', { name: T('Send request') }).click();
  await expect(page.getByRole('heading', { name: T('Request sent') })).toBeVisible();
  await expect(page.locator('.conf')).toContainText('Halle');
  await expect(page.locator('.conf')).toContainText('60 CHF');
  await expect(page.locator('.conf')).toContainText('Anfängerin, eigener Schläger');
  await expect(page.getByRole('button', { name: T('Add to calendar') })).toHaveCount(0);

  // Heute: a new request, Noah opens the time and confirms
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('li.row[data-row="book"]')).toContainText(T('New request: {name} · {title} · {when}', { name: 'Mia Muster', title: T('Tennis lesson'), when: '' }).replace(/ · $/, ''));
  await page.goto(`./#/me/offers/${id}`);
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc .of-sl.free').first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('Anfängerin, eigener Schläger');
  await sheet.getByRole('button', { name: T('Confirm') }).click();
  await expect(sheet).toContainText(T('Confirmed. Now tell {name}:', { name: 'Mia Muster' }));
  await expect(sheet.getByRole('link', { name: T('Write') }).first()).toHaveAttribute('href', /^sms:0790000000\?body=/);

  // the student sees it as booked
  await page.goto(`./buchen/#${id}`);
  await page.reload();
  await page.getByRole('link', { name: /18:00/ }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();

  // the time is full now: Noah puts Leo on the waiting list; when Mia cancels, the sheet says a place is free
  await page.goto(`./#/me/offers/${id}`);
  await page.getByRole('button', { name: T('Next week') }).click();
  await page.locator('.of-dc .of-sl.full').first().click();
  const full = page.getByRole('dialog');
  await expect(full).toContainText(T('Waiting list'));
  await full.locator('#of-wn').fill('Leo Muster');
  await full.locator('#of-wc').fill('leo@example.test');
  await full.locator('[data-wait-add]').click();
  await expect(full.locator('[data-waitlist]')).toContainText('Leo Muster');
  await expect(full.locator('[data-place-free]')).toHaveCount(0);
  await full.getByRole('button', { name: T('Cancel|booking'), exact: true }).click();
  await expect(full.locator('[data-place-free]')).toBeVisible();
  await expect(full.locator('[data-waitlist] a')).toHaveAttribute('href', /^mailto:leo@example\.test/);
  // Heute says it too
  await page.goto('./#/');
  await ready(page);
  const free = page.locator('li.row[data-row="wait"]');
  await expect(free).toContainText('Leo Muster');
  await expect(free.getByRole('link', { name: T('Write') })).toHaveAttribute('href', /^mailto:leo@example\.test/);
});

test('the invoice form is filled from a booking draft and keeps the booking', async ({ page }) => {
  await page.goto('./#/');
  await ready(page);
  await page.evaluate(() => {
    localStorage.setItem('pg.pay.account', JSON.stringify({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Tennis', street: '', house: '', zip: '8000', town: 'Zürich', twint: '079 000 00 00' }));
    sessionStorage.setItem('pg.invoice.prefill', JSON.stringify({ name: 'Mia Muster', email: 'mia@example.test', amount: '60', purpose: 'Tennis-Lektion, Einzel, Mo, 23.11.', bookings: [{ offer: 'tennis-abc123', b: 'bk1' }] }));
  });
  await page.goto('./#/me/pay/invoices/new');
  await expect(page.getByLabel(T('For whom?'))).toHaveValue('Mia Muster');
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('60');
  await expect(page.getByLabel(T('What for?'))).toHaveValue('Tennis-Lektion, Einzel, Mo, 23.11.');
  // cash is a way to pay of its own
  await page.locator('[data-way-cash]').check();
  await expect(page.locator('[data-way-cash]')).toBeChecked();
  // read once: a second visit starts empty
  expect(await page.evaluate(() => sessionStorage.getItem('pg.invoice.prefill'))).toBeNull();
});

test('the customer list: add a customer with an own price, edit and delete with Undo', async ({ page }) => {
  await page.goto('./#/');
  await ready(page);
  await page.evaluate(() => localStorage.setItem('pg.pay.account', JSON.stringify({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Tennis', street: '', house: '', zip: '8000', town: 'Zürich', twint: '079 000 00 00' })));
  await page.goto('./#/me/offers/customers');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Customers'));
  await page.getByRole('button', { name: T('Add a customer') }).first().click();
  await page.locator('#cu-name').fill('Mia Muster');
  await page.locator('#cu-contact').fill('mia@example.test');
  await page.locator('#cu-rate').fill('50');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  const row = page.locator('.cu-row', { hasText: 'Mia Muster' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('50');
  // a lesson card: number and price, shown in the list, sold by an invoice draft
  await row.click();
  await page.locator('#cu-psize').fill('10');
  await page.locator('#cu-pprice').fill('450');
  await page.locator('[data-card-invoice]').click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('450');
  await expect(page.getByLabel(T('What for?'))).toHaveValue(T('{n}-lesson card', { n: 10 }));
  await page.goBack();
  await page.goto('./#/me/offers/customers');
  await row.click();
  await page.locator('#cu-psize').fill('10');
  await page.locator('#cu-pprice').fill('450');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  await expect(row).toContainText('10');
  // a subscription: price per month, the month's invoice is prepared by one tap
  await row.click();
  await page.locator('#cu-abo').fill('200');
  await page.locator('[data-abo-invoice]').click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('200');
  await page.goto('./#/me/offers/customers');
  await row.click();
  await page.locator('#cu-abo').fill('200');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  await expect(row).toContainText('200');
  // a usual time: weekday and time, shown in the list
  await row.click();
  await page.locator('#cu-fday').selectOption('3');
  await page.locator('#cu-ftime').fill('17:00');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  await expect(row).toContainText('17:00');
  // delete asks first, then offers Undo
  await row.click();
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Delete') }).click();
  await page.getByRole('button', { name: T('Delete') }).last().click();
  await expect(page.locator('.cu-row', { hasText: 'Mia Muster' })).toHaveCount(0);
});

test('Heute reminds about tomorrow\'s lesson with a message ready', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByRole('button', { name: T('Booked at once') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  // a time tomorrow (the fixed day is a Wednesday, so tomorrow is the Thursday column of this week)
  await page.locator('.of-dc').nth(3).locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  await page.goto(`./buchen/#${id}`);
  await page.getByLabel(T('Your name')).fill('Mia Muster');
  await page.getByLabel(T('Phone or e-mail')).fill('079 000 00 00');
  await page.getByRole('button', { name: T('Book the time') }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();
  await page.goto('./#/');
  await ready(page);
  const remind = page.locator('li.row[data-row="remind"]');
  await expect(remind).toContainText(T('tomorrow'));
  await expect(remind).toContainText('Mia Muster');
  await expect(remind.getByRole('link', { name: T('Remind') })).toHaveAttribute('href', /^sms:0790000000\?body=/);
});

test('after the lesson: no-show counts the full price, cancelled late half, in the invoice draft', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByRole('button', { name: T('Booked at once') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  // a single lesson today at 18:00 (the fixed day is a Wednesday at noon)
  await page.locator('.of-dc').nth(2).locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: new RegExp(`^${T('Single')}`) }).click();
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  await page.goto(`./buchen/#${id}`);
  await page.getByLabel(T('Your name')).fill('Ben Beispiel');
  await page.getByLabel(T('Phone or e-mail')).fill('ben@example.test');
  await page.getByRole('button', { name: T('Book the time') }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();
  // the lesson is over: later the same day
  const evening = await page.evaluate(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d.getTime();
  });
  await page.clock.setFixedTime(evening);
  await page.goto(`./#/me/offers/${id}`);
  await page.evaluate(() => localStorage.setItem('pg.pay.account', JSON.stringify({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Tennis', street: '', house: '', zip: '8000', town: 'Zürich', twint: '079 000 00 00' })));
  const card = page.locator('[data-lessons-over]');
  await expect(card).toContainText('Ben Beispiel');
  await card.locator('[data-outcome]').selectOption('noshow');
  await card.getByRole('button', { name: T('Prepare invoice') }).click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('60');
  await expect(page.getByLabel(T('What for?'))).toHaveValue(new RegExp(T('did not come')));
  await page.goBack();
  await card.locator('[data-outcome]').selectOption('late');
  await card.getByRole('button', { name: T('Prepare invoice') }).click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('30');
  await expect(page.getByLabel(T('What for?'))).toHaveValue(new RegExp(T('cancelled late')));
});


test('Heute suggests the usual time of a regular customer with a message ready', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  // a free time tomorrow (the fixed day is a Wednesday, so tomorrow is the Thursday column)
  await page.locator('.of-dc').nth(3).locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('17:00');
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  await page.goto('./#/me/offers/customers');
  await page.getByRole('button', { name: T('Add a customer') }).first().click();
  await page.locator('#cu-name').fill('Mia Muster');
  await page.locator('#cu-contact').fill('079 000 00 00');
  await page.locator('#cu-fday').selectOption('3');
  await page.locator('#cu-ftime').fill('17:00');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  // the sheet closes and steps its history entry back; wait for that before leaving (on the phone it raced the next page)
  await expect(page.locator('dialog.cu-sheet')).toBeHidden();
  await expect(page).toHaveURL(/#\/me\/offers\/customers$/);
  await page.goto('./#/');
  await ready(page);
  const row = page.locator('li.row[data-row="fixed"]');
  await expect(row).toContainText('Mia Muster');
  await expect(row.getByRole('link', { name: T('Suggest') })).toHaveAttribute('href', /^sms:0790000000\?body=/);
});

test('a voucher on the customer is taken off in the invoice draft', async ({ page }) => {
  await page.goto('./#/me/offers');
  await ready(page);
  await page.locator('.of-chips .btn').first().click();
  await expect(page).toHaveURL(/#\/me\/offers\/tennis-[a-z0-9]+$/);
  const id = page.url().split('/').at(-1);
  await page.getByRole('button', { name: T('Change') }).click();
  const rules = page.getByRole('dialog', { name: T('How booking works') });
  await rules.getByRole('button', { name: T('Booked at once') }).click();
  await rules.getByRole('button', { name: T('Save') }).click();
  await expect(rules).toBeHidden();
  await page.locator('.of-dc').nth(2).locator('.of-sl.add').click();
  const add = page.getByRole('dialog', { name: T('Open a time') });
  await add.locator('input[type=time]').fill('18:00');
  await add.getByRole('button', { name: new RegExp(`^${T('Single')}`) }).click();
  await add.getByRole('button', { name: T('Open the time') }).click();
  await expect(add).toBeHidden();
  // Ben gets a voucher of 25 CHF
  await page.goto('./#/me/offers/customers');
  await page.getByRole('button', { name: T('Add a customer') }).first().click();
  await page.locator('#cu-name').fill('Ben Beispiel');
  await page.locator('#cu-vvalue').fill('25');
  await page.locator('[data-voucher-add]').click();
  await expect(page.locator('[data-voucher]')).toContainText('GUT-');
  await page.locator('dialog.cu-sheet').getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('.cu-row', { hasText: 'Ben Beispiel' })).toContainText(T('Voucher'));
  await expect(page.locator('dialog.cu-sheet')).toBeHidden();
  // he books and the lesson is over
  await page.goto(`./buchen/#${id}`);
  await page.getByLabel(T('Your name')).fill('Ben Beispiel');
  await page.getByLabel(T('Phone or e-mail')).fill('ben@example.test');
  await page.getByRole('button', { name: T('Book the time') }).click();
  await expect(page.getByRole('heading', { name: T('Booked') })).toBeVisible();
  const evening = await page.evaluate(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d.getTime();
  });
  await page.clock.setFixedTime(evening);
  await page.goto(`./#/me/offers/${id}`);
  await page.evaluate(() => localStorage.setItem('pg.pay.account', JSON.stringify({ iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Tennis', street: '', house: '', zip: '8000', town: 'Zürich', twint: '079 000 00 00' })));
  const card = page.locator('[data-lessons-over]');
  await card.getByRole('button', { name: T('Prepare invoice') }).click();
  await expect(page.getByLabel(T('Amount|money'))).toHaveValue('35');
  await expect(page.getByLabel(T('What for?'))).toHaveValue(new RegExp(T('Voucher')));
  // the voucher is used up: the sheet shows what is left
  await page.goto('./#/me/offers/customers');
  await page.locator('.cu-row', { hasText: 'Ben Beispiel' }).click();
  await expect(page.locator('[data-voucher]')).toContainText(T('{total} CHF, {left} left', { total: '25', left: '0' }));
});
