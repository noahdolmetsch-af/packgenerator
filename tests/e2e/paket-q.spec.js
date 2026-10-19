// Paket Q «App klarer» (Noah 19.10.2026 «1a 2a … 3 … 4a 5a»), German UI:
// - the backup lock: switch on, set a password, the exported file is locked; on a device without the
//   password the app asks for it, a wrong one changes nothing, the right one opens the backup;
// - Ich › Hinweise: news of the sources (the server is mocked), add and delete a source with Undo;
// - the calm offline line comes and goes;
// - «Stimmt das noch?» opens from Ich › Daten.
// Fictional data only; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle, replaceAll } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('backup with a password: locked file, wrong password changes nothing, right one opens it', async ({ page }, info) => {
  await page.goto('./');
  const data = await openData(page);
  const lock = data.locator('[data-section="backup-lock"]');
  await lock.locator('[data-lock-switch]').check();
  await lock.locator('[data-lock-pw]').fill('test-pw-123');
  await lock.locator('[data-lock-pw2]').fill('test-pw-999');
  await lock.locator('[data-lock-save]').click();
  await expect(lock.getByRole('status')).toHaveText(T('The two passwords are not the same.'));
  await lock.locator('[data-lock-pw2]').fill('test-pw-123');
  await lock.locator('[data-lock-save]').click();
  await expect(lock.locator('[data-lock-switch]')).toBeChecked();

  const wait = page.waitForEvent('download');
  await data.getByRole('button', { name: T('Save backup'), exact: true }).first().click();
  const file = info.outputPath('locked.json');
  await (await wait).saveAs(file);
  const text = readFileSync(file, 'utf8');
  expect(JSON.parse(text).locked).toBeTruthy();
  expect(text).not.toContain('"tables"');

  // this device forgets the password: the file now asks for it
  await lock.locator('[data-lock-switch]').uncheck();
  await expect(lock.locator('[data-lock-switch]')).not.toBeChecked();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  const pw = data.locator('[data-unlock-pw]');
  await expect(pw).toBeVisible();
  await pw.fill('falsch-123');
  await data.getByRole('button', { name: T('Open'), exact: true }).click();
  await expect(data.getByRole('alert')).toHaveText(T('Wrong password. Try again; nothing was changed.'));
  await pw.fill('test-pw-123');
  await data.getByRole('button', { name: T('Open'), exact: true }).click();
  await expect(pw).toHaveCount(0);
  await expect(data.getByRole('button', { name: T('Replace all data') })).toBeVisible();
});

