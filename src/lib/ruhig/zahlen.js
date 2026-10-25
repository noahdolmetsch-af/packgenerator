/**
 * Paket C › Zahlen, die verständlich bleiben (996 Ideen UC-218-I2, UC-242-I2, UC-223-I3):
 *
 *   Eine Fahrt, zwei Rollen (ROLES_KEY): a Strava ride can be commuting and training at the same time;
 *     the sums per role count it in each role, the total counts it once. { kinds, acts: { [actId]: [id] } }
 *     Without an own choice: Strava's «commute» flag → commuting, else training.
 *   Was eine Skala meinte (SCALES_KEY): for each scale question your meaning of 1 and 10, kept with the day
 *     from which it counts, so an old 7 stays readable. { [qid]: [{ from, lo, hi }] }
 *   Gespräch über Körperwerte (TALK_KEY): a quiet summary of your own measured values and your own notes
 *     and open questions, to take to a professional. Observation only, never a diagnosis.
 *     { notes: [text], questions: [text] }
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, addDays } from './base.js';
import { kindsOf } from './kinds.js';

/* ---------- Eine Fahrt, zwei Rollen ---------- */

export const ROLES_KEY = 'ruhig.roles';
export const ROLE_STD = [
  { id: 'commute', std: 'Commuting' },
  { id: 'training', std: 'Training' },
  { id: 'outing', std: 'Outing' },
];
export function rolesOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const acts = {};
  for (const [id, l] of Object.entries(v.acts && typeof v.acts === 'object' ? v.acts : {})) if (Array.isArray(l)) acts[id] = [...new Set(l.filter((x) => typeof x === 'string'))];
  return { kinds: kindsOf(v.kinds, ROLE_STD), acts };
}
/** The roles of one activity: your choice (even empty), else from Strava's commute flag. */
export function rolesOfAct(r, a) {
  if (r.acts[a.id]) return r.acts[a.id];
  const has = (id) => r.kinds.some((k) => k.id === id);
  return a.commute ? (has('commute') ? ['commute'] : []) : has('training') ? ['training'] : [];
}
export function flipRole(r, a, id) {
  const now = rolesOfAct(r, a);
  return { ...r, acts: { ...r.acts, [a.id]: now.includes(id) ? now.filter((x) => x !== id) : [...now, id] } };
}
export const roleCount = (r, id, acts = []) => acts.filter((a) => rolesOfAct(r, a).includes(id)).length;
export function dropRole(r, id, to = null) {
  const acts = {};
  for (const [a, l] of Object.entries(r.acts)) acts[a] = [...new Set(l.flatMap((k) => (k === id ? (to ? [to] : []) : [k])))];
  return { kinds: r.kinds.filter((k) => k.id !== id), acts };
}
/**
 * The sums of the rides from `from` on: per role { id, km, min, n } and the total { km, min, n } in which
 * every ride counts once, however many roles it has. acts: activities (training.js actRecord).
 */
export function roleSums(r, acts = [], from = '') {
  const list = acts.filter((a) => a && (!from || a.day >= from));
  const per = r.kinds.map((k) => {
    const mine = list.filter((a) => rolesOfAct(r, a).includes(k.id));
    return { id: k.id, n: mine.length, km: Math.round(mine.reduce((s, a) => s + (a.km || 0), 0)), min: Math.round(mine.reduce((s, a) => s + (a.movingS || 0), 0) / 60) };
  });
  const total = { n: list.length, km: Math.round(list.reduce((s, a) => s + (a.km || 0), 0)), min: Math.round(list.reduce((s, a) => s + (a.movingS || 0), 0) / 60) };
  const both = list.filter((a) => rolesOfAct(r, a).length > 1).length;
  return { per, total, both };
}

/* ---------- Was eine Skala meinte ---------- */

export const SCALES_KEY = 'ruhig.scales';
export function scalesOf(value) {
  const out = {};
  for (const [qid, l] of Object.entries(value && typeof value === 'object' ? value : {})) {
    const defs = (Array.isArray(l) ? l : []).filter((d) => d && isDay(d.from) && (clean(d.lo, 80) || clean(d.hi, 80))).map((d) => ({ from: d.from, lo: clean(d.lo, 80), hi: clean(d.hi, 80) }));
    if (defs.length) out[qid] = defs.sort((a, b) => a.from.localeCompare(b.from));
  }
  return out;
}
/** A new meaning from today on (the same day: replaced); an empty one ends nothing (old answers keep theirs). */
export function setScale(map, qid, { lo, hi }, today) {
  const d = { from: today, lo: clean(lo, 80), hi: clean(hi, 80) };
  if (!d.lo && !d.hi) return map;
  const old = (map[qid] ?? []).filter((x) => x.from !== today);
  return { ...map, [qid]: [...old, d].sort((a, b) => a.from.localeCompare(b.from)) };
}
/** The meaning that counted on a day: the newest one from before or on that day, else null. */
export function meaningOn(map, qid, day) {
  const defs = map[qid] ?? [];
  let out = null;
  for (const d of defs) if (d.from <= day) out = d;
  return out;
}

/* ---------- Gespräch über Körperwerte ---------- */

export const TALK_KEY = 'ruhig.talk';
export function talkOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const list = (l) => (Array.isArray(l) ? l.map((x) => clean(x, 300)).filter(Boolean).slice(0, 30) : []);
  return { notes: list(v.notes), questions: list(v.questions) };
}
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
/**
 * The measured values of the last n days, plain: resting pulse, sleep (h), steps, active zone minutes
 * (healthDays) and the body weight (entries { day, kg }): { key, avg, min, max, days } each, only with data.
 */
export function bodySummary(health = [], weights = [], today, n = 30) {
  const from = addDays(today, -n + 1);
  const rows = health.filter((h) => h?.date >= from && h.date <= today);
  const pick = (f) => rows.map(f).filter((v) => Number.isFinite(v));
  const one = (key, vals) => (vals.length ? { key, avg: r1(avg(vals)), min: r1(Math.min(...vals)), max: r1(Math.max(...vals)), days: vals.length } : null);
  const kg = weights.filter((w) => w?.day >= from && w.day <= today && Number.isFinite(Number(w.kg))).map((w) => Number(w.kg));
  return [
    one('rhr', pick((h) => Number(h.restingHr))),
    one('sleep', pick((h) => (Number(h.sleep?.asleepMin) > 0 ? h.sleep.asleepMin / 60 : NaN))),
    one('steps', pick((h) => Number(h.steps))),
    one('azm', pick((h) => Number(h.azm))),
    one('kg', kg),
  ].filter(Boolean);
}
/** The summary as plain text to copy or print (labels: { key: text } already translated). */
export function talkText({ title, period, summary, labels, units, notes, questions, notesH, questionsH, foot }) {
  const lines = [title, period, ''];
  for (const s of summary) lines.push(`${labels[s.key]}: ${s.avg} ${units[s.key]} (${s.min}–${s.max}, ${s.days})`);
  if (notes.length) lines.push('', notesH, ...notes.map((x) => `• ${x}`));
  if (questions.length) lines.push('', questionsH, ...questions.map((x) => `• ${x}`));
  lines.push('', foot);
  return lines.join('\n');
}
