/**
 * v0.48.0 «Eingang» (Noah, «Eingang, Notizen, Ablage, Pflege pro Teil», 1-20 a):
 * - the page is «Eingang»: newest on top, grouped by day, the open entries and the ones filed today
 *   in one list (1a, 2a); a filed entry stays faint with a chip naming its target until midnight,
 *   after that only under «Abgelegt», which has a search (3a, 5a);
 * - «Ablegen als …» has 7 targets (6a); a receipt asks for bike, shop, date and amount, the work done
 *   is optional (7a), and becomes a workshop visit with the photo.
 * - Text recognition from the photo (8a) is not built: no cheap on-device OCR in the browser yet
 *   (see docs/decisions.md, TODO).
 * A note: { id, at, text, photo, page, tripId, bikeId, status: 'open' | 'sorted' | 'kept', to, sortedAt }.
 * to = { kind, label, ref, bikeId?, chf?, shop? }. A note kept («Einfach behalten») stays the same
 * record with status 'kept' (the Notes page); its to.kind is 'keep'.
 * Pure functions; the page writes the records.
 */
import { localDay } from './localday.js';
import { guessKind } from './notes.js';
import { newVisit } from './hubs.js';

/** The 7 targets of «Ablegen als …», in this order (English keys for t()). */
export const TARGETS = [
  { key: 'receipt', name: 'Receipt|target', where: 'Workshop visit with photo', place: 'Bikes › Workshop & receipts' },
  { key: 'problem', name: 'Problem on a bike', where: 'Open work in the bike care', place: 'Bike › Care › Problems' },
  { key: 'material', name: 'Gear|target', where: 'New item in Gear, with photo', place: 'Gear' },
  { key: 'wish', name: 'Wishlist', where: 'Gear › Wishlist', place: 'Gear › Wishlist' },
  { key: 'idea', name: 'Idea', where: 'Bike › What would be great, or a note', place: 'Bike › Ideas' },
  { key: 'tour', name: 'Trip note', where: 'Into the debrief of a trip', place: 'Trip › Debrief' },
  { key: 'keep', name: 'Just keep', where: 'Becomes a note in «Notes», topic to choose', place: 'Notes' },
];
export const TARGET = Object.fromEntries(TARGETS.map((x) => [x.key, x]));

const RECEIPT = /\b(rechnung|quittung|beleg|receipt|invoice|kassenzettel|chf\s*\d|\d+[.,]\d{2}\s*(chf|fr))/i;
const IDEA = /\b(idee|idea|wäre|waere|geil|vielleicht|maybe|könnte|koennte|später)\b/i;
const PLACE = /(^|[^\p{L}])(café|cafe|beiz|restaurant|aussicht|view|route|pass|camping|brunnen|see)(?![\p{L}])/iu;

/** The target the app suggests for an entry (the first highlighted row of «Ablegen als …»). */
export function guessTarget(note) {
  const text = note?.text ?? '';
  if (RECEIPT.test(text) || (note?.photo && /foto|photo|bild/i.test(text) && RECEIPT.test(`${text} rechnung`) && /rechnung|beleg|quittung/i.test(text))) return 'receipt';
  const k = guessKind(note ?? { text: '' });
  if (k === 'repair') return 'problem';
  if (k === 'wish') return 'wish';
  if (note?.tripId || PLACE.test(text)) return 'tour';
  if (IDEA.test(text)) return 'idea';
  return 'keep';
}

/** The local day (YYYY-MM-DD) of a stored time. */
export const dayOf = (iso) => (iso ? localDay(new Date(iso)) : '');

/** 'today' | 'yesterday' | 'week' | 'older': the day group of an entry. */
export function dayGroup(iso, today = localDay()) {
  const d = dayOf(iso);
  if (d === today) return 'today';
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / 864e5);
  if (diff === 1) return 'yesterday';
  if (diff < 7) return 'week';
  return 'older';
}
export const GROUP_NAMES = { today: 'Today', yesterday: 'Yesterday', week: 'This week', older: 'Earlier' };

/** Was this entry filed today (it stays faint in the list until midnight)? */
export const filedToday = (note, today = localDay()) => note.status !== 'open' && !!note.to && dayOf(note.sortedAt) === today;
/** An entry that came through the inbox and was filed (not a note written on the Notes page). */
export const isFiled = (note) => note.status !== 'open' && !!note.to;

/**
 * The list of the Eingang page: open entries and the ones filed today, newest first, in day groups.
 * Returns [{ key, name, rows }] for the groups that have rows; rows are notes with filed: boolean.
 */
