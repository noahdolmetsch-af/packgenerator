// «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): a search field behind the title of Ich, Touren and Auswerten.
// Fictional data (home0460 fixture), German, phone and computer.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('Ich: the field finds a setting and leads to it; search everywhere is there', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/me');
  const field = page.locator('[data-suche-hier="me"] input');
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute('placeholder', T('Find a setting'));
  // behind the title, not above it
  const y = async (sel) => (await page.locator(sel).first().boundingBox()).y;
  expect(await y('h1')).toBeLessThan(await y('[data-suche-hier="me"]'));
  await field.fill('backup');
  const rows = page.locator('[data-suche-row]');
  await expect(rows.first()).toBeVisible();
  await expect(page.locator('[data-suche-ueberall]')).toContainText(T('Search everywhere for «{q}»', { q: 'backup' }));
  await shot(page, info, 'suche-ort-ich');
  await rows.first().click();
  await expect(page).not.toHaveURL(/#\/me$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Touren: four filter buttons with the sum; Auswerten has its field too', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  await expect(page.locator('[data-suche-hier="trips"] input')).toHaveAttribute('placeholder', T('Find a trip or ride'));
  await expect(page.locator('[data-suche-filter]')).toHaveCount(4);
  await page.locator('[data-suche-filter="dist"]').click();
  await page.locator('[data-suche-choice="long"]').click();
  await expect(page.locator('[data-suche-sum]')).toBeVisible();
  await shot(page, info, 'suche-ort-touren');
  await page.goto('./#/auswerten');
  const field = page.locator('[data-suche-hier="auswerten"] input');
  await expect(field).toHaveAttribute('placeholder', T('Find a value or question'));
  // a screen reader gets the name of the field, not only the grey placeholder (Gesamttest Runde 2, C1)
  await expect(page.getByRole('searchbox', { name: T('Find a value or question') })).toHaveCount(1);
  await field.fill('ruhepuls');
  await expect(page.locator('[data-suche-ueberall]')).toBeVisible();
  await shot(page, info, 'suche-ort-auswerten');
  expect(errors).toEqual([]);
});
