/**
 * Paket U «Rennen» › Muster-Rennen (Noah 19.10.2026 17:27 «dieses Rennen als Beispiel und Muster dem
 * Nutzer schön durchspielen», «1-5 ok 6a 7b 8a»): a made-up race with the structure of a real 1000 km
 * bikepacking race: 11 sectors, about 30 000 m up, a depot at km 500, hotels with a gap at the start,
 * stretches without a shop near the end. Every place name is invented. It lives in your data as a
 * normal race (id SAMPLE_ID), so everything can be changed; «Reset» puts it back, «Delete» removes it.
 * The tasks (8a) tick themselves when you did them; the tour (6a) uses the app's Rundgang (tour.js).
 * Pure apart from the small db helpers at the end; tested in tests/race-sample.test.js.
 */
import { addDay, lineKm, pointAt } from './race.js';

export const SAMPLE_ID = 'race-sample';
export const SAMPLE_KM = 1004;

/** The first Saturday in the third week of June that is at least 60 days away. */
export function sampleStart(today) {
  let y = Number(today.slice(0, 4));
  for (;;) {
    let d = `${y}-06-15`;
    while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 6) d = addDay(d, 1);
    if (d >= addDay(today, 60)) return d;
    y++;
  }
}

// a made-up line through the Alps (only its shape counts; km are scaled to SAMPLE_KM)
const WAY = [
  [47.55, 9.55], [47.25, 9.1], [47.05, 9.4], [46.85, 8.95], [47.0, 8.5], [46.75, 8.2],
  [46.6, 7.7], [46.75, 7.25], [46.5, 7.1], [46.65, 6.8], [46.45, 6.55],
];
const PRE = ['Ober', 'Unter', 'Hinter', 'Vorder', 'Mittel', 'Neu', 'Alt', 'Gross', 'Klein', 'Hoch'];
const SUF = ['riedli', 'mattli', 'eggwil', 'auboden', 'bergli', 'talwil', 'moosach', 'feldli', 'bachau', 'stalden', 'weidli', 'brunnwil'];
const placeName = (i) => `${PRE[i % PRE.length]}${SUF[(i * 7 + 3) % SUF.length]}`;

