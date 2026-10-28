// «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a»): Planen › Alltag › Kochen. The list by meal, a recipe with
// portions, its ingredients on the shopping list, all steps, hide and show again. German, phone 390 and
// desktop 1440, fixed clock in Europe/Zurich, fictional data only. SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { RECIPES, STD_GROUPS } from '../../src/lib/kochen/rezepte.js';
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

test('Groups: filter by a group, put a recipe in, rename, delete with Undo choice, own group', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag/kochen');
  const grill = STD_GROUPS.find((g) => g.key === 'grill');
  await expect(page.locator('[data-ko-group-chips] [data-ko-filter]')).toHaveCount(STD_GROUPS.length);
  await page.locator('[data-ko-filter="g:grill"]').click();
  await expect(page.locator('[data-ko-recipe]')).toHaveCount(grill.ids.length);
  await shot(page, info, 'kochen-gruppe');

  // a recipe goes into the group Grill from its page
  await page.goto('./#/me/alltag/kochen/pasta-pesto');
  const chip = page.locator('[data-ko-in-group="grill"]');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/me/alltag/kochen');
  await page.locator('[data-ko-filter="g:grill"]').click();
  await expect(page.locator('[data-ko-recipe]')).toHaveCount(grill.ids.length + 1);

  // rename, add own, delete
  await page.locator('[data-ko-groups] summary').click();
  await page.locator('[data-ko-grp="grill"] [data-ko-grp-rename]').click();
  await page.getByRole('dialog').locator('input').fill('Test BBQ');
  await page.getByRole('dialog').getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('[data-ko-filter="g:grill"]')).toHaveText('Test BBQ');
  await page.locator('[data-ko-grp-new]').fill('Test guests');
  await page.locator('[data-ko-groups] form button[type="submit"]').click();
  await expect(page.locator('[data-ko-group-chips] [data-ko-filter]')).toHaveCount(STD_GROUPS.length + 1);
  await page.locator('[data-ko-grp="grill"] [data-ko-grp-delete]').click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(page.locator('[data-ko-filter="g:grill"]')).toHaveCount(0);
  await expect(page.locator('[data-ko-recipe]')).toHaveCount(RECIPES.length); // back to «All», nothing lost
  await page.locator('[data-ko-grp-reset]').click();
  await expect(page.locator('[data-ko-group-chips] [data-ko-filter]')).toHaveCount(STD_GROUPS.length);
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Cooking mode: one step per screen, a timer that keeps running and rings, all steps, done', async ({ page, context }, info) => {
  const salad = RECIPES.find((r) => r.id === 'pasta-salad');
  const n = salad.steps.length;
  const errors = await open(page, context, `./#/me/alltag/kochen/${salad.id}`);
  await expect(page.locator('[data-ko-cook-start]')).toBeVisible();
  await shot(page, info, 'kochmodus-start');
  await page.locator('[data-ko-cook-start]').click();
  await expect(page.locator('[data-ko-cook-step="1"]')).toContainText(T('Step {n} of {m}', { n: 1, m: n }));
  await expect(page.locator('[data-ko-cook-step="1"]')).toContainText(T(salad.steps[0].text));
  await expect(page.locator('[data-ko-timer-left]')).toHaveText(`${salad.steps[0].min}:00`);
  await page.locator('[data-ko-timer-start]').click();
  await page.clock.fastForward('00:30');
  await expect(page.locator('[data-ko-timer-left]')).not.toHaveText(`${salad.steps[0].min}:00`);
  await shot(page, info, 'kochmodus');
  expect(await noScroll(page)).toBe(true);
  await page.locator('[data-ko-cook-next]').click();
  await expect(page.locator('[data-ko-cook-step="2"]')).toBeVisible();
  await expect(page.locator('[data-ko-cook-running="1"]')).toBeVisible();
  // the phone's back key goes one step back
  await page.goBack();
  await expect(page.locator('[data-ko-cook-step="1"]')).toBeVisible();
  await page.locator('[data-ko-cook-next]').click();
  await page.clock.fastForward(`${salad.steps[0].min}:00`);
  await expect(page.locator('[data-ko-cook-rung="1"]')).toContainText(T('The timer of step {n} is done.', { n: 1 }));

  await page.locator('[data-ko-cook-all]').click();
  await expect(page.locator('[data-ko-cook-jump]')).toHaveCount(n);
  await shot(page, info, 'kochmodus-alle');
  await page.locator(`[data-ko-cook-jump="${n}"]`).click();
  await expect(page.locator(`[data-ko-cook-step="${n}"]`)).toContainText(T('Step {n} of {m}', { n, m: n }));
  await page.locator('[data-ko-cook-done]').click();
  await expect(page.getByText(T('Enjoy your meal!'))).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: T(salad.title) })).toBeVisible();
  expect(errors).toEqual([]);
});
