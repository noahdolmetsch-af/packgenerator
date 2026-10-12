// v0.112.0 «Strava-Verbindung» (E3, mockups S1–S5 approved by Noah 12.10.2026 13:39): connect (the way
// back from the Strava login carries the device key), the first fetch with its summary (S2), the
// settings (S3), «Zum Prüfen» with «Passt» (S5) and a changed Strava bike asked on Today (S4) with
// «Übernehmen». The server (packgen-three.vercel.app/api/strava) and the Strava login are answered by
// the test; everything else outside the preview server is blocked. Fictional bikes and rides only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
// SHOTS=<folder> saves screenshots of S1–S5 (1440 and 390 px)
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const GB = `${P}gravel_blau`;
const MR = `${P}mtb_rot`;
// calendar days in Zurich (never now + n × 24 h)
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const at = (n, hh = '07') => `${day(n)}T${hh}:00:00Z`;

const entry = (id, f) => ({ id: `${P}${id}`, time: null, kind: 'ride', source: 'csv', name: '', device: '', serial: null, profile: '', sensors: [], gear: '', type: '', stravaId: null, by: 'gear', sure: 'likely', state: 'counted', reason: null, note: '', importId: null, inclusive: false, span: null, tripId: null, at: `${f.date}T18:00:00.000Z`, ...f });

/** Two bikes with a start value 60 days ago, three MTB rides (so «Mountain Bike Ride» suggests MTB Rot) and one CSV ride. */
function seed() {
  const kmBook = [
    entry('s1', { bikeId: GB, date: day(-60), km: 6000, kind: 'start', source: 'hand', by: 'user', sure: 'user', note: 'Start value' }),
    entry('s2', { bikeId: MR, date: day(-60), km: 3000, kind: 'start', source: 'hand', by: 'user', sure: 'user', note: 'Start value' }),
    entry('m1', { bikeId: MR, date: day(-20), km: 25, type: 'Mountain Bike Ride', gear: 'MTB Rot' }),
    entry('m2', { bikeId: MR, date: day(-15), km: 30, type: 'Mountain Bike Ride', gear: 'MTB Rot' }),
    entry('m3', { bikeId: MR, date: day(-12), km: 28, type: 'Mountain Bike Ride', gear: 'MTB Rot' }),
    entry('c1', { bikeId: GB, date: day(-5), km: 50, type: 'Gravel Ride', gear: 'Gravel Blau', stravaId: '1003', name: 'Aus dem CSV' }),
  ];
  const bikes = [
    { id: GB, name: 'Gravel Blau', type: 'Gravel bike', slots: [], setup: {}, fixtures: [], km: 6050, kmDate: day(-5) },
    { id: MR, name: 'MTB Rot', type: 'Hardtail', slots: [], setup: {}, fixtures: [], km: 3083, kmDate: day(-12) },
  ];
  return { bikes, kmBook };
}

const gear = [{ id: 'g1', name: 'Gravel Blau', km: 6142, primary: true, retired: false }, { id: 'g2', name: 'MTB Rot', km: 3103, primary: false, retired: false }];
const act = (id, f) => ({ id, name: `Runde ${id}`, type: 'GravelRide', start: at(-3), startLocal: null, km: 42, hm: 300, movingS: 6000, gearId: 'g1', device: 'Garmin Edge 540', commute: false, trainer: false, ...f });
const RIDES = [
  act('1001', { name: 'Morgenrunde', start: at(-3), km: 42 }),
  act('1002', { name: 'Feierabend im Wald', type: 'MountainBikeRide', start: at(-2), km: 20, gearId: 'g2' }),
  act('1003', { name: 'Aus dem CSV', start: at(-5), km: 50 }),
  act('1004', { name: 'Ganz alt', start: '2024-05-04T07:00:00Z', km: 60 }),
  act('1005', { name: 'Pendeln', type: 'MountainBikeRide', start: at(-1), km: 9, gearId: null }),
  act('1006', { name: 'Lauf', type: 'Run', start: at(-1), km: 8, gearId: null }),
];

async function writeTables(page, data) {
  await page.evaluate(
    (data) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(Object.keys(data), 'readwrite');
          for (const [name, rows] of Object.entries(data)) for (const row of rows) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => fail(tx.error);
        };
      }),
    data,
  );
}
const readTable = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    name,
  );

async function start(page, context, server) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/strava/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    server.log.push({ step, auth: req.headers().authorization ?? null, page: url.searchParams.get('page'), after: url.searchParams.get('after') });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://www.strava.com/oauth/authorize?client_id=1&state=x' });
    if (step === 'status') return body({ connected: true, athlete: { firstname: 'Beispiel' } });
    if (step === 'gear') return body({ bikes: gear });
    if (step === 'activities') return body({ page: Number(url.searchParams.get('page')), more: false, activities: server.rides });
    if (step === 'disconnect') return body({});
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  // the Strava login: straight back into the app, with the key in the fragment (as api/strava.js callback does)
  await context.route(/www\.strava\.com\/oauth\/authorize/, (route) =>
    route.fulfill({ status: 302, headers: { location: `${server.app}#/bikes?tab=care&view=strava&strava=connected&key=${P}key` } }),
  );
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await writeTables(page, seed());
  await page.reload();
  await ready(page);
}

