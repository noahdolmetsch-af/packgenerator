/**
 * SN2x «SN2 extra» (Noah 13.10.2026 19:48 «SN2j–SN2k freigegeben», answers 1a 2 «a und b» 3a 4 (5 groups,
 * 20:18 «b») 5a 6 «2 3 4 5 6», 7 (20:23/20:24 «immer nur wenn relevant»)): the numbers behind the whole
 * Rückblick of one trip, in five groups that fold open, with one day switch on top for a trip of several days.
 *
 * - compareGroup / similarRows: «Vergleich» only inside one of five groups, Bikepacking or one of the bikes,
 *   with km and Hm each at most ±20 % apart.
 * - dayTabs / dayFacts: the day switch and the numbers of one day.
 * - timeline / tripNoteList: «Zeitleiste» and «Notizen» (U4).
 * - wearRows / chainLeft: «Abnutzung» (U2) and «Velo nach der Tour».
 * - packedList: «Packliste, wie gepackt» (U5), fixed once the debrief is saved.
 * - nextTime: «Für nächstes Mal» (U6), each point with the situation it is for; it shows when planning or
 *   packing a trip only when that trip fits (situation.js rules, plus dark).
 * Pure functions, tested in tests/sn2x.test.js. Health values are observation only.
 */
import { hasBike, domainOf, BIKEPACKING } from '../domains.js';
import { ZONE } from '../trips.js';
import { stagePlan } from '../stages.js';
import { kmSince, lastReplace, partInfo } from '../care.js';
import { situationHits, SITUATION_BLOCKS } from '../situation.js';
import { ridesIntoDark } from '../blockplan.js';
import { heartOf } from '../kmbook.js';
import { tripPower, effortOf, loadOf } from './power.js';

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const sum = (list, f) => {
  const xs = list.map(f).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return xs.length ? xs.reduce((s, v) => s + v, 0) : null;
};
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dayOf = (a) => a?.day ?? a?.date ?? null;

/* ---------- the five groups of the page (answer 1a) ---------- */

/** The groups of the page, in their order; only «Die Tour» is open at the start. */
export const GROUPS = [
  { key: 'tour', name: 'The trip|review' },
  { key: 'body', name: 'Body and performance' },
  { key: 'way', name: 'On the way|review' },
  { key: 'pack', name: 'Luggage and bike' },
  { key: 'next', name: 'Next|review' },
];
// Impeccable Runde 2 (Rückblick einer Tour 3): «Weiter» is open from the start, it shows the next step
export const OPEN_START = { tour: true, next: true };
/** The open groups as remembered (localStorage value, JSON) made safe: { key: true | false }. */
export function openOf(stored) {
  let v = null;
  try {
    v = typeof stored === 'string' ? JSON.parse(stored) : stored;
  } catch {
    v = null;
  }
  const out = { ...OPEN_START };
  if (v && typeof v === 'object') for (const g of GROUPS) if (typeof v[g.key] === 'boolean') out[g.key] = v[g.key];
  return out;
}

/* ---------- the comparison groups (answer 4, 20:18 «b») ---------- */

/** km and Hm each at most this far apart (±20 %). */
export const SIMILAR_TOL = 0.2;

/**
 * Is a trip of the kind Bikepacking? Only trips of the area Bikepacking that have a night on the way.
 * SN2x: wire to the Tourart «Velo» (round TA, not built yet): until a trip carries the kind «Velo» of its
 * own, a bike trip of one day without a night counts as a ride of its bike, not as Bikepacking.
 */
export function isBikepacking(trip) {
  if (!trip || !hasBike(trip) || domainOf(trip) !== BIKEPACKING) return false;
  if (trip.domain === 'velo') return false;
  const days = Math.max(1, Number(trip.days) || 1);
  return days > 1 || (!!trip.overnight && trip.overnight !== 'none');
}

/**
 * The comparison group of a trip: { key: 'bikepacking' | 'bike:<id>', name, bikeId } or null (no bike).
 * Bikepacking holds only trips of the kind Bikepacking, with any bike; every other trip goes by its bike.
 */
