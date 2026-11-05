// «Velos-Pflege einbauen» (Noah 03.11.2026 «2a»): «Fits now» by month on Bikes › Care and on Today, and the way back after
// the winter list. A fixed clock in November. Fictional data (test_data_gtp_), built from pf-fixture.json.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const IDS = [0, 1, 2, 3, 4, 5].map((i) => `std-${i}`);

async function start(page, context, info, day, season) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + Number(n)); return `"${d.toISOString().slice(0, 10)}"`; }));
  if (season) fix.tables.settings.push({ key: 'griff.season', value: season });
  const file = info.outputPath('fixture-saison.json');
  writeFileSync(file, JSON.stringify(fix));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${day}T12:00:00+01:00`) });
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
}

test('November: the card on Care and the line on Today offer to put the bike away', async ({ page, context }, info) => {
  await start(page, context, info, '2026-11-18');
  await page.goto('./#/bikes?tab=care');
  const card = page.locator('section[data-season-now]');
  await expect(card).toContainText('Passt jetzt');
  await expect(card.locator('[data-season-rule="bike-winter"]')).toContainText('Velo einwintern');
  await card.locator('[data-season-rule="bike-winter"]').click();
  await expect(page).toHaveURL(/view=season/);
  await page.goto('./#/');
  await expect(page.locator('[data-section="moment"] [data-season-now]')).toContainText('Passt jetzt: Velo einwintern');
});

test('July: nothing about the season', async ({ page, context }, info) => {
  await start(page, context, info, '2026-07-15');
  await page.goto('./#/bikes?tab=care');
  await expect(page.locator('[data-care-acts]')).toBeVisible();
  await expect(page.locator('[data-season-now]')).toHaveCount(0);
});

test('the last tick of the winter list shows the way back and clears the card', async ({ page, context }, info) => {
  const items = IDS.map((id, i) => ({ id, text: `Punkt ${i}`, std: true }));
  const bikes = [`${P}scale`, `${P}spark`, `${P}gravel`];
  const ticks = Object.fromEntries(bikes.map((b) => [b, { day: '2026', ids: b === `${P}scale` ? IDS.slice(0, 5) : IDS }]));
  await start(page, context, info, '2026-11-18', { winter: { items, ticks } });
  await page.goto('./#/bikes?tab=care');
  await expect(page.locator('section[data-season-now]')).toBeVisible();
  await page.goto(`./#/bikes?tab=care&view=season&bike=${P}scale`);
  await expect(page.locator('[data-season-next]')).toHaveCount(0);
  await page.locator('[data-season-tick]').last().check();
  const next = page.locator('[data-season-next]');
  await expect(next).toContainText('Eingewintert.');
  await expect(next).toContainText('Februar');
  await next.locator('[data-season-to-spring]').click();
  await expect(page.locator('[data-season="spring"]')).toBeVisible();
  await page.goto('./#/bikes?tab=care');
  await expect(page.locator('[data-care-acts]')).toBeVisible();
  await expect(page.locator('section[data-season-now]')).toHaveCount(0);
});
