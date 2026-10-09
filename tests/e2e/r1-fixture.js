// v0.49.0 R1 «Rückblick ruhig»: fictional data for the one Rückblick page, Past trips as a table and
// a trip's saved Rückblick. Clock: Friday 9 October 2026. Names are made up; ids carry test_data_gtp_.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const P = 'test_data_gtp_';
export const D0 = '2026-10-09';
export const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

/** A made-up height profile: [[km, m]], a few hills. */
function profile(km, low, high, seed = 1) {
  const n = 60;
  return Array.from({ length: n }, (_, i) => {
    const x = (i / (n - 1)) * km;
    const e = low + (high - low) * (0.5 + 0.3 * Math.sin(i / (4 + seed)) + 0.2 * Math.sin(i / (9 - seed / 2)));
    return [Math.round(x * 100) / 100, Math.round(e)];
  });
}

const ids = (...k) => k.map((id, n) => ({ itemId: id, slot: ['seat', 'frame', 'top'][n % 3], qty: 1, packed: true }));
const DAY_KIT = ids('EL01', 'EL02', 'LI01', 'LI02', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03');
const NIGHT_KIT = ids('EL01', 'EL02', 'EL03', 'LI01', 'LI02', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03', 'SL01', 'HY01', 'OF01', 'HY02', 'LX01');

/**
 * id, days ago (start), days, km, Hm, moving h, temps, rain by day (mm), extra.
 * Every trip gets a GPX route (the plan) and one recorded ride per day (the real).
 */
function made({ id, title, ago, days = 1, km, gain, h, min, max, rain = [], bike = 'bike-test', extra = {}, debrief = 'done', note = '', unused = [], missing = [], broken = [], planKm = null, planGain = null, planH = null }) {
  const start = day(-ago);
  const tripId = `${P}${id}`;
  const forecastDays = Array.from({ length: days }, (_, n) => ({ date: day(-ago + n), min: min + n, max: max - n, rainMm: rain[n] ?? 0, rainPct: rain[n] ? 80 : 10 }));
  const trip = {
    id: tripId, title, domain: 'bikepacking', startDate: start, days, bikeId: bike, bike: bike === 'bike-test' ? 'Gravel Grau' : 'Rennrad Blau',
    setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: days > 1 ? NIGHT_KIT : DAY_KIT, ready: [], status: 'done',
    overnight: days > 1 ? 'outdoor' : 'none',
    route: { name: title, km: planKm ?? km, gainM: planGain ?? gain, profile: profile(km, 400, 400 + gain / Math.max(1, days) / 2, (ago % 5) + 1) },
    forecast: { fetchedAt: `${day(-ago - 1)}T07:00:00.000Z`, place: { name: 'Testort', lat: 47.3, lon: 8.5 }, days: forecastDays },
    wx: { min, max, rain: rain.some((r) => r >= 5) ? 'rain' : rain.some((r) => r >= 1) ? 'showers' : 'none' },
    hours: planH ?? null,
    createdAt: `${day(-ago - 5)}T08:00:00.000Z`,
    ...extra,
  };
  const rides = Array.from({ length: days }, (_, n) => ({
    id: `${P}ride-${id}-${n}`, name: `${title} ${days > 1 ? `Tag ${n + 1}` : ''}`.trim(), date: day(-ago + n), startAt: `${day(-ago + n)}T08:00:00.000Z`,
    km: Math.round((km / days) * 10) / 10, gainM: Math.round(gain / days), lossM: Math.round(gain / days), movingH: Math.round((h / days) * 100) / 100,
    pauseH: 0.4, totalH: Math.round((h / days + 0.4) * 100) / 100, pauses: [{ km: 20, at: `${day(-ago + n)}T10:00:00.000Z`, min: 14 }, { km: 31, at: `${day(-ago + n)}T11:00:00.000Z`, min: 8 }],
    tripId, plan: { km: Math.round(((planKm ?? km) / days) * 10) / 10, gainM: Math.round((planGain ?? gain) / days), hours: planH ? Math.round((planH / days) * 100) / 100 : Math.round(((km / days) / 16 + gain / days / 600) * 100) / 100, kmh: null, source: planH ? 'hours' : 'guess' },
    profile: profile(km / days, 400, 400 + gain / days / 2, n + 2), createdAt: `${day(-ago + n)}T18:00:00.000Z`,
  }));
  const deb = debrief === 'none' ? null : {
    tripId, status: debrief, weather: 'planned', amount: 'right', bags: 'fine', note, clothing: 'fit',
    items: Object.fromEntries([...unused.map((x) => [x, 'unused']), ...broken.map((x) => [x, 'broken'])]),
    missing: missing.map((name, n) => ({ id: `m${n}`, name, itemId: null })), applied: debrief === 'done' ? ['home:LX01'] : [], km, kmApplied: debrief === 'done' ? km : 0,
    doneAt: debrief === 'done' ? `${day(-ago + days)}T18:00:00.000Z` : undefined, updatedAt: `${day(-ago + days)}T18:00:00.000Z`,
  };
  return { trip, rides, deb };
}

export function r1Data() {
  const data = structuredClone(base);
  const T = data.tables;
  T.bikes = [
    { ...T.bikes[0], name: 'Gravel Grau', km: 5400, kmDate: day(-1) },
    { ...T.bikes[0], id: 'bike-road', name: 'Rennrad Blau', km: 9100, kmDate: day(-1) },
  ];
  const all = [
    made({ id: 'abend', title: 'Abendrunde Hügel', ago: 3, km: 42, gain: 780, h: 2.97, min: 9, max: 14, debrief: 'none', planH: 3.1 }),
    made({ id: 'herbst', title: 'Herbsttour Hochland', ago: 13, days: 2, km: 148, gain: 2210, h: 11.08, min: 4, max: 15, rain: [0, 6], note: 'Überschuhe ab 8 °C mitnehmen', unused: ['LX01', 'HY02', 'OF01'], missing: ['Buff'], broken: ['LI01'], planKm: 142, planGain: 2100, planH: 11.7 }),
    made({ id: 'loop', title: 'Drei-Täler-Loop', ago: 42, days: 3, km: 214, gain: 4900, h: 13.17, min: 9, max: 22, rain: [0, 2, 0], extra: { overnight: 'lodging' }, note: 'Zu wenig Riegel für den zweiten Tag', unused: ['LX01'] }),
    made({ id: 'see', title: 'Seerunde', ago: 54, km: 58, gain: 410, h: 3.2, min: 18, max: 27, note: '2 Flaschen reichen bis 25°' }),
    made({ id: 'pass', title: 'Passfahrt', ago: 62, km: 172, gain: 5290, h: 13.83, min: 7, max: 24, bike: 'bike-road', extra: { event: true }, note: 'Windweste reicht für alle Abfahrten' }),
    made({ id: 'huegel', title: 'Hügelrunde', ago: 82, km: 72, gain: 1800, h: 5.97, min: 14, max: 26, rain: [8], note: '' }),
    made({ id: 'sommer', title: 'Sommertour drei Etappen', ago: 97, days: 3, km: 498, gain: 9800, h: 37.33, min: 4, max: 23, rain: [0, 7, 0], note: 'Ab 2000 Hm alle 45 min essen', unused: ['LX01', 'HY02'] }),
    made({ id: 'fruehling', title: 'Frühlingstour', ago: 125, days: 4, km: 286, gain: 6400, h: 21.67, min: 5, max: 24, rain: [0, 0, 9, 0], note: '4 Liter Wasser waren knapp genug' }),
    made({ id: 'winter', title: 'Winterrunde', ago: 265, km: 51, gain: 890, h: 3.58, min: -1, max: 4, rain: [3], note: 'Thermos statt Flasche' }),
    // the 12 months before
    made({ id: 'alt1', title: 'Alte Seerunde', ago: 410, km: 60, gain: 500, h: 3.4, min: 15, max: 25 }),
    made({ id: 'alt2', title: 'Alte Zweitagestour', ago: 450, days: 2, km: 120, gain: 1900, h: 9.5, min: 8, max: 19 }),
  ];
  T.trips = [
    ...all.map((x) => x.trip),
    // the next trip, still ahead
    { id: `${P}next`, title: 'Wochenende Hochland', domain: 'bikepacking', startDate: day(1), days: 2, bikeId: 'bike-test', bike: 'Gravel Grau', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: NIGHT_KIT, ready: [], status: 'planned', overnight: 'outdoor', createdAt: `${day(-2)}T08:00:00.000Z` },
  ];
  T.debriefs = all.map((x) => x.deb).filter(Boolean);
  T.rides = all.flatMap((x) => x.rides);
  const L = (id, topic, rule, source, ago) => ({ id, topic, rule, action: '', itemIds: [], source, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: `${day(-ago)}T19:00:00.000Z` });
  T.learnings = [
    L(1, 'Clothing', 'Überschuhe ab 8 °C mitnehmen', 'Herbsttour Hochland', 11),
    L(2, 'Food', 'Zu wenig Riegel für den zweiten Tag', 'Drei-Täler-Loop', 39),
    L(3, 'Clothing', 'Windweste reicht für alle Abfahrten', 'Passfahrt', 61),
    L(4, 'Water', '2 Flaschen reichen bis 25°', 'Seerunde', 53),
    L(5, 'Food', 'Ab 2000 Hm alle 45 min essen', 'Sommertour drei Etappen', 94),
    L(6, 'Gear', 'Licht-Akku reicht bei Kälte nur 2 h', 'Herbsttour Hochland', 11),
  ];
  T.events = [
    { id: `${P}ev1`, name: 'Alte Tour aus der Liste', note: 'Viel Wind', date: '2024', sortDate: '2024-06-01', source: 'excel' },
    { id: `${P}ev2`, name: 'Noch eine alte Tour', note: '', date: '2023', sortDate: '2023-07-01', source: 'excel' },
  ];
  T.settings = [
    { key: 'pace', value: { kmh: 17.2, climbMh: 640, factor: 0.93, stops: 1.15, n: 8, rides: T.rides.slice(0, 8).map((r) => ({ id: r.id, name: r.name, date: r.date, km: r.km, gainM: r.gainM, movingH: r.movingH, totalH: r.totalH })), updatedAt: `${day(-3)}T19:00:00.000Z` } },
  ];
  return data;
}
