/**
 * «Suche als Alleskönner» (Noah 21.10.2026 «1-8 alle»): what a sentence in the search says, by rules
 * (no AI, nothing leaves the device). Pure functions, tested in tests/suche.test.js.
 *
 *   valueOf('Gewicht 72,5')            → { kind: 'value', qid: 'koerper.waage', value: 72.5 }   (idea 1)
 *   valueOf('schlecht geschlafen')     → { kind: 'value', qid: 'erholung.schlaf', value: 3 }
 *   remindOf('Erinnere mich Freitag ans Reifen pumpen', today) → { kind: 'remind', text, due }  (idea 8)
 *   planOf('Plane mir 3 Tage Jura', today) → { kind: 'plan', days: 3, title: 'Jura', start }   (idea 4)
 *   jumpOf('öffne Tagebuch', groups)   → the one page or trip row that fits                   (idea 3)
 *   partsOf('Gewicht 72 und Puls 48')  → ['Gewicht 72', 'Puls 48']                             (idea 7)
 */

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const num = (s) => Number(String(s).replace(',', '.'));
const addDays = (iso, d) => {
  const x = new Date(`${iso}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
};

/* ---------- values (Deine Abfragen) ---------- */

/** Sleep words → the 1–10 scale of «How well did you sleep?». */
const SLEEP = [
  [/^(sehr gut|super|very well|great)/, 9],
  [/^(gut|well|good)/, 7],
  [/^(mittel|ok|okay|so lala|naja|so so|so-so)/, 5],
  [/^(sehr schlecht|miserabel|very badly|terrible)/, 1],
  [/^(schlecht|badly|bad|poorly)/, 3],
];

export function valueOf(text) {
  const s = fold(text).replace(/[.!]+$/, '');
  let m = /^(?:gewicht|ich wiege|waage|weight|i weigh)\s+(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilo|kilogramm)?$/.exec(s);
  if (m && num(m[1]) >= 20 && num(m[1]) <= 300) return { kind: 'value', qid: 'koerper.waage', value: num(m[1]), unit: 'kg' };
  m = /^(?:ruhepuls|puls|resting heart rate|resting pulse|pulse)\s+(\d{2,3})\s*(?:bpm)?$/.exec(s);
  if (m && +m[1] >= 25 && +m[1] <= 220) return { kind: 'value', qid: 'koerper.ruhepuls', value: +m[1], unit: 'bpm' };
  m = /^(?:schlaf|sleep)\s+(\d{1,2})$/.exec(s);
  if (m && +m[1] >= 1 && +m[1] <= 10) return { kind: 'value', qid: 'erholung.schlaf', value: +m[1] };
  m = /^(.+?)\s+geschlafen$/.exec(s) ?? /^slept\s+(.+)$/.exec(s);
  if (m) {
    const hit = SLEEP.find(([re]) => re.test(m[1]));
    if (hit) return { kind: 'value', qid: 'erholung.schlaf', value: hit[1] };
  }
  return null;
}

/* ---------- reminders (Merken) ---------- */

const WEEKDAYS = [
  ['sonntag', 'sunday'],
  ['montag', 'monday'],
  ['dienstag', 'tuesday'],
  ['mittwoch', 'wednesday'],
  ['donnerstag', 'thursday'],
  ['freitag', 'friday'],
  ['samstag', 'saturday'],
];

/** A day word at the start of s → { due, rest } (due null when none). */
export function dayOf(s, today) {
  const x = fold(s);
  const take = (n, due) => ({ due, rest: String(s).trim().split(/\s+/).slice(n).join(' ') });
  let m = /^(?:heute|today)\b/.exec(x);
  if (m) return take(1, today);
  if (/^(?:ubermorgen|uebermorgen)\b/.test(x)) return take(1, addDays(today, 2));
  if (/^(?:morgen|tomorrow)\b/.test(x)) return take(1, addDays(today, 1));
  m = /^(?:in|in a)\s+(\d{1,2}|einem|einer|zwei|drei|a|one|two|three)\s+(tag|tagen|days?|woche|wochen|weeks?)\b/.exec(x);
  if (m) {
    const n = { einem: 1, einer: 1, a: 1, one: 1, zwei: 2, two: 2, drei: 3, three: 3 }[m[1]] ?? +m[1];
    return take(3, addDays(today, /^(woche|week)/.test(m[2]) ? n * 7 : n));
  }
  const words = x.split(' ');
  const skip = ['am', 'on', 'next', 'naechsten', 'nachsten', 'kommenden'].includes(words[0]) ? 1 : 0;
  const d = WEEKDAYS.findIndex((w) => w.includes(words[skip]));
  if (d >= 0) {
    const now = new Date(`${today}T12:00:00Z`).getUTCDay();
    return take(skip + 1, addDays(today, ((d - now + 7) % 7) || 7));
  }
  return { due: null, rest: String(s).trim() };
}

export function remindOf(text, today) {
  const m = /^(?:erinnere mich|erinner mich|remind me)\b\s*(.*)$/i.exec(String(text ?? '').trim().replace(/[.!]+$/, ''));
  if (!m) return null;
  const { due, rest } = dayOf(m[1], today);
  const what = rest.replace(/^(?:daran,?\s*dass|daran|an das|an den|an die|ans|an|zu|to|about|that)\s+/i, '').trim();
  if (!what) return null;
  return { kind: 'remind', text: what.replace(/^\p{Ll}/u, (c) => c.toUpperCase()), due: due ?? addDays(today, 1) };
}

/* ---------- planning in a dialog («Hilf mir planen») ---------- */

export function planOf(text, today) {
  const s = String(text ?? '').trim().replace(/[.!]+$/, '');
  const m = /^(?:plane(?:\s+mir)?|plan(?:\s+me)?|planen)\b\s*(.*)$/i.exec(s);
  if (!m) return null;
  let rest = m[1].replace(/^(?:eine?n?\s+|a\s+)/i, '');
  let days = null;
  const d = /(\d{1,2}|zwei|drei|vier|fünf|two|three|four|five)[\s-]*(?:tage?|tägige?|days?|day)\b/i.exec(rest);
  if (d) {
    days = { zwei: 2, drei: 3, vier: 4, fünf: 5, two: 2, three: 3, four: 4, five: 5 }[d[1].toLowerCase()] ?? +d[1];
    rest = rest.replace(d[0], ' ');
  }
  rest = rest.replace(/\b(?:tour|trip|ride|ausfahrt|bikepacking)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  let start = null;
  const at = /\b(?:ab|am|from|on)\s+(\S+)$/i.exec(rest);
  if (at) {
    const w = dayOf(at[1], today);
    if (w.due) (start = w.due), (rest = rest.slice(0, at.index).trim());
  }
  const title = rest.replace(/^(?:in den|in die|im|in|nach|ins|to|in the|through)\s+/i, '').replace(/^\p{Ll}/u, (c) => c.toUpperCase());
  return { kind: 'plan', days: days ? Math.min(30, Math.max(1, days)) : null, title, start };
}

/** The address of «Hilf mir planen» with what was said filled in. */
export function planHref(p) {
  const q = new URLSearchParams();
  if (p.days) q.set('days', String(p.days));
  if (p.title) q.set('title', p.title);
  if (p.start) q.set('start', p.start);
  const s = q.toString();
  return `#/assistent/plan${s ? `?${s}` : ''}`;
}

/** The prefill from that address: { days, title, startDate } (only what is there). */
export function planFromHash(hash = '') {
  const i = hash.indexOf('?');
  if (i < 0) return {};
  const q = new URLSearchParams(hash.slice(i + 1));
  const out = {};
  const days = Number(q.get('days'));
  if (days >= 1 && days <= 30) out.days = Math.round(days);
  if (q.get('title')) out.title = q.get('title').slice(0, 80);
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('start') ?? '')) out.startDate = q.get('start');
  return out;
}

