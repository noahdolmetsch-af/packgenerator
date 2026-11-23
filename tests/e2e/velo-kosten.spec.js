// «Kosten-Schätzung» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt E), German UI:
// - in the companion, a point on a part with a known last price says what a new one costs about;
// - the summary adds the estimates of the points to fix or to take to the bike shop; a part without a price is counted as such.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
BIKE.km = 6400;
BIKE.parts = [
  { key: 'chain', model: 'Demo Kette', history: [{ date: day(-90), km: 5700, value: null, action: 'replace', result: 'done', by: 'self', model: null, note: '', chf: 54 }] },
  { key: 'padsF', model: '', history: [] },
];

test.beforeEach(async ({ page, context }, info) => {
  const file = info.outputPath('kosten.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
});

test('the companion says what a new part costs, from the last price, and adds it up', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=inspect&bike=${BIKE.id}&level=monthly`);
  const run = page.locator('[data-inspect-run="monthly"]');
  await run.locator('[data-run-go]').click();
  const step = run.locator('[data-run-step]');
  await expect(step).toBeVisible();
  const mark = async (id, state) => {
    for (let i = 0; i < 60 && !(await step.locator(`[data-point="${id}"]`).count()); i++) await run.locator('[data-run-next]').click();
    await expect(step.locator(`[data-point="${id}"]`)).toBeVisible();
    await expect(step.locator('[data-run-price]')).toHaveCount(0);
    await run.locator(`[data-state="${state}"]`).click();
  };
  await mark('chainwear', 'fix');
  // the chain has a last price (CHF 54): the step says so
  await expect(step.locator('[data-run-price]')).toContainText('CHF 54');
  await run.locator('[data-run-next]').click();
  for (let i = 0; i < 60 && !(await run.locator('[data-run-summary]').count()); i++) {
    if (await step.locator('[data-point]').count()) await run.locator('[data-state="ok"]').click();
    await run.locator('[data-run-next]').click();
  }
  const summary = run.locator('[data-run-summary]');
  await expect(summary).toBeVisible();
  await expect(summary.locator('[data-run-todo] [data-run-price]')).toContainText('CHF 54');
  await expect(summary.locator('[data-run-estimate]')).toContainText('Geschätzte Kosten: CHF 54');
});

test('a point on a part without a known price shows no estimate', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=inspect&bike=${BIKE.id}&level=monthly`);
  const run = page.locator('[data-inspect-run="monthly"]');
  await run.locator('[data-run-go]').click();
  const step = run.locator('[data-run-step]');
  for (let i = 0; i < 60 && !(await step.locator('[data-point="padsF"]').count()); i++) await run.locator('[data-run-next]').click();
  await expect(step.locator('[data-point="padsF"]')).toBeVisible();
  await run.locator('[data-state="shop"]').click();
  await expect(step.locator('[data-run-price]')).toHaveCount(0);
  for (let i = 0; i < 60 && !(await run.locator('[data-run-summary]').count()); i++) {
    await run.locator('[data-run-next]').click();
  }
  const summary = run.locator('[data-run-summary]');
  await expect(summary).toBeVisible();
  await expect(summary.locator('[data-run-estimate]')).toHaveCount(0);
});
