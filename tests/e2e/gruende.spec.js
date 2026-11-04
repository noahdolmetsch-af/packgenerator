// «Gründe für Planänderungen» (Noah 04.11.2026 «2a», Persönliches Lernen Idee 4), German UI, phone 390 and desktop 1440,
// fictional data (sn4plus-fixture.js, clock Friday 9 October 2026):
// a) a tour marked «Nicht fahren» asks why in Planen: a reason stays marked, the same one again takes it away with
//    Undo, «Jetzt nicht» puts the question away;
// b) the tour page of a tour ridden far from its planned km asks the same; from three answers on a line says what
//    came up most often; a tour as planned shows no card.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/gruende';
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
const PLAN = `${P}grund-plan`;
const HERBST = `${P}herbst`;

function data(withHistory) {
  const d = sn4plusData();
  const T0 = d.tables;
  const herbst = T0.trips.find((x) => x.id === HERBST);
  const base = { domain: 'bikepacking', bikeId: herbst.bikeId, bike: herbst.bike, setup: herbst.setup, ready: [], createdAt: `${day(-20)}T08:00:00.000Z` };
  T0.trips.push({ ...base, id: PLAN, title: 'Planung Napf', startDate: day(5), days: 2, entries: herbst.entries.slice(0, 6), skipped: true });
  // the autumn trip was planned far longer than it was ridden
  T0.trips = T0.trips.map((x) => {
    if (x.id === HERBST) return { ...x, route: { ...(x.route ?? {}), km: 900 } };
    if (withHistory && [`${P}loop`, `${P}see`].includes(x.id)) return { ...x, changeWhy: { kind: 'shorter', reason: 'weather' } };
    return x;
  });
  return d;
}

async function start(page, context, info, withHistory = false) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/gruende-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data(withHistory)));
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

test('a) a tour marked «Nicht fahren» asks why; a reason stays, the same one again takes it away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  await page.locator('[data-tour-page] [data-tour-steps] .stepbar a').first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  const card = page.locator('[data-change-why="skipped"]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Why are you not riding?'));
  await expect(card.locator('[data-why]')).toHaveCount(6);
  await shot(page, info, 'G1-planen-fragt');
  await card.locator('[data-why="weather"]').click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Noted: {reason}', { reason: T('Weather|reason') }));
  await shot(page, info, 'G2-planen-notiert');
  await card.locator('[data-why-change]').click();
  await expect(card.locator('[data-why="weather"]')).toHaveAttribute('aria-pressed', 'true');
  await card.locator('[data-why="weather"]').click();
  await expect(card.locator('[data-why]')).toHaveCount(6);
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Noted: {reason}', { reason: T('Weather|reason') }));
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('a2) «Jetzt nicht» puts the question away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  await page.locator('[data-tour-page] [data-tour-steps] .stepbar a').first().click();
  const card = page.locator('[data-change-why="skipped"]');
  await card.locator('[data-why-later]').click();
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('b) a tour ridden far from its plan asks why; three answers give one calm line', async ({ page, context }, info) => {
  const errors = await start(page, context, info, true);
  await page.goto(`./${key(`t:${HERBST}`)}`);
  const card = page.locator('[data-change-why="shorter"]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Why was it different?'));
  await expect(card.locator('[data-why-pattern]')).toHaveCount(0); // two answers are too few
  await shot(page, info, 'G3-tour-fragt');
  await card.locator('[data-why="weather"]').click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Noted: {reason}', { reason: T('Weather|reason') }));
  await expect(card.locator('[data-why-pattern]')).toBeVisible();
  await shot(page, info, 'G4-tour-muster');
  await noSideways(page);
  // a tour as planned shows no card
  await page.goto(`./${key(`t:${P}loop`)}`);
  await expect(page.locator('[data-tour-page] h1')).toBeVisible();
  await expect(page.locator('[data-change-why="skipped"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
