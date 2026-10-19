/**
 * Paket U «Bikepacking und Ultra-Rennen» (Noah 19.10.2026: ideas 1–8 «alle mit erklärungen für den
 * nutzer», 9–16 «alle», 17–24 «alle», 25–32 «alle»). The page Touren › Rennen (#/race).
 *
 * A race is a trip you mark as a race. Everything the race pages add lives in ONE settings record
 * (RACES_KEY, so it travels with every backup; no new Dexie table):
 *   { races: { [tripId]: Race } }
 * Race (every field optional, missing = the suggestion):
 *   start 'YYYY-MM-DDTHH:MM' (local), targetH (whole race in hours), sleepAt 'HH:MM', sleepH,
 *   restDays [day index], checkpoints [{ id, name, km, cutoff?, actual? }], nights [{ n, kind, place, min }],
 *   tired [{ at, v }], rules [{ id, text, itemId? }], probe { date, done, note }, dropBags [{ id, where, km, what }],
 *   why [{ id, text }], countries [code] | null, stomach [{ id, food, h, verdict, day }], goalEvery (km),
 *   goalsDone [key], badWeather [{ id, when, then }], food [iso], contacts [{ id, at, stage, parts, setup }],
 *   postCheck [{ id, text }] | null, postDone [id], bagC (comfort limit °C), lampH (hours of light),
 *   dryKm (km without water that is too long), currentKm, mode (race mode on).
 * Pure functions, tested in tests/race.test.js. Labels are English keys for t().
 */
import { distKm } from '../route.js';

export const RACES_KEY = 'races';

/** The stored record → the races map (a broken value gives an empty map). */
export const racesOf = (value) => (value && typeof value === 'object' && value.races && typeof value.races === 'object' ? value.races : {});

/** One race with the suggestions filled in (never changes the stored object). */
export function raceOf(stored, trip) {
  const r = stored && typeof stored === 'object' ? stored : {};
  const start = r.start || (trip?.startDate ? `${trip.startDate}T${trip.rideStart || '06:00'}` : '');
  const days = Math.max(1, Number(trip?.days) || 1);
  const targetH = Number(r.targetH) > 0 ? Number(r.targetH) : days * 24 - 6;
  return {
    ...r,
    start,
    targetH,
    sleepAt: /^\d\d:\d\d$/.test(r.sleepAt ?? '') ? r.sleepAt : '23:00',
    sleepH: Number.isFinite(Number(r.sleepH)) && r.sleepH !== '' && r.sleepH != null ? Math.max(0, Number(r.sleepH)) : 4,
    restDays: Array.isArray(r.restDays) ? r.restDays : [],
    checkpoints: Array.isArray(r.checkpoints) ? [...r.checkpoints].sort((a, b) => (Number(a.km) || 0) - (Number(b.km) || 0)) : [],
    nights: Array.isArray(r.nights) ? r.nights : [],
    tired: Array.isArray(r.tired) ? r.tired : [],
    rules: Array.isArray(r.rules) ? r.rules : [],
    dropBags: Array.isArray(r.dropBags) ? r.dropBags : [],
    why: Array.isArray(r.why) ? r.why : [],
    stomach: Array.isArray(r.stomach) ? r.stomach : [],
    goalEvery: Number(r.goalEvery) > 0 ? Number(r.goalEvery) : 50,
    goalsDone: Array.isArray(r.goalsDone) ? r.goalsDone : [],
    badWeather: Array.isArray(r.badWeather) ? r.badWeather : null,
    food: Array.isArray(r.food) ? r.food : [],
    contacts: Array.isArray(r.contacts) ? r.contacts : [],
    postCheck: Array.isArray(r.postCheck) ? r.postCheck : null,
    postDone: Array.isArray(r.postDone) ? r.postDone : [],
    bagC: Number.isFinite(Number(r.bagC)) && r.bagC !== '' && r.bagC != null ? Number(r.bagC) : 5,
    lampH: Number(r.lampH) > 0 ? Number(r.lampH) : 8,
    dryKm: Number(r.dryKm) > 0 ? Number(r.dryKm) : 60,
    currentKm: Number(r.currentKm) >= 0 ? Number(r.currentKm) : 0,
  };
}

/** A trip counts as a race: marked here, or a race trip (trip.event from Träume, the race block). */
export const isRaceTrip = (trip, races = {}) => !!trip && (!!races[trip.id] || !!trip.event || !!trip.sets?.race);

/** The races to show: race trips, upcoming first (soonest), then the past ones (latest first). */
export function raceTrips(trips = [], races = {}, today = '') {
  const list = trips.filter((t) => !t.skipped && isRaceTrip(t, races));
  const end = (t) => addDay(t.startDate ?? '', Math.max(1, Number(t.days) || 1) - 1);
  const coming = list.filter((t) => !t.startDate || end(t) >= today).sort((a, b) => (a.startDate ?? '9').localeCompare(b.startDate ?? '9'));
  const past = list.filter((t) => t.startDate && end(t) < today).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return { coming, past };
}

/** A new id (time + random), short. */
export const newId = (p = 'r') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- dates (calendar days, no clock arithmetic on days) ---------- */

