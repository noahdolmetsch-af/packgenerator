/**
 * Paket O «Sportarten» (Noah 19.10.2026 12:29 «1b und dein vorschlag 2a und b … 3 a und b»): every sport
 * gets the same basic blocks, and its own ones. One list of all sports (Noah 14.10. «2a»: one sports list):
 *   trip:<key>  a sport of Neue Tour (sportlist.js SPORTS, and the own sports of Ich › Listen › Sportarten)
 *   act:<id>    an activity of Aktiv (flowActs), without «Velo draussen», which counts for Fahrrad
 *
 * The seven basic blocks (#190): Ausrüstung, Packliste, Verlauf und Fortschritt, Ziele, Pflege, Wetter and
 * «Fürs nächste Mal». Each can be switched off, renamed and moved per sport; extra blocks (training plans,
 * lessons, matches, loops, commuting, the route check, checklists) come on for the sports they fit and can
 * be added to any sport; own blocks (a checklist or notes) can be added, renamed and deleted.
 *
 * The settings live in one record (settings key CFG_KEY): { [sportId]: { color, off, order, names, extras,
 * own, goal } }. Pure functions, tested in tests/sportsbase.test.js.
 */
import { SPORTS } from './sportlist.js';

export const CFG_KEY = 'sportsCfg';

/** #121 one colour per sport: twelve calm colours that read on the light paper (names for the screen reader). */
export const COLORS = [
  { hex: '#2f8f7f', name: 'Teal|colour' },
  { hex: '#c98a1e', name: 'Ochre|colour' },
  { hex: '#3f7fbf', name: 'Blue|colour' },
  { hex: '#8c6bb8', name: 'Violet|colour' },
  { hex: '#b8392b', name: 'Red|colour' },
  { hex: '#2f6b4f', name: 'Green|colour' },
  { hex: '#d9792a', name: 'Orange|colour' },
  { hex: '#a0527a', name: 'Plum|colour' },
  { hex: '#5a7d2a', name: 'Olive|colour' },
  { hex: '#4a6f8f', name: 'Slate|colour' },
  { hex: '#8a6a3f', name: 'Brown|colour' },
  { hex: '#c0506a', name: 'Rose|colour' },
];

/** The activity of Aktiv that is the same as the sport Fahrrad: its ticks count there. */
export const BIKE_ACT = 'bike';
/** Indoor activities: the weather block starts switched off (it can be switched on). */
export const INDOOR = new Set(['gym', 'sauna', 'meditation', 'spin', 'yoga', 'stretch', 'pushups', 'hockey']);

/** The icon of a trip sport for ActIcon (flow/ActIcon.svelte). */
const TRIP_ICON = { cycling: 'bike', gravel: 'bike', xc: 'bike', downhill: 'bike', bikepacking: 'bike', ski: 'ski', hiking: 'walk' };

/**
 * All sports in one list. domains: the live areas of domains.js (with the person's names and own sports),
 * acts: the activities of Aktiv. → [{ id, kind: 'trip'|'act', key, name, raw, icon, ring, bike, act? }]
 * name: an English key for t() unless raw (a typed name, never through t()).
 */
export function allSports({ domains = [], acts = [] } = {}) {
  const dom = Object.fromEntries(domains.map((d) => [d.key, d]));
  const out = [];
  for (const s of SPORTS) {
    const d = dom[s.key];
    if (d?.hidden) continue;
    const raw = !!d?.raw && s.key === d.key;
    out.push({ id: `trip:${s.key}`, kind: 'trip', key: s.key, name: raw ? d.name : s.name, raw, icon: TRIP_ICON[s.key] ?? 'heart', ring: 'move', bike: s.area === 'bikepacking' });
  }
  for (const d of domains) {
    if (!d.own || d.hidden) continue;
    out.push({ id: `trip:${d.key}`, kind: 'trip', key: d.key, name: d.name, raw: true, icon: 'heart', ring: 'move', bike: false });
  }
  for (const a of [...acts].sort((x, y) => (x.order ?? 0) - (y.order ?? 0))) {
    if (!a?.id || a.id === BIKE_ACT || a.paused) continue;
    out.push({ id: `act:${a.id}`, kind: 'act', key: a.id, name: a.name, raw: true, icon: a.icon ?? 'heart', ring: a.ring ?? 'move', bike: false, act: a });
  }
  return out;
}