export function compareGroup(trip, bikes = []) {
  if (!trip || !hasBike(trip)) return null;
  if (isBikepacking(trip)) return { key: 'bikepacking', name: 'Bikepacking', bikeId: null };
  if (!trip.bikeId) return null;
  const bike = bikes.find((b) => b.id === trip.bikeId);
  return { key: `bike:${trip.bikeId}`, name: bike?.name ?? trip.bike ?? '', bikeId: trip.bikeId };
}

/** Is b within ±tol of a (a: this trip's value)? Both must be known. */
export const within = (a, b, tol = SIMILAR_TOL) => pos(a) != null && pos(b) != null && Math.abs(b - a) <= tol * a;

/**
 * The trips like this one: done trips (tripFacts rows) of the same group, km and Hm each within ±20 %,
 * the earlier ones first (newest first), then later ones. row: this trip's row.
 */
export function similarRows(rows = [], row, bikes = []) {
  const g = compareGroup(row?.trip, bikes);
  if (!g) return [];
  const same = rows.filter((r) => r.kind === 'trip' && r.id !== row.id && compareGroup(r.trip, bikes)?.key === g.key && within(row.km, r.km) && within(row.gainM, r.gainM));
  const before = same.filter((r) => r.start < row.start).sort((a, b) => b.start.localeCompare(a.start));
  const after = same.filter((r) => r.start >= row.start).sort((a, b) => a.start.localeCompare(b.start));
  return [...before, ...after];
}

/* ---------- the numbers of a trip (or one day), also for the comparison ---------- */

/** The activities of one day (or all of them with day null). */
export const actsOn = (acts = [], date = null) => (date ? acts.filter((a) => dayOf(a) === date) : acts);

/**
 * The numbers of a trip for «Vergleich» and the summaries: { kmh, movingH, pauseMin, hrAvg, wAvg, west, effort, load }.
 * row: a tripFacts row; acts: its activities; entries: its Strava rides in the ledger; history: all activities.
 */
export function tripNumbers(row, { acts = [], entries = [], history = [] } = {}) {
  const heart = acts.some((a) => pos(a.hrAvg)) ? { avg: Math.round(sum(acts.filter((a) => pos(a.hrAvg)), (a) => a.hrAvg * (pos(a.movingS) ?? 1)) / sum(acts.filter((a) => pos(a.hrAvg)), (a) => pos(a.movingS) ?? 1)) } : heartOf(entries);
  const p = tripPower({ acts, history, end: row?.end ?? null });
  const pauseS = sum(acts, (a) => a?.pauses?.secs);
  return {
    kmh: row?.kmh ?? null,
    movingH: row?.movingH ?? null,
    pauseMin: pauseS != null ? Math.round(pauseS / 60) : row?.pauses ? row.pauses.min : null,
    hrAvg: heart?.avg ?? null,
    wAvg: p?.avg ?? null,
    west: p ? !p.measured : false,
    effort: effortOf(acts),
    load: loadOf(acts, history, row?.end ?? null),
  };
}

/** The rows of «Vergleich»: [{ key, a (this trip), b (the other), diff }], only rows both know. */
export const COMPARE_ROWS = ['kmh', 'movingH', 'pauseMin', 'hrAvg', 'wAvg', 'effort', 'load'];
export function compareRows(a, b) {
  return COMPARE_ROWS.filter((k) => a?.[k] != null && b?.[k] != null).map((k) => ({ key: k, a: a[k], b: b[k], diff: k === 'kmh' ? r1(a[k] - b[k]) : k === 'movingH' ? r2(a[k] - b[k]) : Math.round(a[k] - b[k]) }));
}

/* ---------- the day switch (answer 5a) ---------- */

/** The tabs of a trip of several days: [null (the whole trip), 0, 1, …]; [] for a day trip. */
export function dayTabs(trip) {
  const n = Math.max(1, Number(trip?.days) || 1);
  return n > 1 ? [null, ...Array.from({ length: n }, (_, i) => i)] : [];
}

