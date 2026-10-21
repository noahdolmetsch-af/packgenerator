/**
 * Paket Y «Rückblick und Lernen» (Noah 20.10.2026 «2a»): after a ride you note in two taps how it felt
 * (too cold, just right, too warm; and where: hands, feet, body, head) and, if you like, what you wore.
 * The app keeps it with the weather of that ride (the core's hours) and later, for a ride at a similar
 * temperature, shows it as a suggestion: «Bei 6 °C hattest du kalte Hände – mit: dünne Handschuhe».
 * Setting 'wxFeel' (synced, in the backup): [{ id, day, tmin, tmax, wind, rain, feel, parts, wore }].
 * Pure functions, tested in tests/wetter-gefuehl.test.js.
 */
export const FEEL_KEY = 'wxFeel';
export const FEELS = ['cold', 'ok', 'warm'];
export const PARTS = ['hands', 'feet', 'body', 'head'];
export const FEEL_TEXT = { cold: 'Too cold', ok: 'Just right', warm: 'Too warm' };
export const PART_TEXT = { hands: 'Hands', feet: 'Feet', body: 'Body', head: 'Head' };
/** Similar: within this many degrees (the coldest hour of the ride). */
export const NEAR_C = 3;
export const MAX = 200;

const fin = (v) => typeof v === 'number' && Number.isFinite(v);

export function feelsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && FEELS.includes(x.feel) && /^\d{4}-\d\d-\d\d$/.test(x.day ?? '') && fin(x.tmin))
    .map((x) => ({ id: String(x.id ?? `${x.day}`), day: x.day, tmin: x.tmin, tmax: fin(x.tmax) ? x.tmax : x.tmin, wind: fin(x.wind) ? x.wind : null, rain: !!x.rain, feel: x.feel, parts: (x.parts ?? []).filter((p) => PARTS.includes(p)), wore: String(x.wore ?? '').slice(0, 200) }));
}

/** Add (or replace the note of the same day). line: the day line of the ride (kern.js dayLine). */
export function addFeel(list, { day, line, feel, parts = [], wore = '' }, now = Date.now()) {
  if (!line || !FEELS.includes(feel)) return list;
  const row = { id: `feel-${now.toString(36)}`, day, tmin: line.feelsMin ?? line.tmin, tmax: line.tmax, wind: line.windMax ?? null, rain: !!line.rainFrom, feel, parts: parts.filter((p) => PARTS.includes(p)), wore: String(wore).trim().slice(0, 200) };
  return [...list.filter((x) => x.day !== day), row].slice(-MAX);
}
export const removeFeel = (list, id) => list.filter((x) => x.id !== id);

/**
 * What you learned for a ride at tmin °C: the notes of similar rides that were not «just right», newest
 * first (at most n), and whether a «just right» one exists (with what you wore then).
 */
export function feelHints(list = [], tmin, n = 2) {
  if (!fin(tmin)) return { off: [], ok: null };
  const near = list.filter((x) => Math.abs(x.tmin - tmin) <= NEAR_C).sort((a, b) => b.day.localeCompare(a.day));
  return { off: near.filter((x) => x.feel !== 'ok').slice(0, n), ok: near.find((x) => x.feel === 'ok' && x.wore) ?? null };
}
