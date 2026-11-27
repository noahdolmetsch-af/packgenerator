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
 *   source  'user' (Noah wrote it), 'auto' (the silent error reporter of the device wrote it) or 'test' (a «Works» of the test round); count: how often the same automatic error came
 *   release the release an entry is about, { version, pr, title }: a «Does not work» or «Works» of the test round («Was ist neu»), else null
 *   state   'open' | 'draft' (a draft was made) | 'done' | 'noted'
 */

import { DEFAULT_KINDS, groupList, artList, routeOfArt, groupOfArt } from './kinds.js';

/**
 * The kinds in their groups, the order of the window. L5 (Noah 22.11.2026): the user can rename and order them (kinds.js), so
 * every function below takes the user's list as `cfg` and uses the first version when none is given.
 */
export const GROUPS = groupList(DEFAULT_KINDS);
export const ARTS = artList(DEFAULT_KINDS);

/** Noah's rule (21.11.2026 «3a»): small things go straight into one small change; the rest gets a picture first (kinds.js standardRoute). */
export const routeOf = (art, cfg = DEFAULT_KINDS) => routeOfArt(art, cfg);
export const groupOf = (art, cfg = DEFAULT_KINDS) => groupOfArt(art, cfg);

export const STATES = ['open', 'draft', 'done', 'noted'];
export const URGENT = ['now', 'later'];

const clean = (s, max) => String(s ?? '').trim().slice(0, max);

/** The release an entry is about: { version, pr, title } or null (no version, no release). */
export function cleanRelease(r) {
  const version = clean(r?.version, 20);
  if (!version) return null;
  const pr = Number.isInteger(Number(r?.pr)) && Number(r.pr) > 0 ? Number(r.pr) : null;
  return { version, pr, title: clean(r?.title, 120) };
}

/**
 * A new entry from what the window collected. Returns null without a valid kind or without a text.
 * `now` is a Date (the day is the local calendar day of the device, never a UTC cut).
 */
export function makeEntry({ art, urgent, text, page, pageTitle = '', block, device, width, now = new Date(), id, photo = null, photoNote = null, source = 'user', release = null, cfg = DEFAULT_KINDS }) {
  if (!artList(cfg).includes(art) && !(source !== 'user' && art === '')) return null; // '' = without a kind: only what the app notes itself, when «Error» is gone
  const body = clean(text, 1000);
  if (!body) return null;
  const route = art === '' ? 'direct' : routeOf(art, cfg);
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return {
    id: id ?? `lb-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    art,
    urgent: route === 'note' ? null : URGENT.includes(urgent) ? urgent : 'later',
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
    source: source === 'auto' ? 'auto' : source === 'test' ? 'test' : 'user',
    release: cleanRelease(release),
    count: 1,
  };
}

/** A change of an entry (kind, text, urgency, place, state): keeps what must stay (id, time, photo) and the rules. */
export function changeEntry(entry, patch = {}, cfg = DEFAULT_KINDS) {
  const art = patch.art && artList(cfg).includes(patch.art) ? patch.art : entry.art;
  const route = art === '' ? entry.route ?? 'draft' : routeOf(art, cfg); // without a kind (its kind was deleted): the way it had stays
  const text = patch.text === undefined ? entry.text : clean(patch.text, 1000);
  const out = {
    ...entry,
    art,
    route,
    text: text || entry.text,
    urgent: route === 'note' ? null : URGENT.includes(patch.urgent) ? patch.urgent : entry.urgent ?? 'later',
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
export function filterEntries(list, group = 'all', cfg = DEFAULT_KINDS) {
  return sortEntries(group && group !== 'all' ? list.filter((e) => groupOf(e.art, cfg) === group) : list);
}

/** The numbers of the chips and the headline: { all, open, now, wrong, clear, build, new }. */
export function counts(list, cfg = DEFAULT_KINDS) {
  const out = { all: list.length, open: list.filter(isOpen).length, now: list.filter((e) => isOpen(e) && e.urgent === 'now').length };
  for (const g of cfg.groups) out[g.key] = list.filter((e) => groupOf(e.art, cfg) === g.key).length;
  return out;
}

/** The device of this browser: a narrow screen is a phone (the same border the app uses for its phone layout). */
export const deviceOf = (width) => (Number(width) >= 900 ? 'computer' : 'phone');

/**
 * The entries of a kind that is deleted (L5, Noah 22.11.2026 «3a»): they go to another kind (`to`) or stay without a kind (''), never deleted.
 * cfg: the list AFTER the delete (the new kind must be in it). Returns only the entries that change.
 */
export function reassignEntries(list, from, to, cfg) {
  return list.filter((e) => e.art === from).map((e) => (to ? changeEntry(e, { art: to }, cfg) : { ...e, art: '' }));
}
