/**
 * «Tagebuch» (Noah 20.10.2026: «schaue dir die app dayone an und baue sie nach»; answers «1b und kann aber
 * mit inhalten aus app ergänzt werden 2b mit möglichkeit zum download, teilen 3a … 365 Fragen … diktierfunktion
 * … 4a 5a»). One diary for what you write yourself (1b); things from the app (rides, Fitbit, notes, tours …)
 * can be added to an entry on a tap. One diary with tags (2b), download and share. A question of the day
 * (3a, fragen.js) and dictation. A lock with an own code (4a). Entries sync and go into every backup (5a).
 *
 * Where the entries live: rows of the table «frei» with kind 'diary' (Dexie 19, no new table, so no schema
 * change). An entry: { id, kind: 'diary', day: 'YYYY-MM-DD', time: 'HH:MM', at, editedAt, title, text,
 * photos: [{ src }], tags: [name], place: { name, lat, lon } | null, weather: { temp, code } | null,
 * star: bool, q: question index | null, refs: [{ key, text }] }.
 * The settings: one settings record { key: 'journal', value: { questions, lock: { salt, hash }, resetAt } }.
 * Pure functions here (tested in tests/tagebuch.test.js); the database parts are in journaldb.js.
 */
export const JOURNAL_KEY = 'journal';
export const KIND = 'diary';
export const HREF = '#/tagebuch';

export const uid = (p = 'tb') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
const clean = (s, max) => String(s ?? '').slice(0, max);

