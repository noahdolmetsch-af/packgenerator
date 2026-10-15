/**
 * v0.94.0 «Kachel-Wand» (Noah 11.10.2026, Trello nLi5yNmS «1-5 a», mockups #startseite-kacheln A–D):
 * Today is a wall of small tiles. Every tile can go on the wall, in one of its sizes, anywhere; the
 * wall starts with a ready selection (mockup A) and «Reset» brings it back.
 *
 * Sizes (Noah 1a): s small (1 × 1, one button), w wide (2 × 1, a short list), l large (a list or a
 * week), long (a whole row: the trip, the bikes, the 12 months). A computer has 8 columns, a phone 4.
 * The wall is the settings record «homeWall» = { v: 1, tiles: [{ id, size }] } and goes into every
 * backup (idea 8: the wall travels along). Without it the ready wall shows; the old «homeLayout»
 * (sections switched off) is honoured once, when there is no wall yet.
 * Pure functions, tested in tests/tiles.test.js.
 */
import { FUNCTIONS } from './fnlist.js';
import { WHATS_NEW, compareVersions } from '../whatsnew.js';

export const WALL_KEY = 'homeWall';
export const SIZES = ['s', 'w', 'l', 'long'];
export const SIZE_NAME = { s: 'Small|tile', w: 'Wide|tile', l: 'Large|tile', long: 'Whole row|tile' };

/** The areas of the catalog (mockup C), in their order. */
export const AREAS = [
  { key: 'today', name: 'Today|place' },
  { key: 'trips', name: 'Trips|place' },
  { key: 'gear', name: 'Gear|place' },
  { key: 'bikes', name: 'Bikes|place' },
  { key: 'flow', name: 'Active|place' },
  { key: 'app', name: 'The app' },
];

// where each of the 16 functions belongs in the catalog
const FN_AREA = { dayride: 'trips', trip: 'trips', wear: 'today', weigh: 'gear', care: 'bikes', ride: 'bikes', gear: 'gear', wardrobe: 'gear', templates: 'trips', wish: 'gear', review: 'trips', note: 'today', km: 'bikes', blocks: 'gear', favorites: 'gear', debriefs: 'trips' };

/**
 * Every tile. label: English key for t(); icon: a key of the icon map in Wall.svelte; sizes: the
 * sizes it can take (the first is not special, `size` is the one it starts with); since: the version
 * that brought it (idea 1: a «New» dot for two weeks); fn: one of the 16 functions (a small button).
 */