test('Strava: connect, first fetch, settings, «Zum Prüfen», a changed bike on Today', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const server = { log: [], rides: RIDES, app: baseURL };
  await start(page, context, server);

  // S1: not connected on this device; the file import stays as the reserve
  await page.goto('./#/bikes?tab=care&view=strava');
  await expect(page.getByRole('heading', { level: 1, name: 'Strava verbinden' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Datei importieren \(Reserve\)/ })).toHaveAttribute('href', /view=import/);
  await shot(page, info, 'S1');
  await page.getByRole('button', { name: 'Mit Strava verbinden' }).click();

  // back from the login: the key is stored on this device only, the address is clean again; S2
  await expect(page.getByRole('heading', { level: 1, name: 'Alle Fahrten geholt' })).toBeVisible();
  expect(page.url()).not.toContain('key=');
  expect(await page.evaluate(() => localStorage.getItem('pg.strava.key'))).toBe(`${P}key`);
  expect(server.log.find((x) => x.step === 'start').auth).toBe(null);
  expect(server.log.find((x) => x.step === 'activities')).toMatchObject({ auth: `Bearer ${P}key`, page: '1', after: null });
  const sum = page.locator('section.sum');
  await expect(sum.locator('.found')).toContainText('5 Fahrten gefunden');
  await expect(sum.locator('.srows li').nth(0)).toContainText('1 schon da');
  await expect(sum.locator('.srows li').nth(1)).toContainText('1 schon im km-Stand');
  await expect(sum.locator('.srows li').nth(2)).toContainText('2 neu zugeordnet');
  await expect(sum.locator('.srows li').nth(3)).toContainText('1 zum Prüfen');
  await expect(page.getByText('nur die 2 neuen Fahrten')).toBeVisible();
  await expect(page.locator('li.orow').filter({ hasText: 'Gravel Blau' })).toContainText('+42 km');
  await expect(page.locator('li.orow').filter({ hasText: 'MTB Rot' })).toContainText('+20 km');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await shot(page, info, 'S2');

  // S3: the settings, stored and changeable
  await page.getByRole('button', { name: 'Fertig', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Strava' })).toBeVisible();
  await expect(page.locator('.conn')).toContainText('Verbunden');
  await expect(page.locator('.conn')).toContainText('als «Beispiel»');
  await expect(page.getByRole('radio', { name: /Automatisch beim Öffnen/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /Zum Prüfen mit Vorschlag/ })).toBeChecked();
  await page.getByRole('radio', { name: /Nur per Knopf/ }).check();
  await expect.poll(async () => (await readTable(page, 'settings')).find((s) => s.key === 'strava')?.value.fetch).toBe('button');
  await expect(page.locator('li.map[data-gear="g1"]')).toContainText('gleicher Name');
  await expect(page.locator('li.map[data-gear="g1"] select')).toHaveValue(GB);
  await shot(page, info, 'S3');

  // S5: the ride without a bike, with the suggestion from the usual MTB rides; one tap «Passt»
  await page.getByRole('link', { name: /1 Fahrt zum Prüfen/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Zum Prüfen' })).toBeVisible();
  const ride = page.locator('li.ride[data-ride="1005"]');
  await expect(ride).toContainText('Vorschlag: MTB Rot');
  await expect(ride).toContainText('wie deine letzten 3 Fahrten');
  await shot(page, info, 'S5');
  await ride.getByRole('button', { name: 'Passt' }).click();
  await expect(page.getByText('Nichts zu prüfen. Jede Fahrt aus Strava hat ihr Velo.')).toBeVisible();
  await expect.poll(async () => (await readTable(page, 'bikes')).find((b) => b.id === MR).km).toBe(3083 + 20 + 9);

  // S4: Strava has another bike for «Morgenrunde» now: «Jetzt holen» asks, on Today on top
  server.rides = RIDES.map((a) => (a.id === '1001' ? { ...a, gearId: 'g2' } : a));
  await page.goto('./#/bikes?tab=care&view=strava');
  await page.getByRole('button', { name: 'Jetzt holen' }).click();
  await expect(page.locator('.conn .got')).toContainText('Keine neuen Fahrten');
  expect(Number(server.log.filter((x) => x.step === 'activities').at(-1).after)).toBeGreaterThan(0);
  await page.goto('./#/');
  const q = page.locator('[data-strava-change="1001"]');
  await expect(q).toBeVisible();
  await expect(q).toContainText('Velo in Strava geändert');
  await expect(q).toContainText('jetzt ‹MTB Rot› statt ‹Gravel Blau›');
  await expect(page.locator('[data-strava-questions]')).toHaveText('1 Frage von Strava');
  // the tile «Strava» went on top of Today when this device connected
  await expect(page.locator('.wall [data-tile="strava"]')).toContainText('Strava');
  await shot(page, info, 'S4');
  // the same question on the bike's care page
  await page.goto(`./#/bikes?tab=care&bike=${GB}&open=1`);
  await expect(page.locator('[data-strava-change="1001"]')).toBeVisible();
  await page.goto('./#/');
  await q.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(q).toHaveCount(0);
  await expect.poll(async () => (await readTable(page, 'kmBook')).find((e) => e.stravaId === '1001')?.bikeId).toBe(MR);
  await expect.poll(async () => (await readTable(page, 'bikes')).find((b) => b.id === GB).km).toBe(6050);
  expect(errors).toEqual([]);
});
