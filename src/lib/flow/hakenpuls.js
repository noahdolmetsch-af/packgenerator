/**
 * «Garmin gegen Fitbit» (Noah 27.11.2026 «für mich als nutzer wären unterschiede was die herzfrequenzaufzeichnung angeht spannend zu sehen, ich nehme
 * mal an dass die daten vom Garmin HRM Brustgurt verlässlicher und genauer sind als die von fitbit», Paket B): where the same session was recorded
 * twice, once by a Garmin device (Strava) and once by the Fitbit, the two mean pulses side by side. The pairing is the one rule of the app
 * (flow/dieselbe.js coveredBy, «Eine Fahrt = ein Eintrag», Garmin wins), so nothing is counted twice. Only looking: no value is changed or chosen
 * here; the Garmin recording stays the one that counts.
 * Pure. health: healthDays rows (date, exercises[{ type, name, start, min, hr }]); activities: Strava rows (day, time, device, hrAvg, name, type).
 */
import { addDays } from '../flow.js';
import { coveredBy, joinPieces, isWalk } from './dieselbe.js';

/** A comparison needs at least this many pairs to give a mean. */
export const MIN_PAIRS = 3;

const isGarmin = (a) => /garmin/i.test(String(a?.device ?? ''));
const bpm = (v) => (Number.isFinite(Number(v)) && Number(v) > 30 ? Math.round(Number(v)) : null);

/**
 * The sessions of the window that both recorded: [{ day, name, garmin (bpm), fitbit (bpm), diff (fitbit − garmin) }], newest first.
 * from, to: YYYY-MM-DD, both inside.
 */
export function pulsePairs({ health = [], activities = [], from, to }) {
  const byAct = new Map(); // one Strava recording counts once, even when the watch kept several workouts inside it
  for (const h of health) {
    const day = h?.date;
    if (!day || day < from || day > to || !Array.isArray(h.exercises)) continue;
    for (const ex of joinPieces(h.exercises)) {
      if (isWalk(ex)) continue;
      const a = coveredBy(day, ex, activities);
      if (!a || !isGarmin(a)) continue;
      const g = bpm(a.hrAvg);
      const f = bpm(ex.hr);
      if (g == null || f == null) continue;
      const pair = { day, name: a.name || ex.name || '', garmin: g, fitbit: f, diff: f - g, min: Number(ex.min) || 0 };
      const key = a.id ?? `${day}|${a.time}|${a.name}`;
      const had = byAct.get(key);
      if (!had || pair.min > had.min) byAct.set(key, pair);
    }
  }
  const out = [...byAct.values()].map(({ min, ...p }) => p);
  return out.sort((x, y) => (x.day < y.day ? 1 : x.day > y.day ? -1 : 0));
}

/**
 * The summary of the pairs: { n, mean (fitbit − garmin, one decimal), abs (mean size of the difference), direction: 'under' | 'over' | 'same' } or null under 3 pairs.
 */
export function pulseSummary(pairs = []) {
  if (pairs.length < MIN_PAIRS) return null;
  const mean = pairs.reduce((s, p) => s + p.diff, 0) / pairs.length;
  const abs = pairs.reduce((s, p) => s + Math.abs(p.diff), 0) / pairs.length;
  const r = Math.round(mean * 10) / 10;
  return { n: pairs.length, mean: r, abs: Math.round(abs * 10) / 10, direction: Math.abs(r) < 0.5 ? 'same' : r < 0 ? 'under' : 'over' };
}

/** The days a comparison looks back (at least 90, so a few sessions come together). */
export const windowDays = (span) => Math.max(90, Number(span) || 10);
export const windowFrom = (today, span) => addDays(today, -(windowDays(span) - 1));
