// «Velos-Pflege einbauen» (Noah 03.11.2026 «5a»): on the ready wall of Today the area «Unterwegs und Velos» (the last activity,
// then the bikes) stands over «Deine Woche». Fictional data (test_data_gtp_), built from pf-fixture.json.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));

test('Today: the last activity and the bikes stand over the week area', async ({ page, context }, info) => {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const file = info.outputPath('fixture-heute.json');
  writeFileSync(file, JSON.stringify(fix));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/');
  const secs = page.locator('[data-home-sec]');
  await expect(secs.first()).toBeVisible();
  const keys = await secs.evaluateAll((els) => els.map((e) => e.dataset.homeSec));
  expect(keys.indexOf('away')).toBeGreaterThan(-1);
  expect(keys.indexOf('week')).toBeGreaterThan(-1);
  expect(keys.indexOf('away')).toBeLessThan(keys.indexOf('week'));
  const tiles = await page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile));
  expect(tiles.indexOf('strava')).toBeLessThan(tiles.indexOf('bikes'));
  expect(tiles.indexOf('bikes')).toBeLessThan(tiles.indexOf('week'));
});
