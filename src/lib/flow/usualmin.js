/**
 * «Übliche Dauer» (Noah 21.11.2026 «2b»): how long one session of a sport usually takes. Where a tick has
 * no measured time (Strava, timer, typed minutes), the Sportjahr estimates it with this value and marks it
 * «ca.». Nothing is ever written into a tick; the estimate is only calculated when reading.
 *
 * Setting (db.settings, in the backup, no schema change): USUAL_KEY = { [actId]: minutes }. An activity
 * without an entry counts DEFAULT_MIN. NOT the same as `minMin` of an activity (the minimum duration of the
 * timer, «at least N min»): the two are never mixed.
 */
export const USUAL_KEY = 'sport.usualMin';
/** Without a setting a session counts one hour (Noah 21.11.2026 «wenn nichts definiert ist ist standart 1h»). */
export const DEFAULT_MIN = 60;
export const MAX_MIN = 24 * 60;
/** The quick choices of the editor; «own» takes any number. */
export const CHOICES = [30, 45, 60, 90, 120];

/** A whole number of minutes between 1 and a day, else 0. */
export const cleanMin = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_MIN) : 0;
};

/** The stored value made whole: only valid ids and minutes stay. */
export function usualMap(value) {
  const out = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const [id, v] of Object.entries(value)) {
    const n = cleanMin(v);
    if (id && n) out[id] = n;
  }
  return out;
}

/**
 * Noah's usual durations (21.11.2026 «Standartwert beim abhaken: eishockey 2h, tennis 1h, yoga 1h, sauna blöcke von 12 min,
 * Gym: eGym (20 min), Laufband rennen indoor 20 min, laufen indoor 10 min blöcke; «rennen indoor» und «laufen indoor» sind das gleiche»): what counts without a setting, found by the
 * words in the id and the name of the activity (first rule that fits). A sport that fits none counts DEFAULT_MIN.
 */
export const STANDARD_RULES = [
  // «Rennen indoor» and «Laufen indoor» are one activity (Noah 21.11.2026): 2 blocks of 10 minutes
  [/laufband|treadmill|(indoor|innen|drinnen)\W.*(lauf|renn|run)|(lauf|renn|run).*\W(indoor|innen|drinnen)/i, 20],
  [/gym/i, 20],
  [/sauna/i, 12],
  [/hockey/i, 120],
  [/tennis/i, 60],
  [/yoga/i, 60],
];

/** The standard minutes of an activity ({ id, name, nameDe }) by Noah's list, or 0 when none fits. */
export function standardFor(act) {
  const text = [act?.id, act?.name, act?.nameDe].filter(Boolean).join(' ');
  const rule = STANDARD_RULES.find(([re]) => re.test(text));
  return rule ? rule[1] : 0;
}

/**
 * The usual minutes of an activity: { min, own, std } — own is false when the standard counts; std is the standard minutes
 * (Noah's list, else DEFAULT_MIN). Pass the activity as third argument to find its standard by name.
 */
export function usualFor(map, actId, act = null) {
  const std = standardFor(act ?? { id: actId }) || DEFAULT_MIN;
  const n = cleanMin(usualMap(map)[actId]);
  return n ? { min: n, own: true, std } : { min: std, own: false, std };
}

/** The map with one activity set (min > 0) or back to the standard (min empty or 0). Never changes the input. */
export function withUsual(map, actId, min) {
  const next = { ...usualMap(map) };
  const n = cleanMin(min);
  if (n) next[actId] = n;
  else delete next[actId];
  return next;
}

/** Read the setting. */
export async function readUsual(db) {
  return usualMap((await db.settings.get(USUAL_KEY))?.value);
}

/** Save one activity's usual minutes (0 or empty = back to the standard); returns the map before, for «Undo». */
export async function saveUsual(db, actId, min) {
  const before = await readUsual(db);
  const next = withUsual(before, actId, min);
  if (Object.keys(next).length) await db.settings.put({ key: USUAL_KEY, value: next });
  else await db.settings.delete(USUAL_KEY);
  return before;
}

/** Put a whole map back («Undo»). */
export async function restoreUsual(db, before) {
  const map = usualMap(before);
  if (Object.keys(map).length) await db.settings.put({ key: USUAL_KEY, value: map });
  else await db.settings.delete(USUAL_KEY);
}