/** The sports in the person's order (cfg._order), the new ones after them in the list's order. */
export function orderedSports(list, cfg = {}) {
  const order = Array.isArray(cfg?._order) ? cfg._order : [];
  const rank = (s) => (order.includes(s.id) ? order.indexOf(s.id) : order.length + list.indexOf(s));
  return [...list].sort((a, b) => rank(a) - rank(b));
}

/** Move a sport one place (dir -1 / +1) or to a place (drag): the new order of ids. */
export function moveId(ids, id, to) {
  const from = ids.indexOf(id);
  if (from < 0) return ids;
  const at = Math.max(0, Math.min(ids.length - 1, to));
  if (at === from) return ids;
  const next = ids.filter((x) => x !== id);
  next.splice(at, 0, id);
  return next;
}

/** The colour of a sport: its own, else one by its place in the list (never two the same while there are colours left). */
export function colorOf(id, list = [], cfg = {}) {
  const own = cfg?.[id]?.color;
  if (own && COLORS.some((c) => c.hex === own)) return own;
  const taken = new Set(list.map((s) => cfg?.[s.id]?.color).filter(Boolean));
  const free = COLORS.filter((c) => !taken.has(c.hex));
  const pool = free.length ? free : COLORS;
  const unset = list.filter((s) => !cfg?.[s.id]?.color).map((s) => s.id);
  const i = Math.max(0, unset.indexOf(id));
  return pool[i % pool.length].hex;
}

/* ---------- blocks ---------- */

/** The seven basic blocks (#190), in their first order. */
export const BASE_BLOCKS = ['gear', 'pack', 'log', 'goals', 'care', 'weather', 'next'];
/** The extra blocks any sport can add. */
export const EXTRAS = ['plans', 'lessons', 'matches', 'loops', 'commute', 'route', 'protect'];
/** Block names (English keys for t()). */
export const BLOCK_NAMES = {
  gear: 'Equipment',
  pack: 'Packing list',
  log: 'History and progress',
  goals: 'Goals',
  care: 'Care',
  weather: 'Weather',
  next: 'For next time',
  plans: 'Training plans',
  lessons: 'Lessons',
  matches: 'Matches',
  loops: 'Loops from home',
  commute: 'Commuting',
  route: 'Water and gravel on the route',
  protect: 'Protection check',
};
/** What each block is for (one line under its name when adding or switching). */
export const BLOCK_HINTS = {
  gear: 'Your main equipment for this sport and its care.',
  pack: 'What comes along: the sport bag or the trip list.',
  log: 'What you did, and your own measures with a curve.',
  goals: 'How often, and how far you are.',
  care: 'What is due: care steps after uses, and the age of material.',
  weather: 'Today and tomorrow at home, with a tip for this sport.',
  next: 'What you want to do differently next time.',
  plans: 'Plans with exercises to tick off.',
  lessons: 'Lessons with notes and drills that worked.',
  matches: 'Matches with the result.',
  loops: 'Your loops from the front door, by the time you have.',
  commute: 'Kilometres to work, by month and year.',
  route: 'Fountains and the gravel share of a planned route.',
  protect: 'Protection and spare parts before a bike park day.',
};
/** The extra blocks a sport has on from the start. */
const START_EXTRAS = {
  'act:gym': ['plans'],
  'act:tennis': ['lessons', 'matches'],
  'trip:cycling': ['commute', 'loops'],
  'trip:gravel': ['route', 'loops'],
  'trip:xc': ['loops'],
  'trip:downhill': ['protect'],
};
export const startExtras = (id) => START_EXTRAS[id] ?? [];

/** The blocks off at the start: the weather for indoor activities. */
export const startOff = (id) => (id.startsWith('act:') && INDOOR.has(id.slice(4)) ? ['weather'] : []);

/** One sport's settings made whole. */
export function sportCfg(cfg = {}, id) {
  const c = cfg?.[id] ?? {};
  return {
    color: typeof c.color === 'string' ? c.color : null,
    off: Array.isArray(c.off) ? c.off : startOff(id),
    order: Array.isArray(c.order) ? c.order : [],
    names: c.names && typeof c.names === 'object' ? c.names : {},
    extras: Array.isArray(c.extras) ? c.extras : startExtras(id),
    own: Array.isArray(c.own) ? c.own.filter((o) => o?.id && typeof o.name === 'string') : [],
    goal: c.goal && Number(c.goal.count) > 0 && Number(c.goal.days) > 0 ? { count: Math.round(c.goal.count), days: Math.round(c.goal.days) } : null,
  };
}