export const TILES = [
  { id: 'trip', area: 'trips', label: 'Next trip', icon: 'bag', sizes: ['long'], size: 'long', pitch: 'Your next trip with its step and the countdown.' },
  { id: 'important', area: 'today', label: 'Important today', icon: 'alert', sizes: ['w', 'l', 'long'], size: 'l', pitch: 'What is due today: a bike job, the backup, a debrief.' },
  { id: 'flow', area: 'flow', label: 'In the flow', icon: 'flow', sizes: ['l', 'long'], size: 'l', pitch: 'Tick off today, your rings and the daily check.' },
  { id: 'series', area: 'flow', label: 'Series and milestones', icon: 'flame', sizes: ['w', 'l'], size: 'w', since: '0.94.0', pitch: 'Weeks in a row with anything: a ride, a trip, meditation, yoga …' },
  // v0.110.0 Design-Refresh P10 (I11e): also a whole row, as it sits on top for 14 days after an update
  { id: 'news', area: 'app', label: 'New in the app', icon: 'sparkles', sizes: ['s', 'w', 'long'], size: 'w', since: '0.94.0', pitch: 'What the last update brought, with «Try it».' },
  { id: 'meditation', area: 'flow', label: 'Meditation', icon: 'lotus', sizes: ['s', 'w'], size: 's', since: '0.94.0', pitch: 'Start a meditation like last time, in one tap.' },
  { id: 'play', area: 'app', label: 'Playground', icon: 'flask', sizes: ['s', 'w'], size: 's', since: '0.88.0', pitch: 'Try everything with made-up data; afterwards all is as before.' },
  ...FUNCTIONS.map((f) => ({ id: `fn:${f.id}`, fn: f.id, area: FN_AREA[f.id] ?? 'app', label: f.label, icon: f.icon, sizes: ['s', 'w'], size: 's', pitch: f.pitch })),
  { id: 'milestones', area: 'flow', label: 'Milestones', icon: 'star', sizes: ['s', 'w'], size: 's', pitch: 'All milestones of all areas on one page.' },
  { id: 'try', area: 'app', label: 'Tried it yet?', icon: 'bulb', sizes: ['w', 'l'], size: 'w', pitch: 'One function you have not used yet, with one button.' },
  { id: 'bikes', area: 'bikes', label: 'Bikes|place', icon: 'bike', sizes: ['l', 'long'], size: 'long', pitch: 'Your bikes with their km and what is due.' },
  { id: 'year', area: 'trips', label: 'Last 12 months', icon: 'chart', sizes: ['long'], size: 'long', pitch: 'Km, trips and nights of the last 12 months in one row.' },
  { id: 'helper', area: 'app', label: 'Helper', icon: 'chat', sizes: ['s'], size: 's', pitch: 'Ask the helper about a list or a trip.' },
  { id: 'features', area: 'app', label: 'What the app can do', icon: 'info', sizes: ['s', 'w'], size: 's', pitch: 'Everything the app can do, and what is new.' },
  { id: 'inbox', area: 'today', label: 'Inbox', icon: 'inbox', sizes: ['s'], size: 's', pitch: 'Notes from on the way, to sort.' },
  { id: 'data', area: 'app', label: 'Data and backup', icon: 'data', sizes: ['s', 'w'], size: 's', pitch: 'Backup, restore and import (lives under Me).' },
  // v0.101.0 Design-Refresh P2 (H1, Noah «h1-h6 freigeben»): new tiles, marked «neu» for two weeks
  { id: 'week', area: 'flow', label: 'This week', icon: 'flow', sizes: ['l', 'long'], size: 'l', since: '0.101.0', pitch: 'Monday to Sunday: what you did each day, rides and Im Flow.' },
  { id: 'month', area: 'bikes', label: 'Bike this month', icon: 'bike', sizes: ['w', 'l'], size: 'w', since: '0.101.0', pitch: 'The km of this month, against last month.' },
  { id: 'nextms', area: 'flow', label: 'Next milestone', icon: 'star', sizes: ['w', 'l'], size: 'w', since: '0.101.0', pitch: 'How far to the next 1000 km of a bike, or the next number of trips.' },
  // v0.102.0 «Vorschlag und Challenge» (D1b, Noah «d1-d5 freigeben»)
  { id: 'suggest', area: 'today', label: 'Swim or sauna today?', icon: 'sun', sizes: ['w', 'l'], size: 'l', since: '0.102.0', pitch: 'A suggestion for today with alternatives; any of them can become a challenge.' },
  // v0.116.0 «Strava-Verbindung» (S4): the last fetch from Strava; it goes on top of the wall once, when this device connects
  // «Training» TR1 (Noah 13.10.2026 5a): the tile becomes «Letzte Aktivität», the newest activity with its zones
  { id: 'strava', area: 'bikes', label: 'Last activity', icon: 'bike', sizes: ['w', 'l'], size: 'w', since: '0.116.0', pitch: 'Your newest activity from Strava with time, km, Hm, heart rate and zones.' },
  // v0.127.0 «Tages-Check» 2 (mockup T3, Noah «T1–T4 freigegeben»): the balance ring, the morning check, the 15 questions
  { id: 'balance', area: 'flow', label: 'Your balance', icon: 'flow', sizes: ['l', 'long'], size: 'l', since: '0.132.0', pitch: 'Nine areas of your last 7 days in one ring, from the questions and your data.' },
  // WG «Wi gaht's?» takes over the daily check: the tile of its two fixed rounds (the id stays, so a stored wall keeps it)
  { id: 'morningcheck', area: 'flow', label: 'Morning and evening round', icon: 'sun', sizes: ['w', 'l'], size: 'l', since: '0.132.0', pitch: 'The round of «Wi gaht\'s?»: sleep, energy and mood of today and your goal; in the evening your day.' },
  { id: 'yearago', area: 'trips', label: 'A year ago', icon: 'book', sizes: ['w', 'l'], size: 'w', since: '0.101.0', pitch: 'The trip of this time last year, with a line from its debrief.' },
];
/** v0.101.0: the tiles that came with the Design-Refresh; a stored wall of before gets them once. */
export const ADDED_0101 = ['week', 'month', 'nextms', 'yearago'];
/** v0.102.0: the suggestion tile; a stored wall of before gets it once, after Im Flow. */
export const ADDED_0102 = ['suggest'];
/** v0.127.0: the tiles of the daily check; a stored wall of before gets them once, after Im Flow (WG: without «Deine 15 Fragen»). */
export const ADDED_0127 = ['balance', 'morningcheck'];
/**
 * WG «Wi gaht's?» takes over the daily check: the old daily-check tiles (the small «Tagescheck» and
 * «Deine 15 Fragen») are gone; a stored wall that still has them loses them when it is read.
 */
