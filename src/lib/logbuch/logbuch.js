/**
 * «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): what Noah notices in the app, kept in the app itself.
 * Thirteen kinds in four groups, an urgency, the place (page and block), the device and later a photo.
 * Pure: no database, no texts (the page puts the words in through t()); tested in tests/logbuch.test.js.
 *
 * An entry: { id, art, urgent, text, page, block, route, device, width, at, day, state, photo }
 *   art     a key of ARTS; urgent 'now' | 'later' | null («Gut so» has none)
 *   page    where it was noticed: the address of the page (#/flow/training) or ''; block: the name of the block or ''
 *   route   what happens with it: 'direct' (a small change, one PR with before and after), 'draft' (first a picture of
 *           how it would look, then the change), 'note' (only a note, nothing changes); decided by the kind (routeOf)
 *   source  'user' (Noah wrote it) or 'auto' (the silent error reporter of the device wrote it); count: how often the same automatic error came
 *   state   'open' | 'draft' (a draft was made) | 'done' | 'noted'
 */

/** The kinds in their groups, the order of the window. */
export const GROUPS = [
  { key: 'wrong', arts: ['fehler', 'zahl', 'langsam'] },
  { key: 'clear', arts: ['text', 'erklaerung', 'hinweis', 'finde'] },
  { key: 'build', arts: ['anordnung', 'layout', 'bedienung', 'wegdamit'] },
  { key: 'new', arts: ['idee', 'gutso'] },
];
export const ARTS = GROUPS.flatMap((g) => g.arts);

/** Noah's rule (21.11.2026 «3a»): small things go straight into one small change; the rest gets a picture first. */
const DIRECT = ['fehler', 'zahl', 'langsam', 'text', 'erklaerung', 'hinweis'];
export const routeOf = (art) => (art === 'gutso' ? 'note' : DIRECT.includes(art) ? 'direct' : 'draft');
export const groupOf = (art) => GROUPS.find((g) => g.arts.includes(art))?.key ?? null;

export const STATES = ['open', 'draft', 'done', 'noted'];
export const URGENT = ['now', 'later'];

const clean = (s, max) => String(s ?? '').trim().slice(0, max);

/**
 * A new entry from what the window collected. Returns null without a valid kind or without a text.
 * `now` is a Date (the day is the local calendar day of the device, never a UTC cut).
 */
export function makeEntry({ art, urgent, text, page, pageTitle = '', block, device, width, now = new Date(), id, photo = null, photoNote = null, source = 'user' }) {
  if (!ARTS.includes(art)) return null;
  const body = clean(text, 1000);
  if (!body) return null;
  const route = routeOf(art);
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return {
    id: id ?? `lb-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    art,
    urgent: art === 'gutso' ? null : URGENT.includes(urgent) ? urgent : 'later',
    text: body,
    page: clean(page, 200),
    pageTitle: clean(pageTitle, 80), // the shown title of the page («Training»), set by the button «Verbessern»
    block: clean(block, 80),
    route,
    device: device === 'computer' ? 'computer' : 'phone',
    width: Number.isFinite(Number(width)) ? Math.round(Number(width)) : null,
    at: now.toISOString(),
    day,
    state: route === 'note' ? 'noted' : 'open',
    photo,
    photoNote: photo ? null : photoNote === 'cap' || photoNote === 'failed' ? photoNote : null, // why there is no photo: 'failed' or 'cap' (the memory for photos is full)
    source: source === 'auto' ? 'auto' : 'user',
    count: 1,
  };
}

/** A change of an entry (kind, text, urgency, place, state): keeps what must stay (id, time, photo) and the rules. */
export function changeEntry(entry, patch = {}) {
  const art = patch.art && ARTS.includes(patch.art) ? patch.art : entry.art;
  const route = routeOf(art);
  const text = patch.text === undefined ? entry.text : clean(patch.text, 1000);
  const out = {
    ...entry,
    art,
    route,
    text: text || entry.text,
    urgent: art === 'gutso' ? null : URGENT.includes(patch.urgent) ? patch.urgent : entry.urgent ?? 'later',
    page: patch.page === undefined ? entry.page : clean(patch.page, 200),
    block: patch.block === undefined ? entry.block : clean(patch.block, 80),
  };
  const state = patch.state && STATES.includes(patch.state) ? patch.state : entry.state;
  // «Gut so» is only a note; a note that becomes a kind with a change starts open again
  out.state = route === 'note' ? 'noted' : state === 'noted' ? 'open' : state;
  return out;
}

/** Open means: waiting for a change (open or a draft was made). */
export const isOpen = (e) => e.state === 'open' || e.state === 'draft';

/** Most urgent first, then the newest. */
export function sortEntries(list) {
  const rank = (e) => (e.urgent === 'now' ? 0 : 1);
  return [...list].sort((a, b) => (isOpen(b) - isOpen(a)) || rank(a) - rank(b) || String(b.at).localeCompare(String(a.at)));
}

/** The entries of a group ('' or 'all' = every entry), sorted. */
export function filterEntries(list, group = 'all') {
  return sortEntries(group && group !== 'all' ? list.filter((e) => groupOf(e.art) === group) : list);
}

/** The numbers of the chips and the headline: { all, open, now, wrong, clear, build, new }. */
export function counts(list) {
  const out = { all: list.length, open: list.filter(isOpen).length, now: list.filter((e) => isOpen(e) && e.urgent === 'now').length };
  for (const g of GROUPS) out[g.key] = list.filter((e) => groupOf(e.art) === g.key).length;
  return out;
}

/** The device of this browser: a narrow screen is a phone (the same border the app uses for its phone layout). */
export const deviceOf = (width) => (Number(width) >= 900 ? 'computer' : 'phone');
