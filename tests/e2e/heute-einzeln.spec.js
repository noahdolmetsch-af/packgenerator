// Einzelideen Heute (Noah 25.10.2026, Nr. 1, 2, 4, 5, 6, 7, 8), German UI, fictional data only:
// 1 «Zu Hause: wie war es wirklich?» on the weather page, 2 «Überraschungsrunde» from «Neu» (the bike router
// is answered by the test), 4 a low evening score split in parts, 5 three wet rides make one chain task,
// 6 «Nach der Standzeit» on «Verschleiss», 7 the interest check of the first start, 8 «Hat sich etwas
// geändert?» in «Stimmt das noch?». With SHOTS=<folder> each step also writes a picture (390 and 1440 px).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS || '';
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const HOME = { name: 'Testdorf', lat: 47.0, lon: 8.0 };

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
BIKE.parts = [
  {
    key: 'chain',
    model: 'Test chain',
    history: [
      {
        date: day(-30),
        km: 100,
        value: null,
        action: 'service',
        result: 'done',
        by: 'self',
        note: '',
      },
    ],
  },
  { key: 'tyres', history: [] },
];
const WINTER = {
  ...structuredClone(BIKE),
  id: 'bike-winter',
  name: 'Test-Rennvelo',
  parts: [
    { key: 'chain', history: [] },
    { key: 'tyres', history: [] },
    { key: 'fork', history: [] },
  ],
};
base.tables.bikes = [BIKE, WINTER];
const line = (lat, lon) => Array.from({ length: 20 }, (_, i) => [lat + i * 0.01, lon + i * 0.004]);
base.tables.trips = [
  {
    id: 'tr-now',
    title: 'Test-Runde',
    domain: 'bikepacking',
    startDate: day(-1),
    days: 3,
    status: 'planned',
    bikeId: BIKE.id,
    bike: BIKE.name,
    setup: {},
    overnight: 'outdoor',
    cook: false,
    sets: {},
    purpose: {},
    ready: [],
    entries: [],
    route: { km: 40, line: line(47.02, 8.0) },
    createdAt: `${day(-5)}T08:00:00Z`,
    updatedAt: `${day(-5)}T08:00:00Z`,
  },
];
base.tables.settings = [
  ...base.tables.settings,
  { key: 'homePlace', value: HOME },
  {
    key: 'wxHomeFeel',
    value: [day(-9), day(-6), day(-3)].map((d, i) => ({
      id: `hf${i}`,
      day: d,
      wind: 18,
      dir: 265,
      sunH: 6,
      feltWind: 'less',
      feltSun: i ? 'less' : 'same',
    })),
  },
];
const ride = (id, bikeId, date, km) => ({
  id,
  bikeId,
  date,
  km,
  kind: 'ride',
  state: 'counted',
});
const KM = [ride('r1', BIKE.id, day(-4), 12), ride('r2', BIKE.id, day(-2), 15), ride('r3', BIKE.id, day(0), 9), ride('r4', WINTER.id, day(-60), 40)];
const RAIN = {
  key: 'inspectRain',
  at: new Date().toISOString(),
  lat: HOME.lat,
  lon: HOME.lon,
  place: HOME.name,
  days: { [day(-4)]: 6, [day(-2)]: 3, [day(0)]: 4 },
  spots: {},
};

