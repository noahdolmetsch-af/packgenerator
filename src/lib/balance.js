/**
 * v0.127.0 «Tages-Check» 2 (mockup T3, Noah 13.10.2026 «T1–T4 freigegeben»): «Deine Balance» on Heute.
 * The 9 categories of the 15 questions (Spass · Erholung · Sport · Achtsamkeit · Freunde · Natur ·
 * Visionen · Ziele · Erreicht) get a value 0–100 for the last 7 days, from the answers of the questions
 * and from what the app knows by itself (meditation and other Aktiv ticks, rides). A category without
 * any answer or data stays empty (null): nothing is invented. Fitbit/Google comes later.
 *
 * How a value is made: every answer or known fact of the 7 days is one signal 0–1 (a scale 1–10 is
 * (v − 1) / 9, a choice its step, a highlight chip 1), the value is the mean × 100. What the app knows
 * by itself counts once per week, as a share of a calm week (rides on 3 days, a mindful tick on 5 days,
 * sport ticks on 3 days, rest ticks on 2 days); without such data it is left out, never counted as 0.
 * Pure functions, tested in tests/balance.test.js.
 */
import { checkOf, outsideStep, rideMinutes } from './flowcheck.js';
import { lastDays } from './flow.js';

/** The 9 categories in the order of the ring (mockup T3). label: English key for t(). */
export const CATS = [
  { key: 'fun', label: 'Fun|cat', tip: 'Something just for fun this week?' },
  { key: 'rest', label: 'Recovery|cat', tip: 'An early evening or the sauna?' },
  { key: 'sport', label: 'Sport|cat', tip: 'A short ride after work?' },
  { key: 'mind', label: 'Mindfulness|cat', tip: 'Ten minutes of meditation?' },
  { key: 'friends', label: 'Friends|cat', tip: 'Saturday a ride with friends?' },
  { key: 'nature', label: 'Nature|cat', tip: 'Half an hour outside?' },
  { key: 'vision', label: 'Visions|cat', tip: 'On Sunday think about your vision for a moment?' },
  { key: 'goals', label: 'Goals|cat', tip: 'Tomorrow morning one small goal?' },
  { key: 'done', label: 'Achieved|cat', tip: 'A goal you can finish today?' },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.key, c]));

/** The rotating pool questions (flowcheck.js SEED_QUESTIONS) and the category they count for. */
export const POOL_CAT = { body: 'sport', calm: 'mind', ease: 'mind', people: 'friends', outside: 'nature', new: 'fun', yesterday: 'done' };
/** Highlights of Q9 that say something about a category. */
const BEST_CAT = { nature: 'nature', sport: 'sport', friends: 'friends', calm: 'rest', done: 'done' };
/** Aktiv rings (flow.js act.ring) → category. */
const RING_CAT = { move: 'sport', mind: 'mind', rest: 'rest' };
/** A calm week: on how many days a known fact counts fully. */
const FULL_DAYS = { sport: 3, mind: 5, rest: 2, ride: 3 };

const scale = (v) => (v == null ? null : (v - 1) / 9);
const STEP = { outside: { 0: 0, lt30: 1 / 3, '30-90': 2 / 3, gt90: 1 }, people: { no: 0, short: 0.5, lots: 1 }, goalDone: { yes: 1, part: 0.5, no: 0 }, mindful: { yes: 1, auto: 1, no: 0 } };

/**
 * The balance of the last `days` days up to `today`.
 * checks: flowChecks rows; log: flowLog rows ({ actId, day }); acts: activities ({ id, ring });
 * rides: rides of those days ({ date, km, movingH?, totalH? }, Strava ones included).
 * → { cats: [{ key, value (0–100 or null), n (signals) }], mean (0–100 or null), least (key or null), days }
 */