/**
 * The numbers of one day (0-based) of a trip row: { n, date, from, to, km, gainM, movingH, totalH, kmh,
 * pauses: { n, min } | null, rain (mm), wet, tmin, tmax, rides }. From the day's rides, the stage
 * names (Einteilen) and the forecast saved on the trip. Unknown stays null.
 */
export function dayFacts(row, day) {
  if (!row?.trip || day == null) return null;
  const trip = row.trip;
  const date = addDays(trip.startDate, day);
  const rides = (row.rides ?? []).filter((r) => r.date === date);
  const stage = stagePlan(trip)[day] ?? null;
  const fc = (trip.forecast?.days ?? []).find((d) => d.date === date) ?? null;
  const km = pos(sum(rides, (r) => r.km));
  const movingH = r2(pos(sum(rides, (r) => r.movingH)));
  const totalH = r2(pos(sum(rides, (r) => Math.max(r.totalH ?? 0, r.movingH ?? 0))));
  const pauses = rides.flatMap((r) => r.pauses ?? []);
  return {
    n: day + 1,
    date,
    from: stage?.from || '',
    to: stage?.to || '',
    km: km != null ? r1(km) : stage?.km ?? null,
    gainM: pos(sum(rides, (r) => r.gainM)) ?? stage?.gainM ?? null,
    movingH,
    totalH,
    kmh: km && movingH ? r1(km / movingH) : null,
    pauses: pauses.length ? { n: pauses.length, min: pauses.reduce((s, p) => s + (p.min ?? 0), 0) } : null,
    rain: fc?.rainMm ?? null,
    wet: fc ? (fc.rainMm ?? 0) >= 1 : null,
    tmin: typeof fc?.min === 'number' ? Math.floor(fc.min) : null,
    tmax: typeof fc?.max === 'number' ? Math.ceil(fc.max) : null,
    rides,
  };
}

/* ---------- Zeitleiste and Notizen (U4) ---------- */

/** Pauses shorter than this are folded in the timeline. */
export const SHORT_PAUSE_MIN = 5;

const msOf = (iso) => (iso ? Date.parse(iso) : NaN);

/**
 * The timeline of a trip or of one day: [{ kind: 'start' | 'note' | 'pause' | 'end', at, day, km, min, text, n, short }].
 * km counts from the start of that day (null when unknown); a note gets its km from the ride it falls in.
 * n: the number shown on map, profile and timeline (entries with a km only; the end of a round trip takes
 * the start's number); tkm: the km from the trip's start (for the map of the whole trip).
 * rides: the trip's uploaded rides (oldest first); notes: tripNotes(); trip: for the days.
 */