export function addDay(day, n) {
  if (!/^\d{4}-\d\d-\d\d$/.test(day)) return day;
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Days from a to b (b later = positive). */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
/** Local 'YYYY-MM-DDTHH:MM' → ms (device time zone). */
export const msOf = (local) => (local ? new Date(local).getTime() : NaN);
/** ms → local 'YYYY-MM-DDTHH:MM'. */
export function localOf(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export const hhmm = (ms) => localOf(ms).slice(11, 16);
export const dayOfMs = (ms) => localOf(ms).slice(0, 10);

/** Hours as «3 h 20» (h and min). */
export function hm(h) {
  if (!Number.isFinite(h)) return '–';
  const m = Math.round(h * 60);
  const s = m < 0 ? '−' : '';
  const a = Math.abs(m);
  return `${s}${Math.floor(a / 60)} h${a % 60 ? ` ${String(a % 60).padStart(2, '0')}` : ''}`;
}

/* ---------- 1 · Renn-Zeitplan (with 3 Schlaf-Plan and 31 Ruhetage) ---------- */

/**
 * The blocks of time you do not ride: a sleep every night at sleepAt for sleepH, and whole rest days
 * (31: day index 0 = the start day; from sleepAt the evening before to the same time on the day).
 * → [{ from, to, kind: 'sleep'|'rest', n }] in ms, sorted, inside a window long enough for the race.
 */
export function offBlocks(race, horizonH = null) {
  const start = msOf(race.start);
  if (!Number.isFinite(start)) return [];
  const horizon = start + (horizonH ?? race.targetH + 24 * (race.restDays.length + 2)) * 36e5;
  const out = [];
  const firstDay = race.start.slice(0, 10);
  const rest = new Set(race.restDays.map(Number));
  for (let n = 0; ; n++) {
    const day = addDay(firstDay, n);
    const at = msOf(`${day}T${race.sleepAt}`);
    if (at > horizon) break;
    if (rest.has(n + 1)) {
      out.push({ from: at, to: at + 24 * 36e5, kind: 'rest', n });
    } else if (race.sleepH > 0 && at + race.sleepH * 36e5 > start) out.push({ from: Math.max(at, start), to: at + race.sleepH * 36e5, kind: 'sleep', n });
    if (n > 400) break;
  }
  // a rest block swallows the sleep inside it
  return out.filter((b, i) => !(b.kind === 'sleep' && out.some((o, j) => j !== i && o.kind === 'rest' && o.from <= b.from && o.to >= b.to)));
}

/** Riding hours (moving and short stops) between two moments, outside the off blocks. */
export function rideHoursBetween(blocks, from, to) {
  let ms = Math.max(0, to - from);
  for (const b of blocks) ms -= Math.max(0, Math.min(to, b.to) - Math.max(from, b.from));
  return ms / 36e5;
}

/**
 * Effort along the route (learning from the 1000 km example, 35 000 m up: climbs take the hours, not the
 * km). One metre up counts like CLIMB_KM_PER_M km on the flat (600 m ≈ 16 km, the app's riding-hours rule).
 * profile: [[km, m], …] → { at(km) → effort, km(effort) → km, total }. Without a profile effort = km.
 */
export const CLIMB_KM_PER_M = 16 / 600;
export function effortOf(profile = [], totalKm = 0) {
  const pts = (profile ?? []).filter((p) => p[1] != null);
  if (pts.length < 2) return { at: (k) => k, km: (e) => e, total: totalKm };
  const table = [[0, 0]];
  let gain = 0;
  let ref = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i][1] - ref;
    if (d >= 3) (gain += d), (ref = pts[i][1]);
    else if (d <= -3) ref = pts[i][1];
    table.push([pts[i][0], pts[i][0] + gain * CLIMB_KM_PER_M]);
  }
  const last = table.at(-1);
  if (totalKm > last[0]) table.push([totalKm, totalKm + gain * CLIMB_KM_PER_M]);
  const lerp = (x, a, b) => {
    for (let i = 1; i < table.length; i++) {
      if (table[i][a] >= x) {
        const p = table[i - 1];
        const q = table[i];
        const f = q[a] > p[a] ? (x - p[a]) / (q[a] - p[a]) : 0;
        return p[b] + (q[b] - p[b]) * f;
      }
    }
    return table.at(-1)[b];
  };
  return { at: (k) => lerp(Math.max(0, k), 0, 1), km: (e) => lerp(Math.max(0, e), 1, 0), total: table.at(-1)[1], gain: Math.round(gain) };
}

/**
 * The plan: the race in targetH, sleep and rest days as set; you ride evenly the rest of the time, slower
 * where it climbs (effort, see effortOf). → null without a start or km; else
 * { start, end, kmh, rideH, offH, blocks, etaOf(km), kmAt(ms), days }
 * kmh is the average speed including the short stops; days: [{ day, km, from, to }] per calendar day.
 */
