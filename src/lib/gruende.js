/**
 * «Gründe für Planänderungen» (Noah 04.11.2026, Persönliches Lernen Idee 4, Runde 1 «2a»): when a tour goes
 * differently from the plan, one tap says why: «No time», «Tired legs», «Weather», «No motivation» … The card asks
 * when a tour is marked «Not riding» and when the ridden km are far from the planned km (a quarter or more), one
 * click, always skippable. Over several answers one calm line says what came up most often; it describes and
 * never explains.
 *
 * The reasons are an app list («Listen und Typen», applists.js 'changeReasons'): rename, add, hide, delete.
 * Stored on the trip (no new table): trip.changeWhy = { kind: 'skipped' | 'shorter' | 'longer', reason: id } or
 * { kind, skip: true } for «Not now». A second tap on the chosen reason takes it away.
 * Pure (no database, no clock). Tested in tests/gruende.test.js. Labels are English keys for t().
 */
import { hasId, nameOf, offered } from './applists.js';

export const WHY_FIELD = 'changeWhy';
export const REASON_NAMES = {
  time: 'No time|reason',
  legs: 'Tired legs|reason',
  weather: 'Weather|reason',
  motivation: 'No motivation|reason',
  gear: 'Bike or gear|reason',
  unwell: 'Not feeling well|reason',
};
export const REASONS_STD = Object.entries(REASON_NAMES).map(([id, name]) => ({ id, name }));
export const KINDS = ['skipped', 'shorter', 'longer'];
export const isReason = (id) => typeof id === 'string' && (id in REASON_NAMES || hasId('changeReasons', REASONS_STD, id));
export const reasonName = (id, tr) => nameOf('changeReasons', REASONS_STD, id, tr, '');
export const reasonsOffered = (keep = null) => offered('changeReasons', REASONS_STD, keep);

/** The ridden km differ from the planned km by at least this share. */
export const DEVIATION = 0.25;
/** At least this many answers before the «most often» line shows. */
export const MIN_ANSWERS = 3;

const pos = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

/** How the tour went against the plan: 'skipped' (marked «Not riding»), 'shorter', 'longer' or null (as planned or unknown). */
export function kindOf(trip, realKm = null) {
  if (!trip) return null;
  if (trip.skipped) return 'skipped';
  const plan = pos(trip.route?.km);
  const real = pos(realKm);
  if (!plan || !real) return null;
  const share = (real - plan) / plan;
  return share <= -DEVIATION ? 'shorter' : share >= DEVIATION ? 'longer' : null;
}

/** The answer stored on a trip, made whole: { kind, reason } | { kind, skip: true } | null. */
export function whyOf(trip) {
  const v = trip?.[WHY_FIELD];
  if (!v || typeof v !== 'object' || !KINDS.includes(v.kind)) return null;
  if (v.skip === true) return { kind: v.kind, skip: true };
  return isReason(v.reason) ? { kind: v.kind, reason: v.reason } : null;
}

/** Is the card asked for this trip? Not once it is answered or put away for this kind of change. */
export function asked(trip, realKm = null) {
  const kind = kindOf(trip, realKm);
  if (!kind) return null;
  const w = whyOf(trip);
  return w && w.kind === kind ? null : kind;
}

/** The changes when a reason is tapped: the same reason again takes it away. */
export const whyChange = (trip, kind, reason) => {
  const w = whyOf(trip);
  return { [WHY_FIELD]: w?.reason === reason && w.kind === kind ? null : { kind, reason } };
};
/** The changes for «Not now». */
export const whySkip = (kind) => ({ [WHY_FIELD]: { kind, skip: true } });

/**
 * Over the answers of all trips: { n, top: [{ reason, count }] (most often first) } or null while there are
 * fewer than MIN_ANSWERS answers. «Not now» is no answer.
 */
export function pattern(trips) {
  const counts = new Map();
  let n = 0;
  for (const t of trips ?? []) {
    const w = whyOf(t);
    if (!w?.reason) continue;
    n++;
    counts.set(w.reason, (counts.get(w.reason) ?? 0) + 1);
  }
  if (n < MIN_ANSWERS) return null;
  const top = [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  return { n, top };
}
