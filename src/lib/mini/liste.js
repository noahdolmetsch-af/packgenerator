/**
 * Mini-Tools «Anmeldeliste mit Warteliste» (Noah 28.10.2026, idea 4): a ride or a workshop evening with a number
 * of places. People sign up by link; whoever comes too late is on the waiting list and moves up when someone
 * takes their answer back. The order is the time an answer came in first (server t0, api/_lib/mini.js).
 * Pure, tested in tests/mini-liste.test.js.
 */
export const KIND_LIST = 'list';
export const PLACES_MIN = 1;
export const PLACES_MAX = 50;
const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const cleanName = (s) => clip(s, 40);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = (x) => typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);

/** The list as it is sealed into the link → object, or null (no title). */
export function listQuestion({ title, note = '', by = '', day = '', time = '', where = '', places = 8 }) {
  const n = Math.round(Number(places));
  const out = {
    v: 1,
    kind: KIND_LIST,
    title: clip(title, 80),
    note: clip(note, 200),
    by: cleanName(by),
    day: isDay(day) ? day : '',
    time: isDay(day) && isTime(time) ? time : '',
    where: clip(where, 80),
    places: Number.isFinite(n) ? Math.min(PLACES_MAX, Math.max(PLACES_MIN, n)) : 8,
  };
  return out.title ? out : null;
}

/** A list read from a link → clean, or null (another kind, broken). */
export function readList(obj) {
  if (!obj || obj.kind !== KIND_LIST || typeof obj.pk !== 'string') return null;
  const q = listQuestion(obj);
  return q ? { ...q, pk: obj.pk } : null;
}

/** One sign-up: a name and a note. */
export const cleanListAnswer = ({ name = '', note = '' }) => ({ name: cleanName(name), note: clip(note, 120) });

/** rows [{ a, name, note, t0 }] → { yes: [...], wait: [...] } in the order they came in first. */
export function seats(rows, places) {
  const all = [...rows].sort((x, y) => String(x.t0 ?? x.at ?? '').localeCompare(String(y.t0 ?? y.at ?? '')) || String(x.a).localeCompare(String(y.a)));
  return { yes: all.slice(0, places), wait: all.slice(places) };
}

/** What my place means: { state: 'yes'|'wait', n } (n: place on the waiting list, 1 = next). */
export const placeState = (pos, places) => (pos <= places ? { state: 'yes', n: pos } : { state: 'wait', n: pos - places });

/** Places still free, from the number of answers. */
export const freeOf = (n, places) => Math.max(0, places - n);

/** The list as text for the group (names only, no notes). T: the app's t(). */
export function listText(q, s, T, when = '') {
  const lines = [q.title];
  if (when) lines.push(when);
  if (q.where) lines.push(q.where);
  lines.push(T('Signed up ({n} of {max}):', { n: s.yes.length, max: q.places }));
  s.yes.forEach((r, i) => lines.push(`${i + 1}. ${r.name}`));
  if (s.wait.length) {
    lines.push(T('Waiting list:'));
    s.wait.forEach((r, i) => lines.push(`${i + 1}. ${r.name}`));
  }
  return lines.join('\n');
}