export function schedule(race, km, profile = null, own = null) {
  const start = own?.start ?? msOf(race.start);
  if (!Number.isFinite(start) || !(km > 0)) return null;
  const end = own?.end ?? start + race.targetH * 36e5;
  // own: { start, end, blocks } from the Strategie (the stages end at the places to sleep)
  const blocks = own?.blocks ?? offBlocks(race).filter((b) => b.from < end);
  const rideH = rideHoursBetween(blocks, start, end);
  if (!(rideH > 0)) return null;
  const eff = effortOf(profile, km);
  const eph = eff.total / rideH; // effort per riding hour
  const kmh = km / rideH;
  const kmAt = (ms) => Math.min(km, Math.max(0, eff.km(rideHoursBetween(blocks, start, Math.min(ms, end)) * eph)));
  const etaOf = (k) => {
    let need = eff.at(Math.max(0, Math.min(k, km))) / eph; // riding hours
    let t = start;
    for (const b of blocks) {
      if (b.to <= t) continue;
      const free = (b.from - t) / 36e5;
      if (need <= free) return t + need * 36e5;
      need -= Math.max(0, free);
      t = Math.max(t, b.to);
    }
    return t + need * 36e5;
  };
  const days = [];
  for (let d = dayOfMs(start); d <= dayOfMs(end); d = addDay(d, 1)) {
    const a = Math.max(start, msOf(`${d}T00:00`));
    const b = Math.min(end, msOf(`${addDay(d, 1)}T00:00`));
    days.push({ day: d, km: Math.round(kmAt(b) - kmAt(a)), from: kmAt(a), to: kmAt(b) });
  }
  return { start, end, kmh, rideH, offH: (end - start) / 36e5 - rideH, blocks, etaOf, kmAt, days, gain: eff.gain ?? null, fromStrategy: !!own };
}

/** Each checkpoint with its planned time, its cut-off buffer (25) and plan vs. actual (1). */
export function checkpointRows(race, plan) {
  return race.checkpoints.map((c) => {
    const eta = plan ? plan.etaOf(Number(c.km) || 0) : null;
    const cut = msOf(c.cutoff);
    const act = msOf(c.actual);
    return {
      ...c,
      eta,
      bufferH: Number.isFinite(cut) && eta != null ? (cut - eta) / 36e5 : null,
      diffH: Number.isFinite(act) && eta != null ? (act - eta) / 36e5 : null, // + = later than planned
      actualMs: Number.isFinite(act) ? act : null,
      cutMs: Number.isFinite(cut) ? cut : null,
    };
  });
}

/**
 * 25 · Cut-off-Rechner: from where you are (km, now) to a cut-off (km, time): the speed you need,
 * counting the sleep blocks of the plan in between. → { h, kmh, ok } or null (cut-off passed / no km).
 */
export function cutoffNeed({ fromKm, now, toKm, cutMs, blocks = [] }) {
  const dist = toKm - fromKm;
  if (!(dist > 0) || !Number.isFinite(cutMs)) return null;
  const h = rideHoursBetween(blocks, now, cutMs);
  if (!(h > 0)) return { h: 0, kmh: Infinity, ok: false };
  const kmh = dist / h;
  return { h, kmh, ok: kmh <= 30 };
}

/** The latest actual time logged at a checkpoint: where you are now and how far ahead or behind. */
export function lastActual(rows) {
  const done = rows.filter((r) => r.actualMs != null);
  return done.length ? done[done.length - 1] : null;
}

/** 3 · The nights of the plan with your choice (bivy / hotel / ride through) and planned minutes. */
export const NIGHT_KINDS = [
  { key: 'bivy', name: 'Bivy' },
  { key: 'hotel', name: 'Hotel or room' },
  { key: 'through', name: 'Ride through' },
];
export function nightRows(race, plan) {
  if (!plan) return [];
  return plan.blocks
    .filter((b) => b.kind === 'sleep')
    .map((b, i) => {
      const own = race.nights.find((n) => n.n === b.n) ?? {};
      const kind = own.kind ?? 'bivy';
      const min = kind === 'through' ? 0 : Number(own.min) >= 0 && own.min !== '' && own.min != null ? Number(own.min) : Math.round((b.to - b.from) / 6e4);
      return { n: b.n, i, from: b.from, to: b.to, km: Math.round(plan.kmAt(b.from)), kind, place: own.place ?? '', min };
    });
}
/** Sleep in the race: planned minutes in total. */
export const sleepTotal = (nights) => nights.reduce((s, n) => s + (n.min || 0), 0);

/** 3 · Müdigkeits-Check: 1 (fresh) … 5 (very tired). Observation only, never a diagnosis. */
export const TIRED = [
  { v: 1, name: 'Fresh' },
  { v: 2, name: 'Fine' },
  { v: 3, name: 'Tired' },
  { v: 4, name: 'Very tired' },
  { v: 5, name: 'Microsleep danger' },
];

/* ---------- route geometry ---------- */

/** The route line with km from the start, scaled to the route's real km (the line is thinned). */
export function lineKm(route) {
  const line = Array.isArray(route?.line) ? route.line : [];
  if (line.length < 2) return [];
  let k = 0;
  const raw = line.map((p, i) => {
    if (i) k += distKm({ lat: line[i - 1][0], lon: line[i - 1][1] }, { lat: p[0], lon: p[1] });
    return { lat: p[0], lon: p[1], km: k };
  });
  const f = route.km > 0 && k > 0 ? route.km / k : 1;
  return raw.map((p) => ({ ...p, km: p.km * f }));
}

/** The point at km along the line (interpolated). */
export function pointAt(pts, km) {
  if (!pts.length) return null;
  if (km <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].km >= km) {
      const a = pts[i - 1];
      const b = pts[i];
      const f = b.km > a.km ? (km - a.km) / (b.km - a.km) : 0;
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, km };
    }
  }
  return pts.at(-1);
}

