// B19 «Hochheben beim Sortieren» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen»): while a row is held it
// lifts with a shadow above the others (Ich › Listen und Typen › Kategorien); letting go puts the order.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));

test('the held row lifts with a shadow and lands at its new place', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/me/lists?categories');
  const rows = page.locator('main li[data-sort-id]');
  await expect(rows.nth(2)).toBeVisible();
  const first = await rows.nth(0).getAttribute('data-sort-id');

  const a = await rows.nth(0).locator('[data-sort-grip]').boundingBox();
  const b = await rows.nth(2).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 20);
  const held = page.locator('main li.sort-moving');
  await expect(held).toHaveCount(1);
  await expect(held).toHaveAttribute('data-sort-id', first);
  expect(await held.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  for (let k = 1; k <= 6; k++) await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + ((b.y + b.height * 0.75 - a.y - a.height / 2) * k) / 6);
  await page.mouse.up();
  await expect(page.locator('main li.sort-moving')).toHaveCount(0);
  await expect.poll(() => rows.nth(2).getAttribute('data-sort-id')).toBe(first);
});
