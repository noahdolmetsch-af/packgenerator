// HG1 «Begrüssung auf Heute» (approved 14.10.2026; answers 1a 2b 3 4b and 1a 2a): the Swiss greeting is
// the first thing on Today (also the evening before a trip, the Vorabend line right under it), the night
// text, the name asked once («Nicht jetzt»), the name in Ich › Darstellung, and the sheet behind the
// greeting whose answer lands in the one history of «Deine Abfragen». Fictional data only (the name
// «Lena»); the clock stands on Friday 9 October 2026. The greeting words come from the app source.
// (test titles stay plain ASCII: the upload of the fixture fails from an output folder with «» in its name)
import { test, expect } from './clock.js';
import { homeFixture, openHome } from './home0460-fixture.js';
import { greetFor, helloTitle, HELLO_NIGHT, HELLO_TAP, HELLO_MOOD, HELLO_PLAN } from '../../src/lib/home/hallo.js';

const NAME = 'Lena';
const withName = () => {
  const data = homeFixture();
  data.tables.settings.push({ key: 'userName', value: NAME });
  return data;
};

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
// the first section of Today in the order of the page
const firstSection = (page) => page.locator('div.home [data-section]').first();

test('HG1a: the greeting first on Today, with the name; the greeting itself opens the two questions', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: withName(), hour: 9 });
  const hello = page.locator('#hello-h');
  await expect(hello).toHaveText(greetFor(9, NAME));
  await expect(firstSection(page)).toHaveAttribute('data-section', 'greeting');
  // UI-Ziele #15 (Noah 20.10.2026 «freigabe», changed on purpose): no «antippen» line, the greeting is the button
  await expect(page.locator('[data-hello-tap]')).toHaveText(greetFor(9, NAME));
  await expect(page.locator('#hello-h [data-hello-tap]')).toHaveAttribute('aria-description', HELLO_TAP);
  await expect(page.locator('[data-name-ask]')).toHaveCount(0); // a name is there: nothing asked
  await noSideways(page);
  await shot(page, info, 'hg1a-heute');
  expect(errors).toEqual([]);
});

test('HG1 2a: the evening before a trip the greeting stays on top, the Vorabend line right under it', async ({ page, context }, info) => {
  // the fixture's next trip starts tomorrow; 19:00 is the evening before
  const T = await openHome(page, context, info, { data: withName(), hour: 19 });
  const hello = page.locator('#hello-h');
  await expect(hello).toHaveText(greetFor(19, NAME));
  const eve = page.locator('[data-row="eve"]');
  await expect(eve).toContainText(T('Tomorrow it starts: {trip}', { trip: 'test_data_gtp_ Herbstrunde' }));
  await expect(firstSection(page)).toHaveAttribute('data-section', 'greeting');
  const order = await page.locator('div.home [data-section]').evaluateAll((els) => els.map((e) => e.dataset.section));
  expect(order.indexOf('greeting')).toBe(0);
  expect(order.indexOf('continue')).toBe(1);
  expect((await hello.boundingBox()).y).toBeLessThan((await eve.boundingBox()).y);
  await shot(page, info, 'hg1-vorabend');
});

test('HG1e: at night only the night text, no name, no tap line, no name question', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), hour: 23 });
  await expect(page.locator('#hello-h')).toHaveText(HELLO_NIGHT);
  await expect(page.locator('[data-hello-tap]')).toHaveCount(0);
  await expect(page.locator('[data-name-ask]')).toHaveCount(0);
  await shot(page, info, 'hg1e-nacht');
});

test('HG1b: without a name the greeting has none; the name is asked once, Not now keeps it away', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: homeFixture(), hour: 14 });
  await expect(page.locator('#hello-h')).toHaveText(greetFor(14, ''));
  const ask = page.locator('[data-name-ask]');
  await expect(ask).toBeVisible();
  await expect(ask.getByLabel(T('What may we call you?'))).toHaveAttribute('placeholder', T('First name'));
  await noSideways(page);
  await shot(page, info, 'hg1b-name-fragen');
  // no sideways scroll on a small phone either (320 px), the question row included
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 320, height: vp.height });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.setViewportSize(vp);
  await ask.getByRole('button', { name: T('Not now|hello') }).click();
  await expect(ask).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#hello-h')).toHaveText(greetFor(14, ''));
  await expect(page.locator('[data-hello-tap]')).toBeVisible();
  await expect(page.locator('[data-name-ask]')).toHaveCount(0);
});