/** Where a place is along the route: { km, offKm } (nearest segment, good enough for 200 points). */
export function snap(pts, p) {
  let best = { km: 0, offKm: Infinity };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    // project on the segment in a flat local frame
    const kx = Math.cos((a.lat * Math.PI) / 180);
    const ax = a.lon * kx;
    const bx = b.lon * kx;
    const px = p.lon * kx;
    const dx = bx - ax;
    const dy = b.lat - a.lat;
    const len = dx * dx + dy * dy;
    const f = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (p.lat - a.lat) * dy) / len)) : 0;
    const q = { lat: a.lat + dy * f, lon: a.lon + (b.lon - a.lon) * f };
    const off = distKm(q, p);
    if (off < best.offKm) best = { km: a.km + (b.km - a.km) * f, offKm: off };
  }
  return { km: Math.round(best.km * 10) / 10, offKm: Math.round(best.offKm * 100) / 100 };
}

/** Points every stepKm along the route (start and end included), for the weather and the countries. */
export function samples(pts, stepKm = 50, max = 12) {
  if (!pts.length) return [];
  const total = pts.at(-1).km;
  const step = Math.max(stepKm, total / Math.max(1, max - 1));
  const out = [];
  for (let k = 0; k < total; k += step) out.push(pointAt(pts, k));
  out.push({ ...pts.at(-1), km: total });
  return out;
}

/* ---------- 20 · Anstiege nach Tageszeit ---------- */

/**
 * The climbs of the profile ([[km, m], …]): at least minGain metres up with no more than 40 m down
 * on the way. → [{ fromKm, toKm, gain, top, grade }]
 */
export function climbsOf(profile = [], minGain = 150) {
  const out = [];
  let low = null; // { km, m }
  let high = null;
  for (const [km, m] of profile) {
    if (m == null) continue;
    if (!low) {
      low = high = { km, m };
      continue;
    }
    if (m > high.m) high = { km, m };
    if (high.m - m > 40 || m < low.m) {
      if (high.m - low.m >= minGain && high.km > low.km) out.push(climbRow(low, high));
      low = high = { km, m };
    }
  }
  if (low && high && high.m - low.m >= minGain && high.km > low.km) out.push(climbRow(low, high));
  return out;
}
const climbRow = (a, b) => ({ fromKm: Math.round(a.km), toKm: Math.round(b.km), gain: Math.round(b.m - a.m), top: Math.round(b.m), grade: Math.round(((b.m - a.m) / ((b.km - a.km) * 1000)) * 1000) / 10 });

/** A climb at an hour: «hot» at midday in summer temperatures, «dark» at night, else «ok». */
export function climbWhen(hour, tempC = null, dark = false) {
  if (dark) return 'dark';
  if (tempC != null && tempC >= 26 && hour >= 11 && hour <= 17) return 'hot';
  if (tempC == null && hour >= 12 && hour <= 16) return 'midday';
  return 'ok';
}

/* ---------- 13 · Licht-Plan ---------- */

/**
 * Dark riding hours per night: the time between sunset and sunrise you are on the bike (not in an
 * off block). sun(day) → { rise, set } ms or null. → [{ day, darkH, need: darkH > lampH }]
 */
export function darkRiding(plan, sun, lampH = 8) {
  if (!plan) return [];
  const out = [];
  for (let d = dayOfMs(plan.start); d <= dayOfMs(plan.end); d = addDay(d, 1)) {
    const a = sun(d);
    const b = sun(addDay(d, 1));
    if (!a || !b) continue;
    const from = Math.max(a.set, plan.start);
    const to = Math.min(b.rise, plan.end);
    if (to <= from) continue;
    const h = rideHoursBetween(plan.blocks, from, to);
    if (h > 0.1) out.push({ day: d, from, to, darkH: Math.round(h * 10) / 10, need: h > lampH });
  }
  return out;
}

/* ---------- 29 · Mini-Ziele ---------- */

/** Small goals: every checkpoint and every `every` km (a round number), sorted. */
export function miniGoals(race, km) {
  if (!(km > 0)) return [];
  const out = race.checkpoints.filter((c) => Number(c.km) > 0).map((c) => ({ key: `cp:${c.id}`, km: Number(c.km), name: c.name || '' }));
  for (let k = race.goalEvery; k < km; k += race.goalEvery) if (!out.some((g) => Math.abs(g.km - k) < race.goalEvery / 4)) out.push({ key: `km:${k}`, km: k, name: '' });
  out.push({ key: 'finish', km, name: 'Finish' });
  return out.sort((a, b) => a.km - b.km);
}

/* ---------- 7 · Countdown and 32 · Training fürs Rennen ---------- */

/** Days and weeks to the start; the dress rehearsal should be at least 2 weeks before. */
export function countdown(startDay, today) {
  if (!startDay) return null;
  const days = daysBetween(today, startDay);
  return { days, weeks: Math.floor(days / 7), probeBy: addDay(startDay, -14) };
}

/**
 * A simple build-up to the race: the longest ride of each week grows towards 60 % of an average race
 * day (max 250 km), back-to-back weekends from 6 weeks before, the last 2 weeks easier (taper).
 * → [{ week (from monday), longKm, b2b, taper }], at most 16 weeks, oldest first.
 */
