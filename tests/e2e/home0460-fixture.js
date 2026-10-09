// v0.46.0 «Startseite neu»: the fictional data and the opening of Today for home-0460.spec.js.
// The clock stands on Friday 9 October 2026; Open-Meteo is mocked, nothing leaves the preview.
import { expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

export const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
export const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
export const D0 = '2026-10-09';
export const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

export const entries = (n, packed = 0) => base.tables.items.slice(3, 3 + n).map((i, k) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: k < packed }));
export const trip = (id, start, extra = {}) => ({
  id: `test_data_gtp_${id}`, title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 1, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(6, 2), ready: [], status: 'planned', createdAt: `${day(-3)}T08:00:00.000Z`, ...extra,
});
const bike = (id, name, km, chainAt, extra = {}) => ({ ...base.tables.bikes[0], id, name, type: 'Gravel', km, kmDate: day(-1), ...(chainAt != null ? { parts: [{ key: 'chain', model: '', history: [{ date: day(-20), km: chainAt, action: 'service', result: 'done' }] }] } : {}), ...extra });

/** The fictional data: four bikes, the next trip tomorrow, a later one, a test trip, rides of the last weeks. */
export function homeFixture() {
  const data = structuredClone(base);
  const T = data.tables;
  T.bikes = [
    bike('bike-test', 'test_data_gtp_ Scale', 2288, 2000), // chain due: 288 km since the last lube
    bike('test_data_gtp_spark', 'test_data_gtp_ Spark', 1460, 1350), // chain in 40 km
    bike('test_data_gtp_factor', 'test_data_gtp_ Factor', 3689, 3680),
    { ...bike('test_data_gtp_lux', 'test_data_gtp_ Lux', null, null), km: undefined, kmDate: undefined },
  ];
  const done = (id, ago, km) => [trip(id, day(-ago), { status: 'done', entries: entries(4, 4), wx: { min: 8, max: 14, rain: 'none' } }), { tripId: `test_data_gtp_${id}`, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: {}, missing: [], applied: [], km, kmApplied: 0, doneAt: `${day(-ago)}T18:00:00.000Z` }];
  const past = [done('Napf', 3, 62), done('Jura', 9, 110), done('Emmental', 16, 74), done('Albis', 60, 55), done('Rigi', 200, 90)];
  T.trips = [
    trip('Herbstrunde', day(1), { days: 2, wx: { min: 6, max: 14, rain: 'none' } }),
    trip('Seetal', day(5)),
    { ...trip('TEST-Runde', day(0)), title: 'test_data_gtp_ TEST-Runde' },
    ...past.map((p) => p[0]),
  ];
  T.debriefs = past.map((p) => p[1]);
  T.notes = [{ id: 'test_data_gtp_n1', text: 'test_data_gtp_ Sattel knarzt', status: 'open', at: `${day(-1)}T07:00:00.000Z` }, { id: 'test_data_gtp_n2', text: 'test_data_gtp_ Licht', status: 'open', at: `${day(-1)}T08:00:00.000Z` }];
  T.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort, Aargau, Switzerland', lat: 47.39, lon: 8.04 } }];
  return data;
}

/** The mocked forecast: 16 days, 14 °C at 9:00, dry until 19:00 on the first day, dry otherwise. */
export async function mockWeather(context) {
  await context.route(/open-meteo\.com/, (route) => {
    const days = [...Array(16).keys()].map((n) => day(n));
    const time = days.flatMap((d) => [...Array(24).keys()].map((h) => `${d}T${String(h).padStart(2, '0')}:00`));
    return route.fulfill({ json: {
      daily: { time: days, temperature_2m_min: days.map(() => 7), temperature_2m_max: days.map(() => 16), precipitation_sum: days.map(() => 0), precipitation_probability_max: days.map((d, n) => (n === 0 ? 60 : 10)) },
      hourly: { time, temperature_2m: time.map(() => 14), precipitation_probability: time.map((s) => (s.startsWith(day(0)) && Number(s.slice(11, 13)) >= 19 ? 60 : 5)) },
    } });
  });
}

/** Today at 09:00 on D0, the language set, the data imported through "Your data". */
export async function openHome(page, context, info, { lang = 'de', data = homeFixture(), hour = 9, palette = null, mode = null } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T${String(hour).padStart(2, '0')}:00:00+02:00`));
  await context.addInitScript(([l, p, m]) => {
    localStorage.setItem('lang', l);
    if (p) localStorage.setItem('theme.palette', p);
    if (m) localStorage.setItem('theme.mode', m);
  }, [lang, palette, mode]);
  await page.goto('./');
  const T = tr(lang);
  const file = info.outputPath(`home0460-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(file, JSON.stringify(data));
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
  await page.goto('./#/');
  await page.evaluate(() => window.scrollTo(0, 0));
  return T;
}

