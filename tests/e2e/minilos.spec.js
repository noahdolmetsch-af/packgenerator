// Mini-Tools «Fair auslosen» (Noah 28.10.2026, idea 9): who cooks, drawn fairly on this device. Three people,
// three draws: each comes once before anyone twice; one stays away; a person is removed and comes back with Undo;
// tents in groups of two. Fictional data only.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};
const NAMES = ['test_data_gtp_ Aline', 'test_data_gtp_ Beni', 'test_data_gtp_ Cleo'];

async function addPeople(page, info, names) {
  for (const n of names) {
    await page.locator('[data-los-name]').fill(n);
    await tap(page.locator('[data-los-add]'), info);
    await expect(page.locator(`[data-los-person="${n}"]`)).toBeVisible();
  }
}

test('Fair draw: who cooks comes round fairly, one stays away, remove has Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="los"]'), info);
  await expect(page.locator('[data-los]')).toBeVisible();
  await expect(page.locator('[data-los-empty]')).toBeVisible();
  await tap(page.locator('[data-los-start="one"]'), info);
  await expect(page.locator('[data-los-draw]')).toBeVisible();
  await expect(page.locator('h1')).toHaveText(T('Who cooks?'));

  await addPeople(page, info, NAMES);
  await noSideways(page, 'draw with people');

  const seen = [];
  for (let i = 0; i < 3; i++) {
    await tap(page.locator('[data-los-go]'), info);
    await expect(page.locator('[data-los-history] li')).toHaveCount(i + 1);
    seen.push((await page.locator('[data-los-result] .lo-big').textContent()).trim());
  }
  expect(new Set(seen).size, seen.join(', ')).toBe(3);
  await expect(page.locator('[data-los-go]')).toHaveText(T('Draw again'));

  // Cleo is not there: the next two draws never pick her
  await page.locator(`[data-los-person="${NAMES[2]}"] input[type=checkbox]`).uncheck();
  for (let i = 0; i < 2; i++) {
    await tap(page.locator('[data-los-go]'), info);
    await expect(page.locator('[data-los-history] li')).toHaveCount(4 + i);
    await expect(page.locator('[data-los-result] .lo-big')).not.toHaveText(NAMES[2]);
  }

  // remove Beni, then Undo
  await tap(page.locator(`[data-los-person="${NAMES[1]}"] [data-los-remove]`), info);
  await tap(page.getByRole('button', { name: T('Remove'), exact: true }), info);
  await expect(page.locator(`[data-los-person="${NAMES[1]}"]`)).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(page.locator(`[data-los-person="${NAMES[1]}"]`)).toBeVisible();

  // the list shows it; it survives a reload
  await page.goto('./#/me/mini/los');
  await expect(page.locator('[data-los-item]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-los-item]')).toHaveCount(1);
});

test('Fair draw: tents in groups of two, a new draw takes the people of the last', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/me/mini/los');
  await tap(page.locator('[data-los-start="one"]'), info);
  await addPeople(page, info, [...NAMES, 'test_data_gtp_ Dario']);

  await page.goto('./#/me/mini/los');
  await tap(page.locator('[data-los-start="groups"]'), info);
  await expect(page.locator('h1')).toHaveText(T('Who sleeps in which tent?'));
  await expect(page.locator('[data-los-people] li')).toHaveCount(4);
  await expect(page.locator('[data-los-size]')).toHaveText('2');
  await tap(page.locator('[data-los-go]'), info);
  await expect(page.locator('[data-los-result] .lo-groups li')).toHaveCount(2);
  await noSideways(page, 'groups');

  // rename the draw
  await tap(page.locator('[data-los-rename]'), info);
  const field = page.locator('dialog[open] input');
  await field.fill('test_data_gtp_ Zelte Jura');
  await field.press('Enter');
  await expect(page.locator('h1')).toHaveText('test_data_gtp_ Zelte Jura');
  await page.goto('./#/me/mini/los');
  await expect(page.locator('[data-los-item]')).toHaveCount(2);
});