export function trainingPlan(startDay, today, dayKm) {
  if (!startDay || !(dayKm > 0)) return [];
  const goal = Math.min(250, Math.round(dayKm * 0.6));
  const raceMon = monday(startDay);
  const weeks = Math.min(16, Math.max(0, Math.floor(daysBetween(monday(today), raceMon) / 7)));
  const out = [];
  for (let w = weeks; w >= 1; w--) {
    const week = addDay(raceMon, -7 * w);
    const taper = w <= 2;
    const ramp = Math.min(1, (weeks - w + 1) / Math.max(1, weeks - 2));
    const longKm = Math.round((taper ? goal * (w === 1 ? 0.4 : 0.6) : goal * (0.5 + 0.5 * ramp)) / 5) * 5;
    out.push({ week, longKm, b2b: !taper && w <= 6, taper });
  }
  return out;
}
export function monday(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return addDay(day, -((d.getUTCDay() + 6) % 7));
}
/** The longest ride (km) of each week from rides/activities [{ day|date, km }]. */
export function longestByWeek(rides = []) {
  const out = {};
  for (const r of rides) {
    const day = r.day ?? r.date;
    if (!day || !(r.km > 0)) continue;
    const w = monday(day);
    out[w] = Math.max(out[w] ?? 0, r.km);
  }
  return out;
}

/* ---------- 10 · Ess-Protokoll ---------- */

/**
 * What you ate, per hour of the race, and the gaps: → { perH, gaps: [{ from, to, h }], last }
 * A gap is more than gapH hours without food while riding (an off block does not count).
 */
export function foodStats(times = [], { start, now, blocks = [], gapH = 1.5 } = {}) {
  const ms = times.map((x) => Date.parse(x)).filter(Number.isFinite).sort((a, b) => a - b);
  const from = Number.isFinite(start) ? start : ms[0];
  const to = now ?? Date.now();
  const rideH = Number.isFinite(from) ? rideHoursBetween(blocks, from, to) : 0;
  const perH = rideH > 0.5 ? Math.round((ms.filter((x) => x >= from).length / rideH) * 10) / 10 : null;
  const gaps = [];
  const pts = Number.isFinite(from) ? [from, ...ms.filter((x) => x >= from), to] : ms;
  for (let i = 1; i < pts.length; i++) {
    const h = rideHoursBetween(blocks, pts[i - 1], pts[i]);
    if (h > gapH) gaps.push({ from: pts[i - 1], to: pts[i], h: Math.round(h * 10) / 10 });
  }
  return { perH, gaps, last: ms.at(-1) ?? null };
}

/* ---------- 18 · Weiterfahren oder schlafen? ---------- */

/**
 * A suggestion, never an order. In: tired 1–5, hour (0–23), awakeH (hours since the last sleep), kmToBed
 * (km to the next sleep place), kmh, nightC (temperature tonight), bagC (comfort limit), buffer (h ahead
 * of the plan, negative = behind). → { pick: 'sleep'|'ride'|'nap', why: [English keys] }
 */
export function rideOrSleep({ tired = 2, hour = 22, awakeH = 16, kmToBed = 20, kmh = 18, nightC = null, bagC = 5, bufferH = 0 }) {
  const why = [];
  let sleep = 0;
  if (tired >= 5) (sleep += 3), why.push('Microsleep danger: stop now, even for 20 minutes.');
  else if (tired >= 4) (sleep += 2), why.push('You are very tired; tired riding is slow riding.');
  if (awakeH >= 20) (sleep += 1), why.push('You have been awake for {h} hours.');
  if (hour >= 1 && hour <= 5) (sleep += 1), why.push('Between 1 and 5 at night the body wants to sleep most.');
  const toBedH = kmh > 0 ? kmToBed / kmh : 2;
  if (toBedH > 2.5 && tired >= 3) (sleep += 1), why.push('The next sleep place is {h} away.');
  if (nightC != null && nightC < bagC - 3) (sleep -= 1), why.push('It gets colder than your sleeping bag likes: a roof or riding on is better.');
  if (bufferH < -2) (sleep -= 1), why.push('You are behind your plan.');
  if (bufferH > 2) (sleep += 1), why.push('You are ahead of your plan: you can afford the sleep.');
  if (tired <= 2 && awakeH < 16) (sleep -= 2), why.push('You feel fine: use the good hours.');
  const pick = tired >= 5 ? 'nap' : sleep >= 2 ? 'sleep' : sleep >= 1 ? 'nap' : 'ride';
  return { pick, why, toBedH };
}

/* ---------- 6 · Stopp-Analyse ---------- */

/**
 * Riding vs. standing from the rides of the trip [{ km, movingH, totalH, pauses: [{ min }] }].
 * → { movingH, totalH, stopH, share, stops, long (≥ 20 min), learn: English key|null } or null
 */
export function stopAnalysis(rides = []) {
  const rs = rides.filter((r) => r.totalH > 0);
  if (!rs.length) return null;
  const movingH = rs.reduce((s, r) => s + (r.movingH || 0), 0);
  const totalH = rs.reduce((s, r) => s + r.totalH, 0);
  const pauses = rs.flatMap((r) => r.pauses ?? []);
  const long = pauses.filter((p) => p.min >= 20);
  const stopH = Math.max(0, totalH - movingH);
  const share = totalH > 0 ? Math.round((stopH / totalH) * 100) : 0;
  const learn = share >= 30 ? 'More than a quarter of the time you stood still. Shorter, planned stops save the most time.' : long.length >= 3 ? 'Several long stops: plan them at a shop, then they count twice.' : share > 0 ? 'Your stops were short. Keep it like that.' : null;
  return { movingH, totalH, stopH, share, stops: pauses.length, long: long.length, longMin: long.reduce((s, p) => s + p.min, 0), learn };
}

/* ---------- 15 · Erholung nach dem Rennen ---------- */