export function timeline({ trip, rides = [], notes = [], day = null, loop = false } = {}) {
  if (!trip?.startDate) return [];
  const dayIdx = (date) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / 864e5);
  const sorted = [...rides].filter((r) => r.date).sort((a, b) => (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date));
  const before = {};
  let acc = 0;
  for (const r of sorted) {
    before[r.id] = acc;
    acc += Number(r.km) || 0;
  }
  const out = [];
  for (const r of sorted) {
    const d = dayIdx(r.date);
    if (day != null && d !== day) continue;
    const off = sorted.filter((x) => x.date === r.date && x !== r && (x.startAt ?? '') < (r.startAt ?? '')).reduce((s, x) => s + (Number(x.km) || 0), 0);
    const start = msOf(r.startAt);
    const endMs = Number.isFinite(start) && pos(r.totalH) ? start + r.totalH * 36e5 : NaN;
    if (Number.isFinite(start)) out.push({ kind: 'start', at: r.startAt, day: d, km: r1(off), tkm: r1(before[r.id]), name: r.name ?? '' });
    for (const p of r.pauses ?? []) out.push({ kind: 'pause', at: p.at, day: d, km: r1(off + (p.km ?? 0)), tkm: r1(before[r.id] + (p.km ?? 0)), min: p.min ?? null, short: (p.min ?? 0) < SHORT_PAUSE_MIN });
    if (Number.isFinite(endMs)) out.push({ kind: 'end', at: new Date(endMs).toISOString(), day: d, km: r1(off + (Number(r.km) || 0)), tkm: r1(before[r.id] + (Number(r.km) || 0)) });
  }
  for (const n of notes) {
    if (n.day == null) continue;
    if (day != null && n.day !== day) continue;
    const t = msOf(n.at);
    const r = sorted.find((x) => dayIdx(x.date) === n.day && Number.isFinite(msOf(x.startAt)) && pos(x.totalH) && t >= msOf(x.startAt) && t <= msOf(x.startAt) + x.totalH * 36e5);
    let km = null;
    let tkm = null;
    if (r) {
      const f = (t - msOf(r.startAt)) / (r.totalH * 36e5);
      const off = sorted.filter((x) => x.date === r.date && x !== r && (x.startAt ?? '') < (r.startAt ?? '')).reduce((s, x) => s + (Number(x.km) || 0), 0);
      km = r1(off + f * (Number(r.km) || 0));
      tkm = r1(before[r.id] + f * (Number(r.km) || 0));
    }
    out.push({ kind: 'note', at: n.at, day: n.day, km, tkm, text: n.text, photo: n.photo ?? null });
  }
  out.sort((a, b) => a.day - b.day || (a.at ?? '').localeCompare(b.at ?? '') || (a.kind === 'start' ? -1 : b.kind === 'start' ? 1 : 0));
  let n = 0;
  for (const e of out) {
    if (e.km == null || e.short) continue;
    if (e.kind === 'end' && loop && out.filter((x) => x.kind === 'start').length === 1) e.n = out.find((x) => x.kind === 'start')?.n ?? ++n;
    else e.n = ++n;
  }
  return out;
}

/**
 * «Notizen» (U4): every note of the trip with its time and place, also those after the trip.
 * → [{ text, at, day, km, after }] in time order; after: written after the trip (or the sentence for next time).
 */
export function tripNoteList({ trip, debrief, notes = [], line = [] } = {}) {
  const kmOf = (n) => line.find((e) => e.kind === 'note' && e.at === n.at && e.text === n.text)?.km ?? null;
  const seen = new Set();
  const out = [];
  for (const n of [...(debrief?.rideNotes ?? []).map((x) => ({ ...x, day: x.day ?? 0 })), ...notes.filter((x) => x.tripId === trip?.id)]) {
    const key = `${n.at}|${n.text}`;
    if (seen.has(key) || !String(n.text ?? '').trim()) continue;
    seen.add(key);
    out.push({ text: n.text.trim(), at: n.at ?? null, day: n.day ?? null, km: n.day != null ? kmOf(n) : null, after: n.day == null });
  }
  const s = (debrief?.note ?? '').trim();
  if (s && !seen.has(`|${s}`) && !out.some((x) => x.text === s)) out.push({ text: s, at: debrief.doneAt ?? debrief.updatedAt ?? null, day: null, km: null, after: true });
  return out.sort((a, b) => (a.after === b.after ? (a.at ?? '').localeCompare(b.at ?? '') : a.after ? 1 : -1));
}

/* ---------- Velo nach der Tour and Abnutzung (U2) ---------- */

const part = (bike, key) => (bike?.parts ?? []).find((p) => p.key === key) ?? null;
const isWork = (h) => h.action === 'service' || h.action === 'replace';

/** The km left to the next chain service (wax / lube every 150 km), negative when overdue; null unknown. */
export function chainLeft(bike) {
  const c = part(bike, 'chain');
  if (!c) return null;
  const since = kmSince(bike, [...(c.history ?? [])].reverse().find(isWork));
  // v0.144.0 RE: the bike's own interval (Pflege für …); switched off: nothing to count down.
  const every = partInfo(c).everyKm;
  return since == null || !every ? null : Math.round(every - since);
}

