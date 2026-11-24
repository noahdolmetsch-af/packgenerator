/**
 * «Rennatlas» (Noah 24.11.2026 «1:1 wie das Mockup»): the pure part of the three views of the race
 * list: filters with counts, the status of a registration, the cards «Bald fällig / Danach / Prüfen»,
 * the year line with its overlaps and free windows, and the map points. No page, no storage: tested
 * in tests/atlas-view.test.js. Days are 'YYYY-MM-DD' (calendar days).
 */
import { keyOf, rangeOf } from './atlas.js';

const DAY = 864e5;
const at = (day) => Date.parse(`${day}T12:00:00Z`);
export const addDay = (day, n) => new Date(at(day) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a, b) => Math.round((at(b) - at(a)) / DAY);
/** Days of rest the line keeps free behind each race. */
export const REST_DAYS = 2;
export const MAX_DAYS = 12;

/** «6–10» → { min: 6, max: 10 }; «3» → { 3, 3 }; nothing → { 1, 1 }. */
export function span(r) {
  const all = String(r?.daysText ?? '').match(/\d+/g)?.map(Number) ?? [];
  if (!all.length) return { min: r?.days || 1, max: r?.days || 1 };
  return { min: Math.max(1, Math.min(...all)), max: Math.max(1, Math.max(...all)) };
}

const STATUS = {
  'Anmeldung offen': 'open',
  'Anmeldung öffnet': 'soon',
  'Geschlossen / vergangen': 'shut',
  'Keine gesicherte Angabe': 'unk',
  'Noch nicht offen': 'later',
  'Nur Warteliste': 'wait',
  'Ohne formelle Anmeldung': 'none',
};

/** The state of the registration: { kind, days?, text? }. kind: mine, open, soon, later, wait, shut, none, unk (text: a status nobody knows, as typed). */
export function statusOf(r, today) {
  if (r.registered) return { kind: 'mine' };
  let kind = STATUS[r.status];
  if (!kind) return r.status ? { kind: 'unk', text: r.status } : { kind: 'unk' };
  if (kind === 'soon' && r.opens) {
    const d = diffDays(today, r.opens);
    if (d <= 0) return { kind: 'open' };
    return { kind, days: d };
  }
  return { kind };
}

/** The range of a race with its rest days: { from, to (the last riding day), maxTo, restTo }. */
export function lineOf(r) {
  const g = rangeOf(r);
  if (!g) return null;
  const s = span(r);
  const minTo = addDay(g.from, s.min - 1);
  const maxTo = addDay(g.from, s.max - 1);
  return { from: g.from, minTo, maxTo, restTo: addDay(maxTo, REST_DAYS) };
}

const clashes = (a, b) => a.from <= b.restTo && b.from <= a.restTo;

/** Races that fit between the ones of yours: no overlap, rest days included, with any of `mine` but itself. */
export function fits(r, mine = []) {
  const a = lineOf(r);
  if (!a) return false;
  return mine.every((m) => keyOf(m) === keyOf(r) || !lineOf(m) || !clashes(a, lineOf(m)));
}

export const EMPTY_FILTER = Object.freeze({ q: '', surface: [], land: [], dmin: 1, dmax: MAX_DAYS, opens30: false, open: false, fits: false, show: 'all' });
export const newFilter = () => ({ ...EMPTY_FILTER, surface: [], land: [] });

/** How many filters are on. */
export function activeCount(f) {
  return (f.q.trim() ? 1 : 0) + f.surface.length + f.land.length + (f.dmin > 1 || f.dmax < MAX_DAYS ? 1 : 0) + (f.opens30 ? 1 : 0) + (f.open ? 1 : 0) + (f.fits ? 1 : 0) + (f.show !== 'all' ? 1 : 0);
}

