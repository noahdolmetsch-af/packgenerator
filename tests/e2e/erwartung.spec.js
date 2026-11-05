// «Erwartung und Erlebnis» (Noah 04.11.2026 «1a», Persönliches Lernen Idee 1), German UI, phone 390 and desktop 1440,
// fictional data (sn4plus-fixture.js, clock Friday 9 October 2026):
// a) Planen of a bike tour not yet ridden asks «Wie anstrengend wird es?»: a number stays marked, the same number
//    again takes it away with Undo;
// b) the tour page of a tour with a guess and a ride asks «Wie anstrengend war es wirklich?», and after the answer
//    puts «Geschätzt» and «Erlebt» side by side with one calm sentence; no guess, no card.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/erwartung';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, fullPage = false) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const key = (k) => `#/tour/${encodeURIComponent(k)}`;
const PLAN = `${P}erw-plan`;
const HERBST = `${P}herbst`;

function data() {
  const d = sn4plusData();
  const T0 = d.tables;
  const herbst = T0.trips.find((x) => x.id === HERBST);
  const base = { domain: 'bikepacking', bikeId: herbst.bikeId, bike: herbst.bike, setup: herbst.setup, ready: [], createdAt: `${day(-20)}T08:00:00.000Z` };
  T0.trips.push({ ...base, id: PLAN, title: 'Planung Napf', startDate: day(5), days: 2, entries: herbst.entries.slice(0, 6) });
  // the autumn trip was guessed at 5 before the ride; its rides carry no answer yet
  T0.trips = T0.trips.map((x) => (x.id === HERBST ? { ...x, expectEffort: 5 } : x));
  T0.activities = (T0.activities ?? []).map((a) => ({ ...a, feel: null, rpe: null, feelSkip: false }));
  return d;
}

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/erwartung-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  return errors;
}
const tour = (page) => page.locator('[data-tour-page]');

test('a) Planen asks «Wie anstrengend wird es?»; a number stays, the same number again takes it away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  await tour(page).locator('[data-tour-steps] .stepbar a').first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  const card = page.locator('[data-expect]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('How hard will it be?'));
  await expect(card.locator('[data-expect-n]')).toHaveCount(10);
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(0);
  await shot(page, info, 'E1-planen-leer');
  await card.locator('[data-expect-n="6"]').click();
  await expect(card.locator('[data-expect-n="6"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toContainText(T('{n} of 10: {word}', { n: 6, word: T('medium') }));
  await shot(page, info, 'E2-planen-6');
  // another number replaces it
  await card.locator('[data-expect-n="7"]').click();
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(card.locator('[data-expect-n="7"]')).toHaveAttribute('aria-pressed', 'true');
  // the same number again: the guess is gone, Undo brings it back
  await card.locator('[data-expect-n="7"]').click();
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(card.locator('[data-expect-n="7"]')).toHaveAttribute('aria-pressed', 'true');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) the tour page asks how it was, then puts guess and felt side by side; no guess, no card', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${HERBST}`)}`);
  const card = tour(page).locator('[data-tour-expect]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('How hard was it really?'));
  await expect(card).toContainText(T('You guessed {n} of 10. Say how it felt, and the page puts the two side by side.', { n: 5 }));
  await shot(page, info, 'E3-tour-fragt');
  await card.locator('[data-feel="8"]').first().click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('{n} points harder than you guessed.', { n: 3 }));
  await expect(card).toContainText(T('Guessed'));
  await expect(card).toContainText(T('Felt'));
  await expect(card.locator('[data-expect-next]')).toHaveCount(0); // the debrief of this tour is written already
  await card.locator('[data-expect-change]').click();
  await card.locator('[data-feel="5"]').first().click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('About as hard as you guessed.'));
  await card.locator('[data-feel="8"]').first().click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('{n} points harder than you guessed.', { n: 3 }));
  await expect(card.locator('[data-expect-habit]')).toHaveCount(0); // one tour is too few
  await shot(page, info, 'E4-tour-vergleich');
  await noSideways(page);
  // a tour without a guess shows no card
  await page.goto(`./${key(`t:${P}loop`)}`);
  await expect(tour(page).locator('h1')).toBeVisible();
  await expect(tour(page).locator('[data-tour-expect]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