/**
 * Resting pulse and HRV after the race against your normal (the 28 days before the start).
 * days: healthDays rows [{ date, restingHr, hrvMs }]. → { base, after: [{ date, restingHr, hrvMs, back }], backOn } or null
 * «back» = resting pulse at most 2 above the normal and HRV at least 90 % of it. Observation only.
 */
export function recovery(days = [], startDay, endDay) {
  if (!startDay || !endDay) return null;
  const before = days.filter((d) => d.date < startDay && d.date >= addDay(startDay, -28));
  const avg = (k) => {
    const v = before.map((d) => d[k]).filter(Number.isFinite);
    return v.length >= 5 ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null;
  };
  const base = { restingHr: avg('restingHr'), hrvMs: avg('hrvMs') };
  if (base.restingHr == null && base.hrvMs == null) return { base, after: [], backOn: null };
  const after = days
    .filter((d) => d.date > endDay && d.date <= addDay(endDay, 21))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const okHr = base.restingHr == null || !Number.isFinite(d.restingHr) || d.restingHr <= base.restingHr + 2;
      const okHrv = base.hrvMs == null || !Number.isFinite(d.hrvMs) || d.hrvMs >= base.hrvMs * 0.9;
      const any = Number.isFinite(d.restingHr) || Number.isFinite(d.hrvMs);
      return { date: d.date, restingHr: d.restingHr ?? null, hrvMs: d.hrvMs ?? null, back: any && okHr && okHrv };
    });
  const backOn = after.find((d, i) => d.back && (after[i + 1]?.back ?? true))?.date ?? null;
  return { base, after, backOn, days: backOn ? daysBetween(endDay, backOn) : null };
}

/* ---------- 16 · Gleiches Rennen Jahr für Jahr ---------- */