const flat = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Does the race pass the filter? ctx: { today, mine }. */
export function matches(r, f, ctx) {
  if (f.show === 'fav' && !r.fav) return false;
  if (f.show === 'registered' && !r.registered) return false;
  const q = flat(f.q).trim();
  if (q && !flat(`${r.name} ${r.city} ${r.land}`).includes(q)) return false;
  if (f.surface.length && !f.surface.includes(r.surface)) return false;
  if (f.land.length && !f.land.includes(r.land)) return false;
  if (f.dmin > 1 || f.dmax < MAX_DAYS) {
    const s = span(r);
    if (s.max < f.dmin || s.min > f.dmax) return false;
  }
  const st = statusOf(r, ctx.today);
  if (f.open && st.kind !== 'open') return false;
  if (f.opens30 && !(st.kind === 'soon' && st.days != null && st.days <= 30)) return false;
  if (f.fits && !fits(r, ctx.mine)) return false;
  return true;
}

/** The filter chips with their counts: { surface: [{ key, n }], land: [{ key, n }], fav, registered }, the most common first. */
export function facets(rows = []) {
  const count = (pick) => {
    const m = new Map();
    for (const r of rows) {
      const k = pick(r);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  };
  return { surface: count((r) => r.surface), land: count((r) => r.land), fav: rows.filter((r) => r.fav).length, registered: rows.filter((r) => r.registered).length };
}

/** How many races each switch of «Anmeldung» would show (with the rest of the filter on). */
export function switchCounts(rows, f, ctx) {
  const n = (patch) => rows.filter((r) => matches(r, { ...f, ...patch }, ctx)).length;
  return { opens30: n({ opens30: true }), open: n({ open: true }), fits: n({ fits: true }) };
}

export const SORTS = ['date', 'name', 'km', 'opens'];
/** The races in the order asked for (a copy). */
export function sorted(rows, how = 'date') {
  const list = [...rows];
  const by = {
    date: (a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
    km: (a, b) => (b.km ?? 0) - (a.km ?? 0) || a.name.localeCompare(b.name),
    opens: (a, b) => (a.opens || '9999').localeCompare(b.opens || '9999') || a.name.localeCompare(b.name),
  };
  return list.sort(by[how] ?? by.date);
}

/** Yours: registered, favourites and the races already in the app (rows). */
export const mineOf = (rows, known = () => false) => rows.filter((r) => r.registered || r.fav || known(r));

/**
 * The three cards: «Bald fällig» and «Danach» (the next two registrations that open, of your favourites),
 * «Prüfen» (you are registered, but the list says the registration is not open yet).
 */
export function dueCards(rows, today) {
  const next = rows
    .filter((r) => r.fav && !r.registered && r.opens && r.opens >= today)
    .sort((a, b) => a.opens.localeCompare(b.opens) || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((r) => ({ row: r, days: diffDays(today, r.opens) }));
  const check = rows.find((r) => r.registered && ['soon', 'later'].includes(statusOf({ ...r, registered: false }, today).kind));
  return { soon: next[0] ?? null, then: next[1] ?? null, check: check ?? null };
}

/** The race a window of the year belongs to, for the year line. */
const monthOf = (day) => Number(day.slice(5, 7)) - 1;

/**
 * The year line: the races of yours of one year with their ranges, the pairs that do not fit, and the
 * free windows with the number of races from the list that would fit in. → { year, from, to (days of the
 * shown cut), items, pairs, free }.
 */
export function yearLine(rows, mine, year) {
  const own = mine
    .map((r) => ({ r, l: lineOf(r) }))
    .filter((x) => x.l && (x.l.from.slice(0, 4) === String(year) || x.l.maxTo.slice(0, 4) === String(year)))
    .sort((a, b) => a.l.from.localeCompare(b.l.from) || a.r.name.localeCompare(b.r.name));
  if (!own.length) return { year, from: '', to: '', items: [], pairs: [], free: [] };
  const firstMonth = Math.max(0, monthOf(own[0].l.from) - 1);
  const lastMonth = Math.min(11, Math.max(...own.map((x) => monthOf(x.l.maxTo.slice(0, 4) === String(year) ? x.l.maxTo : `${year}-12-31`))) + 1);
  const from = `${year}-${String(firstMonth + 1).padStart(2, '0')}-01`;
  const to = addDay(`${year}-${String(lastMonth + 1).padStart(2, '0')}-01`, new Date(Date.UTC(year, lastMonth + 1, 0)).getUTCDate() - 1);
  const items = own.map(({ r, l }) => ({ key: keyOf(r), row: r, ...l, s: span(r), clash: false }));
  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (!clashes(a, b)) continue;
      a.clash = b.clash = true;
      // sure: even the shortest ride of the earlier one runs into the later one; otherwise it only fits when the earlier one is short enough
      const sure = a.minTo >= b.from;
      pairs.push({ a: a.row, b: b.row, sure, atMost: Math.max(1, diffDays(a.from, b.from)) });
    }
  }
  // the ones that matter most first: two races you are registered for, then the rest by day
  pairs.sort((p, q) => Number(q.a.registered && q.b.registered) - Number(p.a.registered && p.b.registered));
  // free windows between the occupied stretches (rest days included), cut to the shown part
  const busy = items.map((x) => [x.from, x.restTo]).sort((p, q) => p[0].localeCompare(q[0]));
  const free = [];
  let cursor = from;
  for (const [s, e] of busy) {
    if (s > cursor) free.push([cursor, addDay(s, -1)]);
    if (addDay(e, 1) > cursor) cursor = addDay(e, 1);
  }
  if (cursor <= to) free.push([cursor, to]);
  return { year, from, to, items, pairs, free: free.map(([a, b]) => ({ from: a, to: b })) };
}

/** The races of the list (not yours) that fit completely into each free window. */
export function freeCounts(line, rows, mine) {
  const mineKeys = new Set(mine.map(keyOf));
  const cand = rows.map((r) => ({ r, l: lineOf(r) })).filter((x) => x.l && !mineKeys.has(keyOf(x.r)));
  return line.free.map((w) => ({ ...w, n: cand.filter((x) => x.l.from >= w.from && x.l.maxTo <= w.to).length }));
}

/** The years in which you have races, the coming one first (for the year choice). */
export function yearsOfMine(mine, today) {
  const ys = [...new Set(mine.map(lineOf).filter(Boolean).flatMap((l) => [l.from.slice(0, 4), l.maxTo.slice(0, 4)]))].sort();
  const now = today.slice(0, 4);
  return ys.filter((y) => y >= now).concat(ys.filter((y) => y < now));
}

/** Where the races of yours are on the map: only the ones with a position. */
export const pointsOf = (mine) => mine.filter((r) => r.lat != null && r.lon != null).map((r) => ({ key: keyOf(r), row: r, lat: r.lat, lon: r.lon }));

const ics = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
const compact = (d) => d.replace(/-/g, '');
/** A calendar file (all-day events): the races of yours, or the days when the registrations of your favourites open. */
export function calendarOf(kind, mine, today, stamp = '20260101T000000Z') {
  const ev = [];
  if (kind === 'races') {
    for (const r of mine) {
      const l = lineOf(r);
      if (!l) continue;
      ev.push({ uid: `race-${compact(r.date)}-${keyOf(r).length}-${ics(r.name).length}`, from: l.from, to: addDay(l.maxTo, 1), title: r.name + (r.registered ? '' : ' ☆'), note: [r.city, r.land, r.url].filter(Boolean).join(' · ') });
    }
  } else {
    for (const r of mine) {
      if (r.registered || !r.opens || r.opens < today) continue;
      ev.push({ uid: `open-${compact(r.opens)}-${ics(r.name).length}`, from: r.opens, to: addDay(r.opens, 1), title: `${r.name}: Anmeldung öffnet`, note: r.url || '' });
    }
  }
  if (!ev.length) return '';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pack Generator//Rennatlas//DE'];
  ev.forEach((e, i) => lines.push('BEGIN:VEVENT', `UID:${e.uid}-${i}@packgenerator`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${compact(e.from)}`, `DTEND;VALUE=DATE:${compact(e.to)}`, `SUMMARY:${ics(e.title)}`, ...(e.note ? [`DESCRIPTION:${ics(e.note)}`] : []), 'END:VEVENT'));
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
