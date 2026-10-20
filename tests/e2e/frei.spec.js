// Paket T «Freie Zeit» (Noah 19.10.2026 «alle bauen», «1a und b», «2a», «4a»): Ich › Freie Zeit with its eight
// pages, the tab «Impulse» of Aktiv and the line on Heute when there is no ride idea. German, phone 390 and
// desktop 1440, a fixed clock in Europe/Zurich, fictional data only (a test recipe). SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import DE from '../../src/lib/i18n/de/index.js';
import { PAGES } from '../../src/lib/frei.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-19';

async function open(page, context, hash = './#/me') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
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

test('Ich leads to Freie Zeit; every one of the eight pages opens in German without a wide page', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await viaTab(page, 'week', '#/me/frei'); // UI-Ziele #6: Planen › Freie Zeit
  await expect(page.getByRole('heading', { level: 1, name: T('Free time') })).toBeVisible();
  await expect(page.locator('[data-frei-page]')).toHaveCount(PAGES.length);
  await shot(page, info, 'frei-hub');
  for (const p of PAGES) {
    await page.goto(`./#/me/frei/${p.key}`);
    await expect(page.getByRole('heading', { level: 1, name: T(p.title) })).toBeVisible();
    expect(await noScroll(page), p.key).toBe(true);
    await shot(page, info, `frei-${p.key}`);
  }
  expect(errors).toEqual([]);
});

test('Aktiv › Impulse: the impulse of the day, «Gemacht» and the line on Heute', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow/impulse');
  await expect(page.getByRole('heading', { level: 1, name: T('Impulses') })).toBeVisible();
  await expect(page.locator('[data-impulse]').first()).toBeVisible();
  await page.locator('[data-done]').first().click();
  await expect(page.getByText(/steht jetzt in deinem Logbuch/).first()).toBeVisible();
  await page.goto('./#/');
  await expect(page.locator('[data-impulse-today]')).toBeVisible(); // no bike, so no ride idea
  expect(errors).toEqual([]);
});

test('Worauf hab ich Lust: a choice gives up to three ideas', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/lust');
  await page.locator('[data-choice="play"]').first().click();
  const picks = page.locator('[data-pick]');
  await expect(picks.first()).toBeVisible();
  expect(await picks.count()).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('a recipe: its ingredients go to the shopping list', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/sammlung/recipes');
  await page.locator('[data-new-entry]').click();
  await page.locator('[data-field="title"]').fill('test_data_frei_Pasta');
  await page.locator('[data-field="ingredients"]').fill('Pasta\nTomaten\nBasilikum');
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-entry]')).toContainText('test_data_frei_Pasta');
  await page.locator('[data-to-shopping]').click();
  await expect(page.getByText(T('{n} ingredients are on your shopping list.', { n: 3 })).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Was mir wesentlich ist and Erste Nacht keep what you write', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/wesentlich');
  await page.locator('[data-ess-draft]').fill('test_data_frei_mehr Zeit draussen');
  await page.locator('[data-ess-save]').click();
  await expect(page.locator('[data-ess-list]')).toContainText('test_data_frei_mehr Zeit draussen');
  await page.goto('./#/me/frei/nacht');
  await page.locator('[data-night-question]').fill('test_data_frei_Frage');
  await page.locator('[data-night-question]').blur();
  await page.locator('[data-night-next]').click();
  await expect(page.locator('[data-night-part="plan"]')).toBeVisible();
  await page.reload();
  await ready(page);
  await page.locator('[data-night-step="question"]').click();
  await expect(page.locator('[data-night-question]')).toHaveValue('test_data_frei_Frage');
  expect(errors).toEqual([]);
});