/** The name of a race without years and numbers in front or behind: «Race Across 2026» → «race across». */
export const seriesKey = (title = '') =>
  String(title)
    .toLowerCase()
    .replace(/\b(19|20)\d\d\b/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** The other years of the same race: race trips with the same series key, oldest first. */
export function sameRace(trip, trips = [], races = {}) {
  const key = seriesKey(trip?.title);
  if (!key) return [];
  return trips.filter((t) => !t.skipped && isRaceTrip(t, races) && seriesKey(t.title) === key && t.startDate).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/* ---------- 11 · Rig-Vergleich ---------- */

/** Where a place sits: front, middle, rear, on me or mounted. */
export const RIG_PART = { bar: 'front', pouchL: 'front', pouchR: 'front', fork: 'front', top: 'middle', frame: 'middle', ttrear: 'middle', cage1: 'middle', cage2: 'middle', tool: 'middle', down: 'middle', seat: 'rear', side: 'rear', carry: 'body', hip: 'body', body: 'body', mounted: 'mounted' };
export const RIG_PARTS = [
  { key: 'front', name: 'Front' },
  { key: 'middle', name: 'Middle' },
  { key: 'rear', name: 'Rear' },
  { key: 'body', name: 'On me' },
  { key: 'mounted', name: 'Mounted' },
];
/**
 * Weight and volume of a trip's packing list by part of the bike. → { g, l, missing, parts: { front: { g, l } … } }
 * Volume only counts items with litres; a weight without a value is counted in missing.
 */
export function rigOf(trip, items = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const parts = Object.fromEntries(RIG_PARTS.map((p) => [p.key, { g: 0, l: 0 }]));
  let g = 0;
  let l = 0;
  let missing = 0;
  for (const e of trip?.entries ?? []) {
    const it = byId[e.itemId];
    const q = e.qty || 1;
    const part = parts[RIG_PART[e.slot] ?? 'middle'];
    if (it?.weightG == null) missing++;
    else (part.g += it.weightG * q), (g += it.weightG * q);
    if (it?.volumeL > 0) (part.l += it.volumeL * q), (l += it.volumeL * q);
  }
  return { g, l: Math.round(l * 10) / 10, missing, parts };
}

/* ---------- 4 · Pflichtmaterial ---------- */

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const WORDS_SKIP = new Set(['mit', 'und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'the', 'and', 'or', 'with', 'a', 'an', 'of', 'fur', 'for', 'min', 'mind', 'mindestens', 'at', 'least', 'pflicht', 'mandatory']);
/** The words of a rule line that matter. */
const keyWords = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !WORDS_SKIP.has(w) && !/^\d+$/.test(w));

/**
 * Paste the race rules, one thing per line → rows (blank lines and «- » bullets go away).
 */
export const rulesFromText = (text = '') =>
  String(text)
    .split(/\r?\n|;/)
    .map((s) => s.replace(/^\s*([-*•·]|\d+[.)])\s*/, '').trim())
    .filter((s) => s.length > 1);

/**
 * Each rule against the packing list: found (an item whose name shares a word with the rule, or the item
 * you linked by hand) or missing. names: [{ id, name }] of the packed items. → [{ ...rule, item|null }]
 */
export function checkRules(rules = [], packed = []) {
  const list = packed.map((p) => ({ ...p, w: new Set(keyWords(p.name)) }));
  return rules.map((r) => {
    if (r.itemId) return { ...r, item: packed.find((p) => p.id === r.itemId) ?? null, byHand: true };
    const ws = keyWords(r.text);
    const hit = list.find((p) => ws.some((w) => p.w.has(w) || [...p.w].some((x) => x.length > 4 && (x.startsWith(w) || w.startsWith(x)))));
    return { ...r, item: hit ? { id: hit.id, name: hit.name } : null, byHand: false };
  });
}

/* ---------- 21 · Drop-Bags / 22 · Velo-Check / 28 · Schlechtwetter ---------- */

/** 22 · The check after the race, as the app comes (yours to change). English keys. */
export const POST_CHECK = [
  'Wash the bike, dry the chain and oil it',
  'Chain: measure the wear',
  'Brake pads: check what is left',
  'Tyres: cuts, sealant, pressure',
  'Bearings: headset, hubs and bottom bracket turn freely',
  'Bolts: stem, handlebar, seat post, bottle cages',
  'Bags: dry them, check straps and zips',
  'Charge and clean lights, GPS and power bank',
  'Wash and air the sleeping bag and mat',
  'Write down what broke or was missing',
];

/** 28 · Bad-weather plans as the app comes (if → then), yours to change. kinds match the forecast check. */
export const BAD_WEATHER = [
  { id: 'bw-rain', kind: 'rain', when: 'Rain for hours', then: 'Rain jacket and overshoes on before it starts; dry socks in a bag; eat more, you get cold faster.' },
  { id: 'bw-cold', kind: 'cold', when: 'Below 5 °C at night', then: 'Ride through the coldest hour before sunrise or sleep with a roof; all layers on, a warm drink.' },
  { id: 'bw-heat', kind: 'heat', when: 'Above 30 °C', then: 'Ride early and late, long shade stop at midday; 1 litre per hour and salt.' },
  { id: 'bw-wind', kind: 'wind', when: 'Strong headwind', then: 'Lower on the bike, small steps of 10 km; plan a longer day.' },
  { id: 'bw-storm', kind: 'storm', when: 'Thunderstorm', then: 'Off the pass and the ridge, wait under a roof (not under a single tree), then go on.' },
];

/* ---------- 12 · Länder-Info ---------- */

/**
 * Basic facts per country (as of October 2026; check before the race). sunday: are most shops open on
 * Sundays? plug: the plug types. bbox: [minLat, minLon, maxLat, maxLon], only to guess the countries of
 * a route (a border region may show one too many; you can change the list).
 */
export const COUNTRIES = [
  { code: 'CH', name: 'Switzerland', sos: '112 · 144 ambulance · 1414 Rega', money: 'CHF', plug: 'J (C fits)', sunday: 'Mostly closed; open at stations and petrol stations', bbox: [45.8, 5.95, 47.81, 10.5] },
  { code: 'DE', name: 'Germany', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Closed; petrol stations and stations open', bbox: [47.27, 5.87, 55.06, 15.04] },
  { code: 'AT', name: 'Austria', sos: '112 · 144 ambulance · 140 mountain rescue', money: 'EUR', plug: 'F, C', sunday: 'Closed; petrol stations and stations open', bbox: [46.37, 9.53, 49.02, 17.16] },
  { code: 'FR', name: 'France', sos: '112 · 15 ambulance', money: 'EUR', plug: 'E, C', sunday: 'Often open in the morning, closed after midday', bbox: [42.33, -4.8, 51.09, 8.23] },
  { code: 'IT', name: 'Italy', sos: '112 · 118 ambulance', money: 'EUR', plug: 'L, F, C', sunday: 'Often open in towns, closed in villages', bbox: [36.6, 6.62, 47.09, 18.52] },
  { code: 'LI', name: 'Liechtenstein', sos: '112 · 144 ambulance', money: 'CHF', plug: 'J (C fits)', sunday: 'Mostly closed', bbox: [47.05, 9.47, 47.27, 9.64] },
  { code: 'SI', name: 'Slovenia', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Many closed; petrol stations open', bbox: [45.42, 13.38, 46.88, 16.6] },
  { code: 'HR', name: 'Croatia', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Many closed since 2023; some open', bbox: [42.39, 13.49, 46.55, 19.45] },
  { code: 'ES', name: 'Spain', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Mostly closed; tourist places open', bbox: [36.0, -9.3, 43.8, 3.33] },
  { code: 'PT', name: 'Portugal', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Supermarkets mostly open', bbox: [36.96, -9.5, 42.15, -6.19] },
  { code: 'NL', name: 'Netherlands', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Often open in towns', bbox: [50.75, 3.36, 53.55, 7.23] },
  { code: 'BE', name: 'Belgium', sos: '112', money: 'EUR', plug: 'E, C', sunday: 'Mostly closed', bbox: [49.5, 2.54, 51.5, 6.4] },
  { code: 'LU', name: 'Luxembourg', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Often open in the morning', bbox: [49.45, 5.73, 50.18, 6.53] },
  { code: 'CZ', name: 'Czechia', sos: '112 · 155 ambulance', money: 'CZK', plug: 'E, C', sunday: 'Mostly open', bbox: [48.55, 12.09, 51.06, 18.86] },
  { code: 'PL', name: 'Poland', sos: '112', money: 'PLN', plug: 'E, C', sunday: 'Mostly closed (shopping Sunday ban)', bbox: [49.0, 14.12, 54.84, 24.15] },
  { code: 'DK', name: 'Denmark', sos: '112', money: 'DKK', plug: 'K, C', sunday: 'Mostly open', bbox: [54.56, 8.07, 57.75, 15.2] },
  { code: 'NO', name: 'Norway', sos: '112 · 113 ambulance', money: 'NOK', plug: 'F, C', sunday: 'Closed; small shops open', bbox: [57.96, 4.5, 71.2, 31.1] },
  { code: 'SE', name: 'Sweden', sos: '112', money: 'SEK', plug: 'F, C', sunday: 'Mostly open', bbox: [55.34, 11.1, 69.06, 24.17] },
  { code: 'GB', name: 'United Kingdom', sos: '999 · 112', money: 'GBP', plug: 'G', sunday: 'Open, shorter hours', bbox: [49.9, -8.2, 58.7, 1.77] },
  { code: 'IE', name: 'Ireland', sos: '112 · 999', money: 'EUR', plug: 'G', sunday: 'Open, shorter hours', bbox: [51.42, -10.48, 55.39, -5.99] },
  { code: 'HU', name: 'Hungary', sos: '112', money: 'HUF', plug: 'F, C', sunday: 'Mostly open', bbox: [45.74, 16.11, 48.59, 22.9] },
  { code: 'SK', name: 'Slovakia', sos: '112', money: 'EUR', plug: 'E, C', sunday: 'Mostly open', bbox: [47.73, 16.83, 49.61, 22.57] },
  { code: 'BA', name: 'Bosnia and Herzegovina', sos: '112 · 124 ambulance', money: 'BAM', plug: 'F, C', sunday: 'Mostly open', bbox: [42.55, 15.72, 45.28, 19.62] },
  { code: 'ME', name: 'Montenegro', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Mostly open', bbox: [41.85, 18.43, 43.56, 20.36] },
  { code: 'AL', name: 'Albania', sos: '112 · 127 ambulance', money: 'ALL', plug: 'F, C', sunday: 'Mostly open', bbox: [39.64, 19.26, 42.66, 21.06] },
  { code: 'GR', name: 'Greece', sos: '112 · 166 ambulance', money: 'EUR', plug: 'F, C', sunday: 'Mostly closed; tourist places open', bbox: [34.8, 19.37, 41.75, 29.65] },
  { code: 'RS', name: 'Serbia', sos: '112 · 194 ambulance', money: 'RSD', plug: 'F, C', sunday: 'Mostly open', bbox: [42.23, 18.82, 46.19, 23.0] },
  { code: 'RO', name: 'Romania', sos: '112', money: 'RON', plug: 'F, C', sunday: 'Mostly open', bbox: [43.62, 20.26, 48.27, 29.7] },
  { code: 'BG', name: 'Bulgaria', sos: '112', money: 'EUR', plug: 'F, C', sunday: 'Mostly open', bbox: [41.24, 22.36, 44.22, 28.6] },
  { code: 'TR', name: 'Türkiye', sos: '112', money: 'TRY', plug: 'F, C', sunday: 'Mostly open', bbox: [35.8, 25.66, 42.11, 44.82] },
];
export const COUNTRY = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

/**
 * The countries a route goes through (guessed from the boxes; a point in two boxes takes the smaller
 * box, which is right for most border areas). points: [{ lat, lon }] → codes in route order.
 */
export function countriesOf(points = []) {
  const out = [];
  const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
  for (const p of points) {
    const hits = COUNTRIES.filter(({ bbox: b }) => p.lat >= b[0] && p.lat <= b[2] && p.lon >= b[1] && p.lon <= b[3]).sort((a, b) => area(a.bbox) - area(b.bbox));
    const c = hits[0]?.code;
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/* ---------- 14 · Kontaktpunkte ---------- */

/** The contact points (0 nothing … 3 painful). Observation, no diagnosis. */
export const CONTACT_PARTS = [
  { key: 'saddle', name: 'Saddle area' },
  { key: 'hands', name: 'Hands' },
  { key: 'feet', name: 'Feet' },
  { key: 'neck', name: 'Neck and shoulders' },
  { key: 'knees', name: 'Knees' },
];
export const CONTACT_LEVELS = ['Nothing', 'A little', 'Clearly', 'Painful'];
/** Per part the highest level and on how many entries it hurt (≥ 2). */
export function contactSummary(contacts = []) {
  return CONTACT_PARTS.map((p) => {
    const v = contacts.map((c) => Number(c.parts?.[p.key]) || 0);
    return { ...p, max: v.length ? Math.max(...v) : 0, hurt: v.filter((x) => x >= 2).length };
  });
}

/* ---------- 26 · Magen-Test ---------- */

export const VERDICTS = [
  { key: 'good', name: 'Went well' },
  { key: 'mid', name: 'So-so' },
  { key: 'bad', name: 'Did not work' },
];
/** Per food the tests and the latest verdict, best first. */
export function stomachList(tests = []) {
  const by = {};
  for (const x of tests) {
    const k = norm(x.food);
    if (!k) continue;
    (by[k] ??= { food: x.food, tests: [] }).tests.push(x);
  }
  const rank = { good: 0, mid: 1, bad: 2 };
  return Object.values(by)
    .map((f) => {
      const sorted = [...f.tests].sort((a, b) => (b.day ?? '').localeCompare(a.day ?? ''));
      const maxH = Math.max(0, ...f.tests.map((x) => Number(x.h) || 0));
      return { food: f.food, n: f.tests.length, verdict: sorted[0].verdict ?? 'mid', maxH, tests: sorted };
    })
    .sort((a, b) => rank[a.verdict] - rank[b.verdict] || b.n - a.n);
}
