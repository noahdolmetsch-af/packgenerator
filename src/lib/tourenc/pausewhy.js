/**
 * Paket «Touren c» (996 Einzelideen, Noah 25.10.2026 «bauen»), ideas 60 and 61.
 * 60 «Pausengrund»: a pause gets a reason (rest, repair, waiting). The reason is kept with the recording as
 *    row.whys = { [pause start ms]: 'rest' | 'fix' | 'wait' }, so the pairs in row.breaks stay as they are.
 *    While paused the live map shows the arrival «if you ride on now»; it moves with every minute of the pause.
 * 61 «Vergessene Pause erkennen»: you stood a long time without «Pause» (FORGOT_S) and ride on → the app asks
 *    what it was. The answer puts that time in as a pause [from, to] with its reason; «Nothing» keeps it as it was.
 * Pure, tested in tests/touren-c.test.js.
 */

export const WHYS = [
  { key: 'rest', name: 'Rest|pause' },
  { key: 'fix', name: 'Repair|pause' },
  { key: 'wait', name: 'Waiting|pause' },
];
const KEYS = new Set(WHYS.map((w) => w.key));
export const isWhy = (v) => KEYS.has(v);

/** Standing this long without «Pause» and riding on → ask what it was (10 min). */
export const FORGOT_S = 600;
/** Riding again: this fast (km/h) ends the standing time. */
export const MOVE_KMH = 6;

/** The reason of a pause that started at fromMs, or ''. */
export const whyOf = (whys, fromMs) => (whys && isWhy(whys[String(fromMs)]) ? whys[String(fromMs)] : '');

/** whys with the reason of the pause that started at fromMs set (why '' or unknown takes it away). */
export function setWhy(whys = {}, fromMs, why) {
  const out = { ...(whys ?? {}) };
  if (isWhy(why)) out[String(fromMs)] = why;
  else delete out[String(fromMs)];
  return out;
}

/**
 * A forgotten pause put in afterwards: breaks with [from, to] added (sorted, never overlapping an existing pause:
 * the part that already is a pause is left out). → the new breaks, or the old ones when nothing is left.
 */
export function addBreak(breaks = [], from, to) {
  const list = (breaks ?? []).map((b) => b.slice());
  if (!(Number.isFinite(from) && Number.isFinite(to) && to > from)) return list;
  let a = from;
  let b = to;
  for (const [f, e] of list) {
    const end = e == null ? Infinity : e;
    if (f <= a && end >= b) return list; // already inside a pause
    if (f <= a && end > a) a = end;
    if (f < b && end >= b) b = f;
  }
  if (!(b > a)) return list;
  return [...list, [a, b]].sort((x, y) => x[0] - y[0]);
}

/** Seconds per reason of the closed pauses: { rest, fix, wait, none }. */
export function whyTotals(breaks = [], whys = {}) {
  const out = { rest: 0, fix: 0, wait: 0, none: 0 };
  for (const [f, e] of breaks ?? []) {
    if (e == null || !(e > f)) continue;
    const w = whyOf(whys, f) || 'none';
    out[w] += Math.round((e - f) / 1000);
  }
  return out;
}

/**
 * One tick of «forgotten pause» (61). st: { since: ms standing started or null, long: true once FORGOT_S passed }.
 * kmh: the speed now; paused: the recording is paused (then nothing is asked).
 * → { st, ask: null | { from, to } } — ask when you ride on after a long standing time.
 */
export function forgotStep(st = {}, { kmh, now = Date.now(), paused = false, minS = FORGOT_S } = {}) {
  if (paused || !Number.isFinite(kmh)) return { st: { since: null, long: false }, ask: null };
  if (kmh < 2) {
    const since = st.since ?? now;
    return { st: { since, long: now - since >= minS * 1000 }, ask: null };
  }
  if (kmh >= MOVE_KMH && st.since != null && st.long) return { st: { since: null, long: false }, ask: { from: st.since, to: now } };
  if (kmh >= MOVE_KMH) return { st: { since: null, long: false }, ask: null };
  return { st, ask: null };
}
