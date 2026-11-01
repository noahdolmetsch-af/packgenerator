/**
 * Mini-Tools «Wann muss ich losfahren?» (Noah 28.10.2026, idea 10): everybody's start place, one meeting point and
 * time; the app works out when each person has to leave so all arrive together. Without a server and without paid
 * route services: straight line × a detour factor, at each person's own speed, plus a buffer.
 * Everything stays on this device (db.settings «mini-abfahrt»). Pure, tested in tests/mini-abfahrt.test.js.
 *
 *   'mini-abfahrt'  [{ id, title, place: { name, lat, lon } | null, day, time,
 *                      people: [{ id, name, from: { name, lat, lon } | null, speed, buffer }] }]
 */
import { haversine } from '../tools/geo.js';

export const ABFAHRT_KEY = 'mini-abfahrt';
/** Roads and paths are longer than the straight line; 1.3 is a usual value for cycling in Switzerland. */
export const DETOUR = 1.3;
/** Ready speeds in km/h (English keys for t()). */
export const SPEEDS = [
  { kmh: 15, label: 'Easy|pace' },
  { kmh: 20, label: 'Normal|pace' },
  { kmh: 25, label: 'Fast|pace' },
  { kmh: 4.5, label: 'On foot' },
];
export const SPEED_DEFAULT = 20;
export const BUFFER_DEFAULT = 5;
export const PEOPLE_MAX = 30;

const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const num = (v, lo, hi, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
export const listOf = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : []);

/** A clean place { name, lat, lon } or null. */
export function cleanPlace(p) {
  if (!p || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lon))) return null;
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { name: clip(p.name, 60) || '?', lat, lon };
}

/** A clean person. */
export const cleanPerson = (p, id) => ({
  id: typeof p?.id === 'string' ? p.id : id,
  name: clip(p?.name, 40),
  from: cleanPlace(p?.from),
  speed: num(p?.speed, 3, 45, SPEED_DEFAULT),
  buffer: Math.round(num(p?.buffer, 0, 60, BUFFER_DEFAULT)),
});

/** A new meeting. */
export function newMeet({ title = '', place = null, day = '', time = '09:00', people = [] } = {}, id = 'ab-1') {
  return {
    id,
    title: clip(title, 60),
    place: cleanPlace(place),
    day: /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '',
    time: /^\d{2}:\d{2}$/.test(time) ? time : '09:00',
    people: people.map((p, i) => cleanPerson(p, `p${i + 1}`)).filter((p) => p.name).slice(0, PEOPLE_MAX),
  };
}

/** km on the way (straight line × DETOUR), or null without both places. */
export function wayKm(from, to) {
  if (!from || !to) return null;
  return (haversine([from.lat, from.lon], [to.lat, to.lon]) / 1000) * DETOUR;
}

/** Minutes on the way at `speed` km/h (rounded up), or null. */
export function rideMinutes(from, to, speed = SPEED_DEFAULT) {
  const km = wayKm(from, to);
  return km === null ? null : Math.ceil((km / speed) * 60);
}

/** «HH:MM» `mins` minutes before `time`; prev: true when that is the day before. */
export function minus(time, mins) {
  const [h, m] = time.split(':').map(Number);
  let t = h * 60 + m - mins;
  let prev = 0;
  while (t < 0) {
    t += 1440;
    prev += 1;
  }
  return { at: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, prev };
}

/** Each person's plan, earliest departure first; people without a start place come last. */
export function plan(meet) {
  const rows = meet.people.map((p) => {
    const ride = rideMinutes(p.from, meet.place, p.speed);
    if (ride === null) return { ...p, km: null, ride: null, leave: null };
    const leave = minus(meet.time, ride + p.buffer);
    return { ...p, km: wayKm(p.from, meet.place), ride, leave };
  });
  const key = (r) => (r.leave ? -r.leave.prev * 1440 + Number(r.leave.at.slice(0, 2)) * 60 + Number(r.leave.at.slice(3)) : Infinity);
  return rows.sort((a, b) => key(a) - key(b));
}

/** «1 h 05» or «35 min». */
export const durText = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `${mins} min`);

/** The plan as text for the group. T: the app's t(). */
export function planText(meet, rows, T) {
  const head = [meet.title, T('Meeting point: {place} at {time}', { place: meet.place?.name ?? '?', time: meet.time })].filter(Boolean);
  const lines = rows.filter((r) => r.leave).map((r) => T('{name}: leave at {at} ({km} km)', { name: r.name, at: r.leave.at, km: r.km.toFixed(0) }));
  return [...head, ...lines].join('\n');
}
