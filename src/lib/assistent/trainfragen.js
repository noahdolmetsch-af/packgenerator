/**
 * «Frage deine Daten» (Noah 03.11.2026, Idee 7 der Cockpit-Ideen, ★ nur feste Regeln, ohne KI): questions about the
 * training, answered from the Strava activities on this device. Free, offline, no AI: each question is one rule.
 *
 * - «Zeig mir meine effizientesten Z2-Fahrten»: bike rides with a power meter and pulse, mostly in the zone,
 *   ranked by watts per heartbeat (the same number as «Efficiency» in Training).
 * - «Vergleiche meine letzten vier Wochen»: the last N weeks against the N weeks before (rides, time, km, climbing).
 *
 * trainAnswer(q, { acts, bounds, today }) → the answer in the shape of answers.js (+ rows with a link each) or null.
 * q is already folded (search.js fold: lower case, no umlauts). Pure: no database, no clock.
 */
import { zoneOf, zoneSecs, mainZone } from '../training.js';
import { t, tn, num } from '../i18n.svelte.js';

const has = (q, words) => words.some((w) => q.includes(w));
const addDays = (iso, d) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const dm = (iso) => `${+iso.slice(8, 10)}.${+iso.slice(5, 7)}.`;

/** A ride counts for the efficiency from this many minutes of moving time. */
export const MIN_MIN = 20;
/** How many rides the answer lists. */
export const TOP = 5;
const NUMBERS = { eine: 1, einer: 1, one: 1, zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, fuenf: 5, five: 5, sechs: 6, six: 6, acht: 8, eight: 8, zwoelf: 12, twelve: 12 };

/** The zone (1–5) a question names («Z2», «Zone 2»), or null. */
export function zoneIn(q) {
  const m = /\bz(?:one)?\s?([1-5])\b/.exec(q);
  return m ? Number(m[1]) : null;
}

/** The number of weeks of «letzte vier Wochen» / «last 4 weeks» (1–12), or null. */
export function weeksIn(q) {
  const m = /(?:letzte[nr]?|last|past|vergangene[nr]?)\s+(\d+|[a-z]+)\s+(?:wochen|weeks)/.exec(q);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBERS[m[1]];
  return n >= 1 && n <= 12 ? n : null;
}

/** The zone (0–4) of a ride: by its pulse histogram, else by its mean pulse. approx: true for the latter. */
function zoneIndex(a, bounds) {
  const main = mainZone(zoneSecs(a.hist, bounds));
  if (main != null) return { z: main, approx: false };
  return fin(a.hrAvg) > 0 ? { z: zoneOf(a.hrAvg, bounds), approx: true } : null;
}

/**
 * The most efficient rides: watts per heartbeat, best first. zone: 1–5 (only rides mostly in it) or null (all).
 * Needs a power meter, a mean pulse and MIN_MIN minutes of moving time. → { rows: [{ id, day, name, eff, w, hr, min, approx }], total }
 */
export function efficientRides(acts = [], bounds = [], zone = null, top = TOP) {
  const list = [];
  for (const a of acts) {
    if (!a || a.hidden || a.kind !== 'bike' || !a.wDevice || !(fin(a.wAvg) > 0) || !(fin(a.hrAvg) > 0) || !((fin(a.movingS) ?? 0) >= MIN_MIN * 60)) continue;
    const zi = zoneIndex(a, bounds);
    if (zone != null && (!zi || zi.z !== zone - 1)) continue;
    list.push({ id: a.id, day: a.day, name: a.name ?? '', eff: Math.round((a.wAvg / a.hrAvg) * 100) / 100, w: Math.round(a.wAvg), hr: Math.round(a.hrAvg), min: Math.round(a.movingS / 60), approx: !!zi?.approx });
  }
  list.sort((x, y) => y.eff - x.eff || String(y.day).localeCompare(String(x.day)));
  return { rows: list.slice(0, top), total: list.length };
}

