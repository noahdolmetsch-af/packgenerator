// «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): on the pages of Lust the card «What you can do
// here» lists the functions of the page with what they are for; «How it works» opens steps and example; × folds it to one line
// that stays folded after a reload. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Dreams shows what you can do here, opens how it works and folds to one line', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/trips/dreams');
  const card = page.locator('[data-seiteninhalt]');
  await expect(card).toContainText(T('What you can do here'));
  const first = card.locator('[data-seiteninhalt-item]').first();
  await expect(first.locator('.si-what')).not.toBeEmpty();
  // PR 12: each function brings «Good to know»
  await expect(first.locator('[data-seiteninhalt-know]')).toContainText(T('Good to know'));
  await tap(first.getByRole('button', { name: T('How it works') }), info);
  await expect(card.locator('[data-seiteninhalt-how]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await tap(card.locator('[data-seiteninhalt-fold]'), info);
  await expect(page.locator('[data-seiteninhalt-line]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-seiteninhalt-line]')).toBeVisible();
  await expect(page.locator('[data-seiteninhalt]')).toHaveCount(0);
  // never on Today
  await page.goto('./#/');
  await expect(page.locator('[data-seiteninhalt], [data-seiteninhalt-line]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Free time What am I up for shows good to know in the card', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/me/frei/lust');
  const know = page.locator('[data-seiteninhalt-know="f.freilust"]');
  await expect(know).toContainText(T('Good to know'));
  expect((await know.innerText()).length).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  expect(errors).toEqual([]);
});

test('Debriefs and logbook show what you can do here with good to know (area Zurueck)', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/debrief');
  await expect(page.locator('[data-seiteninhalt]')).toContainText(T('What you can do here'));
  await expect(page.locator('[data-seiteninhalt-know]').first()).toContainText(T('Good to know'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.goto('./#/debrief/logbook');
  await expect(page.locator('[data-seiteninhalt-know="f.logbook"]')).toContainText(T('Good to know'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  expect(errors).toEqual([]);
});
test('Customise this page does not list the card as a page part', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/trips/dreams');
  await expect(page.locator('[data-seiteninhalt]')).toBeVisible();
  await tap(page.locator('[data-anp-open]'), info);
  const rows = page.locator('dialog[data-anp-sheet] li[data-anp-row]');
  await expect(rows.first()).toBeVisible();
  await expect(rows.filter({ hasText: T('What you can do here') })).toHaveCount(0);
  await tap(page.locator('dialog[data-anp-sheet]').getByRole('button', { name: T('Close') }), info);
  expect(errors).toEqual([]);
});

// PR 15, area Unterwegs: On the way during a trip shows the card with good to know
test('On the way shows good to know in the card during a trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  d.tables.trips = [trip('Jura-Wochenende', day(-1), { days: 3 }), ...d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title))];
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), 'test_data_gtp_Jura-Wochenende');
  await openHome(page, context, info, { data: d });
  await page.goto('./#/ride');
  // on the way the card starts as one line, so the helpers and the emergency button stay on top; a tap opens it
  const line = page.locator('[data-seiteninhalt-line]');
  await expect(line).toContainText(T('What you can do here'));
  await (info.project.name === 'phone' ? line.tap() : line.click());
  const card = page.locator('[data-seiteninhalt]');
  await expect(card).toContainText(T('What you can do here'));
  await expect(card.locator('[data-seiteninhalt-know]').first()).toContainText(T('Good to know'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.goto('./#/ride/abfahrt');
  await expect(page.locator('[data-seiteninhalt-know="f.departsheet"]')).toContainText(T('Good to know'));
  expect(errors).toEqual([]);
});

// PR 17, area Alltag: the card on Documents and Reminders, with good to know
test('Alltag pages Documents and Reminders show the card with good to know', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  for (const [hash, id] of [['./#/me/docs', 'f.docs'], ['./#/me/reminders', 'f.birthdays']]) {
    await page.goto(hash);
    const card = page.locator('[data-seiteninhalt]');
    await expect(card).toContainText(T('What you can do here'));
    await expect(card.locator('[data-seiteninhalt-item]').first()).toBeVisible();
    // more than 4 functions: «Show all n» opens the rest
    if (await card.locator('.si-all').count()) await tap(card.locator('.si-all'), info);
    await expect(page.locator(`[data-seiteninhalt-know="${id}"]`)).toContainText(T('Good to know'));

// PR 16: the card on Pack, with good to know; it starts as one line so the packing list keeps its space (a tap opens it)
test('Pack shows what you can do here with good to know, starting as one line', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/pack');
  const line = page.locator('[data-seiteninhalt-line]');
  await expect(line).toContainText(T('What you can do here'));
  await (info.project.name === 'phone' ? line.tap() : line.click());
  const card = page.locator('[data-seiteninhalt]');
  await expect(card).toContainText(T('What you can do here'));
  await expect(card.locator('[data-seiteninhalt-know]').first()).toContainText(T('Good to know'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.goto('./#/pack/templates');
  await expect(page.locator('[data-seiteninhalt-know="templates"]')).toContainText(T('Good to know'));
  expect(errors).toEqual([]);
});

test('Planen Notes and Week show the card with good to know', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  for (const hash of ['#/notes', '#/week', '#/inbox']) {
    await page.goto(`./${hash}`);
    const card = page.locator('[data-seiteninhalt]');
    await expect(card).toContainText(T('What you can do here'));
    await expect(card.locator('[data-seiteninhalt-know]').first()).toContainText(T('Good to know'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
  expect(errors).toEqual([]);
});