/**
 * «Abnutzung»: what this trip added to the parts of the bike, with the new state.
 * → [{ key: 'chain' | 'tyres' | 'pads', addKm, addHm, nowKm }] (nowKm: km since the part was put on, or null).
 * Nothing without a bike or without the trip's km.
 */
export function wearRows(bike, { km = null, gainM = null } = {}) {
  if (!bike || !pos(km)) return [];
  const since = (key) => {
    const p = part(bike, key);
    return p ? kmSince(bike, lastReplace(p)) : null;
  };
  const out = [
    { key: 'chain', addKm: Math.round(km), addHm: null, nowKm: since('chain') },
    { key: 'tyres', addKm: Math.round(km), addHm: null, nowKm: since('tyres') },
  ];
  if (pos(gainM)) out.push({ key: 'pads', addKm: null, addHm: Math.round(gainM), nowKm: null });
  return out;
}

/* ---------- Packliste, wie gepackt (U5) ---------- */

/**
 * The packed list as it was: [{ slot, name, items: [{ id, name, nameDe, g, qty }], g, n }] in the order of the
 * trip; g null when nothing in the bag is weighed. snap: the list kept on the saved debrief (debrief.packed),
 * taken as it is; else it is built from the trip and the gear now.
 */
export function packedList(trip, items = [], containers = [], snap = null) {
  if (Array.isArray(snap) && snap.length) return snap;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const out = [];
  const seen = new Set();
  for (const e of trip?.entries ?? []) {
    const it = byId[e.itemId];
    if (!it || seen.has(`${e.slot}|${e.itemId}`)) continue;
    seen.add(`${e.slot}|${e.itemId}`);
    let g = out.find((x) => x.slot === e.slot);
    if (!g) {
      const bag = containers.find((c) => c.id === trip.setup?.[e.slot]);
      const own = trip.packs?.find((p) => p.key === e.slot);
      g = { slot: e.slot, name: trip.purpose?.[e.slot] || own?.name || ZONE[e.slot]?.name || bag?.name || e.slot, items: [], g: null, n: 0 };
      out.push(g);
    }
    const qty = e.qty || 1;
    const w = it.weightG == null ? null : it.weightG * qty;
    g.items.push({ id: it.id, name: it.name, nameDe: it.nameDe ?? null, g: w, qty });
    g.n += 1;
    if (w != null) g.g = (g.g ?? 0) + w;
  }
  return out;
}
/** The totals of a packed list: { bags, n, g } (g null when nothing is weighed). */
export function packedTotals(list = []) {
  const ws = list.map((b) => b.g).filter((v) => v != null);
  return { bags: list.length, n: list.reduce((s, b) => s + b.n, 0), g: ws.length ? ws.reduce((s, v) => s + v, 0) : null };
}

/* ---------- Für nächstes Mal (U6, answer 7 «immer nur wenn relevant») ---------- */

/** When a point fits: any trip, one of the seven situations (situation.js) or a ride into the dark. */
export const NEXT_WHEN = ['any', ...SITUATION_BLOCKS, 'dark'];
/** The words of each «when» (English keys for t()). */
export const WHEN_WORD = { any: 'every trip', cold: 'when it is cold', heat: 'when it is hot', climb: 'with a pass or climbing', long: 'on a long ride', abroad: 'abroad|when', train: 'by train|when', rain: 'when it rains', dark: 'riding into the dark' };

const WHEN_WORDS = [
  ['dark', /\b(licht|lampe|stirnlampe|dunkel|nacht|light|lamp|headlamp|dark|night)/i],
  ['cold', /\b(kalt|kälte|frier|friert|handschuh|überschuh|winter|cold|glove|freez)/i],
  ['rain', /\b(regen|nass|rain|wet)/i],
  ['heat', /\b(heiss|hitze|sonnencreme|sonnenbrand|warm|hot|heat|sunscreen|sunburn)/i],
  ['climb', /\b(pass|steil|höhenmeter|aufstieg|climb|steep)/i],
  ['train', /\b(zug|bahn|train)/i],
  ['abroad', /\b(ausland|grenze|euro|abroad|border)/i],
];

