/**
 * v0.48.0 «Pflege-Übersicht C» (Noah, «Drei Seiten» part C, 1-15 a): the numbers of the care overview.
 * - a ring per bike, 0-100: the share of its parts with nothing due; brakes and drivetrain count double;
 * - at most three «due now» cards over all bikes, the most urgent first;
 * - km since the last 1000 km check per bike;
 * - the bike diary: the newest work over all bikes, with milestones (a bike passed 1'000 km more,
 *   weeks without a breakdown).
 * bikes: from withVisits (workshop.js). Pure functions, easy to test.
 */
import { AREAS, PART, CHECK_KM, checkState, bikeLog, isPrep, taskBike, partName } from '../care.js';
import { visitTotal } from '../workshop.js';
import { partStatus, isDueState } from './last.js';
import { localDay } from '../localday.js';

const DOUBLE = new Set(['brakes', 'drive']);
const DAY = 864e5;

/** The parts that count for the ring: no check points, no old parts without a history. */
const counted = (bike) => (bike.parts ?? []).filter((p) => (PART[p.key]?.area ?? p.area) !== 'checks' && !(PART[p.key]?.legacy && !p.history?.length));

/**
 * The ring of one bike: { score, due, parts } or { score: null } when nothing is known (no km and
 * not one entry). score: 0-100, the weighted share of parts with nothing due.
 */
export function ringScore(bike, time = [], today = localDay()) {
  const parts = counted(bike);
  // Nothing recorded on any part: no ring value (never «100» for a bike nobody looked at).
  if (!parts.some((p) => p.history?.length)) return { score: null, due: 0, parts: parts.length };
  let all = 0;
  let fine = 0;
  let due = 0;
  for (const p of parts) {
    const w = DOUBLE.has(PART[p.key]?.area) ? 2 : 1;
    const st = partStatus(bike, p, time, today).state;
    all += w;
    if (isDueState(st)) due += 1;
    else fine += w;
  }
  return { score: all ? Math.round((fine / all) * 100) : null, due, parts: parts.length };
}

/** 'good' (80+), 'mid' (60-79), 'low': the colour of a ring. */
export const ringTone = (score) => (score == null ? 'none' : score >= 80 ? 'good' : score >= 60 ? 'mid' : 'low');

/**
 * At most `max` due cards over all bikes, the most urgent first: a worn part or work needed, then
 * what is overdue, then the 1000 km check and the services by km. Open repairs stay in the problem list.
 * checks: [{ bike, care }] with care from readiness.bikeCare. Returns { cards: [{ bike, row, rank }], total }.
 */
export function dueCards(checks, max = 3) {
  const rank = (r) => (r.kind === 'part' ? 3 : r.kind === 'time' ? 2 : r.kind === 'check' ? 1 : 1);
  const all = checks.flatMap((c) => (c.care?.rows ?? []).filter((r) => r.kind !== 'repair').map((row) => ({ bike: c.bike, row, rank: rank(row) })));
  all.sort((a, b) => b.rank - a.rank);
  return { cards: all.slice(0, max), total: all.length };
}

/** km since the last 1000 km check: { since, every, date } (the oldest check point), or null. */
export function kmSinceService(bike) {
  const rows = checkState(bike).rows.filter((r) => r.since != null);
  if (!rows.length) return null;
  const since = Math.max(...rows.map((r) => r.since));
  // The date of the oldest check point's last look.
  let date = null;
  for (const p of bike.parts ?? []) {
    const last = [...(p.history ?? [])].reverse().find((h) => h.result !== 'needed' && typeof h.km === 'number' && bike.km - h.km === since);
    if (last) date = last.date;
  }
  return { since, every: CHECK_KM, date };
}

/** Bike problems (repairs on a bike), all states: for «weeks without a breakdown». */
const problemsOf = (tasks, bikes) => tasks.filter((x) => !isPrep(x) && x.logDate && bikes.some((b) => b.id === taskBike(x)));

