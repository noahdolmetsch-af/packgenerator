/**
 * Paket N «Pläne und Träume» (Noah 19.10.2026 «1a 2b 3a und b»): the page Touren › Träume (#/trips/dreams).
 *
 * - #32 Abenteuer-Kompass mit Wunschliste: your dream tours; one tap makes a trip draft from a dream.
 * - #287 Jahresplan mit Saisonfenstern: a year band January to December shows when each dream fits.
 *   The months come as a suggestion from the kind of tour (2b) and can be changed per dream.
 * - #1008 Rennen als Event-Tour: a race from Inspiration (3a) or from the Google calendar (3b) becomes a
 *   planned trip with the race block and the registration deadline.
 *
 * Storage: no new table. The settings record DREAMS_KEY (in every backup) holds
 *   { dreams: [{ id, title, kind, months?: [1..12] (own months; missing = the suggestion), days, note,
 *     url, at, tripId? }], kinds?: [{ key, name, raw?, months }] }
 * The kinds of tour are a group like every other («Gruppen überall», rule 17/18): you can add your own,
 * rename and delete them (a deleted kind's dreams show under «Ohne Tourart» and keep its months).
 * Pure functions, tested in tests/dreams.test.js. Labels are English keys for t().
 */

export const DREAMS_KEY = 'dreams';

/** The kinds of tour with the months they usually fit (the suggestion, 2b). Swiss view, changeable. */
export const KINDS = [
  { key: 'alps', name: 'Alpine passes', months: [7, 8, 9], words: /\b(alp|alpen|pass|pässe|paesse|furka|grimsel|gotthard|stelvio|hochalpin|col)\w*/i },
  { key: 'hills', name: 'Jura and foothills', months: [5, 6, 7, 8, 9, 10], words: /\b(jura|voralpen|emmental|napf|hügel|huegel|schwarzwald|vogesen)\w*/i },
  { key: 'lowland', name: 'Lowland and rivers', months: [4, 5, 6, 7, 8, 9, 10], words: /\b(mittelland|fluss|river|rhein|aare|donau|see|lake|route \d)\w*/i },
  { key: 'gravel', name: 'Gravel', months: [3, 4, 5, 6, 7, 8, 9, 10, 11], words: /\b(gravel|schotter|forst)\w*/i },
  { key: 'south', name: 'South and Mediterranean', months: [10, 11, 12, 1, 2, 3, 4], words: /\b(süd|sued|south|mittelmeer|sardin|sizil|korsika|spanien|mallorca|ital|tessin|ticino|provence|kanaren|girona)\w*/i },
  { key: 'north', name: 'North', months: [6, 7, 8], words: /\b(nord|north|norweg|schwed|finn|island|iceland|schottland|scotland|lappland)\w*/i },
  { key: 'snow', name: 'Winter and snow', months: [12, 1, 2, 3, 4], words: /\b(ski|skitour|schnee|snow|winter|fatbike)\w*/i },
  { key: 'race', name: 'Race|dream', months: [], words: /\b(rennen|race|marathon|gran ?fondo|brevet|ultra|challenge)\b/i },
  { key: 'other', name: 'Other|dream', months: [4, 5, 6, 7, 8, 9], words: null },
];
export const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k]));

/** Month names for the band (English keys for t(); German: Jan … Dez). */
export const MONTHS = ['Jan|month', 'Feb|month', 'Mar|month', 'Apr|month', 'May|month', 'Jun|month', 'Jul|month', 'Aug|month', 'Sep|month', 'Oct|month', 'Nov|month', 'Dec|month'];

/**
 * Months as short ranges for one line: [7, 8, 9] → «Jul–Sep», [10, 11, 12, 1, 2] → «Oct–Feb» (over the
 * new year), [5, 7] → «May, Jul». name(m) gives the shown name of month m.
 */
export function seasonText(months = [], name = (m) => String(m)) {
  const set = new Set(months);
  if (!set.size) return '';
  if (set.size === 12) return `${name(1)}–${name(12)}`;
  // start each run at a month whose month before is not in the set
  const starts = [...set].filter((m) => !set.has(m === 1 ? 12 : m - 1)).sort((a, b) => a - b);
  return starts
    .map((s) => {
      let e = s;
      while (set.has(e === 12 ? 1 : e + 1) && (e === 12 ? 1 : e + 1) !== s) e = e === 12 ? 1 : e + 1;
      return e === s ? name(s) : `${name(s)}–${name(e)}`;
    })
    .join(', ');
}

