/**
 * Mini-Tools «Find a date» (Noah 28.10.2026, idea 1, like Doodle): pick 2 to 8 days, share a link, each
 * person taps «works», «maybe» or «does not work» per day; the best day is on top.
 * The question and the answers in their plain form; sealing and the server are in client.js. Pure, tested
 * in tests/mini-termin.test.js.
 */
export const KIND_DATE = 'date';
export const OPTS_MIN = 2;
export const OPTS_MAX = 8;
export const TITLE_MAX = 80;
export const NOTE_MAX = 200;
export const NAME_MAX = 40;
/** The three answers for one day, and how much each counts for «best day». */
export const PICKS = [
  { key: 'y', label: 'Works', score: 1 },
  { key: 'm', label: 'Maybe', score: 0.5 },
  { key: 'n', label: 'Does not work', score: 0 },
];
const PICK_KEYS = new Set(PICKS.map((p) => p.key));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const text = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const cleanName = (s) => text(s, NAME_MAX);

/** One option's key: the day, with its time when it has one («2026-11-14» or «2026-11-14T09:00»). */
export const optKey = (o) => (o.t ? `${o.d}T${o.t}` : o.d);

/** Options → unique, sorted by day and time, at most OPTS_MAX. */
export function cleanOpts(list) {
  const seen = new Map();
  for (const o of Array.isArray(list) ? list : []) {
    const d = String(o?.d ?? '');
    const t = TIME.test(String(o?.t ?? '')) ? String(o.t) : '';
    if (!DAY.test(d) || Number.isNaN(Date.parse(`${d}T12:00:00Z`))) continue;
    const x = { d, t };
    seen.set(optKey(x), x);
  }
  return [...seen.values()].sort((a, b) => optKey(a).localeCompare(optKey(b))).slice(0, OPTS_MAX);
}

/** The question as it is sealed into the link. → object, or null when it is not a usable date question. */
export function dateQuestion({ title, note = '', opts, by = '' }) {
  const o = cleanOpts(opts);
  const q = { v: 1, kind: KIND_DATE, title: text(title, TITLE_MAX), note: text(note, NOTE_MAX), by: cleanName(by), opts: o };
  return q.title && o.length >= OPTS_MIN ? q : null;
}

/** A question read from a link → the clean question, or null (another kind, broken). */
export function readDateQuestion(obj) {
  if (!obj || obj.kind !== KIND_DATE || typeof obj.pk !== 'string') return null;
  const q = dateQuestion(obj);
  return q ? { ...q, pk: obj.pk } : null;
}

/** One person's answer (only days of the question, only y/m/n). */
export function cleanAnswer({ name, picks, note = '' }, opts) {
  const keys = new Set(opts.map(optKey));
  const out = {};
  for (const [k, v] of Object.entries(picks ?? {})) if (keys.has(k) && PICK_KEYS.has(v)) out[k] = v;
  return { name: cleanName(name), picks: out, note: text(note, NOTE_MAX) };
}

/**
 * Count the answers per option. rows: [{ name, picks }] (my own row too, when I gave one).
 * → [{ key, d, t, y, m, n, open, score }] in the order of the question, and `best`: the option with the
 * highest score (works = 1, maybe = ½), on a tie more «works», then the earlier one; null without answers.
 */
export function tally(opts, rows) {
  const list = opts.map((o) => {
    const k = optKey(o);
    const c = { key: k, d: o.d, t: o.t, y: 0, m: 0, n: 0, open: 0, score: 0 };
    for (const r of rows) {
      const p = r?.picks?.[k];
      if (p === 'y' || p === 'm' || p === 'n') c[p] += 1;
      else c.open += 1;
    }
    c.score = c.y + c.m * 0.5;
    return c;
  });
  const answered = rows.some((r) => Object.keys(r?.picks ?? {}).length);
  const best = answered ? [...list].sort((a, b) => b.score - a.score || b.y - a.y || a.key.localeCompare(b.key))[0] : null;
  return { list, best: best && best.score > 0 ? best : null };
}

/**
 * Days I am busy (grey when picking days): days of my trips and of my calendar copy (Google).
 * trips: [{ startDate, days, status }]; events: [{ day }]. → Set of YYYY-MM-DD.
 */
export function busyDays(trips = [], events = []) {
  const out = new Set();
  for (const tr of trips) {
    if (!tr?.startDate || !DAY.test(tr.startDate) || tr.status === 'cancelled') continue;
    const n = Math.min(60, Math.max(1, Number(tr.days) || 1));
    for (let i = 0; i < n; i++) out.add(addDays(tr.startDate, i));
  }
  for (const e of events) if (e?.day && DAY.test(e.day)) out.add(e.day);
  return out;
}

/** Calendar-day arithmetic (no clock, no summer time). */
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return x.toISOString().slice(0, 10);
}

/** The next `n` days from today (to pick from). */
export const nextDays = (today, n = 42) => Array.from({ length: n }, (_, i) => addDays(today, i));

/** One line per option for the group chat: «Sa 14.11.: 4 works, 1 maybe». fmt(o) writes the day. */
export function summaryLines(result, fmt, words) {
  return result.list.map((c) => `${fmt(c)}: ${[c.y && `${c.y} ${words.y}`, c.m && `${c.m} ${words.m}`, c.n && `${c.n} ${words.n}`].filter(Boolean).join(', ') || words.none}`);
}

const icsText = (s) => String(s).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
/** A calendar file for the chosen option (all day, or 2 hours from its time). */
export function icsOf(title, o, stamp = '20260101T000000Z', uid = 'mini') {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pack Generator//Mini-Tools//DE', 'BEGIN:VEVENT', `UID:${uid}@packgenerator`, `DTSTAMP:${stamp}`];
  const d = o.d.replace(/-/g, '');
  if (o.t) {
    const [h, mi] = o.t.split(':').map(Number);
    const end = `${String(Math.min(23, h + 2)).padStart(2, '0')}${String(mi).padStart(2, '0')}00`;
    lines.push(`DTSTART;TZID=Europe/Zurich:${d}T${o.t.replace(':', '')}00`, `DTEND;TZID=Europe/Zurich:${d}T${end}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(o.d, 1).replace(/-/g, '')}`);
  }
  lines.push(`SUMMARY:${icsText(title)}`, 'END:VEVENT', 'END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
