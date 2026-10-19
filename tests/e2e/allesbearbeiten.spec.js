// «Alles selbst bearbeiten» (Noah 19.10.2026: «alle daten können vom nutzer selber hinzugefügt, umbenannt
// oder gelöscht werden»), German UI:
// - a bike that a trip uses can be deleted: the app's window asks where the trip goes, «Rückgängig» brings all back;
// - a new bike name says that Garmin and Strava need the same name;
// - a learning can be added, changed and deleted; a problem renamed and deleted; a logbook entry renamed.
// Fictional fixture plus test_data_gtp_ data; nothing leaves the preview server.
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
const OTHER = 'test_data_gtp_ Zweitvelo';
const TRIP = 'test_data_gtp_ Tour';

function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  data.tables.bikes.push({ ...structuredClone(bike), id: 'bike-zwei', name: OTHER, order: 9 });
  data.tables.trips.push({
    id: 'trip-alles', domain: 'bikepacking', title: TRIP, startDate: '2026-11-01', days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [], ready: [], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  data.tables.maintenance = [{ id: 1, area: 'Bike', bikeId: bike.id, subject: bike.name, task: 'test_data_gtp_ Kette knackt', category: 'Repair', source: 'Problem', logDate: '2026-10-10', priority: 'medium', status: 'open', note: '', fix: 'self', beforeRide: false, done: false }];
  data.tables.events = [{ id: 'ev-1', name: 'test_data_gtp_ Alter Eintrag', date: '2019-06-01', source: 'logbook', type: 'Brevet' }];
  writeFileSync(path, JSON.stringify(data));
}

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
  const file = info.outputPath('alles.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('a bike a trip uses can be deleted: the trip goes to the chosen bike, Undo brings it back', async ({ page }) => {
  const bike = base.tables.bikes[0];
  await page.goto(`./#/bikes?bike=${bike.id}`);
  await page.getByRole('button', { name: T('Edit {name}', { name: bike.name }) }).click();
  const dlg = page.getByRole('dialog', { name: T('Bike details') });
  await expect(dlg).toBeVisible();

  // a new name says once that Garmin and Strava need the same name
  await expect(page.getByTestId('bike-rename-hint')).toHaveCount(0);
  await dlg.getByLabel(T('Name')).fill('test_data_gtp_ Neuer Name');
  await expect(page.getByTestId('bike-rename-hint')).toBeVisible();
  await dlg.getByLabel(T('Name')).fill(bike.name);
  await expect(page.getByTestId('bike-rename-hint')).toHaveCount(0);

  await dlg.getByRole('button', { name: T('Delete bike') }).click();
  const ask = page.getByRole('dialog', { name: T('Delete the bike "{name}"?', { name: bike.name }) });
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('radio', { name: T('No bike') })).toBeChecked(); // «Ohne Velo» comes first
  await ask.getByRole('radio', { name: OTHER }).check();
  await ask.getByRole('button', { name: T('Delete') }).click();

  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(T('"{name}" deleted.', { name: bike.name }));
  await expect.poll(async () => (await table(page, 'bikes')).map((b) => b.id)).toEqual(['bike-zwei']);
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === 'trip-alles')?.bikeId).toBe('bike-zwei');

  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'bikes')).length).toBe(2);
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === 'trip-alles')?.bikeId).toBe(bike.id);
});

test('a learning: add, change, delete', async ({ page }) => {
  await page.goto('./#/debrief/learnings');
  await page.getByRole('button', { name: T('Learning'), exact: true }).click();
  let sheet = page.getByTestId('learning-sheet');
  await sheet.getByLabel(T('What you learned')).fill('test_data_gtp_ Zweite Handschuhe');
  await sheet.getByLabel(T('Topic (optional)')).fill('test_data_gtp_ Kleidung');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByText('test_data_gtp_ Zweite Handschuhe', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: T('Edit learning: {name}', { name: 'test_data_gtp_ Zweite Handschuhe' }) }).click();
  sheet = page.getByTestId('learning-sheet');
  await sheet.getByLabel(T('What you learned')).fill('test_data_gtp_ Dritte Handschuhe');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(page.getByText('test_data_gtp_ Dritte Handschuhe', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: T('Edit learning: {name}', { name: 'test_data_gtp_ Dritte Handschuhe' }) }).click();
  await page.getByTestId('learning-sheet').getByRole('button', { name: T('Delete'), exact: true }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect.poll(async () => (await table(page, 'learnings')).length).toBe(0);
});

test('a problem can be renamed and deleted', async ({ page }) => {
  const bike = base.tables.bikes[0];
  await page.goto(`./#/bikes?tab=care&bike=${bike.id}&open=1`);
  const row = page.locator('[data-repair-id="1"]').first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: T('More answers for {label}', { label: 'test_data_gtp_ Kette knackt' }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Rename')}`) }).click();
  const ren = page.getByRole('dialog', { name: T('Rename problem') });
  await ren.getByRole('textbox').fill('test_data_gtp_ Kette quietscht');
  await ren.getByRole('textbox').press('Enter');
  await expect.poll(async () => (await table(page, 'maintenance'))[0]?.task).toBe('test_data_gtp_ Kette quietscht');

  const row2 = page.locator('[data-repair-id="1"]').first();
  await row2.getByRole('button', { name: T('More answers for {label}', { label: 'test_data_gtp_ Kette quietscht' }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect.poll(async () => (await table(page, 'maintenance')).length).toBe(0);
});

test('sports: an own sport is offered for a new trip; a place on the bike gets a new name', async ({ page }) => {
  await page.goto('./#/me/lists?domains');
  await page.getByRole('button', { name: T('Own sport') }).click();
  const sheet = page.getByRole('dialog', { name: T('Own sport') });
  await sheet.getByLabel(T('Name')).fill('test_data_gtp_ Tennis');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(page.getByRole('button', { name: T('Edit: {name}', { name: 'test_data_gtp_ Tennis' }) })).toBeVisible();
  await expect.poll(async () => (await table(page, 'settings')).find((r) => r.key === 'listOverrides')?.value?.domains?.own?.[0]?.name).toBe('test_data_gtp_ Tennis');

  // the place on the bike: only the name, no «Delete», no own entries
  await page.goto('./#/me/lists?bikeSlots');
  await expect(page.getByRole('button', { name: T('Own sport') })).toHaveCount(0);
  await page.getByRole('button', { name: T('Edit: {name}', { name: T('Seat pack') }) }).click();
  const ren = page.getByRole('dialog', { name: T('Rename place') });
  await expect(ren.getByRole('button', { name: T('Delete') })).toHaveCount(0);
  await ren.getByLabel(T('Name')).fill('test_data_gtp_ Sattel');
  await ren.getByRole('button', { name: T('Save') }).click();
  await expect(page.getByRole('button', { name: T('Edit: {name}', { name: 'test_data_gtp_ Sattel' }) })).toBeVisible();
});
