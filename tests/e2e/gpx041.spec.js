// v0.41.0 "GPX → Learning" (Noah 1-5): upload a recorded ride from New → "Upload ride", see its
// pauses, save it to the trip of that day, compare planned vs real and keep a learning with one tap.
// And the Android share target: a GPX file POSTed to share-target (the service worker) opens the
// upload; text still goes to the Inbox. Synthetic, fictional ride (tests/test_data_gtp_gpx.js);
// nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { makeGpx } from '../test_data_gtp_gpx.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const TRIP = 'test_data_gtp_gpxtrip';
// SHOTS_DIR: another folder for the design shots (a run that must not write into the shared folder)
const SHOTS = process.env.SHOTS_DIR ? `${process.env.SHOTS_DIR}/v041/` : '/mnt/project-files/design/v041/';
const shot = async (page, name) => {
  try {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });
  } catch {
    /* no design folder on this machine (CI): the screenshots are only for the design review */
  }
};

/** A finished day trip yesterday with a 50 km route and 600 m of climbing (the plan: 4:08 h at 16 km/h). */
function fixture(path, title) {
  const data = structuredClone(base);
  const entries = data.tables.items.slice(3, 6).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [{ id: TRIP, domain: 'bikepacking', title, startDate: day(-1), days: 1, bikeId: 'bike-test', bike: data.tables.bikes[0].name, setup: data.tables.bikes[0].setup, entries, ready: [], status: 'planned', route: { name: 'test_data_gtp_ route', km: 50, gainM: 600, lossM: 600, start: { lat: 46.5, lon: 7.5 }, end: { lat: 46.5, lon: 8.15 }, line: [[46.5, 7.5], [46.5, 8.15]], profile: [] } }];
  writeFileSync(path, JSON.stringify(data));
}

/** 40 km flat at 22 km/h, a 3-minute stop, a 30-minute pause, then 10 km and 600 m up at 6 km/h. */
const rideGpx = (name) => makeGpx({ name, start: `${day(-1)}T07:00:00Z`, legs: [{ km: 20, kmh: 22 }, { stopMin: 3 }, { km: 20, kmh: 22 }, { stopMin: 30 }, { km: 10, kmh: 6, gainM: 600 }] });

const stored = (page, table) =>
  page.evaluate((name) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(name).objectStore(name).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result ?? []); };
    };
  }), table);

async function importData(page, T, file) {
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

const noSideScroll = async (page, what) => {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `no sideways scroll: ${what}`).toBeLessThanOrEqual(page.viewportSize().width);
};

for (const lang of ['en', 'de']) {
  test(`upload a ride, planned vs real, keep a learning, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `test_data_gtp_ Hügelrunde ${lang}`;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    const file = info.outputPath('gpx-fixture.json');
    fixture(file, title);
    const gpx = info.outputPath('test_data_gtp_ride.gpx');
    writeFileSync(gpx, rideGpx(`test_data_gtp_ evening ${lang}`));
    await importData(page, T, file);

    // 1. New → "Upload ride" (Fahrt hochladen)
    await page.goto('./#/');
    await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
    await page.getByRole('dialog', { name: T('New') }).getByRole('link', { name: new RegExp(`^${T('Upload ride')}`) }).click();
    await expect(page).toHaveURL(/#\/debrief\/ride$/);
    await expect(page.getByRole('heading', { level: 1, name: T('Upload ride') })).toBeVisible();

    // 2. Choose the file: the ride, its pauses (the 3-minute stop is moving time), the trip of that day chosen
    await page.locator('.pickbtn input[type=file]').setInputFiles(gpx);
    await expect(page.getByRole('heading', { name: new RegExp(`test_data_gtp_ evening ${lang}`) })).toBeVisible();
    const pauses = page.locator('.pz summary');
    await expect(pauses).toContainText(T('Pauses'));
    await expect(pauses.locator('.nbadge')).toHaveText('1');
    await expect(pauses).toContainText('0:30');
    await expect(page.getByRole('button', { name: title })).toHaveAttribute('aria-pressed', 'true');
    await noSideScroll(page, 'upload');
    if (lang === 'en') await shot(page, `upload-preview-${info.project.name}`);

    // 3. Save: the ride page with planned vs real and the learnings
    await page.getByRole('button', { name: T('Save ride') }).click();
    await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
    const cmp = page.getByRole('table', { name: new RegExp(T('Planned vs real')) });
    await expect(cmp).toBeVisible();
    await expect(cmp.getByRole('row', { name: new RegExp(T('Distance')) })).toContainText('50');
    await expect(cmp.getByRole('row', { name: new RegExp(T('Moving time')) })).toContainText('4:08');
    const speed = T('You ride faster than planned: {real} km/h instead of {plan}', { real: 14, plan: 12 });
    const longPause = T('Long pause at km {km}', { km: 40 });
    const learn = page.getByRole('list', { name: new RegExp(T('Learnings from this ride')) });
    await expect(learn.getByText(speed)).toBeVisible();
    await expect(learn.getByText(longPause)).toBeVisible();
    // nothing kept before a tap
    expect((await stored(page, 'learnings')).filter((l) => l.rideId)).toEqual([]);
    await noSideScroll(page, 'ride');
    if (lang === 'en') await shot(page, `ride-view-${info.project.name}`);

    // 4. One tap keeps the speed learning; "No" on the pause keeps nothing
    await learn.getByRole('group', { name: speed }).getByRole('button', { name: T('Remember') }).click();
    await expect(learn.getByText(T('Remembered'))).toBeVisible();
    await learn.getByRole('group', { name: longPause }).getByRole('button', { name: T('No') }).click();
    await expect(learn.getByText(T('Not kept'))).toBeVisible();
    const kept = (await stored(page, 'learnings')).filter((l) => l.rideId);
    expect(kept.map((l) => [l.topic, l.rule, l.source])).toEqual([['Pace', speed, title]]);

    // 5. The ride feeds your pace; the trip's debrief links to it; the overview counts it
    const settings = await stored(page, 'settings');
    expect(settings.find((s) => s.key === 'pace').value.rides.length).toBe(1);
    await page.goto(`./#/debrief/${TRIP}`);
    await expect(page.getByRole('link', { name: new RegExp(T('Planned vs real')) })).toBeVisible();
    // v0.49.0 R1: the one Rückblick page; uploading is a quiet link, the pace card one level below.
    await page.goto('./#/debrief');
    await expect(page.getByRole('link', { name: T('Upload ride') }).first()).toHaveAttribute('href', '#/debrief/ride');
    await expect(page.locator('.below')).toBeVisible();

    // 6. At 320 px nothing scrolls sideways either
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('./#/debrief/ride');
    await noSideScroll(page, 'upload at 320');
    await page.getByRole('link', { name: new RegExp(`test_data_gtp_ evening ${lang}`) }).click();
    await expect(learn).toBeVisible();
    await noSideScroll(page, 'ride at 320');
    if (lang === 'en' && info.project.name === 'phone') await shot(page, 'ride-view-320');
    expect(errors).toEqual([]);
  });
}

