/**
 * Pflanzenpass am echten Standort (996 Ideen UC-257-I1, Noah 25.10.2026 «bauen … 10»): a plant keeps
 * photos and own observations of its real spot (sun, wind, how wet the soil stays), and a move to
 * another spot stays in the history. Everything is the user's own observation; nothing is measured.
 *
 *   plant.pass = [{ id, day: 'YYYY-MM-DD', kind: 'obs' | 'move', place, sun?, wind?, wet?, photo?, note? }]
 *   A «move» entry sets plant.place to its place. The newest entry comes first.
 * Lives inside the Merken record of the plant (settings 'merken'), so it travels in every backup and
 * sync; no Dexie change. Pure functions, tested in tests/einzelplanen.test.js.
 */

export const SUN = [
  { key: 'full', label: 'Full sun' },
  { key: 'half', label: 'Half shade' },
  { key: 'shade', label: 'Shade' },
];
export const WIND = [
  { key: 'calm', label: 'Sheltered' },
  { key: 'some', label: 'Some wind' },
  { key: 'windy', label: 'Windy' },
];
export const WET = [
  { key: 'dry', label: 'Dries out fast' },
  { key: 'ok', label: 'Stays moist' },
  { key: 'wet', label: 'Stays wet' },
];
export const PASS_MAX = 60;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const keyIn = (list, k) => (list.some((x) => x.key === k) ? k : null);
const uid = () => `pp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** The entries of a plant, newest first (made safe). */
export function passOf(td) {
  const raw = Array.isArray(td?.plant?.pass) ? td.plant.pass : [];
  return raw.filter((e) => e && DAY.test(e.day ?? '')).sort((a, b) => b.day.localeCompare(a.day)); // stable: on the same day the entry saved last stays first
}

/** One clean entry, or null when it says nothing (no place change, no observation, no photo, no note). */
export function passEntry({ id, day, kind = 'obs', place = '', sun, wind, wet, photo = null, note = '' } = {}) {
  const e = {
    id: id || uid(),
    day: DAY.test(day ?? '') ? day : null,
    kind: kind === 'move' ? 'move' : 'obs',
    place: String(place ?? '').trim().slice(0, 60),
  };
  if (!e.day) return null;
  const s = keyIn(SUN, sun);
  const w = keyIn(WIND, wind);
  const m = keyIn(WET, wet);
  if (s) e.sun = s;
  if (w) e.wind = w;
  if (m) e.wet = m;
  if (typeof photo === 'string' && photo.startsWith('data:image/')) e.photo = photo;
  const n = String(note ?? '').trim().slice(0, 300);
  if (n) e.note = n;
  if (e.kind === 'move' && !e.place) return null;
  if (e.kind === 'obs' && !s && !w && !m && !e.photo && !n) return null;
  return e;
}

/** The plant with an entry added or replaced (same id); a move also changes plant.place. Keeps at most PASS_MAX. */
export function withEntry(td, entry) {
  if (!entry) return td;
  const old = passOf(td);
  const at = old.findIndex((e) => e.id === entry.id);
  // a changed entry keeps its place among the same day; a new one goes first
  const list = at >= 0 ? old.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...old];
  const pass = list.sort((a, b) => b.day.localeCompare(a.day)).slice(0, PASS_MAX);
  const lastMove = pass.find((e) => e.kind === 'move');
  const place = lastMove ? lastMove.place : td.plant.place ?? null;
  return { ...td, plant: { ...td.plant, place, pass } };
}

/**
 * The plant moved to a new place (fields: { day, place, photo?, note? }). The first move also keeps the place it had before (from the
 * day the plant was added), so the history starts where the plant stood.
 */
export function moveTo(td, fields) {
  const e = passEntry({ ...fields, kind: 'move' });
  const day = e?.day;
  if (!e) return td;
  let out = td;
  const old = String(td.plant.place ?? '').trim();
  if (old && !passOf(td).some((x) => x.kind === 'move')) {
    const since = DAY.test(String(td.created ?? '').slice(0, 10)) && String(td.created).slice(0, 10) < day ? String(td.created).slice(0, 10) : day;
    out = withEntry(out, passEntry({ day: since, kind: 'move', place: old, id: `${e.id}-0` }));
  }
  return withEntry(out, e);
}

/** The plant without one entry; when it was the newest move, the place goes back to the move before (or stays). */
export function withoutEntry(td, id) {
  const pass = passOf(td).filter((e) => e.id !== id);
  const lastMove = pass.find((e) => e.kind === 'move');
  return { ...td, plant: { ...td.plant, pass, place: lastMove ? lastMove.place : td.plant.place ?? null } };
}

/** The spots in order, oldest first: [{ place, from, to }] (to: null for the spot now). */
export function spots(td) {
  const moves = passOf(td).filter((e) => e.kind === 'move').reverse();
  return moves.map((m, i) => ({ place: m.place, from: m.day, to: moves[i + 1]?.day ?? null }));
}

/** What the observations at the spot now say most often: { sun, wind, wet, n } (keys or null). */
export function spotNow(td) {
  const pass = passOf(td);
  const since = pass.find((e) => e.kind === 'move')?.day ?? '0000-00-00';
  const here = pass.filter((e) => e.kind === 'obs' && e.day >= since); // observations only: a move says nothing about the spot
  const most = (field) => {
    const c = {};
    for (const e of here) if (e[field]) c[e[field]] = (c[e[field]] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  return { sun: most('sun'), wind: most('wind'), wet: most('wet'), n: here.length };
}

/**
 * A short own hint from the observations at the spot now (English key for t()), or null.
 * Only a suggestion: it never changes the watering interval by itself.
 */
export function passHint(td) {
  const s = spotNow(td);
  if (s.n < 2) return null;
  if (s.wet === 'dry' && (s.sun === 'full' || s.wind === 'windy')) return 'Here it dries out fast: water a little more often?';
  if (s.wet === 'wet' && s.sun === 'shade') return 'Here the soil stays wet: water a little less often?';
  if (s.wind === 'windy') return 'A windy spot: a more sheltered place may suit it better.';
  return null;
}

/**
 * The hint with a watering interval to take in one tap (Noah 27.10.2026 «1b»): { hint, every } or null.
 * every: the suggested «every N days», or null when the hint has no interval (a windy spot) or nothing would change.
 * Only a suggestion: the page shows a button; nothing changes without a tap, and the tap can be undone.
 * Once taken, it waits for a new observation (plant.everyFor = id of the newest observation it was taken for),
 * so the interval never keeps shrinking on the same observations.
 */
export function passAdvice(td) {
  const hint = passHint(td);
  if (!hint) return null;
  const now = Math.round(Number(td?.plant?.every)) || 0;
  const s = spotNow(td);
  let every = null;
  if (now >= 1 && s.wet === 'dry' && (s.sun === 'full' || s.wind === 'windy')) every = Math.max(1, now - 1);
  else if (now >= 1 && s.wet === 'wet' && s.sun === 'shade') every = now + 1;
  const newest = passOf(td).find((e) => e.kind === 'obs')?.id ?? null;
  if (newest && td.plant.everyFor === newest) every = null;
  return { hint, every: every && every !== now ? every : null, obs: newest };
}