test('HG1b, HG1c: the name saved on Today, then changed in Ich › Darstellung (the first section)', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: homeFixture(), hour: 9 });
  const ask = page.locator('[data-name-ask]');
  await ask.getByLabel(T('What may we call you?')).fill(NAME);
  await ask.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('#hello-h')).toHaveText(greetFor(9, NAME));
  await expect(ask).toHaveCount(0);

  await page.goto('./#/me/look');
  const sec = page.locator('[data-look-name]');
  await expect(page.locator('.look .sets > section').first()).toHaveAttribute('data-look-name', '');
  await expect(sec.getByRole('heading', { level: 2 })).toHaveText(T('Your name'));
  const field = sec.getByRole('textbox', { name: T('Your name') });
  await expect(field).toHaveValue(NAME);
  await expect(sec).toContainText(T('On Today: «{text}»', { text: greetFor(9, NAME) }));
  await field.fill('Mira');
  await expect(sec).toContainText(T('On Today: «{text}»', { text: greetFor(9, 'Mira') }));
  await sec.getByRole('button', { name: T('Save') }).click();
  await expect(sec.getByRole('status')).toHaveText(T('Saved|name'));
  await noSideways(page);
  await shot(page, info, 'hg1c-name-aendern');
  await page.goto('./#/');
  await expect(page.locator('#hello-h')).toHaveText(greetFor(9, 'Mira'));
  // empty: the greeting without a name (and the question does not come back: it was asked)
  await page.goto('./#/me/look');
  await expect(page.locator('[data-look-name]').getByRole('textbox')).toHaveValue('Mira'); // the stored name has loaded
  await page.locator('[data-look-name]').getByRole('textbox').fill('');
  await page.locator('[data-look-name]').getByRole('button', { name: T('Save') }).click();
  await page.goto('./#/');
  await expect(page.locator('#hello-h')).toHaveText(greetFor(9, ''));
  await expect(page.locator('[data-name-ask]')).toHaveCount(0);
});

test('HG1d (2b): the tap opens the two questions; the answer lands in the history of Deine Abfragen', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: withName(), hour: 9 });
  const phone = info.project.name === 'phone';

  // «Nicht jetzt» closes it and saves nothing
  await page.locator('[data-hello-tap]').click();
  const sheet = page.locator('dialog[data-hello-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: T('Not now|hello') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-hello-saved]')).toHaveCount(0);

  await page.locator('[data-hello-tap]').click();
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText(helloTitle(NAME));
  const moods = sheet.getByRole('group', { name: HELLO_MOOD });
  await expect(moods.getByRole('button')).toHaveCount(5);
  // one neutral colour for all five (observation only)
  const colours = await moods.getByRole('button').evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).color + getComputedStyle(e).borderColor))]);
  expect(colours).toHaveLength(1);
  await moods.getByRole('button', { name: 'Guet' }).click();
  await expect(moods.getByRole('button', { name: 'Guet' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('textbox', { name: HELLO_PLAN }).fill('Kurze Runde, dann ins Büro');
  const plans = sheet.getByRole('group', { name: HELLO_PLAN });
  await plans.getByRole('button', { name: 'Training' }).click();
  await plans.getByRole('button', { name: 'Arbeit' }).click();
  // a sheet from below on a phone, a window in the middle on a computer
  const box = await sheet.boundingBox();
  const vp = page.viewportSize();
  if (phone) expect(Math.abs(box.y + box.height - vp.height)).toBeLessThan(2);
  else expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThan(2);
  await shot(page, info, 'hg1d-antippen');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-hello-saved]')).toHaveText(T('Saved in the history of «Your questions».'));

  // the one history (Ich › Daten › Verlauf)
  await page.goto('./#/me/history');
  await expect(page.locator('[data-row="hallo.gaht"]')).toContainText(HELLO_MOOD);
  await expect(page.locator('[data-row="hallo.gaht"]')).toContainText('Guet');
  const vor = page.locator('[data-row="hallo.vor"]');
  await expect(vor).toContainText(HELLO_PLAN);
  await expect(vor).toContainText('Training · Arbeit');
  await expect(vor).toContainText('Kurze Runde, dann ins Büro');
  await shot(page, info, 'hg1d-verlauf');
  expect(errors).toEqual([]);
});

test('HG1f: the greeting by time of day (Morge, Tag, Abig)', async ({ page, context }, info) => {
  for (const hour of [8, 14, 20]) {
    await openHome(page, context, info, { data: withName(), hour });
    await expect(page.locator('#hello-h')).toHaveText(greetFor(hour, NAME));
    await shot(page, info, `hg1f-${hour}`);
  }
});