export function inboxGroups(notes, today = localDay()) {
  const rows = notes
    .filter((n) => n.status === 'open' || filedToday(n, today))
    .map((n) => ({ ...n, filed: n.status !== 'open' }))
    .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  return ['today', 'yesterday', 'week', 'older']
    .map((key) => ({ key, name: GROUP_NAMES[key], rows: rows.filter((n) => dayGroup(n.at, today) === key) }))
    .filter((g) => g.rows.length);
}

/** The filter chips of «Abgelegt»: what each one shows (by to.kind, old kinds included). */
export const FILED_FILTERS = [
  { key: 'all', name: 'All|filed', kinds: null },
  { key: 'receipts', name: 'Receipts', kinds: ['receipt'] },
  { key: 'bikes', name: 'Bikes', kinds: ['problem', 'repair', 'idea'] },
  { key: 'gear', name: 'Gear', kinds: ['material', 'wish'] },
  { key: 'trips', name: 'Trips', kinds: ['tour', 'trip', 'learning'] },
  { key: 'kept', name: 'Kept', kinds: ['keep', 'done'] },
];

/**
 * «Abgelegt»: every filed entry, newest first (by when it was noted), matching the search in the text,
 * the target, the shop, the bike or the amount. names: { bikeId: name } to search bike names.
 */
export function filedRows(notes, { query = '', filter = 'all', names = {} } = {}) {
  const kinds = FILED_FILTERS.find((f) => f.key === filter)?.kinds ?? null;
  const q = query.trim().toLowerCase();
  return notes
    .filter(isFiled)
    .filter((n) => !kinds || kinds.includes(n.to.kind))
    .filter((n) => {
      if (!q) return true;
      const hay = [n.text, n.title, n.to.label, n.to.shop, names[n.to.bikeId ?? n.bikeId], n.to.chf != null ? String(n.to.chf) : '', n.to.chf != null ? n.to.chf.toFixed(2) : ''].filter(Boolean).join(' ').toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    })
    .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
}

/** The shops of earlier visits with how often, most often first: [{ shop, n }]. */
export function shopsOf(visits) {
  const by = {};
  for (const v of visits) if (v.shop) by[v.shop] = (by[v.shop] ?? 0) + 1;
  return Object.entries(by).map(([shop, n]) => ({ shop, n })).sort((a, b) => b.n - a.n || a.shop.localeCompare(b.shop));
}

/** «Rechnungsbeleg Velo shop · 6.10.2026»: the name of a filed receipt. */
export const receiptName = (shop, date) => `${shop || '–'} · ${date ? date.split('-').reverse().map((x) => String(Number(x))).join('.') : ''}`;

/**
 * A receipt filed as a workshop visit (7a): bike, shop, date and amount; jobs optional
 * ([{ part, action }]). The note's photo becomes the receipt photo. km: the bike's km when the
 * visit is today, else unknown. Returns { visit, note }.
 */
export function fileReceipt(note, { bike, shop, date, chf = null, jobs = [] }, { id, now = new Date().toISOString(), today = localDay() }) {
  const visit = {
    ...newVisit({ bikeId: bike.id, date, shop, km: date === today && typeof bike.km === 'number' ? bike.km : null, chf, photo: note.photo ?? null }, { id }),
    parts: jobs.map((j) => ({ part: j.part, action: j.action ?? 'replace', what: j.what ?? '' })),
    source: 'Inbox',
    noteId: note.id,
  };
  const label = receiptName(shop, date);
  return { visit, note: { ...note, status: 'sorted', sortedAt: now, to: { kind: 'receipt', label, ref: id, bikeId: bike.id, shop, chf, made: [['visits', id]] } } };
}

/** The topics of the Notes page (14a): 5 fixed ones; #tags in the text on top. */
export const TOPICS = [
  { key: 'bike', name: 'Bike|topic' },
  { key: 'trips', name: 'Trip ideas' },
  { key: 'gear', name: 'Gear|topic' },
  { key: 'training', name: 'Training' },
  { key: 'general', name: 'General' },
];
const TOPIC_WORDS = {
  bike: /\b(velo|bike|kette|chain|reifen|tyre|bremse|brake|sattel|saddle|druck|pressure|lenker|gabel|fork|schaltung|shift)\w*/i,
  trips: /\b(tour|route|etappe|stage|trip|tage|days|übernacht|camping|zug|train|pass|jura|alpen|alps)\w*/i,
  gear: /\b(material|gear|tasche|bag|isomatte|mat|zelt|tent|jacke|jacket|kaufen|buy|gramm|\d+\s?g\b)\w*/i,
  training: /\b(training|intervall|interval|schwelle|threshold|einfahren|warm-?up|ausfahren|puls|watt|ftp)\w*/i,
};
/** The topic a note's text suggests (the capture field says «Thema wählt sich aus dem Text»). */
export function guessTopic(text = '') {
  for (const [k, re] of Object.entries(TOPIC_WORDS)) if (re.test(text)) return k;
  return 'general';
}