/**
 * The blocks of a sport in its order: [{ key, name, raw, on, own, type }]. type: 'base' | 'extra' | 'check'
 * | 'notes'. name: the typed name (raw) or the English key.
 */
export function blocksOf(id, cfg = {}) {
  const c = sportCfg(cfg, id);
  const keys = [...BASE_BLOCKS, ...EXTRAS.filter((k) => c.extras.includes(k)), ...c.own.map((o) => o.id)];
  const rank = (k) => (c.order.includes(k) ? c.order.indexOf(k) : c.order.length + keys.indexOf(k));
  return keys
    .sort((a, b) => rank(a) - rank(b))
    .map((key) => {
      const own = c.own.find((o) => o.id === key);
      const typed = c.names[key];
      return {
        key,
        name: typed ?? (own ? own.name : BLOCK_NAMES[key]),
        raw: !!typed || !!own,
        on: !c.off.includes(key),
        own: !!own,
        type: own ? (own.type === 'notes' ? 'notes' : 'check') : BASE_BLOCKS.includes(key) ? 'base' : 'extra',
      };
    });
}

/** The changed settings of one sport (patch merged into cfg[id]); returns the whole new cfg. */
export function patchSport(cfg = {}, id, patch) {
  return { ...cfg, [id]: { ...sportCfg(cfg, id), ...patch } };
}

/** Switch a block on or off. */
export const toggleBlock = (cfg, id, key) => {
  const c = sportCfg(cfg, id);
  return patchSport(cfg, id, { off: c.off.includes(key) ? c.off.filter((k) => k !== key) : [...c.off, key] });
};
/** Move a block (dir: -1 up, +1 down, or a place). */
export function moveBlock(cfg, id, key, to) {
  const keys = blocksOf(id, cfg).map((b) => b.key);
  return patchSport(cfg, id, { order: moveId(keys, key, to) });
}
/** Rename a block (an empty name gives back the standard name; own blocks keep their own). */
export function renameBlock(cfg, id, key, name) {
  const c = sportCfg(cfg, id);
  const n = String(name ?? '').trim();
  const own = c.own.find((o) => o.id === key);
  if (own) return patchSport(cfg, id, { own: c.own.map((o) => (o.id === key ? { ...o, name: n || o.name } : o)) });
  const { [key]: _old, ...names } = c.names;
  return patchSport(cfg, id, { names: n ? { ...names, [key]: n } : names });
}
/** Add an extra block. */
export const addExtra = (cfg, id, key) => {
  const c = sportCfg(cfg, id);
  if (!EXTRAS.includes(key) || c.extras.includes(key)) return cfg;
  return patchSport(cfg, id, { extras: [...c.extras, key], off: c.off.filter((k) => k !== key) });
};
/** Take an extra block off the sport (its entries stay in the data and come back with it). */
export const removeExtra = (cfg, id, key) => {
  const c = sportCfg(cfg, id);
  return patchSport(cfg, id, { extras: c.extras.filter((k) => k !== key), order: c.order.filter((k) => k !== key) });
};
/** Add an own block: a checklist or notes. → { cfg, key } */
export function addOwnBlock(cfg, id, { name, type = 'check' }, key = `own-${Date.now().toString(36)}`) {
  const c = sportCfg(cfg, id);
  const n = String(name ?? '').trim();
  if (!n) return { cfg, key: null };
  return { cfg: patchSport(cfg, id, { own: [...c.own, { id: key, name: n, type: type === 'notes' ? 'notes' : 'check' }] }), key };
}
/** Delete an own block (its entries are deleted by the caller, with Undo). */
export function removeOwnBlock(cfg, id, key) {
  const c = sportCfg(cfg, id);
  return patchSport(cfg, id, { own: c.own.filter((o) => o.id !== key), order: c.order.filter((k) => k !== key), off: c.off.filter((k) => k !== key) });
}
/** The extra blocks this sport can still add. */
export const addableExtras = (id, cfg) => EXTRAS.filter((k) => !sportCfg(cfg, id).extras.includes(k));
