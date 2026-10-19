// «Velo-Inspektion» (Noah 19.10.2026, «1a 2a 3a 4a 5a»), German UI:
// - the inspection card on a bike's care page starts the Kurzcheck; states, a value, «Rest OK», «Fertig» saves,
//   a «Velowerkstatt» point becomes a problem of the bike, Undo takes it all back;
// - the Inspections page: «Später weitermachen» keeps a draft, the history lists a finished check, delete with Undo;
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('insp.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('Kurzcheck: states, value, Rest OK, finish makes a problem, Undo takes it back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  const card = page.locator('[data-inspect-card]');
  await expect(card).toBeVisible();
  await card.locator('[data-inspect-start="quick"]').click();

  const run = page.locator('[data-inspect-run="quick"]');
  await expect(run).toBeVisible();
  // the gravel bike has no fork part: the suspension point stays out
  await expect(run.locator('[data-point="stanchions"]')).toHaveCount(0);

  const pressure = run.locator('[data-point="pressure"]');
  await pressure.locator('[data-point-value]').fill('2,4');
  await pressure.locator('[data-point-value]').press('Tab');
  const brakes = run.locator('[data-point="brakefeel"]');
  await brakes.locator('[data-state="shop"]').click();
  await expect(brakes.locator('[data-state="shop"]')).toHaveAttribute('aria-pressed', 'true');

  // «So geht's» shows steps and links
  await brakes.locator('[data-howto-open]').click();
  const how = page.getByRole('dialog');
  await expect(how).toBeVisible();
  await expect(how.getByRole('link').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(how).toHaveCount(0);

  for (const b of await run.locator('[data-area-ok]').all()) await b.click();
  await expect.poll(async () => (await table(page, 'inspections'))[0]?.results?.find((r) => r.id === 'axles')?.state).toBe('ok');
  await pressure.locator('[data-state="ok"]').click();

  await run.locator('[data-inspect-finish]').click();
  await expect.poll(async () => (await table(page, 'inspections'))[0]?.done).toBe(true);
  const tasks = await table(page, 'maintenance');
  const task = tasks.find((m) => m.inspectionId);
  expect(task?.fix).toBe('shop');
  await expect(page.locator('[data-inspect-page]')).toBeVisible();
  await expect(page.locator('[data-inspection]')).toHaveCount(1);

  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  // Undo turns the finished check back into the draft it was
  await expect.poll(async () => (await table(page, 'inspections'))[0]?.done ?? false).toBe(false);
  await expect.poll(async () => (await table(page, 'maintenance')).filter((m) => m.inspectionId).length).toBe(0);
});

test('Inspections page: continue later keeps a draft; history delete with Undo', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=inspect&bike=${BIKE.id}&level=quick`);
  const run = page.locator('[data-inspect-run="quick"]');
  await run.locator('[data-point="axles"] [data-state="ok"]').click();
  await expect.poll(async () => (await table(page, 'inspections'))[0]?.results?.find((r) => r.id === 'axles')?.state).toBe('ok');
  await run.locator('[data-inspect-later]').click();
  await expect(page.locator('[data-inspect-page]')).toBeVisible();
  await expect(page.locator('[data-inspection]')).toHaveCount(1);
  expect((await table(page, 'inspections'))[0].done).toBeFalsy();

  await page.locator('[data-inspection] [data-inspection-delete]').click();
  const ask = page.getByRole('dialog');
  if (await ask.count()) await ask.getByRole('button', { name: T('Delete') }).click();
  await expect.poll(async () => (await table(page, 'inspections')).length).toBe(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'inspections')).length).toBe(1);
});