/** Whole weeks since the newest problem was noted; null without any problem on record. */
export function calmWeeks(tasks, bikes, today = localDay()) {
  const newest = problemsOf(tasks, bikes).map((x) => x.logDate).sort().at(-1);
  if (!newest) return null;
  return Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${newest}T00:00:00Z`)) / (7 * DAY)));
}

/**
 * The bike diary: the newest entries over all bikes (one row per bike, day, action and note),
 * and the milestones: a bike that passed a full 1'000 km (dated with its km date).
 * Returns [{ date, bikeId, bikeName, what, action, km, by, chf, milestone }], newest first.
 */
export function diary(bikes, tasks = [], n = 5) {
  const rows = [];
  const seen = new Set();
  for (const b of bikes) {
    for (const h of bikeLog(b, tasks)) {
      const key = `${b.id}|${h.date}|${h.action}|${h.what}|${h.visitId ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ date: h.date, bikeId: b.id, bikeName: b.name, what: h.what, action: h.action, result: h.result, value: h.value ?? null, unit: h.unit ?? '', km: h.km ?? null, by: h.by ?? null, chf: h.chf ?? null, milestone: false });
    }
    // A milestone only shortly after it was passed (less than 250 km over the full thousand).
    if (typeof b.km === 'number' && b.km >= 1000 && b.km % 1000 < 250 && b.kmDate) rows.push({ date: b.kmDate, bikeId: b.id, bikeName: b.name, what: '', km: Math.floor(b.km / 1000) * 1000, action: 'milestone', milestone: true });
  }
  rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  // At most one milestone, so the work stays in sight.
  const first = rows.findIndex((r) => r.milestone);
  return rows.filter((r, i) => !r.milestone || i === first).slice(0, n);
}

/** What the visits of one year cost per bike: [{ bike, chf }] in the bike order, and the total. */
export function costYear(bikes, visits, year = localDay().slice(0, 4)) {
  const rows = bikes.map((b) => ({ bike: b, chf: Math.round(visits.filter((v) => v.bikeId === b.id && v.date.startsWith(year)).reduce((s, v) => s + (visitTotal(v) ?? 0), 0) * 100) / 100 }));
  return { rows, total: Math.round(rows.reduce((s, r) => s + r.chf, 0) * 100) / 100, max: Math.max(0, ...rows.map((r) => r.chf)) };
}

/** The areas of a bike's part table, each with its parts; «More» parts and the check points apart. */
export function partAreas(parts, isMore) {
  const main = [];
  const more = [];
  for (const a of AREAS) {
    const list = parts.filter((p) => (PART[p.key]?.area ?? p.area ?? 'extras') === a.key);
    const shown = list.filter((p) => !isMore(p));
    const hidden = list.filter((p) => isMore(p));
    if (shown.length) main.push({ ...a, parts: shown });
    if (hidden.length) more.push({ ...a, parts: hidden });
  }
  return { main, more };
}

/** Has this bike any part data (an entry on a part, or a workshop job)? Without: the start-values wizard. */
export const noPartData = (bike) => !(bike.parts ?? []).some((p) => p.history?.length);

export { partName };

/**
 * v0.48.0 (Noah 9a): the start values of a bike without part data, in three steps: the purchase
 * date is the mounting date of every part, the km today, and what is new since then.
 * fresh: { [partKey]: { date, km } } for the parts that were replaced since the purchase
 * (km may be null: then only the date is known). kmBought: the km at the purchase (0 for a new bike).
 * Returns { parts, km, kmDate, bought } to store; existing entries stay (the start entry goes first).
 */
export function startValues(bike, { bought, kmBought = 0, kmNow = null, fresh = {}, today = localDay(), parts }) {
  const start = { date: bought, km: kmBought, value: null, action: 'replace', result: 'done', by: null, model: null, note: '', start: true };
  const out = parts.map((p) => {
    const def = PART[p.key];
    if (def && (def.area === 'checks' || def.legacy)) return p;
    const history = [start, ...(p.history ?? [])];
    const f = fresh[p.key];
    if (f?.date) history.push({ date: f.date, km: typeof f.km === 'number' ? f.km : null, value: null, action: 'replace', result: 'done', by: null, model: null, note: '' });
    return { ...p, history };
  });
  return { parts: out, ...(typeof kmNow === 'number' ? { km: kmNow, kmDate: today } : {}), bought };
}

/** The parts the wizard asks about («What is new since the purchase?»): the wear parts first. */
export const WIZARD_PARTS = ['chain', 'tyres', 'padsF', 'padsR', 'cassette', 'rotorF', 'rotorR', 'chainring', 'grips', 'fork', 'shock', 'brakeF', 'brakeR', 'shifting', 'wheelF', 'wheelR', 'saddle', 'seatpost'];
