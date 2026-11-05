// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): a trip with the arrival «train» shows «Pack the bike for the train»
// in its folded row on Bikes › Care. Fictional data (test_data_gtp_), built from pf-fixture.json.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));

async function start(page, context, info, arrival) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  fix.tables.trips.find((x) => x.id === `${P}event`).arrival = arrival;
  const file = info.outputPath('fixture-zug.json');
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

test('trip by train: the folded row names the pack list and links to its page', async ({ page, context }, info) => {
  await start(page, context, info, 'train');
  await page.goto(`./#/bikes?tab=care&trip=${P}event`);
  const row = page.locator(`#before-${P}event [data-trip-pack]`);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Velo für den Zug verpacken');
  await row.getByRole('link').click();
  await expect(page).toHaveURL(/view=bikepack/);
});

test('trip by bike: no pack row', async ({ page, context }, info) => {
  await start(page, context, info, 'bike');
  await page.goto(`./#/bikes?tab=care&trip=${P}event`);
  await expect(page.locator(`#before-${P}event`)).toHaveAttribute('open', '');
  await expect(page.locator('[data-trip-pack]')).toHaveCount(0);
});
