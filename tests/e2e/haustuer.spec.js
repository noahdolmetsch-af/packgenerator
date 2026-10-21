// Paket W «Von der Haustür bis zurück» (Noah 20.10.2026 «1a 2a 3a 4a»): on Planen the card with plan B, the check-in
// per night and the people for «Gut angekommen»; on Unterwegs the plan B hint with heavy rain, «Plan B nehmen» with
// Undo, tonight's check-in, the share sheet «Gut angekommen» and «Velo abgestellt»; in the evening the window «Plan B».
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js), every outside
// address blocked, open-meteo answered by the test.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day, entries, D0 } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const line = Array.from({ length: 30 }, (_, i) => [47.36 + i * 0.002, 7.15 + i * 0.004]);
const route = (name, km) => ({ name, km, gainM: 600, lossM: 600, start: { lat: 47.36, lon: 7.15 }, end: { lat: 47.418, lon: 7.266 }, line, profile: Array.from({ length: 20 }, (_, k) => [k * (km / 19), 450 + k * 10]) });
const RUN = 'test_data_gtp_Jura-Regen';
const PLAN = 'test_data_gtp_Alpen-Plan';
const CONTACTS = [{ id: 'test_data_gtp_c1', name: 'test_data_gtp_Anna', phone: '+41 79 000 00 01' }, { id: 'test_data_gtp_c2', name: 'test_data_gtp_Ben', phone: '+41 79 000 00 02' }];
const wet = (d) => ({ fetchedAt: `${D0}T07:00:00.000Z`, places: [{ name: 'Start of the day', lat: 47.36, lon: 7.15, hours: Array.from({ length: 24 }, (_, h) => ({ t: `${d}T${String(h).padStart(2, '0')}:00`, h, temp: 9, rainMm: h >= 8 && h <= 16 ? 2.4 : 0, rainPct: 90, wind: 20, gust: 45 })) }] });

function data() {
  const d = homeFixture();
  d.tables.trips = [
    trip('Jura-Regen', day(-1), { days: 3, route: route('test_data_gtp_ Lang', 186), planB: { kind: 'short', note: 'test_data_gtp_ dem See entlang', route: route('test_data_gtp_ Kurz', 42) }, stays: [{ n: 1, name: 'test_data_gtp_ Hotel Post', until: '10:00', phone: '+41 32 000 00 00' }], rideWx: { [day(0)]: wet(day(0)) } }),
    trip('Alpen-Plan', day(4), { days: 2, route: route('test_data_gtp_ Pass', 120) }),
    ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title)),
  ];
  d.tables.items = [...d.tables.items, { ...d.tables.items[3], id: 'test_data_gtp_lock', name: 'test_data_gtp_ Folding lock', nameDe: 'test_data_gtp_ Faltschloss' }];
  d.tables.settings = [...d.tables.settings, { key: 'notfall', value: { contacts: CONTACTS } }];
  return d;
}

async function open(page, context, info, chosen, hour = 9) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), chosen);
  return openHome(page, context, info, { data: data(), hour });
}

test('Planen: plan B, check-in per night with the late warning, the people for Gut angekommen', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, PLAN);
  await page.goto('./#/pack');
  const card = page.locator('[data-door]');
  await expect(card).toContainText(T('From the door and back'));
  expect(await noSideways(page)).toBe(0);

  // plan B: the train home, with a note
  const pb = card.locator('[data-door-planb]');
  await tap(pb.locator('summary'), info);
  await tap(pb.getByRole('button', { name: T('Train home') }), info);
  await pb.getByRole('textbox').fill('test_data_gtp_ ab Andermatt mit dem Zug');
  await pb.getByRole('textbox').blur();
  await expect(pb.locator('summary')).toContainText(T('Train home'));

  // check-in: until 08:30 on night 1 is too late for a ride that starts at 08:00
  const ci = card.locator('[data-door-checkin]');
  await tap(ci.locator('summary'), info);
  await ci.locator('[data-night="0"] [data-checkin-until]').fill('08:30');
  await ci.locator('[data-night="0"] [data-checkin-until]').blur();
  await expect(ci.locator('[data-checkin-late]')).toContainText('km/h');
  await expect(ci.locator('summary')).toContainText(T('{n} arrival too late', { n: 1 }));
  await ci.locator('[data-night="0"] [data-checkin-until]').fill('22:00');
  await ci.locator('[data-night="0"] [data-checkin-until]').blur();
  await expect(ci.locator('[data-checkin-ok]')).toBeVisible();

  // «Gut angekommen»: pick Anna
  const ar = card.locator('[data-door-arrived]');
  await tap(ar.locator('summary'), info);
  await tap(ar.getByRole('button', { name: 'test_data_gtp_Anna' }), info);
  await expect(ar.getByRole('button', { name: 'test_data_gtp_Anna' })).toHaveAttribute('aria-pressed', 'true');
  await expect(ar.locator('summary')).toContainText(T('{n} person', { n: 1 }));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Unterwegs: plan B with heavy rain, take it and Undo; the check-in of tonight is late', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, RUN);
  await page.goto('./#/ride');
  const door = page.locator('[data-ride-door]');
  const pb = door.locator('[data-ride-planb]');
  await expect(pb).toContainText(T('heavy rain ({n} mm)', { n: 22 }));
  await expect(pb).toContainText('test_data_gtp_ dem See entlang');
  await expect(door.locator('[data-ride-checkin]')).toContainText('test_data_gtp_ Hotel Post');
  await expect(door.locator('[data-ride-checkin]')).toContainText(T('Call the accommodation'));
  expect(await noSideways(page)).toBe(0);

  await tap(pb.locator('[data-planb-swap]'), info);
  await expect(pb).toContainText(T('Plan B is the route now'));
  const km = () => page.evaluate(async (id) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((ok) => (req.onsuccess = () => ok(req.result)));
    return new Promise((ok) => (db.transaction('trips').objectStore('trips').get(id).onsuccess = (e) => ok(e.target.result.route.km)));
  }, RUN);
  await expect.poll(km).toBe(42);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(km).toBe(186);
  await expect(pb).not.toContainText(T('Plan B is the route now'));
  expect(errors).toEqual([]);
});