/** A small weather answer: 4 days of hours from yesterday on, west wind, mostly sunny. */
function core() {
  const start = Date.parse(`${day(-1)}T00:00:00Z`) / 1000;
  const n = 96;
  const a = (f) => Array.from({ length: n }, (_, i) => f(i));
  return {
    latitude: HOME.lat,
    longitude: HOME.lon,
    elevation: 450,
    utc_offset_seconds: 3600,
    hourly: {
      time: a((i) => start + i * 3600),
      temperature_2m: a((i) => 8 + (i % 24 > 9 && i % 24 < 17 ? 6 : 0)),
      apparent_temperature: a(() => 6),
      precipitation_probability: a(() => 5),
      precipitation: a(() => 0),
      weather_code: a((i) => (i % 24 > 8 && i % 24 < 16 ? 1 : 3)),
      wind_speed_10m: a(() => 16),
      wind_gusts_10m: a(() => 28),
      wind_direction_10m: a(() => 268),
      cape: a(() => 0),
      freezing_level_height: a(() => 2500),
      visibility: a(() => 20000),
      snowfall: a(() => 0),
      snow_depth: a(() => 0),
    },
    daily: {
      time: a((i) => start + i * 86400).slice(0, 4),
      sunrise: [0, 1, 2, 3].map((i) => start + i * 86400 + 6 * 3600),
      sunset: [0, 1, 2, 3].map((i) => start + i * 86400 + 17 * 3600),
      uv_index_max: [2, 2, 2, 2],
    },
  };
}
const ROUND = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        'track-length': '34200',
        'filtered ascend': '310',
        'total-time': '6800',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [8.0, 47.0, 450],
          [7.9, 46.95, 520],
          [7.85, 47.02, 600],
          [7.95, 47.05, 480],
          [8.0, 47.0, 450],
        ],
      },
    },
  ],
};

const put = (page, store, rows) =>
  page.evaluate(
    ([s, r]) =>
      new Promise((ok, no) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const tx = o.result.transaction(s, 'readwrite');
          for (const x of r) tx.objectStore(s).put(x);
          tx.oncomplete = () => (o.result.close(), ok());
          tx.onerror = () => no(tx.error);
        };
      }),
    [store, rows],
  );

