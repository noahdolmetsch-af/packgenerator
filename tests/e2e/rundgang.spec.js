// «Rundgang» and «Einstieg» (Noah 15.10.2026, Rundgang «1a … 5a», Einstieg «1a 2a 3a 4a»): the line in First
// steps starts the tour, with own data or the example trip; Next through six places to the end card; the
// Einstieg on top of Active with × and «show again» in the Handbook; the small tour of a place.
// Empty app plus the playground's made-up trip only, German UI, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TOURS, stepCount } from '../../src/lib/tour.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Tour of the app with own data: six steps, the end card, then gone', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const line = page.locator('[data-tourline]');
  await expect(line).toContainText(T('New here? Take the tour'));
  await line.getByRole('button', { name: T('Start ›|tour') }).click();
  const ask = page.getByRole('dialog', { name: T('Tour of the app') });
  await expect(ask).toContainText(T('{n} short steps, about 2 minutes', { n: 6 }));
  await ask.locator('[data-choice="own"]').click();
  const card = page.getByRole('dialog', { name: T(TOURS.app[0].title) });
  await expect(card).toContainText(T('Step {n} of {of}', { n: 1, of: stepCount('app') }));
  for (let i = 1; i < TOURS.app.length; i++) {
    await page.locator('.tcard .btn.hi').click();
    await expect(page.locator('.tour')).toHaveAttribute('data-step', String(i));
    await expect(page.locator('#tour-h')).toHaveText(T(TOURS.app[i].title));
  }
  await expect(page).toHaveURL(/#\/$/);
  await page.getByRole('button', { name: T('Close|tour') }).click();
  await expect(page.locator('.tour')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.tour')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Tour with the example trip runs in the playground; Esc ends it', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-tourline]').getByRole('button', { name: T('Start ›|tour') }).click();
  const started = page.waitForEvent('load');
  await page.getByRole('dialog', { name: T('Tour of the app') }).locator('[data-choice="play"]').click();
  await started;
  await expect(page.getByRole('region', { name: 'Demo' })).toBeVisible();
  await expect(page.locator('.tour')).toHaveAttribute('data-step', '0');
  await expect(page.locator('.lit')).toBeVisible(); // the next trip of the playground is lit
  await page.locator('.tcard .btn.hi').click();
  await expect(page).toHaveURL(/#\/trips/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour')).toHaveCount(0);
});

test('Einstieg on top of Active: tip and source, × brings the tip line back, the Handbook brings it back', async ({ page }) => {
  await page.goto('./#/flow');
  const intro = page.locator('[data-intro="aktiv"]');
  await expect(intro).toContainText(T('Movement, rest and recovery in everyday life'));
  await expect(intro).toContainText(T('What to expect:'));
  await expect(intro.locator('[data-fact]')).toContainText(T('Source: {source}', { source: '' }).trim());
  await expect(intro.locator('[data-offer]')).toBeVisible(); // first visit: the small tour is offered
  await intro.getByRole('button', { name: T('No thanks') }).click();
  await expect(intro.locator('[data-offer]')).toHaveCount(0);
  await intro.getByRole('button', { name: T('Hide the introduction') }).click();
  await expect(page.locator('[data-intro="aktiv"]')).toHaveCount(0);
  await expect(page.locator('.tipl')).toBeVisible();
  await page.goto('./#/me/handbook');
  await page.getByRole('button', { name: T('Show the introductions on top of the places again ({n})', { n: 1 }) }).click();
  await page.goto('./#/flow');
  await expect(page.locator('[data-intro="aktiv"]')).toBeVisible();
});

test('The small tour of Trips from the Einstieg', async ({ page }) => {
  await page.goto('./#/trips');
  // Trips starts as one line («Neue Tour» stays in reach, FE1); a tap opens it, the tour is offered
  await page.locator('[data-intro="touren"][data-open="false"]').click();
  const intro = page.locator('[data-intro="touren"][data-open="true"]');
  await intro.locator('[data-offer]').getByRole('button', { name: T('Start ›|tour') }).click();
  await expect(page.locator('.tour')).toHaveAttribute('data-tour', 'touren');
  await expect(page.locator('#tour-h')).toHaveText(T(TOURS.touren[0].title));
  for (let i = 1; i < TOURS.touren.length; i++) await page.locator('.tcard .btn.hi').click();
  await expect(page.locator('.tcard .btn.hi')).toHaveText(T('Done ›|tour'));
  await page.locator('.tcard .btn.hi').click();
  await expect(page.locator('.tour')).toHaveCount(0);
  // the offer comes once
  await page.goto('./#/flow');
  await page.goto('./#/trips');
  await expect(page.locator('[data-intro="touren"] [data-offer]')).toHaveCount(0);
});

// Noah «4a»: Bikes and the pages below the places get the same Einstieg; Bikes has its small tour.
test('The small tour of Bikes, and the Einstieg on the pages below the places', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/bikes');
  const intro = page.locator('[data-intro="velos"]');
  await expect(intro).toContainText(T('Every bike with its bags, km and care'));
  await intro.locator('[data-offer]').getByRole('button', { name: T('Start ›|tour') }).click();
  await expect(page.locator('.tour')).toHaveAttribute('data-tour', 'velos');
  for (let i = 1; i < TOURS.velos.length; i++) {
    await page.locator('.tcard .btn.hi').click();
    await expect(page.locator('#tour-h')).toHaveText(T(TOURS.velos[i].title));
  }
  await page.locator('.tcard .btn.hi').click();
  await expect(page.locator('.tour')).toHaveCount(0);
  // a page below a place: «This is …», no tour of its own, a «Did you know» with its source
  for (const [hash, place, title] of [
    ['#/flow/goals', 'goals', 'Goals that fit your week'],
    ['#/flow/rest', 'rest', 'The pause has its place too'],
    ['#/pack/templates', 'templates', 'The next trip starts packed'],
    ['#/debrief', 'debrief', 'What the last trips taught you'],
    ['#/wardrobe', 'wardrobe', 'Clothes by temperature, layer by layer'],
    ['#/bikes?tab=shop', 'workshop', 'What waits for the bike shop, and every visit'],
  ]) {
    await page.goto(`./${hash}`);
    const box = page.locator(`[data-intro="${place}"]`);
    await expect(box, place).toContainText(T(title));
    await expect(box.locator('.kick'), place).toHaveText(new RegExp(`^${T('This is {place}', { place: '' })}`));
    await expect(box.locator('[data-offer]'), place).toHaveCount(0);
    await expect(box.locator('[data-fact]'), place).toContainText(T('Source: {source}', { source: '' }).trim());
  }
  // Care and the wishlist start as one line (what is due / the list first); a tap opens them
  for (const [hash, place, title] of [
    ['#/bikes?tab=care', 'pflege', 'Keep every bike ready to ride'],
    ['#/gear?view=wish', 'einkauf', 'Your wish list, with prices'],
  ]) {
    await page.goto(`./${hash}`);
    await page.locator(`[data-intro="${place}"][data-open="false"]`).click();
    await expect(page.locator(`[data-intro="${place}"][data-open="true"]`), place).toContainText(T(title));
  }
  // Meditation stays a short page: folded, only a round «i» in the head; a tap opens the Einstieg
  await page.goto('./#/flow/act/meditation');
  await page.locator('.ai-mini[data-intro="meditation"]').click();
  await expect(page.locator('[data-intro="meditation"][data-open="true"]')).toContainText(T('Sit, breathe, come back'));
  expect(errors).toEqual([]);
});
