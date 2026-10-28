// «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): Planen › Alltag › Kochen. The list by meal, a recipe with
// portions, its ingredients on the shopping list, all steps, hide and show again. German, phone 390 and
// desktop 1440, fixed clock in Europe/Zurich, fictional data only. SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { RECIPES } from '../../src/lib/kochen/rezepte.js';
import { shoppingLines } from '../../src/lib/kochen/kochen.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-28';
const oats = RECIPES.find((r) => r.id === 'overnight-oats');

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+01:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Alltag shows Cooking; the list filters by meal', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag');
  await page.locator('[data-alltag-page="kochen"]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Cooking') })).toBeVisible();
  await expect(page.locator('[data-ko-recipe]')).toHaveCount(RECIPES.length);
  await shot(page, info, 'kochen-liste');
  await page.locator('[data-ko-filter="breakfast"]').click();
  await expect(page.locator('[data-ko-recipe]')).toHaveCount(RECIPES.filter((r) => r.meals.includes('breakfast')).length);
  await page.locator('[data-ko-filter="own"]').click();
  await expect(page.locator('[data-ko-empty]')).toBeVisible();
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('A recipe: two portions on the shopping list, all steps, hide and show again', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag/kochen');
  await page.locator(`[data-ko-recipe="${oats.id}"]`).click();
  await expect(page.getByRole('heading', { level: 1, name: T(oats.title) })).toBeVisible();
  await expect(page.locator('[data-ko-step]')).toHaveCount(oats.steps.length);
  await page.locator('[data-ko-more]').click();
  await expect(page.locator('[data-ko-portions]')).toHaveText(T('{n} portions', { n: 2 }));
  await shot(page, info, 'kochen-rezept');
  expect(await noScroll(page)).toBe(true);
  await page.locator('[data-ko-shop]').click();
  await expect(page.getByText(T('{n} ingredients are on your shopping list.', { n: oats.ingredients.length }))).toBeVisible();
  await page.goto('./#/me/alltag/einkauf');
  for (const line of shoppingLines(oats, 2, (s) => T(s))) await expect(page.locator(`[data-shop-item="${line}"]`)).toBeVisible();

  await page.goto(`./#/me/alltag/kochen/${oats.id}`);
  await page.locator('[data-ko-hide]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Cooking') })).toBeVisible();
  await expect(page.locator(`[data-ko-recipe="${oats.id}"]`)).toHaveCount(0);
  await page.locator('[data-ko-hidden] summary').click();
  await page.locator(`[data-ko-unhide="${oats.id}"]`).click();
  await expect(page.locator(`[data-ko-recipe="${oats.id}"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});
