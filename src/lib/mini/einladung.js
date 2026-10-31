/**
 * Mini-Tools «Spontan-Einladung» (Noah 28.10.2026, idea 5): «Are you riding with me tomorrow?» One link with the
 * day, time, meeting point, route and the weather; the others tap «I am in», «Maybe» or «Not this time».
 * The link closes the day after the ride. Pure, tested in tests/mini-einladung.test.js.
 */
export const KIND_INVITE = 'invite';
/** The answers (English keys for t()). */
export const REPLIES = [
  { key: 'y', label: 'I am in' },
  { key: 'm', label: 'Maybe' },
  { key: 'n', label: 'Not this time' },
];
const KEYS = new Set(REPLIES.map((r) => r.key));
const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const cleanName = (s) => clip(s, 40);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = (x) => typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);

/** Only http(s) links, for the route. */
export function cleanUrl(u) {
  const s = String(u ?? '').trim();
  if (!s) return '';
  try {
    const x = new URL(s);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href.slice(0, 300) : '';
  } catch {
    return '';
  }
}

/** The weather as kept in the invite: { place, min, max, rain } (rain: chance in %), or null. */
export function cleanWx(w) {
  if (!w || typeof w !== 'object') return null;
  const out = { place: clip(w.place, 60), min: num(w.min), max: num(w.max), rain: num(w.rain) };
  return out.min === null && out.max === null ? null : out;
}

/** The weather of one day from a forecast ({ place, days: [{ date, min, max, rainPct }] }). */
export function wxOf(forecast, day) {
  const d = forecast?.days?.find((x) => x.date === day);
  return d ? cleanWx({ place: String(forecast.place?.name ?? '').split(',')[0], min: d.min, max: d.max, rain: d.rainPct }) : null;
}

/** The invite as it is sealed into the link → object, or null (no day). */
export function inviteQuestion({ title = '', note = '', by = '', day = '', time = '', where = '', route = '', routeUrl = '', wx = null }) {
  if (!isDay(day)) return null;
  return {
    v: 1,
    kind: KIND_INVITE,
    title: clip(title, 80),
    note: clip(note, 200),
    by: cleanName(by),
    day,
    time: isTime(time) ? time : '',
    where: clip(where, 80),
    route: clip(route, 80),
    routeUrl: cleanUrl(routeUrl),
    wx: cleanWx(wx),
  };
}

/** An invite read from a link → clean, or null. */
export function readInvite(obj) {
  if (!obj || obj.kind !== KIND_INVITE || typeof obj.pk !== 'string') return null;
  const q = inviteQuestion(obj);
  return q ? { ...q, pk: obj.pk } : null;
}

/** One answer: { name, reply: 'y'|'m'|'n', note }, or null without a reply. */
export function cleanReply({ name = '', reply = '', note = '' }) {
  return KEYS.has(reply) ? { name: cleanName(name), reply, note: clip(note, 120) } : null;
}

/** rows [{ name, reply }] → { y: [...], m: [...], n: [...] } (names, in the order of the rows). */
export function groupReplies(rows) {
  const out = { y: [], m: [], n: [] };
  for (const r of rows) if (out[r.reply]) out[r.reply].push(r);
  return out;
}

/** Days from today until the day after the ride (at least 1): how long the link stays open. */
export function daysOpen(today, day) {
  const d = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  return Math.max(1, d + 1);
}

/** The text for the group. T: the app's t(); when: the day in words. */
export function inviteText(q, g, T, when) {
  const lines = [q.title || T('Are you riding with me?'), when + (q.time ? `, ${q.time}` : '')];
  if (q.where) lines.push(q.where);
  lines.push(T('In: {list}', { list: g.y.map((r) => r.name).join(', ') || '–' }));
  if (g.m.length) lines.push(T('Maybe: {list}', { list: g.m.map((r) => r.name).join(', ') }));
  return lines.join('\n');
}