export const GONE = ['check', 'questions'];
export const TILE = Object.fromEntries(TILES.map((x) => [x.id, x]));

/** The ready wall (mockup A, Noah 3a): the trip, what is important, Im Flow, the series, the news, then the buttons. */
export const READY = [
  ['trip', 'long'],
  ['important', 'l'],
  ['flow', 'l'],
  ['balance', 'l'],
  ['morningcheck', 'l'],
  ['suggest', 'l'],
  ['week', 'l'],
  ['month', 'w'],
  ['nextms', 'w'],
  ['yearago', 'w'],
  ['series', 'w'],
  ['news', 'w'],
  ['try', 'l'],
  ['meditation', 's'],
  ['play', 's'],
  ...FUNCTIONS.map((f) => [`fn:${f.id}`, 's']),
  ['bikes', 'long'],
  ['year', 'long'],
].map(([id, size]) => ({ id, size }));

// the old sections (0.46 «Customise the start page») and the tiles they became
const FROM_SECTION = { trip: ['trip'], flow: ['flow'], actions: FUNCTIONS.map((f) => `fn:${f.id}`), today: ['important', 'try'], bikes: ['bikes'], year: ['year'] };

/** A size the tile can take: the asked one, else the tile's own. */
export const sizeFor = (id, size) => (TILE[id]?.sizes.includes(size) ? size : TILE[id]?.size ?? 's');

/**
 * A stored wall made safe: unknown tiles and doubles go, sizes are fixed. Without a stored wall the
 * ready one, minus the sections switched off in the old layout (legacy, e.g. { off: ['year'] }).
 * → [{ id, size }]
 */