test('a ride without a trip: saved on its own, then made a past trip', async ({ page, context }, info) => {
  const T = tr('en');
  page.on('dialog', (d) => d.accept());
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'en'));
  const gpx = info.outputPath('test_data_gtp_solo.gpx');
  writeFileSync(gpx, makeGpx({ name: 'test_data_gtp_ solo', start: `${day(-3)}T16:00:00Z`, legs: [{ km: 25, kmh: 20 }] }));
  await page.goto('./#/debrief/ride');
  await page.locator('.pickbtn input[type=file]').setInputFiles(gpx);
  await expect(page.getByRole('button', { name: T('Ride only') })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  await expect(page.getByText(T('No trip on this day. Make it a past trip?'))).toBeVisible();
  await page.getByRole('button', { name: T('Make a past trip') }).click();
  await expect(page.getByText(T('Past trip made from this ride'))).toBeVisible();
  const trips = await stored(page, 'trips');
  expect(trips.find((x) => x.fromRide)).toMatchObject({ title: 'test_data_gtp_ solo', startDate: day(-3), days: 1, entries: [] });
  // v0.49.0 R1: one table; km in its own column.
  await page.goto('./#/pack/past');
  const row = page.locator('table.tt tbody tr').filter({ hasText: 'test_data_gtp_ solo' });
  await expect(row).toHaveCount(1);
  await expect(row.locator('td').first()).toHaveText('25');
});

test.describe('Android share target (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });
  test('a shared GPX opens the upload; shared text still goes to the Inbox', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'one browser is enough for the worker');
    const T = tr('en');
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript(() => localStorage.setItem('lang', 'en'));
    await page.goto('./#/debrief/ride');
    // wait until the worker controls the page (it claims open pages on activation)
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);
    const manifest = await (await page.request.get('./manifest.webmanifest')).json();
    expect(manifest.share_target).toMatchObject({ method: 'POST', enctype: 'multipart/form-data', action: '/packgenerator/share-target' });
    expect(manifest.share_target.params.files[0].accept).toContain('.gpx');

    // What Android does: a form POST of the file to the share target
    const gpx = info.outputPath('test_data_gtp_shared.gpx');
    writeFileSync(gpx, makeGpx({ name: 'test_data_gtp_ shared', start: `${day(-2)}T07:00:00Z`, legs: [{ km: 22, kmh: 20 }, { stopMin: 8 }, { km: 10, kmh: 20 }] }));
    await page.evaluate(() => {
      const f = document.createElement('form');
      f.method = 'POST';
      f.enctype = 'multipart/form-data';
      f.action = 'share-target';
      f.id = 'share';
      f.innerHTML = '<input type="file" name="ride">';
      document.body.append(f);
    });
    await page.locator('#share input').setInputFiles(gpx);
    await page.evaluate(() => document.getElementById('share').submit());
    await expect(page).toHaveURL(/#\/debrief\/ride\/shared$/);
    await expect(page.getByRole('heading', { name: /test_data_gtp_ shared/ })).toBeVisible();
    await expect(page.locator('.pz summary .nbadge')).toHaveText('1');
    await page.getByRole('button', { name: T('Save ride') }).click();
    await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
    // the shared file is tidied away once saved
    expect(await page.evaluate(async () => !!(await (await caches.open('pg-shared-ride')).match(new URL('shared-ride', location.href).href)))).toBe(false);

    // Text and links (no file): the Inbox quick note, as before
    await page.evaluate(() => {
      const f = document.createElement('form');
      f.method = 'POST';
      f.enctype = 'multipart/form-data';
      f.action = 'share-target';
      f.innerHTML = '<input name="title" value="test_data_gtp_ link"><input name="text" value="look at this">';
      document.body.append(f);
      f.submit();
    });
    await expect(page).toHaveURL(/#\/inbox$/);
    await expect(page.getByRole('dialog').locator('textarea')).toHaveValue(/test_data_gtp_ link\nlook at this/);
  });
});