test('Unterwegs: Gut angekommen shares a ready text with the chosen people', async ({ page, context }, info) => {
  await open(page, context, info, RUN);
  await page.goto('./#/ride');
  // the share sheet of the phone: the test keeps what would be shared
  await page.evaluate(() => {
    window.__shared = [];
    navigator.share = async (x) => void window.__shared.push(x);
  });
  await tap(page.locator('[data-uw-arrived]'), info);
  const dlg = page.locator('dialog[data-arrived]');
  await expect(dlg).toHaveJSProperty('open', true);
  await tap(dlg.locator('[data-arrived-person="test_data_gtp_Ben"]'), info);
  await expect(dlg.locator('[data-arrived-text]')).toHaveValue(/^Hallo test_data_gtp_Ben, ich bin gut angekommen, um \d\d:\d\d\./);
  await expect(dlg.locator('[data-arrived-sms]')).toHaveAttribute('href', /^sms:\+41790000002\?body=Hallo/);
  await tap(dlg.locator('[data-arrived-share]'), info);
  await expect.poll(() => page.evaluate(() => window.__shared.length)).toBe(1);
  expect(await page.evaluate(() => window.__shared[0].text)).toContain('test_data_gtp_Ben');
  // the choice stays with the trip
  await dlg.getByRole('button', { name: T('Close') }).click();
  await tap(page.locator('[data-uw-arrived]'), info);
  await expect(page.locator('dialog[data-arrived] [data-arrived-person="test_data_gtp_Ben"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Velo abgestellt: place and lock on this device, then Wo steht mein Velo, picked up with Undo', async ({ page, context }, info) => {
  await open(page, context, info, RUN);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 47.37, longitude: 7.16, accuracy: 12 });
  await page.goto('./#/ride');
  await tap(page.locator('[data-uw-helpers] [data-uw-parked]'), info);
  const dlg = page.locator('dialog[data-parked]');
  await expect(dlg).toHaveJSProperty('open', true);
  await tap(dlg.locator('[data-parked-lock="test_data_gtp_lock"]'), info);
  await dlg.getByLabel(T('Note|parked')).fill('test_data_gtp_ Ebene 2');
  await tap(dlg.locator('[data-parked-save]'), info);
  await expect(dlg.getByRole('heading', { name: T('Where is my bike?') })).toBeVisible();
  await expect(dlg.locator('[data-parked-facts]')).toContainText('test_data_gtp_ Faltschloss');
  await expect(dlg.locator('[data-parked-map]')).toHaveAttribute('href', /query=47\.37000,7\.16000/);
  // after a reload it is still there; never in a backup
  await page.reload();
  await tap(page.locator('[data-uw-helpers] [data-uw-parked]'), info);
  await expect(page.locator('dialog[data-parked] [data-parked-facts]')).toContainText('test_data_gtp_ Ebene 2');
  await tap(page.locator('dialog[data-parked] [data-parked-done]'), info);
  await expect(page.locator('dialog[data-parked] [data-parked-save]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('dialog[data-parked] [data-parked-facts]')).toBeVisible();
});

test('the evening before a rainy trip day: the window Plan B, not on Heute itself', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = data();
  // only the planned trip, fully packed (no «Packen» window), with a plan B, starting tomorrow
  d.tables.trips = [trip('Morgen-Regen', day(1), { days: 2, route: route('test_data_gtp_ Morgen', 90), entries: entries(4, 4), planB: { kind: 'train', note: 'test_data_gtp_ Zug ab Biel' } })];
  await context.addInitScript(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_Morgen-Regen'));
  await openHome(page, context, info, { data: d, hour: 16 });
  await expect(page.locator('dialog[data-window]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('test_data_gtp_ Zug ab Biel');
  // from now on open-meteo brings 3 mm an hour tomorrow
  await context.route(/open-meteo\.com/, (r) => {
    const time = Array.from({ length: 24 }, (_, h) => `${day(1)}T${String(h).padStart(2, '0')}:00`);
    return r.fulfill({ json: { hourly: { time, temperature_2m: time.map(() => 9), precipitation: time.map(() => 3), precipitation_probability: time.map(() => 95), wind_speed_10m: time.map(() => 15), wind_gusts_10m: time.map(() => 30) } } });
  });
  await page.clock.setFixedTime(new Date(`${D0}T18:00:00+02:00`));
  await page.reload();
  const win = page.locator('dialog[data-window="planb"]');
  await expect(win).toHaveJSProperty('open', true);
  await expect(win).toContainText('test_data_gtp_ Zug ab Biel');
  await expect(win).toContainText(T('Your plan B: the train home.'));
  expect(await noSideways(page)).toBe(0);
  await win.locator('[data-window-today]').click();
  await expect(win).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('dialog[data-window="planb"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