test('Hinweise: news of the sources, add and delete a source with Undo', async ({ page }) => {
  await page.route(/packgen-three\.vercel\.app\/api\/news/, (route) => {
    const q = new URL(route.request().url()).searchParams;
    const body = q.get('alerts') === 'weather' ? { ok: true, warnings: [] }
      : q.get('alerts') === 'avalanche' ? { ok: true, level: null, link: 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/' }
      : { ok: true, title: 'Test', items: [{ title: `test_data_gtp_ Meldung ${new URL(q.get('feed')).hostname}`, link: 'https://example.org/a', date: '2026-10-19T08:00:00.000Z' }] };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  });
  await page.goto('./#/me/hinweise');
  await settle(page, { sameTrips: false });
  const hw = page.locator('[data-page="hinweise"]');
  await expect(hw.getByRole('heading', { name: T('Alerts and news'), level: 1 })).toBeVisible();
  await expect(hw.getByText('test_data_gtp_ Meldung bikepacking.com')).toBeVisible();

  await hw.locator('[data-feed-add]').click();
  await hw.locator('[data-feed-name]').fill('test_data_gtp_ Quelle');
  await hw.locator('[data-feed-url]').fill('example.org/feed');
  await hw.locator('[data-feed-save]').click();
  await expect(hw.getByText('test_data_gtp_ Meldung example.org')).toBeVisible();

  await hw.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Quelle' }) }).click();
  await expect(hw.getByText('test_data_gtp_ Meldung example.org')).toHaveCount(0);
  await hw.getByRole('button', { name: T('Undo') }).click();
  await expect(hw.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Quelle' }) })).toBeVisible();
});

test('offline line comes and goes by itself', async ({ page, context }) => {
  await page.goto('./');
  await settle(page);
  const line = page.locator('[data-offline-line]');
  await expect(line).toHaveCount(0);
  await context.setOffline(true);
  await expect(line).toHaveText(T('Offline. Weather, Strava, Google and the exchange come back when you are online; everything else works.'));
  await context.setOffline(false);
  await expect(line).toHaveAttribute('data-offline-line', 'back');
  await expect(line).toHaveCount(0, { timeout: 10_000 });
});

test('«Stimmt das noch?» opens from Ich › Daten', async ({ page }) => {
  await page.goto('./');
  await settle(page);
  await page.goto('./#/me/data?yearcheck');
  const win = page.getByRole('dialog', { name: T('Still right?') });
  await expect(win).toBeVisible();
  await win.getByRole('button', { name: T('All checked') }).click();
  await expect(win).toHaveCount(0);
  await expect(page).toHaveURL(/#\/me\/data$/);
});

test('Hinweise without the server (as in a test preview) says why it is empty', async ({ page }) => {
  await page.goto('./#/me/hinweise');
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-news-down]')).toHaveText(T("Alerts and news come through the app's server, which does not answer here yet. In a test preview this is normal: they load once the update is live. Everything else on this page works."));
});

// ---------- Zusatz (Noah 19.10.2026 «1-3 alle a»): warning for the trip, help search, save for the way ----------
const zurichDay = (n) => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date()).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const TRIP = 'trip-test_data_gtp_q';
async function withTrip(page, info) {
  const data = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
  const bike = data.tables.bikes[0];
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Morgenrunde', startDate: zurichDay(1), days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    place: { name: 'Testregion', lat: 46.9, lon: 7.4 }, entries: [], ready: [], ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
  });
  const file = info.outputPath('trip.json');
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await replaceAll(panel);
  await settle(page);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  // the alerts are set up once Ich › Hinweise was opened
  await page.goto('./#/me/hinweise');
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-page="hinweise"]')).toBeVisible();
}
const WARN = () => ({ event: 'test_data_gtp_ Starkregen', area: 'Testregion Nord', level: 3, onset: `${zurichDay(1)}T04:00:00.000Z`, expires: `${zurichDay(2)}T04:00:00.000Z`, link: 'https://example.org/w' });
async function mockServer(page) {
  await page.route(/packgen-three\.vercel\.app\/api\/news/, (route) => {
    const q = new URL(route.request().url()).searchParams;
    const body = q.get('alerts') === 'weather' ? { ok: true, warnings: [WARN()] } : q.get('alerts') === 'avalanche' ? { ok: true, level: null, link: 'https://www.slf.ch/' } : { ok: true, title: 'Test', items: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  });
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ daily: { time: [zurichDay(1)], temperature_2m_min: [6], temperature_2m_max: [14], precipitation_sum: [8], precipitation_probability_max: [80] } }) }),
  );
}

test('a warning for the days and place of a planned trip shows on the trip, once the alerts are set up', async ({ page }, info) => {
  await mockServer(page);
  await withTrip(page, info);
  await page.goto('./#/pack');
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-trip-alert="weather"]')).toContainText(T('Weather warning for your trip: {event} ({area})', { event: 'test_data_gtp_ Starkregen', area: 'Testregion Nord' }));
});

test('save for the way: weather, alerts and news on the device, one line says so', async ({ page }, info) => {
  await mockServer(page);
  await withTrip(page, info);
  await page.goto('./#/pack');
  await settle(page, { sameTrips: false });
  const box = page.locator('[data-offline-save]');
  await box.locator('[data-offline-save-btn]').click();
  const what = [T('the weather|offline'), T('the alerts|offline'), T('the news|offline')].join(', ');
  await expect(box.getByRole('status')).toContainText(T('Saved for the way: {what} and your packing list.', { what }));
  const trip = await page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => { const q = r.result.transaction('trips').objectStore('trips').get(id); q.onsuccess = () => { r.result.close(); ok(q.result); }; };
  }), TRIP);
  expect(trip.forecast.days[0]).toMatchObject({ date: zurichDay(1), max: 14 });
});

test('the search answers a question in everyday words', async ({ page }, info) => {
  await page.goto('./');
  await settle(page);
  if (info.project.name === 'phone') await page.getByRole('button', { name: T('Search everything') }).click();
  await page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).fill('Wo stelle ich das Backup-Passwort ein?');
  const res = page.getByRole('region', { name: T('Search results') });
  await expect(res.getByText(T('Fits your question'))).toBeVisible();
  await res.locator('[data-help="f.backuplock"]').click();
  await expect(page).toHaveURL(/#\/me\/data/);
});