/** The store made safe: { dreams: [], kinds: [] } (kinds: yours, else the Standard ones). */
export function storeOf(value) {
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value : { dreams: Array.isArray(value) ? value : [] };
  const kinds = Array.isArray(v.kinds) && v.kinds.length ? v.kinds.filter((k) => k?.key) : KINDS.map(({ key, name, months }) => ({ key, name, months: [...months] }));
  return { dreams: Array.isArray(v.dreams) ? v.dreams.filter((d) => d?.id) : [], kinds };
}

/** A kind as shown: a typed name as it is (never through t()), a Standard name translated; missing → «No kind». */
export const kindName = (kinds, key, tr) => {
  const k = kinds.find((x) => x.key === key);
  return !k ? tr('No kind of tour') : k.raw ? k.name : tr(k.name);
};

/** A new own kind of tour (typed name, months to suggest). */
export function addKind(kinds, name, { id, months = [5, 6, 7, 8, 9] } = {}) {
  const n = String(name ?? '').trim();
  if (!n) return kinds;
  return [...kinds, { key: id ?? `own-${Date.now().toString(36)}`, name: n, raw: true, months }];
}
/** Renamed: the typed name is kept as typed; empty brings a Standard kind back to its own name. */
export function renameKind(kinds, key, name) {
  const n = String(name ?? '').trim();
  const std = KIND[key];
  return kinds.map((k) => (k.key !== key ? k : n ? { ...k, name: n, raw: true } : std ? { key, name: std.name, months: k.months } : k));
}
/** Deleted: the kind leaves the list; its dreams keep their own months (copied from the kind) and move to `to` or «No kind». */
export function deleteKind(store, key, to = null) {
  const gone = store.kinds.find((k) => k.key === key);
  if (!gone) return store;
  return {
    kinds: store.kinds.filter((k) => k.key !== key),
    dreams: store.dreams.map((d) => (d.kind !== key ? d : { ...d, kind: to ?? '', months: Array.isArray(d.months) && d.months.length ? d.months : [...(gone.months ?? [])] })),
  };
}

/** The kind a title suggests (the first Standard match that is still in your kinds), else 'other' or ''. */
export function guessKind(text = '', kinds = KINDS) {
  const have = new Set(kinds.map((k) => k.key));
  const hit = KINDS.find((k) => k.words && have.has(k.key) && k.words.test(String(text)));
  return hit?.key ?? (have.has('other') ? 'other' : '');
}

const monthOf = (day) => (day && /^\d{4}-\d{2}/.test(day) ? Number(day.slice(5, 7)) : null);

/** The months a dream fits: its own months, a race's month, else the suggestion of its kind. */
export function monthsOf(d, kinds = KINDS) {
  if (Array.isArray(d?.months) && d.months.length) return [...new Set(d.months.filter((m) => m >= 1 && m <= 12))].sort((a, b) => a - b);
  if (d?.raceDate) return [monthOf(d.raceDate)];
  return [...(kinds.find((k) => k.key === d?.kind)?.months ?? KIND.other.months)].sort((a, b) => a - b);
}

/** Are the months the suggestion (true) or chosen by you (false)? */
export const suggested = (d) => !(Array.isArray(d?.months) && d.months.length) && !d?.raceDate;

/** A month switched on or off for a dream; the first change starts from the suggestion. Never empty. */
export function toggleMonth(d, m, kinds = KINDS) {
  const now = monthsOf(d, kinds);
  const next = now.includes(m) ? now.filter((x) => x !== m) : [...now, m].sort((a, b) => a - b);
  return { ...d, months: next.length ? next : now };
}

/** Back to the suggestion of the kind. */
export const resetMonths = (d) => {
  const { months, ...rest } = d;
  return rest;
};

/** A new dream from a title (kind guessed, months suggested). */
export function newDream({ title, kind = null, days = 2, note = '', url = '' }, { id, now = new Date().toISOString(), kinds = KINDS } = {}) {
  const t = String(title ?? '').trim();
  return { id, title: t, kind: kind ?? guessKind(t, kinds), days: Math.max(1, Math.min(60, Number(days) || 1)), note: note.trim(), url: url.trim(), at: now };
}

/**
 * The year band: for each month 1..12 the dreams that fit then, in the dreams' own order.
 * → [{ month, dreams: [dream] }]
 */
export function yearBand(dreams = [], kinds = KINDS) {
  return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, dreams: dreams.filter((d) => !d.tripId && monthsOf(d, kinds).includes(i + 1)) }));
}

/**
 * When a dream fits next, from today: { ym: 'YYYY-MM', now: true when this month fits } or null.
 * A race: its own date (null once it is past).
 */