/** Rides, moving time, km and climbing of the activities in [from, to]. */
export function sumsOf(acts = [], from, to) {
  const r = { n: 0, s: 0, km: 0, hm: 0 };
  for (const a of acts) {
    if (!a || a.hidden || !a.day || a.day < from || a.day > to) continue;
    r.n++;
    r.s += fin(a.movingS) ?? 0;
    r.km += fin(a.km) ?? 0;
    r.hm += fin(a.hm) ?? 0;
  }
  return r;
}

/** The last `weeks` weeks (days up to today) against the same number of weeks before. */
export function compareWeeks(acts, today, weeks) {
  const span = weeks * 7;
  const now = { from: addDays(today, -(span - 1)), to: today };
  const prev = { from: addDays(today, -(2 * span - 1)), to: addDays(today, -span) };
  return { weeks, now: { ...now, ...sumsOf(acts, now.from, now.to) }, prev: { ...prev, ...sumsOf(acts, prev.from, prev.to) } };
}

const hmin = (s) => {
  const m = Math.round(s / 60);
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};
const signed = (d, text) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${text}`;

export function trainAnswer(q, { acts = [], bounds = [], today } = {}) {
  if (!today) return null;
  // «effizienteste Z2-Fahrten»
  if (has(q, ['effizient', 'efficien'])) {
    const zone = zoneIn(q);
    const { rows, total } = efficientRides(acts, bounds, zone);
    const link = { label: t('Open the rides'), href: '#/flow/training?view=list' };
    const what = zone ? t('Z{z} rides|ask', { z: zone }) : t('rides|ask');
    if (!rows.length) {
      return { kind: 'efficient', title: t('No {what} with a power meter and pulse yet.|ask', { what }), lines: [t('Efficiency is watts per heartbeat. It needs a power meter, a pulse and at least {min} minutes.|ask', { min: MIN_MIN })], link, rows: [] };
    }
    const lines = [t('Efficiency is watts per heartbeat: higher means more power for the same pulse. Only an observation: weather and the route count too.|ask')];
    if (rows.some((r) => r.approx)) lines.push(t('Rides without a pulse histogram are sorted into the zone by their mean pulse.|ask'));
    return {
      kind: 'efficient',
      title: t('Your most efficient {what}: {n} of {total}.|ask', { what, n: rows.length, total }),
      lines,
      link,
      rows: rows.map((r) => ({ text: t('{day} {name}: {eff} W per beat ({w} W, {hr} bpm, {min} min)|ask', { day: dm(r.day), name: r.name, eff: num(r.eff), w: num(r.w), hr: num(r.hr), min: num(r.min) }), href: `#/flow/training/a/${encodeURIComponent(r.id)}` })),
    };
  }
  // «Vergleiche meine letzten vier Wochen»
  const weeks = weeksIn(q);
  if (weeks && has(q, ['vergleich', 'compare', 'gegen', 'against', 'versus'])) {
    const c = compareWeeks(acts, today, weeks);
    const link = { label: t('Open the comparisons'), href: '#/auswerten/analyse' };
    const label = tn(weeks, '{n} week', '{n} weeks');
    if (!c.now.n && !c.prev.n) return { kind: 'compare', title: t('No activities in these {label}.|ask', { label }), lines: [], link };
    const row = (name, a, b, text) => `${name}: ${text(a)} ${t('against|ask')} ${text(b)} (${signed(a - b, text(Math.abs(a - b)))})`;
    return {
      kind: 'compare',
      title: t('The last {label} against the {label} before.|ask', { label }),
      lines: [
        row(t('Activities|ask'), c.now.n, c.prev.n, (x) => num(x)),
        row(t('Time|ask'), c.now.s, c.prev.s, hmin),
        row(t('Distance|ask'), Math.round(c.now.km), Math.round(c.prev.km), (x) => `${num(x)} km`),
        row(t('Climbing|ask'), Math.round(c.now.hm), Math.round(c.prev.hm), (x) => `${num(x)} m`),
        `${dm(c.now.from)}–${dm(c.now.to)} ${t('against|ask')} ${dm(c.prev.from)}–${dm(c.prev.to)}`,
      ],
      link,
    };
  }
  return null;
}
