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
  { id: 'trip', area: 'trips', label: 'Next trip', icon: 'bag', sizes: ['long'], size: 'long', pitch: 'Your next trip with its step, the countdown and a photo.' },
  { id: 'important', area: 'today', label: 'Important today', icon: 'alert', sizes: ['w', 'l', 'long'], size: 'l', pitch: 'What is due today: a bike job, the backup, a debrief.' },
  { id: 'flow', area: 'flow', label: 'In the flow', icon: 'flow', sizes: ['l', 'long'], size: 'l', pitch: 'Tick off today, your rings and the daily check.' },
  { id: 'series', area: 'flow', label: 'Series and milestones', icon: 'flame', sizes: ['w', 'l'], size: 'w', since: '0.94.0', pitch: 'Weeks in a row with anything: a ride, a trip, meditation, yoga …' },
  { id: 'news', area: 'app', label: 'New in the app', icon: 'sparkles', sizes: ['s', 'w'], size: 'w', since: '0.94.0', pitch: 'What the last update brought, with «Try it».' },
  { id: 'meditation', area: 'flow', label: 'Meditation', icon: 'lotus', sizes: ['s', 'w'], size: 's', since: '0.94.0', pitch: 'Start a meditation like last time, in one tap.' },
  { id: 'play', area: 'app', label: 'Playground', icon: 'flask', sizes: ['s', 'w'], size: 's', since: '0.88.0', pitch: 'Try everything with made-up data; afterwards all is as before.' },
  ...FUNCTIONS.map((f) => ({ id: `fn:${f.id}`, fn: f.id, area: FN_AREA[f.id] ?? 'app', label: f.label, icon: f.icon, sizes: ['s', 'w'], size: 's', pitch: f.pitch })),
  { id: 'check', area: 'flow', label: 'Daily check', icon: 'sun', sizes: ['s', 'w'], size: 's', pitch: 'Four short questions about your day, one tap each.' },
  { id: 'milestones', area: 'flow', label: 'Milestones', icon: 'star', sizes: ['s', 'w'], size: 's', pitch: 'All milestones of all areas on one page.' },
  { id: 'try', area: 'app', label: 'Tried it yet?', icon: 'bulb', sizes: ['w', 'l'], size: 'w', pitch: 'One function you have not used yet, with one button.' },
  { id: 'bikes', area: 'bikes', label: 'Bikes|place', icon: 'bike', sizes: ['l', 'long'], size: 'long', pitch: 'Your bikes with their km and what is due.' },
  { id: 'year', area: 'trips', label: 'Last 12 months', icon: 'chart', sizes: ['long'], size: 'long', pitch: 'Km, trips and nights of the last 12 months in one row.' },
  { id: 'helper', area: 'app', label: 'Helper', icon: 'chat', sizes: ['s'], size: 's', pitch: 'Ask the helper about a list or a trip.' },
  { id: 'features', area: 'app', label: 'What the app can do', icon: 'info', sizes: ['s', 'w'], size: 's', pitch: 'Everything the app can do, and what is new.' },
  { id: 'inbox', area: 'today', label: 'Inbox', icon: 'inbox', sizes: ['s'], size: 's', pitch: 'Notes from on the way, to sort.' },
  { id: 'data', area: 'app', label: 'Data and backup', icon: 'data', sizes: ['s', 'w'], size: 's', pitch: 'Backup, restore and import (lives under Me).' },
];
export const TILE = Object.fromEntries(TILES.map((x) => [x.id, x]));

/** The ready wall (mockup A, Noah 3a): the trip, what is important, Im Flow, the series, the news, then the buttons. */
export const READY = [
  ['trip', 'long'],
  ['important', 'l'],
  ['flow', 'l'],
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
    return value.tiles.filter((x) => x && TILE[x.id] && !seen.has(x.id) && seen.add(x.id)).map((x) => ({ id: x.id, size: sizeFor(x.id, x.size) }));
  }
  const off = new Set((Array.isArray(legacy?.off) ? legacy.off : []).flatMap((k) => FROM_SECTION[k] ?? []));
  return READY.filter((x) => !off.has(x.id)).map((x) => ({ ...x }));
}
/** The record to store. */
export const wallRecord = (tiles) => ({ v: 1, tiles: tiles.map((x) => ({ id: x.id, size: sizeFor(x.id, x.size) })) });

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
export function catalog(query = '', tr = (s) => s) {
  const q = query.trim().toLowerCase();
  const hit = (x) => !q || `${tr(x.label)} ${tr(x.pitch ?? '')}`.toLowerCase().includes(q);
  return AREAS.map((a) => ({ ...a, tiles: TILES.filter((x) => x.area === a.key && hit(x)) })).filter((a) => a.tiles.length);
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