export function nextWindow(d, today, kinds = KINDS) {
  if (d?.raceDate) return d.raceDate >= today ? { ym: d.raceDate.slice(0, 7), now: d.raceDate.slice(0, 7) === today.slice(0, 7) } : null;
  const ms = monthsOf(d, kinds);
  if (!ms.length) return null;
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  for (let i = 0; i < 12; i++) {
    if (ms.includes(m)) return { ym: `${y}-${String(m).padStart(2, '0')}`, now: i === 0 };
    m++;
    if (m > 12) ((m = 1), y++);
  }
  return null;
}

/** A start date to suggest for the trip draft: the race day, else the first Saturday of the next window after today. */
export function suggestStart(d, today, kinds = KINDS) {
  if (d?.raceDate) return d.raceDate >= today ? d.raceDate : '';
  const w = nextWindow(d, today, kinds);
  if (!w) return '';
  const first = new Date(`${w.ym}-01T12:00:00Z`);
  const sat = new Date(first);
  sat.setUTCDate(1 + ((6 - first.getUTCDay() + 7) % 7));
  let day = sat.toISOString().slice(0, 10);
  while (day <= today) {
    sat.setUTCDate(sat.getUTCDate() + 7);
    day = sat.toISOString().slice(0, 10);
  }
  return day;
}

/** Days from today to a day (negative: past), calendar days. */
export function daysUntil(day, today) {
  if (!day || !today) return null;
  return Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);
}

/** The dreams in their order with the open ones first (a dream that became a trip goes to the end). */
export const dreamList = (dreams = []) => [...dreams.filter((d) => !d.tripId), ...dreams.filter((d) => d.tripId)];

/** Move a dream from place `from` to `to` (places in dreamList order). */
export function moveDream(dreams, from, to) {
  const list = dreamList(dreams);
  if (from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [d] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, d);
  return next;
}

/* ---------- races (#1008) ---------- */

/** Words that mark a calendar event as a race (3b). */
export const RACE_WORDS = /\b(rennen|race|radrennen|marathon|gran ?fondo|granfondo|brevet|ultra|rad-?marathon|criterium|zeitfahren|bikerace)\b/i;

/**
 * The races you could plan, upcoming, earliest first, without the ones that already have a trip:
 * from Inspiration (rigLinks with kind 'race' and a date) and from the Google calendar (gEvents whose
 * title has a race word). → [{ key, source: 'inspo'|'calendar', ref, title, raceDate, raceEnd, url }]
 */
export function plannableRaces({ links = [], events = [], trips = [] } = {}, today = '') {
  const used = new Set([
    ...trips.filter((t) => t.event?.source && t.event?.ref).map((t) => `${t.event.source}:${t.event.ref}`),
  ]);
  const out = [];
  for (const l of links) {
    if (l?.kind !== 'race' || !l.raceDate || l.raceDate < today) continue;
    out.push({ key: `inspo:${l.id}`, source: 'inspo', ref: l.id, title: l.title || l.url || '', raceDate: l.raceDate, raceEnd: l.raceEnd ?? null, url: l.url ?? '' });
  }
  const seenCal = new Set();
  for (const e of events) {
    if (!e?.title || !RACE_WORDS.test(e.title) || !e.day || e.day < today || seenCal.has(e.gid ?? e.id)) continue;
    seenCal.add(e.gid ?? e.id);
    out.push({ key: `calendar:${e.gid ?? e.id}`, source: 'calendar', ref: e.gid ?? e.id, title: e.title, raceDate: e.day, raceEnd: e.lastDay && e.lastDay !== e.day ? e.lastDay : null, url: e.link ?? '' });
  }
  return out.filter((r) => !used.has(r.key)).sort((a, b) => a.raceDate.localeCompare(b.raceDate));
}

/** The days of a race (1 when it has no end). */
export const raceDays = (r) => (r?.raceEnd ? Math.max(1, (daysUntil(r.raceEnd, r.raceDate) ?? 0) + 1) : 1);

/**
 * The event of a race trip: { name, source, ref, signupBy, url } (stored as trip.event). The trip itself
 * comes from newTrip (trips.js) with the race block switched on (trip.sets.race).
 */
export function raceEvent(r, { signupBy = '' } = {}) {
  return { name: r.title, source: r.source, ref: r.ref, signupBy: signupBy || null, url: r.url || '' };
}

/**
 * Registration deadlines to show: trips with an event whose deadline is today or later, earliest first.
 * → [{ tripId, title, signupBy, days }]
 */
export function deadlines(trips = [], today = '') {
  return trips
    .filter((t) => t.event?.signupBy && t.event.signupBy >= today && !t.event.signedUp)
    .map((t) => ({ tripId: t.id, title: t.title, signupBy: t.event.signupBy, days: daysUntil(t.event.signupBy, today) }))
    .sort((a, b) => a.signupBy.localeCompare(b.signupBy));
}