/** A tag as typed: trimmed, no leading #, at most 30 signs. '' when nothing is left. */
export const cleanTag = (s) => String(s ?? '').replace(/^#+/, '').replace(/\s+/g, ' ').trim().slice(0, 30);
/** Tags without empties and doubles (case-insensitive, the first spelling wins). */
export function cleanTags(list = []) {
  const seen = new Set();
  const out = [];
  for (const x of list ?? []) {
    const s = cleanTag(x);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

/** A new or changed entry, cleaned. `now`: ISO time (also gives day and time when they are missing). */
export function newEntry(e = {}, { id, now = new Date().toISOString(), today = null, clock = null } = {}) {
  return {
    id: id ?? e.id ?? uid(),
    kind: KIND,
    day: isDay(e.day) ? e.day : today ?? now.slice(0, 10),
    time: isTime(e.time) ? e.time : clock ?? now.slice(11, 16),
    at: e.at ?? now,
    editedAt: now,
    title: clean(e.title, 140).trim(),
    text: clean(e.text, 50000),
    photos: (e.photos ?? []).filter((p) => p?.src).map((p) => ({ src: p.src })),
    tags: cleanTags(e.tags),
    place: e.place && (e.place.name || Number.isFinite(e.place.lat)) ? { name: clean(e.place.name, 80).trim(), ...(Number.isFinite(e.place.lat) ? { lat: e.place.lat, lon: e.place.lon } : {}) } : null,
    weather: e.weather && Number.isFinite(e.weather.temp) ? { temp: Math.round(e.weather.temp), code: Number.isFinite(e.weather.code) ? e.weather.code : null } : null,
    star: !!e.star,
    mood: Number.isInteger(e.mood) && e.mood >= 1 && e.mood <= 5 ? e.mood : null,
    q: Number.isInteger(e.q) ? e.q : null,
    refs: (e.refs ?? []).filter((r) => r?.key).map((r) => ({ key: String(r.key), text: clean(r.text, 300) })),
  };
}

/** Nothing written: no title, no text, no photo. Such an entry is not saved. */
export const isEmpty = (e) => !String(e?.title ?? '').trim() && !String(e?.text ?? '').trim() && !(e?.photos ?? []).length;

/** Newest first: by day, then by time. */
export const sortEntries = (list = []) => [...list].sort((a, b) => `${b.day} ${b.time ?? ''}`.localeCompare(`${a.day} ${a.time ?? ''}`));

/** Words in a text (for the counters). */
export const wordCount = (s) => (String(s ?? '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;

/** The first line as a title when none is given, and the rest as a short preview. */
export function headOf(e, max = 160) {
  const text = String(e?.text ?? '').trim();
  const title = String(e?.title ?? '').trim();
  if (title) return { title, preview: text.replace(/\s+/g, ' ').slice(0, max) };
  const [first = '', ...rest] = text.split('\n');
  return { title: first.trim().slice(0, 90), preview: rest.join(' ').replace(/\s+/g, ' ').trim().slice(0, max) };
}

/** Search in title, text, tags and place (all words must be there, case-insensitive). */
export function matches(e, q = '') {
  const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [e.title, e.text, ...(e.tags ?? []), e.place?.name ?? ''].join(' ').toLowerCase();
  return words.every((w) => hay.includes(w));
}

/** Filter: q (search), tag ('' = all), star (only starred), month ('YYYY-MM'), day. */
export function filterEntries(list = [], { q = '', tag = '', star = false, month = '', day = '' } = {}) {
  const lt = tag.toLowerCase();
  return list.filter((e) => matches(e, q) && (!tag || (e.tags ?? []).some((x) => x.toLowerCase() === lt)) && (!star || e.star) && (!month || e.day.startsWith(month)) && (!day || e.day === day));
}

/** The entries grouped by month, newest first: [{ month: 'YYYY-MM', items }]. */
export function byMonth(list = []) {
  const out = [];
  for (const e of sortEntries(list)) {
    const m = e.day.slice(0, 7);
    if (out.at(-1)?.month !== m) out.push({ month: m, items: [] });
    out.at(-1).items.push(e);
  }
  return out;
}

/** All tags with how often they are used: [{ name, n }], most used first, then A–Z. */
export function allTags(list = []) {
  const map = new Map();
  for (const e of list) for (const x of e.tags ?? []) {
    const k = x.toLowerCase();
    const cur = map.get(k) ?? { name: x, n: 0 };
    cur.n += 1;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/**
 * Rename tag `from` to `to` in every entry, or remove it (to = ''), or merge it into another tag.
 * → only the entries that change (to save; the old rows are the Undo).
 */
export function retag(list = [], from, to = '') {
  const lf = String(from ?? '').toLowerCase();
  const next = cleanTag(to);
  if (!lf || next.toLowerCase() === lf && next === from) return [];
  return list
    .filter((e) => (e.tags ?? []).some((x) => x.toLowerCase() === lf))
    .map((e) => ({ ...e, tags: cleanTags((e.tags ?? []).map((x) => (x.toLowerCase() === lf ? next : x))) }));
}

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** «On this day»: entries of the same calendar day in earlier years → [{ years, items }], nearest first. */
export function onThisDay(list = [], today) {
  const md = String(today).slice(5);
  const y = Number(String(today).slice(0, 4));
  const out = new Map();
  for (const e of list) {
    if (e.day.slice(5) !== md || e.day >= today) continue;
    const years = y - Number(e.day.slice(0, 4));
    if (!out.has(years)) out.set(years, []);
    out.get(years).push(e);
  }
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([years, items]) => ({ years, items: sortEntries(items) }));
}

/** Days in a row with at least one entry, ending today (or yesterday, so the series is not lost before evening). */
export function streak(list = [], today) {
  const days = new Set(list.map((e) => e.day));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

/** Numbers for the head: entries, days with an entry, words, photos, entries this year. */
export function stats(list = [], today) {
  const year = String(today).slice(0, 4);
  return {
    entries: list.length,
    days: new Set(list.map((e) => e.day)).size,
    words: list.reduce((s, e) => s + wordCount(e.text) + wordCount(e.title), 0),
    photos: list.reduce((s, e) => s + (e.photos?.length ?? 0), 0),
    thisYear: list.filter((e) => e.day.startsWith(year)).length,
    streak: streak(list, today),
  };
}

/** The weeks of a month for the calendar, Monday first: [[day|null × 7]]. */
export function monthGrid(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
/** The month before or after 'YYYY-MM'. */
export function shiftMonth(month, n) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** All photos, newest first: [{ src, id, day }]. */
export const photosOf = (list = []) => sortEntries(list).flatMap((e) => (e.photos ?? []).map((p, i) => ({ src: p.src, id: e.id, day: e.day, n: i })));

/**
 * Open-Meteo weather codes (WMO) → a key for the word and the icon. 0 clear, 1–3 clouds, 45/48 fog,
 * 51–67 drizzle and rain, 71–77 snow, 80–82 showers, 85/86 snow showers, 95–99 thunderstorm.
 */
export function weatherKind(code) {
  if (!Number.isFinite(code)) return 'cloud';
  if (code === 0) return 'sun';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain';
}
export const WEATHER_WORDS = { sun: 'Sunny', partly: 'Partly cloudy', cloud: 'Cloudy', fog: 'Fog', rain: 'Rain', snow: 'Snow', storm: 'Thunderstorm' };

/**
 * One entry as Markdown (for download and sharing). t: the translator; fmt(day): the long date.
 * Photos are not in the text (they stay in the app and the backup; sharing sends them as files).
 */
export function entryMarkdown(e, { t = (s) => s, fmt = (d) => d } = {}) {
  const head = headOf(e);
  const meta = [`${fmt(e.day)}${e.time ? `, ${e.time}` : ''}`];
  if (e.mood) meta.push(t(['Heavy|mood', 'Meh|mood', 'Okay|mood', 'Good|mood', 'Great|mood'][e.mood - 1]));
  if (e.place?.name) meta.push(e.place.name);
  if (e.weather) meta.push(`${e.weather.temp} °C ${t(WEATHER_WORDS[weatherKind(e.weather.code)])}`);
  const lines = [`## ${e.title?.trim() ? e.title.trim() : head.title || fmt(e.day)}`, '', `_${meta.join(' · ')}_`, ''];
  const body = e.title?.trim() ? e.text : String(e.text ?? '').split('\n').slice(1).join('\n');
  if (String(body ?? '').trim()) lines.push(String(body).trim(), '');
  if (e.tags?.length) lines.push(e.tags.map((x) => `#${x.replace(/\s+/g, '_')}`).join(' '), '');
  if (e.photos?.length) lines.push(`(${e.photos.length} ${e.photos.length === 1 ? t('photo') : t('photos')})`, '');
  return lines.join('\n');
}
/** The whole diary (or a filtered part) as one Markdown file, oldest first like a book. */
export function journalMarkdown(list = [], { t = (s) => s, fmt = (d) => d, title = 'Diary' } = {}) {
  const items = sortEntries(list).reverse();
  return [`# ${title}`, '', ...items.map((e) => entryMarkdown(e, { t, fmt }))].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
/** The years that have entries, newest first (year book). */
export const yearsOf = (entries) => [...new Set(entries.map((e) => e.day.slice(0, 4)))].sort().reverse();
/** File name for a download: tagebuch-2026-10-20.md */
export const fileName = (base, day) => `${base}-${day}.md`;

/* ---------- the lock (4a) ---------- */
/** Only digits, 4 to 8 of them. */
export const validCode = (s) => /^\d{4,8}$/.test(String(s ?? ''));
/** SHA-256 of salt + code as hex (the code itself is never stored). */
export async function hashCode(code, salt, subtle = globalThis.crypto?.subtle) {
  const data = new TextEncoder().encode(`${salt}:${code}`);
  const buf = await subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const newSalt = () => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
