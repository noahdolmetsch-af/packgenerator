// «Ideen laden» (Noah 27.11.2026 «ich kann nicht mehr ideen laden»): more tips per area, «Another idea», «I like it» brings the next one,
// the further areas have buttons too, no double crumb. German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const TODAY = '2026-10-16';
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

test('Ideas: another idea, like brings the next one, further areas have buttons', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.healthDays = Array.from({ length: 10 }, (_, i) => {
    const date = addDays(TODAY, -i);
    return { date, restingHr: 52 + (i % 3), sleep: { asleepMin: 400 }, steps: 9000, src: 'google', at: `${date}T08:00:00Z` };
  });
  const file = info.outputPath('ideen-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/flow/ideen');
  const card = page.locator('[data-tip]').first();
  await expect(card).toBeVisible({ timeout: 20000 });
  const key = await card.getAttribute('data-tip');
  const area = page.locator(`[data-tip="${key}"]`);

  // «Another idea»: a different text, and it stays after a reload
  const t0 = await area.locator('p').innerText();
  await area.getByRole('button', { name: T('Another idea') }).click();
  await expect(area.locator('p')).not.toHaveText(t0);
  const t1 = await area.locator('p').innerText();
  await page.reload();
  await expect(page.locator(`[data-tip="${key}"] p`)).toHaveText(t1);

  // «I like it»: the tip is in your ideas and the next one is shown
  await page.locator(`[data-tip="${key}"]`).getByRole('button', { name: T('I like it → my ideas') }).click();
  await expect(page.locator('.rtoast')).toContainText(T('In your ideas.'));
  await expect(page.locator(`[data-tip="${key}"] p`)).not.toHaveText(t1);
  await expect(page.getByText(t1, { exact: true }).first()).toBeVisible();

  // the further areas are full cards with buttons
  await page.getByRole('button', { name: /weitere Bereiche/ }).click();
  const other = page.locator('[data-tip-other]').first();
  await expect(other).toBeVisible();
  await expect(other.getByRole('button', { name: T('I like it → my ideas') })).toBeVisible();
  await expect(other.getByRole('button', { name: T('Another idea') })).toBeVisible();
  const o0 = await other.locator('p').innerText();
  await other.getByRole('button', { name: T('Another idea') }).click();
  await expect(other.locator('p')).not.toHaveText(o0);

  // no double crumb: on the computer the path ends with the page once, then the title (the phone shows only the last step)
  if (info.project.name === 'desktop') {
    const words = (await page.locator('.ph').first().innerText()).split('\n').map((x) => x.trim().replace(/·$/, ''));
    expect(words.filter((x) => x === 'Ideen')).toHaveLength(2);
  }
  expect(errors).toEqual([]);
});