/* ---------- jumping to a place ---------- */

const LEAD = /^(?:oeffne|offne|öffne|zeig mir|zeige mir|zeig|zeige|geh zu|gehe zu|gehe auf|wechsle zu|open|show me|show|go to)\s+/;

/** The one page or trip that a spoken «öffne …» / name means, or null. */
export function jumpOf(text, groups = []) {
  const said = fold(text);
  const lead = LEAD.test(said);
  const rest = said.replace(LEAD, '').replace(/^(?:die|der|das|den|the)\s+/, '').replace(/^(?:packliste|packing list)\s+/, '');
  if (rest.length < 3) return null;
  const rows = groups.filter((g) => g.kind === 'page' || g.kind === 'trip').flatMap((g) => g.rows.map((r) => ({ ...r, kind: g.kind })));
  const name = (r) => fold(String(r.title ?? '').replace(/^★ /, ''));
  const same = rows.filter((r) => name(r) === rest);
  if (same.length === 1) return same[0];
  if (!lead && !/^(?:packliste|packing list)\s/.test(said)) return null;
  const part = rows.filter((r) => name(r).includes(rest));
  return part.length === 1 ? part[0] : null;
}

/* ---------- several things in one sentence ---------- */

/** «Gewicht 72 und Puls 48, schlecht geschlafen» → the parts (one part when there is nothing to split). */
export function partsOf(text) {
  return String(text ?? '')
    .split(/\s*(?:,|;|\bund dann\b|\bund\b|\band then\b|\band\b|\.\s+)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
}
