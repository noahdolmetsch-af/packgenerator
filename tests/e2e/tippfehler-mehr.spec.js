// «Tippfehler-Frage» Teil 2 bis 4 (Warteliste 6; Noah 22.11.2026 «1-5 a», «3a»): the quiet line under the weight of a piece of gear, under
// the km on the counter (compared with the last reading) and under an own length in minutes. It never blocks. Fictional data, German.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Material weight: 32000 g asks, Yes puts 320 in', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/gear');
  const name = 'test_data_gtp_ Zeltplane';
  await page.getByRole('searchbox').first().fill(name);
  await page.getByRole('button', { name: T('Add "{q}" as a new item', { q: name }) }).click();
  const grams = page.locator('#it-grams');
  await expect(grams).toBeVisible();
  await grams.fill('32000');
  await grams.blur();
  const line = page.locator('[data-typo-line]');
  await expect(line).toBeVisible();
  await expect(line).toContainText('Meintest du 320');
  await page.locator('[data-typo-use]').click();
  await expect(grams).toHaveValue('320');
  expect(errors).toEqual([]);
});

test('Log km: a reading far above the last one asks, Yes puts the likely one in', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new', { detail: 'km' })));
  await page.locator('dialog[open] select').first().selectOption('bike-test'); // the counter of this bike stands at 2288 km
  const field = page.locator('dialog[open] input[inputmode="decimal"]').first();
  await expect(field).toBeVisible();
  await field.fill('22880');
  await field.blur();
  const line = page.locator('[data-typo-line]');
  await expect(line).toBeVisible();
  await expect(line).toContainText('Meintest du');
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/km-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await page.locator('[data-typo-use]').click();
  await expect(field).toHaveValue(/2.?288/);
  expect(errors).toEqual([]);
});