/** The situation a point is probably for, from its words; else the first situation of the trip it came from; else 'any'. */
export function guessWhen(text, hits = {}) {
  const s = String(text ?? '');
  for (const [k, re] of WHEN_WORDS) if (re.test(s)) return k;
  return SITUATION_BLOCKS.find((k) => hits?.[k]) ?? 'any';
}

/** A point made safe: { id, text, when } or null. */
export function cleanPoint(p) {
  const text = String(p?.text ?? '').trim();
  if (!text) return null;
  return { id: String(p.id ?? ''), text, when: NEXT_WHEN.includes(p.when) ? p.when : 'any' };
}

/** The points stored on a debrief (debrief.nextTime), made safe. */
export const pointsOf = (debrief) => (Array.isArray(debrief?.nextTime) ? debrief.nextTime.map(cleanPoint).filter(Boolean) : []);

/**
 * Suggestions for «Für nächstes Mal» from the debrief: what was missing («{name} einpacken») and the sentence
 * for next time, unless already a point. → [{ key, text (or item name with pack: true), when }].
 */
export function pointSuggestions(debrief, hits = {}) {
  const have = new Set(pointsOf(debrief).map((p) => p.text.toLowerCase()));
  const out = [];
  for (const m of debrief?.missing ?? []) {
    const name = String(m.name ?? '').trim();
    if (name) out.push({ key: `miss:${m.id ?? name}`, name, pack: true, when: guessWhen(name, hits) });
  }
  const note = String(debrief?.note ?? '').trim();
  if (note) out.push({ key: 'note', text: note, pack: false, when: guessWhen(note, hits) });
  return out.filter((s) => !have.has((s.text ?? s.name).toLowerCase()) && !(s.pack && [...have].some((h) => h.includes(s.name.toLowerCase()))));
}

/**
 * Does a point fit a trip being planned? 'any' always; 'dark' when the ride goes into the dark (trip.dark, set in
 * Packen, else blockplan.js ridesIntoDark);
 * the seven situations by their rule (situation.js, setsValue: the settings «sets»).
 */
export function pointFits(point, trip, setsValue = null, place = null) {
  if (!point || !trip) return false;
  if (point.when === 'any') return true;
  if (point.when === 'dark') return trip.dark === true || ridesIntoDark(trip, place ?? trip.place ?? trip.route?.start ?? trip.forecast?.place ?? null);
  return !!situationHits(trip, setsValue)[point.when];
}

/**
 * The reminders for a trip being planned or packed: the points of every other saved debrief that fit it,
 * the newest trip first. → [{ id, text, when, from (title), fromId }].
 */
export function remindersFor(trip, { debriefs = [], trips = [], sets = null, place = null } = {}) {
  if (!trip) return [];
  const byId = Object.fromEntries(trips.map((x) => [x.id, x]));
  return debriefs
    .filter((d) => d.status === 'done' && d.tripId !== trip.id && byId[d.tripId])
    .sort((a, b) => (byId[b.tripId].startDate ?? '').localeCompare(byId[a.tripId].startDate ?? ''))
    .flatMap((d) => pointsOf(d).filter((p) => pointFits(p, trip, sets, place)).map((p) => ({ ...p, from: byId[d.tripId].title ?? '', fromId: d.tripId })));
}

/* ---------- the quiet line of each closed group ---------- */

/** The last values of a series of trips (oldest first), this trip last: [{ id, v }] (at most n). */
export function lastSeries(rows = [], row, valueOf, n = 8) {
  const older = rows.filter((r) => r.kind === 'trip' && r.id !== row.id && r.start <= row.start).sort((a, b) => b.start.localeCompare(a.start)).slice(0, n - 1).reverse();
  return [...older, row].map((r) => ({ id: r.id, v: valueOf(r) }));
}