/**
 * The records to write when an entry is filed as one of the targets other than a receipt (6a).
 * opts: { bike, trip, topic, name, category, grams, ids: { task, item, idea }, now }.
 * Returns { note, repair?, item?, idea?: { bikeId, idea }, tripNote? }. The note keeps in to.made
 * what it wrote ([table, id] or ['idea', bikeId, ideaId]), so «Rückgängig» can take it back later.
 */
export function fileNote(note, kind, { bike = null, trip = null, topic = null, name = '', category = 'lux', grams = null, ids = {}, now = new Date().toISOString() } = {}) {
  const out = {};
  const short = note.text.length > 60 ? `${note.text.slice(0, 59)}…` : note.text;
  const bikeId = bike?.id ?? null;
  let to;
  if (kind === 'problem') {
    out.repair = { id: ids.task, area: 'Bike', bikeId, subject: bike?.name ?? '', task: note.text, category: 'Repair', source: 'Inbox', logDate: note.at.slice(0, 10), leadWeeks: null, priority: 'medium', status: 'open', note: '', done: false, photo: note.photo ?? null, noteId: note.id };
    to = { kind, label: 'Bike care', ref: ids.task, bikeId, made: [['maintenance', ids.task]] };
  } else if (kind === 'wish' || kind === 'material') {
    const wish = kind === 'wish';
    out.item = {
      id: ids.item, name: (name || short).trim(), brand: '', model: '', category: wish ? 'lux' : category, weightG: typeof grams === 'number' ? grams : null, qty: 1,
      weightStatus: typeof grams === 'number' ? 'measured' : 'missing', carry: 'luggage', defaultBag: null, ownership: wish ? 'wishlist' : 'owned', role: null, sets: [], kits: [],
      domains: ['bikepacking'], note: `From the inbox (${note.at.slice(0, 10)}): ${note.text}`, updatedAt: now,
    };
    to = { kind, label: wish ? 'Wishlist' : 'Gear', ref: ids.item, made: [['items', ids.item]] };
  } else if (kind === 'idea') {
    out.idea = { bikeId, idea: { id: ids.idea, text: note.text, at: now, done: false, noteId: note.id } };
    to = { kind, label: 'Ideas', ref: ids.idea, bikeId, made: [['idea', bikeId, ids.idea]] };
  } else if (kind === 'tour') {
    out.tripNote = { tripId: trip?.id ?? null, text: note.text, at: note.at };
    to = { kind, label: 'Debrief', ref: trip?.id ?? null, made: [['ride', trip?.id ?? null, note.at]] };
  } else {
    to = { kind: 'keep', label: 'Notes', ref: null, made: [] };
  }
  const status = kind === 'keep' ? 'kept' : 'sorted';
  out.note = { ...note, status, sortedAt: now, to, ...(kind === 'keep' ? { topic: topic ?? guessTopic(note.text) } : {}) };
  return out;
}

/** Where a filed entry lives now (a link), or null when it went nowhere or is gone. */
export function targetHref(to, { visits = [], tasks = [], items = [], trips = [], bikes = [] } = {}) {
  if (!to) return null;
  const enc = encodeURIComponent;
  const kind = to.kind;
  if (kind === 'receipt') return visits.some((v) => v.id === to.ref) ? `#/bikes?tab=shop&bike=${enc(to.bikeId ?? '')}&visit=${enc(to.ref)}` : null;
  if (kind === 'problem' || kind === 'repair') {
    const rec = tasks.find((x) => x.id === to.ref);
    if (!rec) return null;
    return rec.bikeId ? `#/bikes?tab=care&bike=${enc(rec.bikeId)}&open=1` : '#/bikes?tab=care';
  }
  if (kind === 'wish' || kind === 'material') return items.some((i) => i.id === to.ref) ? `#/gear?item=${enc(to.ref)}` : null;
  if (kind === 'idea') return bikes.some((b) => b.id === to.bikeId) ? `#/bikes?bike=${enc(to.bikeId)}` : null;
  if (kind === 'learning') return '#/debrief/learnings';
  if (kind === 'tour' || kind === 'trip') return trips.some((tr) => tr.id === to.ref) ? `#/debrief/${enc(to.ref)}` : null;
  if (kind === 'keep') return '#/notes';
  return null;
}