export function wallOf(value, legacy = null) {
  if (value && Array.isArray(value.tiles)) {
    const seen = new Set();
    // WG: the old daily-check tiles (GONE) are filtered out like any tile that is no more
    const out = value.tiles.filter((x) => x && TILE[x.id] && !GONE.includes(x.id) && !seen.has(x.id) && seen.add(x.id)).map((x) => ({ id: x.id, size: sizeFor(x.id, x.size) }));
    // v0.101.0 (H1 «neue Bausteine kommen als Kacheln dazu»): a wall stored before gets the new tiles
    // once, after Im Flow (else at the end); taken away later, they stay away (the wall is v 2 then).
    if ((value.v ?? 1) < 2) {
      const add = ADDED_0101.filter((id) => !seen.has(id)).map((id) => ({ id, size: TILE[id].size }));
      const at = out.findIndex((x) => x.id === 'flow');
      out.splice(at < 0 ? out.length : at + 1, 0, ...add);
    }
    // v0.102.0: the suggestion tile once, right after Im Flow (else at the end)
    if ((value.v ?? 1) < 3 && !seen.has('suggest')) {
      const at = out.findIndex((x) => x.id === 'flow');
      out.splice(at < 0 ? out.length : at + 1, 0, { id: 'suggest', size: TILE.suggest.size });
    }
    // v0.127.0 «Tages-Check» 2: the balance and the morning check once, after Im Flow (WG: now the round tile)
    if ((value.v ?? 1) < 4) {
      const add = ADDED_0127.filter((id) => !out.some((x) => x.id === id)).map((id) => ({ id, size: TILE[id].size }));
      const at = out.findIndex((x) => x.id === 'flow');
      out.splice(at < 0 ? out.length : at + 1, 0, ...add);
    }
    return out;
  }
  const off = new Set((Array.isArray(legacy?.off) ? legacy.off : []).flatMap((k) => FROM_SECTION[k] ?? []));
  return READY.filter((x) => !off.has(x.id)).map((x) => ({ ...x }));
}
/** The record to store. */
export const wallRecord = (tiles) => ({ v: 4, tiles: tiles.map((x) => ({ id: x.id, size: sizeFor(x.id, x.size) })) });

/** Move tile `id` to place `to` (0 … n − 1). */
export function moveTile(tiles, id, to) {
  const i = tiles.findIndex((x) => x.id === id);
  if (i < 0) return tiles;
  const out = [...tiles];
  const [x] = out.splice(i, 1);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, x);
  return out;
}
/** One place earlier (dir −1) or later (+1). */
export const stepTile = (tiles, id, dir) => moveTile(tiles, id, tiles.findIndex((x) => x.id === id) + dir);
/** The next size the tile can take (round). */
export function nextSize(id, size) {
  const list = TILE[id]?.sizes ?? ['s'];
  return list[(list.indexOf(size) + 1) % list.length];
}
export const resizeTile = (tiles, id, size) => tiles.map((x) => (x.id === id ? { ...x, size: sizeFor(id, size) } : x));
export const removeTile = (tiles, id) => tiles.filter((x) => x.id !== id);
/** Add a tile at the end (or nothing when it is there already). */
export const addTile = (tiles, id) => (!TILE[id] || tiles.some((x) => x.id === id) ? tiles : [...tiles, { id, size: TILE[id].size }]);

/** The catalog, by area, filtered by a search word (label and pitch, already translated by `tr`). */
export function catalog(query = '', tr = (s) => s, hidden = []) {
  const q = query.trim().toLowerCase();
  const hit = (x) => !q || `${tr(x.label)} ${tr(x.pitch ?? '')}`.toLowerCase().includes(q);
  return AREAS.map((a) => ({ ...a, tiles: TILES.filter((x) => x.area === a.key && hit(x) && !hidden.includes(x.id)) })).filter((a) => a.tiles.length);
}

/**
 * v0.118.0 «KI-Helfer ausblenden» (K4): tiles hidden by a switch (the helper's tile while the AI helper
 * is off) leave the wall that shows, but stay stored. keepHidden puts them back where they stood when
 * the shown wall is saved (moved, resized, a tile added or taken away).
 */
export const HELPER_TILES = ['helper'];
export const hideTiles = (tiles, hidden = []) => (hidden.length ? tiles.filter((x) => !hidden.includes(x.id)) : tiles);
export function keepHidden(next, stored, hidden = []) {
  const out = next.filter((x) => !hidden.includes(x.id));
  stored.forEach((x, i) => {
    if (hidden.includes(x.id)) out.splice(Math.min(i, out.length), 0, x);
  });
  return out;
}

/** Idea 1: a «New» dot for two weeks after the version that brought the tile. */
export const NEW_DAYS = 14;
export function isNew(tile, today, news = WHATS_NEW) {
  if (!tile?.since) return false;
  const e = news.find((x) => compareVersions(x.version, tile.since) === 0);
  if (!e?.date) return false;
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${e.date}T00:00:00Z`)) / 864e5);
  return days >= 0 && days < NEW_DAYS;
}