async function shot(page, name, el = null) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const w = page.viewportSize().width;
  if (el) await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${SHOTS}/${name}-${w >= 1000 ? 1440 : 390}.png`,
  });
}

async function load(page, context, info) {
  page.on('dialog', (d) => {
    throw new Error(`browser dialog: ${d.message()}`);
  });
  await context.route(/brouter\.de/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ROUND),
    }),
  );
  await context.route(/api\.open-meteo\.com/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(core()),
    }),
  );
  await context.route(/^https?:\/\/(?!localhost[:/])(?!brouter\.de)(?!api\.open-meteo\.com)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const file = info.outputPath('heute.json');
  writeFileSync(file, JSON.stringify(base));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await put(page, 'kmBook', KM);
  await put(page, 'meta', [RAIN]);
}

test('weather at home, surprise round, rating in parts', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context, info);

  // 1 the weather page of the home place: your own hint for today's west wind
  await page.goto('./#/wetter');
  const hf = page.locator('[data-home-feel]');
  await expect(hf).toBeVisible();
  await expect(hf.locator('[data-home-feel-hint]')).toContainText(T('With wind from the {side} it is mostly calmer on your spot than forecast ({n} of {of} times).', { side: T('west'), n: 3, of: 3 }));
  await hf.locator('[data-home-wind="less"]').click();
  await shot(page, 'H1-zu-hause', hf);
  await hf.locator('[data-home-feel-save]').click();
  await expect(hf.locator('[data-home-feel-list] li')).toHaveCount(4);

  // 2 surprise round from «Neu»
  await page.goto('./#/trips');
  await settle(page, { sameTrips: false });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new', { detail: 'all' })));
  await page.locator('[data-new-surprise]').click();
  const sr = page.locator('[data-surprise]');
  await expect(sr).toBeVisible();
  await sr.locator('[data-sr-level="wild"]').click();
  await sr.locator('[data-sr-hours="2"]').click();
  await sr.locator('[data-sr-go]').click();
  await expect(sr.locator('[data-sr-result]')).toContainText('34');
  await shot(page, 'H2-ueberraschung');
  await sr.locator('[data-sr-plan]').click();
  await expect(sr).toBeHidden();
  await expect(page.getByText(T('Surprise round')).first()).toBeVisible();

  await expect(page.getByText(T('Surprise round planned: {km} km. Undo deletes the trip.', { km: '34' }))).toBeHidden({ timeout: 20_000 });

  // 4 the evening review: a 4 asks what it was about
  await page.goto('./#/check/evening');
  const at = page.locator('[data-abendtour]');
  await expect(at).toBeVisible();
  await at.getByRole('button', { name: '4', exact: true }).click();
  const parts = at.locator('[data-abendtour-parts]');
  await expect(parts).toBeVisible();
  await parts.locator('[data-part="exp"][data-mark="good"]').click();
  await parts.locator('[data-part="plan"][data-mark="hard"]').click();
  await expect(parts.locator('[data-part="plan"][data-mark="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'H4-bewertung', at);

  expect(errors).toEqual([]);
});

test('wet rides as one task, check after the standstill, something changed', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context, info);

  // 5 three wet rides since the last chain care: one task
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const wet = page.locator('[data-wet-chain]');
  await expect(wet.locator('[data-wet-chain-series]')).toBeVisible();
  await expect(wet).toContainText(T('Care for the chain'));
  await shot(page, 'H5-regen', wet);

  // 6 the winter bike stood 60 days
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${WINTER.id}`);
  await page.reload();
  const st = page.locator('[data-stand-check]');
  await expect(st).toBeVisible();
  await expect(st.locator('[data-stand="suspension"]')).toBeVisible();
  await expect(st.locator('[data-stand="sealant"]')).toBeVisible();
  await st.locator('[data-stand="tyres"] [data-stand-mark="ok"]').click();
  await st.locator('[data-stand="sealant"] [data-stand-mark="todo"]').click();
  await expect(st.locator('[data-stand-problem]')).toBeVisible();
  await shot(page, 'H6-standzeit', st);
  await st.locator('[data-stand-done]').click();
  await expect(st).toBeHidden();

  // 8 «Stimmt das noch?» with «Ich bin umgezogen»
  await page.goto('./#/me/data?yearcheck');
  const yc = page.locator('[data-yc-change]');
  await expect(yc).toBeVisible();
  await yc.locator('[data-yc-change-pick="move"]').click();
  await expect(yc.locator('[data-yc-life="home"]')).toBeVisible();
  await yc
    .locator('[data-yc-life="home"]')
    .getByRole('button', { name: T('Still right') })
    .click();
  await shot(page, 'H8-lebensaenderung', yc);
  expect(errors).toEqual([]);
});

test('first start: the interest check picks the examples', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => (localStorage.setItem('lang', 'de'), localStorage.setItem('firstStart.ask', '1')));
  await page.goto('./');
  const win = page.getByTestId('first-start');
  await expect(win).toBeVisible();
  await win.locator('[data-choice="examples"]').click();
  await expect(win.locator('[data-interest][aria-pressed="true"]')).toHaveCount(3);
  await win.locator('[data-interest="nights"]').click();
  await win.locator('[data-interest="active"]').click();
  await expect(win.locator('[data-interest][aria-pressed="true"]')).toHaveCount(1);
  // the last one stays on
  await win.locator('[data-interest="days"]').click();
  await expect(win.locator('[data-interest="days"]')).toHaveAttribute('aria-pressed', 'true');
  await win.locator('[data-interest="active"]').click();
  await shot(page, 'H7-beispiele');
  await win.locator('[data-choice="examples-go"]').click();
  await win.locator('[data-choice="notour"]').click();
  const ids = await page.evaluate(() => new Promise((ok) => {
    const o = indexedDB.open('pack-generator');
    o.onsuccess = () => {
      const q = o.result.transaction('trips').objectStore('trips').getAllKeys();
      q.onsuccess = () => (o.result.close(), ok(q.result));
    };
  }));
  expect(ids).toEqual(['ex-past']);
  expect(errors).toEqual([]);
});
