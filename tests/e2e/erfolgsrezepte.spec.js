// «Erfolgsrezepte» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5), German UI, phone 390 and desktop 1440,
// fictional data (sn4plus-fixture.js, clock Friday 9 October 2026):
// a) the tour page of a tour with a written Rückblick offers «Als Rezept speichern»; the recipe is saved only on
//    «Rezept speichern», then it stands under Vorlagen, where it can be changed and deleted with Undo;
// b) in Planen of a next bike tour a recipe is put next to the trip and taken away again;
// c) without a recipe Planen shows no card.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/rezepte';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, card = null) => {
  mkdirSync(SHOTS, { recursive: true });
  if (card) await card.evaluate((el) => { el.scrollIntoView({ block: 'center' }); el.style.outline = '3px solid #d9822b'; el.style.outlineOffset = '2px'; });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const key = (k) => `#/tour/${encodeURIComponent(k)}`;
const PLAN = `${P}rez-plan`;
const HERBST = `${P}herbst`;
const REC = [
  { id: 'rc-1', name: 'Jura-Tag', breakfast: 'Porridge, Banane, zwei Kaffee', start: '07:30', food: 'Jede Stunde ein Riegel', pace: '22 km/h auf der Ebene', tripId: `${P}loop`, createdAt: '2026-09-01T10:00:00.000Z' },
  { id: 'rc-2', name: 'Napf-Runde', breakfast: 'Brot mit Honig', start: '08:00', food: '', pace: '', createdAt: '2026-09-15T10:00:00.000Z' },
];

function data(withRecipes) {
  const d = sn4plusData();
  const T0 = d.tables;
  const herbst = T0.trips.find((x) => x.id === HERBST);
  const base = { domain: 'bikepacking', bikeId: herbst.bikeId, bike: herbst.bike, setup: herbst.setup, ready: [], createdAt: `${day(-20)}T08:00:00.000Z` };
  T0.trips.push({ ...base, id: PLAN, title: 'Planung Napf', startDate: day(5), days: 2, entries: herbst.entries.slice(0, 6) });
  if (withRecipes) T0.settings = [...(T0.settings ?? []), { key: 'recipes', value: REC }];
  return d;
}

async function start(page, context, info, withRecipes = false) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/rezepte-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data(withRecipes)));
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

test('a) the tour page keeps a recipe only on «Rezept speichern»; Vorlagen lists, changes and deletes it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${HERBST}`)}`);
  const card = page.locator('[data-tour-recipe]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('A day that worked?'));
  await card.locator('[data-recipe-start]').click();
  await expect(card.locator('[data-recipe-name]')).toHaveValue('Herbsttour Hochland');
  await expect(card.locator('[data-recipe-save]')).toBeDisabled(); // nothing to keep yet
  await card.locator('[data-recipe-part="breakfast"]').fill('Porridge, Banane');
  await card.locator('[data-recipe-part="start"]').fill('7:30');
  await shot(page, info, 'R1-formular', card);
  await card.locator('[data-recipe-save]').click();
  await expect(card.locator('[data-recipe-have]')).toContainText('Herbsttour Hochland');
  await noSideways(page);
  // Vorlagen: the recipe stands there
  await page.goto('./#/pack/templates');
  const list = page.locator('[data-recipes]');
  const row = list.locator('[data-recipe]').first();
  await expect(row).toContainText('Porridge, Banane');
  await expect(row).toContainText('07:30');
  await shot(page, info, 'R2-vorlagen', list);
  await row.locator('[data-recipe-edit]').click();
  await row.locator('[data-recipe-edit-name]').fill('Hochland-Tag');
  await row.locator('[data-recipe-edit-save]').click();
  await expect(list.locator('[data-recipe]').first()).toContainText('Hochland-Tag');
  // delete asks first, and Undo brings it back
  await list.locator('[data-recipe-delete]').first().click();
  await page.getByRole('button', { name: T('Delete'), exact: true }).last().click();
  await expect(list.locator('[data-recipes-empty]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(list.locator('[data-recipe]').first()).toContainText('Hochland-Tag');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) Planen puts a recipe next to the trip and takes it away again', async ({ page, context }, info) => {
  const errors = await start(page, context, info, true);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  await page.locator('[data-tour-page] [data-tour-steps] .stepbar a').first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  const card = page.locator('[data-recipe-pick]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('A recipe that worked'));
  await expect(card.locator('[data-recipe-choose]')).toHaveCount(2);
  await expect(card.locator('[data-recipe-lines]')).toHaveCount(0);
  await card.locator('[data-recipe-choose="rc-1"]').click();
  await expect(card.locator('[data-recipe-choose="rc-1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('[data-recipe-lines]')).toContainText('Porridge, Banane, zwei Kaffee');
  await expect(card.locator('[data-recipe-lines]')).toContainText('22 km/h auf der Ebene');
  await shot(page, info, 'R3-planen', card);
  await card.locator('[data-recipe-choose="rc-1"]').click();
  await expect(card.locator('[data-recipe-lines]')).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) without a recipe Planen shows no card, and Vorlagen says why the list is empty', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  await page.locator('[data-tour-page] [data-tour-steps] .stepbar a').first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  await expect(page.locator('[data-expect]')).toBeVisible();
  await expect(page.locator('[data-recipe-pick]')).toHaveCount(0);
  await page.goto('./#/pack/templates');
  await expect(page.locator('[data-recipes] [data-recipes-empty]')).toContainText(T('No recipe yet. After a tour that went well, open its tour page and tap «Save as a recipe».'));
  await noSideways(page);
  expect(errors).toEqual([]);
});