/** The route: 11 sectors, a profile with about 30 000 m up and one pass above 2000 m. */
export function sampleRoute() {
  const line = [];
  for (let i = 0; i < WAY.length - 1; i++) {
    const [a, b] = [WAY[i], WAY[i + 1]];
    for (let s = 0; s < 40; s++) {
      const f = s / 40;
      const wob = Math.sin((i * 40 + s) / 3) * 0.01;
      line.push([Math.round((a[0] + (b[0] - a[0]) * f + wob) * 1e5) / 1e5, Math.round((a[1] + (b[1] - a[1]) * f) * 1e5) / 1e5]);
    }
  }
  line.push(WAY.at(-1));
  const profile = [];
  for (let k = 0; k <= SAMPLE_KM; k += 2) {
    const cyc = (k / SAMPLE_KM) * 30 * 2 * Math.PI;
    const base = 600 + 480 * (1 - Math.cos(cyc)) + 120 * Math.sin(k / 7);
    const pass = 2060 - Math.abs(k - 670) * 60; // the high pass, 6 % on both sides
    profile.push([k, Math.round(Math.max(base, pass))]);
  }
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < profile.length; i++) {
    const d = profile[i][1] - profile[i - 1][1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  const cuts = [0, 92, 181, 268, 354, 441, 530, 618, 709, 800, 897, SAMPLE_KM];
  const gainIn = (a, b) => {
    let g = 0;
    for (let i = 1; i < profile.length; i++) if (profile[i][0] > a && profile[i][0] <= b) g += Math.max(0, profile[i][1] - profile[i - 1][1]);
    return g;
  };
  const sectors = cuts.slice(1).map((to, i) => ({ name: `Sektor ${String(i + 1).padStart(2, '0')}`, fromKm: cuts[i], toKm: to, gainM: gainIn(cuts[i], to) }));
  return {
    km: SAMPLE_KM,
    gainM: gain,
    lossM: loss,
    maxM: Math.max(...profile.map((p) => p[1])),
    start: { lat: line[0][0], lon: line[0][1] },
    end: { lat: line.at(-1)[0], lon: line.at(-1)[1] },
    line,
    profile,
    sectors,
    files: sectors.map((s) => `${s.name}.gpx`),
  };
}

/** Is km inside one of the gaps (no shop, no food)? */
const GAPS = [[640, 712], [771, 850], [912, SAMPLE_KM]];
const inGap = (km) => GAPS.some(([a, b]) => km > a && km < b);

/** The stops: shops, food, water, beds (none before km 168), campgrounds, stations, the depot. */
export function samplePois(route = sampleRoute()) {
  const pts = lineKm(route);
  const out = [];
  let i = 0;
  const add = (kind, km, name, extra = {}) => {
    const p = pointAt(pts, km);
    out.push({ id: `smp${i++}`, kind, name, km: Math.round(km * 10) / 10, lat: Math.round(p.lat * 1e5) / 1e5, lon: Math.round(p.lon * 1e5) / 1e5, offKm: Math.round(((i * 37) % 9) * 10 + 20) / 100, own: true, ...extra });
  };
  add('startfinish', 0, 'Start');
  for (let k = 9; k < SAMPLE_KM; k += 13 + ((k * 7) % 9)) if (!inGap(k)) add('shop', k, `Dorfladen ${placeName(k)}`, { hours: 'Mo-Sa 07:00-19:00', sym: 'Pizza' });
  for (let k = 16; k < SAMPLE_KM; k += 17 + ((k * 3) % 11)) if (!inGap(k)) add('food', k, `Gasthaus ${placeName(k + 1)}`, { hours: 'Mo-Su 10:00-22:00', sym: 'Restaurant' });
  for (let k = 22; k < SAMPLE_KM; k += 24 + ((k * 5) % 13)) if (!(k > 918 && k < 953) && !(k > 461 && k < 495)) add('water', k, `Brunnen ${placeName(k + 2)}`, { sym: 'Water Source' });
  for (let k = 168; k < SAMPLE_KM - 10; k += 18 + ((k * 11) % 23)) add('sleep', k, `Hotel ${placeName(k + 3)}`, { sym: 'Lodging', sub: 'hotel' });
  for (const k of [139, 402, 611, 846]) add('sleep', k, `Camping ${placeName(k + 4)}`, { sym: 'Campground', sub: 'campground' });
  for (let k = 30; k < SAMPLE_KM; k += 38) add('station', k, `Bahnhof ${placeName(k + 5)}`);
  for (const k of [120, 470, 735]) add('bike', k, `Velo ${placeName(k + 6)}`, { sym: 'Bike Trail' });
  for (const k of [330, 690, 880]) add('shelter', k, `Unterstand ${placeName(k + 7)}`);
  add('depot', 500, 'Depot 500', { sym: 'Residence' });
  add('startfinish', SAMPLE_KM, 'Ziel');
  return out.sort((a, b) => a.km - b.km);
}

/** The stored race of the sample: start Saturday 08:00, 10 days as the goal, night 1 open. */
export function sampleStored(today) {
  const route = sampleRoute();
  return {
    sample: true,
    createdAt: `${today}T00:00:00`,
    start: `${sampleStart(today)}T08:00`,
    targetDays: 10,
    way: 'mixed',
    route,
    pois: samplePois(route),
    checkpoints: route.sectors.map((s, i) => ({ id: `sec${i + 1}`, name: s.name, km: s.toKm, sector: true })),
    assume: { climbMh: 650, flatKmh: 25 },
    assumeNote: { climbMh: 'Testrennen 2026', fatiguePct: 'Testrennen 2026 (Plan 27 h, echt 30 h)' },
    learnOwn: [
      { id: 'sl1', text: 'The tent was never used: leave it at home' },
      { id: 'sl2', text: 'Big bags tempt you to take more' },
      { id: 'sl3', text: 'Book the hotels early' },
    ],
    dropBags: [{ id: 'sd1', text: 'Depot 500', km: 500, items: 'Clean clothes, bars, brake pads' }],
  };
}

/**
 * The hands-on tasks (8a): each ticks itself when the race shows it was done (or you tick it).
 * check(stored) → true when done. Texts are English keys.
 */
export const SAMPLE_TASKS = [
  { key: 'climb', text: 'Change the climbing rate from 650 to 550 m/h and watch the days grow', check: (s) => Number(s.assume?.climbMh) > 0 && Number(s.assume?.climbMh) !== 650 },
  { key: 'tent', text: 'Choose the tent and watch the weight and the risks', check: (s) => s.way === 'tent' },
  { key: 'night1', text: 'Set night 1 to «bivy» under Strategy', check: (s) => !!s.fixedNights?.[1] },
  { key: 'own', text: 'Add your own assumption (e.g. 30 min for the shower)', check: (s) => (s.ownAssume ?? []).length > 0 },
  { key: 'scenario', text: 'Save a scenario and compare it', check: (s) => (s.scenarios ?? []).length > 0 },
  { key: 'start', text: 'Move the start to another day and watch the Sundays', check: (s) => !!s.start && !/T08:00$/.test(s.start) },
];
export const tasksDone = (stored = {}) => SAMPLE_TASKS.filter((x) => x.check(stored) || (stored.tasksTicked ?? []).includes(x.key)).map((x) => x.key);

/** The trip of the sample (made with the app's own newTrip so the packing list is yours). */
export function sampleTrip(base, title, today) {
  return { ...base, id: SAMPLE_ID, title, startDate: sampleStart(today), days: 10 };
}

/* ---------- db helpers ---------- */

/** Create the sample (or put it back as new): the trip and its race. Returns the trip id. */
export async function makeSample({ db, newTrip, putRace, today, title }) {
  const bikes = await db.bikes.toArray();
  const bike = bikes[0] ?? { id: '', name: '', setup: {} };
  const base = newTrip({ title, startDate: sampleStart(today), days: 10, bike }, [], await db.items.toArray());
  await db.trips.put(sampleTrip(base, title, today));
  await putRace(SAMPLE_ID, sampleStored(today));
  return SAMPLE_ID;
}
