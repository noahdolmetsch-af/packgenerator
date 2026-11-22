// «Pro Velo und Untergrund» zählt nur Fahrten, die wirklich zum Velo gehören (Noah 22.11.2026: Canyon Lux «236 Fahrten»).
// A ride that waits in «Zum Prüfen» only carries the bike that was suggested; it must not count for that bike's pace.
// Fictional data (sn2plus-fixture.js, test_data_gtp_). SHOTS_DIR: where the pictures go (phone 390 and computer 1440).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn2plusData, D0 } from './sn2plus-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = process.env.SHOTS_DIR ?? null;
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

function data() {
  const d = sn2plusData();
  // no trip names a bike, so a ride only has the bike of its ledger entry
  d.tables.trips = d.tables.trips.map((x) => ({ ...x, bikeId: null, bike: '' }));
  // the gravel bike: 2 rides really counted, the others wait in «Zum Prüfen» with the gravel bike as the suggestion
  let seen = 0;
  d.tables.kmBook = d.tables.kmBook.map((e) => {
    if (e.bikeId !== 'bike-test') return e;
    return ++seen <= 2 ? e : { ...e, state: 'open', sure: 'unclear', by: 'type', reason: { code: 'none', gear: '', profile: '' } };
  });
  return d;
}

test('A ride waiting in «Zum Prüfen» does not count for the suggested bike', async ({ page, context }, info) => {
  const DATA = data();
  const open = DATA.tables.kmBook.filter((e) => e.bikeId === 'bike-test' && e.state === 'open').length;
  expect(open).toBeGreaterThanOrEqual(3);
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/pace-nur-gezaehlt-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(DATA));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/debrief/pace');
  const grid = page.locator('[data-pace-grid]');
  await expect(grid.getByRole('heading', { level: 2, name: T('Per bike and surface') })).toBeVisible();
  // only the 2 counted rides stand in the gravel row; the open ones wait for you
  const cell = grid.locator('[data-bike="bike-test"] [data-surface="gravel"]');
  await expect(cell).toHaveAttribute('data-counts', '0');
  await expect(cell).toContainText(T('only {n} ride', { n: 2 }).replace('2', '2'));
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await grid.screenshot({ path: `${SHOTS}/pace-nur-gezaehlt-${info.project.name === 'phone' ? '390' : '1440'}.png` });
  }
  expect(errors).toEqual([]);
});
