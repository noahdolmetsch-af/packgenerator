// «Velos-Pflege einbauen» (Noah 03.11.2026 «4a»): a due part shows what is at home for it. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));

async function start(page, context, info, qty) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  if (qty != null) fix.tables.settings.push({ key: 'griff.stock', value: [{ id: 'st-1', name: `${P}Kette`, part: 'chain', qty, since: day(-100) }] });
  const file = info.outputPath('fixture-vorrat.json');
  writeFileSync(file, JSON.stringify(fix));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
}
const chainRow = (page) => page.locator('li.dcard').filter({ hasText: 'Kette' }).first();

test('due chain with stock at home: the count under the part and the way to the stock page', async ({ page, context }, info) => {
  await start(page, context, info, 2);
  await page.goto('./#/bikes?tab=care');
  await expect(chainRow(page).locator('.dd')).toContainText(`Im Vorrat: ${P}Kette (2)`);
  await chainRow(page).getByRole('button', { name: /Weiteres|Mehr/ }).last().click();
  await page.getByRole('button', { name: /Ersatzteile zu Hause/ }).or(page.getByRole('menuitem', { name: /Ersatzteile zu Hause/ })).first().click();
  await expect(page).toHaveURL(/view=stock/);
});

test('empty stock says used up; no stock row says nothing', async ({ page, context }, info) => {
  await start(page, context, info, 0);
  await page.goto('./#/bikes?tab=care');
  await expect(chainRow(page).locator('.dd')).toContainText('aufgebraucht');
});

test('without a stock row the due part says nothing about the stock', async ({ page, context }, info) => {
  await start(page, context, info, null);
  await page.goto('./#/bikes?tab=care');
  await expect(chainRow(page)).toBeVisible();
  await expect(page.locator('li.dcard .dd', { hasText: 'Im Vorrat' })).toHaveCount(0);
});
