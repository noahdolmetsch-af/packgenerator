// v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 alle a, mockups F, G, H): Ich › Testdaten aufräumen
// archives the test trip and test gear with Undo; a trip ended before its start date asks before a
// debrief and comes back with «Wieder planen»; Ich › Ausprobieren starts the playground, and ending
// it puts the data back. Fictional fixture (test_data_gtp_), German UI, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, settle } from './settle.js';
import { openShort } from './kurz-open.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const TEST = 'test_data_gtp_ Testtour Regen';
const EARLY = 'test_data_gtp_ Seerunde';
const REAL = 'test_data_gtp_ Jura';

function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  const trip = (id, title, start, extra = {}) => ({ id, domain: 'bikepacking', title, startDate: start, days: 1, bikeId: bike.id, bike: bike.name, setup: bike.setup, entries, ready: [], status: 'done', ...extra });
  data.tables.trips = [trip('test_data_gtp_t1', TEST, day(-9)), trip('test_data_gtp_t2', REAL, day(-5)), trip('test_data_gtp_t3', EARLY, day(6), { finished: day(-3) })];
  data.tables.debriefs = data.tables.trips.map((x) => ({ tripId: x.id, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: {}, missing: [], applied: [], km: null }));
  writeFileSync(path, JSON.stringify(data));
}

test('Clean up test data, plan again, playground', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const file = info.outputPath('aufraeumen-fixture.json');
  fixture(file);
  await page.goto('./');
  await importAndSettle(page, file);

  // H: Touren shows the trip ended before it began as still planned, not as ridden
  // (TZ-1 «Zustand sichtbar»: no own group any more; it stands under Geplant with its line;
  // SN4g: «Geplant» is a list of cards, the finished trips are rows of «Abgeschlossene Touren»)
  await page.goto('./#/trips');
  await openShort(page);
  const planned = page.locator('section[data-planned]');
  await expect(planned.getByText(T('Marked as ended, the date is still ahead'))).toBeVisible();
  await expect(page.locator('section[data-finished]').getByText(EARLY)).toHaveCount(0);
  // SN4g: a finished trip is a row of the list (its title can also stand in a block of «In Zahlen» below)
  const listed = (title) => page.locator('[data-trip-list]').getByRole('link', { name: title, exact: true });
  await expect(listed(TEST)).toBeVisible();

  // F: Ich › Testdaten aufräumen: the test trip and the fixture's «Test …» bags, archived.
  await page.goto('./#/me');
  await page.getByRole('button', { name: new RegExp(T('Clean up test data')) }).click();
  const sheet = page.getByRole('dialog', { name: T('Clean up test data') });
  await expect(sheet.getByText(T('Found: everything with «test» in its name. Untick what should stay.'))).toBeVisible();
  await sheet.getByRole('button', { name: /Sachen archivieren$/ }).click();
  await expect(sheet.getByRole('status')).toContainText(/archiviert/);
  await expect(sheet.getByText(T('Nothing with «test» in its name left.'))).toBeVisible();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await page.goto('./#/trips');
  await openShort(page);
  await expect(listed(REAL)).toBeVisible();
  await expect(page.getByText(TEST)).toHaveCount(0);

  // Undo brings it back.
  await page.goto('./#/me');
  await page.getByRole('button', { name: new RegExp(T('Clean up test data')) }).click();
  await sheet.getByRole('button', { name: /^Rückgängig: / }).click();
  await expect(sheet.getByRole('status')).toContainText(/zurück/);
  await sheet.getByRole('button', { name: T('Close') }).click();
  await page.goto('./#/trips');
  await openShort(page);
  await expect(listed(TEST)).toBeVisible();

  // H: the debrief of that trip asks first; «Trotzdem» opens it.
  await page.goto('./#/debrief/test_data_gtp_t3');
  await expect(page.getByRole('heading', { name: T('{name} is still to come', { name: EARLY }) })).toBeVisible();
  await page.getByRole('button', { name: T('Debrief anyway') }).click();
  await expect(page.getByRole('heading', { name: T('{name} is still to come', { name: EARLY }) })).toHaveCount(0);

  // «Wieder planen» on Touren: the trip opens at Plan and leaves the group.
  await page.goto('./#/trips');
  await openShort(page);
  await page.getByRole('button', { name: `${T('Plan again')}: ${EARLY}` }).click();
  await expect(page).toHaveURL(/#\/pack/);
  await page.goto('./#/trips');
  await openShort(page);
  await expect(page.getByRole('heading', { name: new RegExp(T('Ended before it began')) })).toHaveCount(0);

  // G: the playground with a weekend trip; ending it puts the data back.
  await page.goto('./#/me');
  await page.getByRole('button', { name: new RegExp(T('Try it out')) }).click();
  const play = page.getByRole('dialog', { name: T('Try it out') });
  // the start reloads the app (the demo day applies before it starts): wait for that load first
  const started = page.waitForEvent('load');
  await play.getByRole('button', { name: T('Start the playground') }).click();
  await started;
  await settle(page, { sameTrips: false });
  const bar = page.getByRole('region', { name: 'Demo' });
  await expect(bar).toContainText(T('your data is safe · nothing counts'));
  await page.goto('./#/trips');
  await openShort(page);
  await expect(page.getByText(T('Jura loop'), { exact: true }).first()).toBeVisible();
  const ended = page.waitForEvent('load');
  await bar.getByRole('button', { name: T('End|playground') }).click();
  await ended;
  await settle(page, { sameTrips: false });
  await expect(page.getByRole('region', { name: 'Demo' })).toHaveCount(0);
  await page.goto('./#/trips');
  await openShort(page);
  await expect(listed(REAL)).toBeVisible();
  await expect(page.getByText(T('Jura loop'), { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
