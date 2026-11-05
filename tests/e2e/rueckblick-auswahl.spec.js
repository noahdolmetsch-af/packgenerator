// «Rückblick-Auswahl änderbar» (Noah 05.11.2026 «b»): the answers of «How was it?» can be renamed in Ich › Listen und Typen. Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { importAndSettle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));
const ID = 'test_data_gtp_ra1';
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
function fixtureWithTrip(path) {
  const data = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const bike = data.tables.bikes[0];
  const entries = data.tables.items.slice(3, 9).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [{ id: ID, domain: 'bikepacking', title: 'test_data_gtp_ Jura Runde', startDate: day(-2), days: 2, bikeId: bike.id, bike: bike.name, setup: bike.setup, entries, ready: [], status: 'planned' }];
  data.tables.debriefs = [];
  writeFileSync(path, JSON.stringify(data));
}

test('Listen und Typen: an answer of the debrief can be renamed, and the name stays after a reload', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const file = info.outputPath('rueckblick-auswahl-fixture.json');
  fixtureWithTrip(file);
  await importAndSettle(page, file);

  await page.goto('./#/me/lists');
  await page.locator('a[href="#/me/lists?debrief.weather"]').click();
  const rows = page.locator('.lists li.ich-row');
  await expect(rows).toHaveCount(3);
  await rows.filter({ hasText: T('Warmer') }).locator('button.edit').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill('Sommerlich');
  await input.press('Enter');
  await expect(rows.filter({ hasText: 'Sommerlich' })).toHaveCount(1);
  await page.reload();
  await expect(rows.filter({ hasText: 'Sommerlich' })).toHaveCount(1);
  await expect(page.locator('.lists li.ich-row b', { hasText: new RegExp(`^${T('Warmer')}$`) })).toHaveCount(0);

  // the debrief shows the new word in «How was it?»
  await page.goto(`./#/debrief/${ID}`);
  await page.locator('details.how-fold > summary').click();
  await expect(page.getByRole('group', { name: T('Weather') }).getByText('Sommerlich')).toBeVisible();
});