export function balance({ checks = [], log = [], acts = [], rides = [], today, days = 7 } = {}) {
  const span = lastDays(today, days);
  const inSpan = new Set(span);
  const sig = Object.fromEntries(CATS.map((c) => [c.key, []]));
  const add = (k, v) => v != null && Number.isFinite(v) && sig[k].push(Math.max(0, Math.min(1, v)));

  // the rides of each day (for Q11 when it was not answered, and for Sport and Natur)
  const rideDays = new Set();
  const rideMin = {};
  for (const r of rides) {
    if (!inSpan.has(r?.date)) continue;
    const min = rideMinutes(r);
    if (!min && !(Number(r.km) > 0)) continue;
    rideDays.add(r.date);
    rideMin[r.date] = (rideMin[r.date] ?? 0) + min;
  }

  for (const row of checks) {
    if (!inSpan.has(row?.day)) continue;
    const c = checkOf(row);
    add('rest', scale(c.sleep));
    add('rest', scale(c.energy));
    add('fun', scale(c.mood));
    if (c.extra != null && POOL_CAT[c.q]) add(POOL_CAT[c.q], scale(c.extra));
    // Q7: a goal set on a morning that was answered (a morning without a goal counts 0)
    const morning = c.sleep != null || c.energy != null || c.mood != null || c.joy.length > 0;
    if (c.goal) add('goals', 1);
    else if (morning) add('goals', 0);
    add('done', scale(c.sat));
    if (c.goalDone) add('done', STEP.goalDone[c.goalDone]);
    for (const b of c.best) if (BEST_CAT[b]) add(BEST_CAT[b], 1);
    const out = c.outside ?? (rideMin[c.day] != null ? outsideStep(rideMin[c.day]) : null);
    if (out != null) add('nature', STEP.outside[out]);
    if (c.people) add('friends', STEP.people[c.people]);
    add('fun', scale(c.fun));
    if (c.mindful) add('mind', STEP.mindful[c.mindful]);
    add('vision', scale(c.vision));
  }
  // days with a ride but no check: the ride says the time outside
  for (const d of rideDays) if (!checks.some((x) => x?.day === d)) add('nature', STEP.outside[outsideStep(rideMin[d])]);

  // what the app knows by itself, once per week as a share of a calm week
  const ring = Object.fromEntries(acts.map((a) => [a.id, a.ring]));
  const tickDays = { sport: new Set(), mind: new Set(), rest: new Set() };
  for (const e of log) {
    const k = RING_CAT[ring[e?.actId]];
    if (k && inSpan.has(e.day)) tickDays[k].add(e.day);
  }
  for (const d of rideDays) tickDays.sport.add(d);
  for (const k of ['sport', 'mind', 'rest']) if (tickDays[k].size) add(k, tickDays[k].size / FULL_DAYS[k]);
  if (rideDays.size) add('nature', rideDays.size / FULL_DAYS.ride);

  const cats = CATS.map((c) => {
    const list = sig[c.key];
    return { key: c.key, n: list.length, value: list.length ? Math.round((list.reduce((s, x) => s + x, 0) / list.length) * 100) : null };
  });
  const known = cats.filter((c) => c.value != null);
  const mean = known.length ? Math.round(known.reduce((s, c) => s + c.value, 0) / known.length) : null;
  // the least: only when at least 3 categories have a value (else it says little)
  const least = known.length >= 3 ? [...known].sort((a, b) => a.value - b.value || CATS.findIndex((x) => x.key === a.key) - CATS.findIndex((x) => x.key === b.key))[0].key : null;
  return { cats, mean, least, days };
}

/**
 * The ring as SVG paths: 9 segments around a centre, each an outer light background and an inner
 * wedge whose depth is the value. size: the side of the square. → [{ key, bg, fg }] (fg null when empty).
 */
export function ringPaths(cats, size = 200, { inner = 0.27, gap = 2.2 } = {}) {
  const c = size / 2;
  const r0 = size * inner;
  const r1 = size / 2 - 2;
  const n = cats.length;
  const step = 360 / n;
  const pt = (r, a) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };
  const wedge = (ra, rb, a0, a1) => `M ${pt(ra, a0)} L ${pt(rb, a0)} A ${rb} ${rb} 0 0 1 ${pt(rb, a1)} L ${pt(ra, a1)} A ${ra} ${ra} 0 0 0 ${pt(ra, a0)} Z`;
  return cats.map((x, i) => {
    const a0 = i * step - step / 2 + gap / 2;
    const a1 = a0 + step - gap;
    const rv = x.value == null ? null : r0 + ((r1 - r0) * Math.max(4, x.value)) / 100;
    return { key: x.key, bg: wedge(r0, r1, a0, a1), fg: rv == null ? null : wedge(r0, rv, a0, a1) };
  });
}
