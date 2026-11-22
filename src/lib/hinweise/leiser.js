/**
 * «Hinweise lernen aus dem Wegtippen» (S5, Noah 21.11.2026 «4a», Thread «Ideen für bessere App und Inhalte sammeln»):
 * a hint you send away with «Not today» on three different days within two weeks gets one question under it:
 * «Make this kind quieter?». «Yes» switches the kind off (Undo, and the place where it comes back is named),
 * «Keep» is remembered for 60 days. The app never switches anything off by itself.
 *
 * Stored in settings key 'hintSkips' = { [kind]: { days: ['YYYY-MM-DD', …] (the last 10 days sent away), no: 'YYYY-MM-DD' | null } }.
 * Pure functions on calendar days (strings); the clock and the database stay with the caller. Tested in tests/hinweise-leiser.test.js.
 */

export const SKIPS_KEY = 'hintSkips';
/** The question comes at this many different days sent away … */
export const ASK_AFTER = 3;
/** … within this many days. */
export const WINDOW_DAYS = 14;
/** After «Keep» the same kind is not asked again for this many days. */
export const REASK_DAYS = 60;
const KEEP_DAYS = 10;

/**
 * The kinds that can ask. area: switched in Me › Look › Suggestions (clear/suggest.js); setting: its own on/off setting
 * (true = on). label: an English text for t(); back: where it comes back (English text for t()).
 */
export const HINT_KINDS = {
  ruhetag: { label: 'Performance tips', area: 'performance', back: 'Me › Look › Suggestions › Performance tips' },
  sonne: { label: 'Suggest a ride above the fog on Today', setting: 'sunRide', back: 'Weather › Fog line › Suggest a ride above the fog on Today' },
};

const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
/** Whole calendar days from a to b (b later = positive). */
export const dayDiff = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/** What is kept: { kind: { days, no } } for the known kinds only (also from an empty or broken row). */
export function cleanSkips(value) {
  const out = {};
  for (const kind of Object.keys(HINT_KINDS)) {
    const v = value?.[kind];
    if (!v) continue;
    const days = [...new Set((Array.isArray(v.days) ? v.days : []).filter(isDay))].sort().slice(-KEEP_DAYS);
    out[kind] = { days, no: isDay(v.no) ? v.no : null };
  }
  return out;
}

/** «Not today» on `day`: the day is kept once per kind. → the new state. */
export function noteSkip(state, kind, day) {
  const s = cleanSkips(state);
  if (!HINT_KINDS[kind] || !isDay(day)) return s;
  const old = s[kind] ?? { days: [], no: null };
  return { ...s, [kind]: { ...old, days: [...new Set([...old.days, day])].sort().slice(-KEEP_DAYS) } };
}

/** How many different days within the window ending `today` the hint was sent away. */
export function skippedDays(state, kind, today) {
  return (cleanSkips(state)[kind]?.days ?? []).filter((d) => dayDiff(d, today) >= 0 && dayDiff(d, today) < WINDOW_DAYS).length;
}

/**
 * Is the question due? Only on the day of the last «Not today» (so it stands where the hint stood), after ASK_AFTER
 * days in the window, and not within REASK_DAYS after a «Keep».
 */
export function askDue(state, kind, today) {
  const v = cleanSkips(state)[kind];
  if (!v || v.days.at(-1) !== today) return false;
  if (v.no && dayDiff(v.no, today) < REASK_DAYS) return false;
  return skippedDays(state, kind, today) >= ASK_AFTER;
}

/** «Keep it as it is»: not asked again for REASK_DAYS. → the new state. */
export function keepAsIs(state, kind, day) {
  const s = cleanSkips(state);
  if (!s[kind]) return s;
  return { ...s, [kind]: { ...s[kind], no: isDay(day) ? day : null } };
}

/** «Make it quieter» is done: the days are cleared so a later switch-on starts fresh. → the new state. */
export function clearKind(state, kind) {
  const s = cleanSkips(state);
  const { [kind]: _drop, ...rest } = s;
  return rest;
}
