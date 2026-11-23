/**
 * «Zusammenhänge» (Noah 22.11.2026 «a», Thread «Alle Sportarten und Erholung», Schritt L): what goes together in your own days, said only
 * when there is enough behind it. «Nach der Sauna: Tiefschlaf» (the night after a ritual against the other nights) and «Schlafgefühl
 * gegen Uhr» (the nights you felt rested against the others, as the watch measured them). From MIN_TIMES times on a line says what it
 * found, with how sure it is and «So gerechnet»; before that it only says how many more times it needs («Noch N»). Observation only:
 * going together is not a cause and nothing is rated. Pure: no database, no clock.
 */
import { normAct } from '../flow.js';
import { shiftDay } from '../training.js';

/** Times (days with the ritual and a value the night after) before a line says anything. */
export const MIN_TIMES = 20;
/** At least this many other days to compare with. */
export const MIN_OTHER = 5;
/** The days looked back on. */
export const WINDOW_DAYS = 365;
/** The rituals shown (the most ticked first). */
export const MAX_RITUALS = 3;
/** |t| from which the words change: «probably» from 2, «clearly» from 2.6. */
export const T_PROBABLY = 2;
export const T_CLEARLY = 2.6;

const fin = (v) => (Number.isFinite(v) && v > 0 ? v : null);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const variance = (a) => (a.length < 2 ? 0 : a.reduce((s, x) => s + (x - mean(a)) ** 2, 0) / (a.length - 1));
const r1 = (x) => Math.round(x * 10) / 10;

/** How sure: 'clear' | 'probably' | 'unsure' from the size of the difference against the spread (Welch t). */
export const sureOf = (t) => (Math.abs(t) >= T_CLEARLY ? 'clear' : Math.abs(t) >= T_PROBABLY ? 'probably' : 'unsure');

/** The two groups side by side: { on, off, mOn, mOff, diff, t, sure } (means rounded to whole minutes, t to one decimal). */
export function compare(on, off) {
  const mOn = mean(on);
  const mOff = mean(off);
  const se = Math.sqrt(variance(on) / on.length + variance(off) / off.length);
  const diff = mOn - mOff;
  const t = se === 0 ? (diff === 0 ? 0 : Math.sign(diff) * 99) : diff / se;
  return { on: on.length, off: off.length, mOn: Math.round(mOn), mOff: Math.round(mOff), diff: Math.round(diff), t: r1(t), sure: sureOf(t) };
}

/** The days (YYYY-MM-DD) with a tick of each ritual activity in the window: Map actId → Set(days). Ticks of trip days do not count. */
function tickDays(log, acts, from, to) {
  const rit = new Set(acts.map(normAct).filter((a) => ['mind', 'rest'].includes(a.ring) && !a.paused).map((a) => a.id));
  const m = new Map();
  for (const e of log) {
    if (!e?.actId || !rit.has(e.actId) || e.via === 'trip' || !e.day || e.day < from || e.day > to) continue;
    if (!m.has(e.actId)) m.set(e.actId, new Set());
    m.get(e.actId).add(e.day);
  }
  return m;
}

/**
 * data: { health: healthDays, log: flowLog, acts: flowActs, feel: [{ day, value }] (the answers of «How did you sleep?»), today }
 * → { rituals: [{ actId, kind: 'wait' | 'done', n, left?, ... }], feel: { kind, n, ... } | null }
 * A ritual line: the night AFTER the day of the ritual (the Fitbit night of the next morning) against the other nights, deep sleep in minutes.
 */
export function zusammenhaenge({ health = [], log = [], acts = [], feel = [], today }) {
  const from = shiftDay(today, -WINDOW_DAYS + 1);
  const nights = new Map(health.filter((h) => h?.date).map((h) => [h.date, h]));
  const deep = (day) => fin(nights.get(day)?.sleep?.deepMin);
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => shiftDay(from, i));

  const rituals = [];
  const byAct = [...tickDays(log, acts, from, today)].sort((a, b) => b[1].size - a[1].size || String(a[0]).localeCompare(String(b[0]))).slice(0, MAX_RITUALS);
  for (const [actId, ticked] of byAct) {
    const on = [];
    const off = [];
    for (const d of days) {
      const y = deep(shiftDay(d, 1));
      if (y == null) continue;
      (ticked.has(d) ? on : off).push(y);
    }
    if (on.length < MIN_TIMES || off.length < MIN_OTHER) rituals.push({ actId, kind: 'wait', n: on.length, left: Math.max(1, MIN_TIMES - on.length) });
    else rituals.push({ actId, kind: 'done', ...compare(on, off) });
  }

  // the felt sleep against the watch: the nights above your own median of the feeling against the others, asleep minutes of the watch
  const byDay = new Map();
  for (const f of feel) if (f?.day && f.day >= from && f.day <= today && Number.isFinite(Number(f.value))) (byDay.get(f.day) ?? byDay.set(f.day, []).get(f.day)).push(Number(f.value));
  const pairs = [];
  for (const [day, vs] of byDay) {
    const asleep = fin(nights.get(day)?.sleep?.asleepMin);
    if (asleep != null) pairs.push({ v: mean(vs), asleep });
  }
  let felt = null;
  if (pairs.length) {
    if (pairs.length < MIN_TIMES) felt = { kind: 'wait', n: pairs.length, left: MIN_TIMES - pairs.length };
    else {
      const sorted = pairs.map((p) => p.v).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      // above your own median against the rest; with many equal answers (a 7 most of the time) the median itself counts as the good side
      const split = (hi) => ({ good: pairs.filter((p) => (hi ? p.v >= median : p.v > median)).map((p) => p.asleep), rest: pairs.filter((p) => (hi ? p.v < median : p.v <= median)).map((p) => p.asleep) });
      const ok = (g) => g.good.length >= MIN_OTHER && g.rest.length >= MIN_OTHER;
      const g = [split(false), split(true)].find(ok);
      felt = g ? { kind: 'done', median, ...compare(g.good, g.rest) } : { kind: 'wait', n: pairs.length, left: 0, flat: true };
    }
  }
  return { rituals, feel: felt };
}
