/**
 * «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «1a 2a 3a 4a 5a»): the kinds and their groups are a list the user can change.
 * Stored as ONE setting `logbuch.kinds` (in the backup, never in the device sync, see db.js syncLocal):
 *   { groups: [{ key, name, arts: [{ key, name, route }] }] }
 * name: null = the built-in word (it goes through t()); a text = what the user typed (never through t()).
 * route: null = the standard way of the kind ('direct' | 'draft' | 'note'); a text = chosen by the user.
 * The order of the lists is the order of the window. No setting stored = the 13 kinds in 4 groups of the first version.
 * Pure: no database, no texts. Tested in tests/logbuch-kinds.test.js.
 */

export const KINDS_KEY = 'logbuch.kinds';
export const ROUTES = ['direct', 'draft', 'note'];
export const NAME_MAX = 40;

/** The first version: thirteen kinds in four groups. */
const STANDARD = [
  { key: 'wrong', arts: ['fehler', 'zahl', 'langsam'] },
  { key: 'clear', arts: ['text', 'erklaerung', 'hinweis', 'finde'] },
  { key: 'build', arts: ['anordnung', 'layout', 'bedienung', 'wegdamit'] },
  { key: 'new', arts: ['idee', 'gutso'] },
];
/** Noah's rule (21.11.2026 «3a»): small things go straight into one small change; the rest gets a picture first; «Gut so» is a note. */
const DIRECT = ['fehler', 'zahl', 'langsam', 'text', 'erklaerung', 'hinweis'];
export const standardRoute = (art) => (art === 'gutso' ? 'note' : DIRECT.includes(art) ? 'direct' : 'draft');
export const STANDARD_ARTS = STANDARD.flatMap((g) => g.arts);

export const DEFAULT_KINDS = Object.freeze({
  groups: STANDARD.map((g) => ({ key: g.key, name: null, arts: g.arts.map((a) => ({ key: a, name: null, route: null })) })),
});

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const cleanName = (s) => {
  const v = String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return v || null;
};

/** A stored value made safe: unknown shapes give the first version, doubled or odd keys are dropped. */
export function normalizeKinds(value) {
  if (!value || !Array.isArray(value.groups)) return DEFAULT_KINDS;
  const seen = new Set();
  const groups = [];
  for (const g of value.groups) {
    if (!g || typeof g.key !== 'string' || !KEY_RE.test(g.key) || seen.has(`g:${g.key}`)) continue;
    seen.add(`g:${g.key}`);
    const arts = [];
    for (const a of Array.isArray(g.arts) ? g.arts : []) {
      if (!a || typeof a.key !== 'string' || !KEY_RE.test(a.key) || seen.has(`a:${a.key}`)) continue;
      seen.add(`a:${a.key}`);
      arts.push({ key: a.key, name: cleanName(a.name), route: ROUTES.includes(a.route) ? a.route : null });
    }
    groups.push({ key: g.key, name: cleanName(g.name), arts });
  }
  return { groups };
}

/** The groups with their kind keys: [{ key, arts: ['fehler', …] }], the shape the window and the filter use. */
export const groupList = (cfg = DEFAULT_KINDS) => cfg.groups.map((g) => ({ key: g.key, arts: g.arts.map((a) => a.key) }));
export const artList = (cfg = DEFAULT_KINDS) => cfg.groups.flatMap((g) => g.arts.map((a) => a.key));
const findArt = (cfg, key) => cfg.groups.flatMap((g) => g.arts).find((a) => a.key === key) ?? null;

/** The way of a kind: the one the user chose, else its standard way; a kind of the user without a way is 'draft' (L5 4a). */
export const routeOfArt = (art, cfg = DEFAULT_KINDS) => findArt(cfg, art)?.route ?? standardRoute(art);
export const groupOfArt = (art, cfg = DEFAULT_KINDS) => cfg.groups.find((g) => g.arts.some((a) => a.key === art))?.key ?? null;
/** The name the user typed, or null (then the built-in word is shown). */
export const artName = (cfg, key) => findArt(cfg, key)?.name ?? null;
export const groupName = (cfg, key) => cfg.groups.find((g) => g.key === key)?.name ?? null;
export const hasArt = (cfg, key) => !!findArt(cfg, key);
export const hasGroup = (cfg, key) => cfg.groups.some((g) => g.key === key);
export const isStandard = (cfg) => JSON.stringify(normalizeKinds(cfg)) === JSON.stringify(DEFAULT_KINDS);

/** Rename a kind; an empty name gives the built-in word back. Returns a new config. */
export const renameArt = (cfg, key, name) => ({ groups: cfg.groups.map((g) => ({ ...g, arts: g.arts.map((a) => (a.key === key ? { ...a, name: cleanName(name) } : a)) })) });
export const renameGroup = (cfg, key, name) => ({ groups: cfg.groups.map((g) => (g.key === key ? { ...g, name: cleanName(name) } : g)) });

const shift = (list, from, to) => {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || from >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, x);
  return out;
};
/** Move a kind inside its group (indices as shown). */
export const moveArt = (cfg, groupKey, from, to) => ({ groups: cfg.groups.map((g) => (g.key === groupKey ? { ...g, arts: shift(g.arts, from, to) } : g)) });
/** Move a group (indices as shown). */
export const moveGroup = (cfg, from, to) => ({ groups: shift(cfg.groups, from, to) });

/** The group that takes the kinds of a deleted group when nothing else is chosen («No group»). */
export const NO_GROUP = 'ohne';

/** Delete a kind from the list (its entries are moved by logbuch.js reassignEntries, never deleted). */
export const removeArt = (cfg, key) => ({ groups: cfg.groups.map((g) => ({ ...g, arts: g.arts.filter((a) => a.key !== key) })) });

/**
 * Delete a group; its kinds go to the group `toKey`, or (null) to the group «No group» that is made at the end when it is missing.
 * Nothing is lost: every kind stays in the list. A group that does not exist, or the target equal to the group itself, changes nothing.
 */
export function removeGroup(cfg, key, toKey = null) {
  const g = cfg.groups.find((x) => x.key === key);
  if (!g || toKey === key) return cfg;
  const rest = cfg.groups.filter((x) => x.key !== key);
  if (!g.arts.length) return { groups: rest };
  if (toKey && rest.some((x) => x.key === toKey)) return { groups: rest.map((x) => (x.key === toKey ? { ...x, arts: [...x.arts, ...g.arts] } : x)) };
  if (key === NO_GROUP) return cfg; // the «No group» group cannot send its kinds to itself
  const none = rest.find((x) => x.key === NO_GROUP);
  return none ? { groups: rest.map((x) => (x === none ? { ...x, arts: [...x.arts, ...g.arts] } : x)) } : { groups: [...rest, { key: NO_GROUP, name: null, arts: g.arts }] };
}

const slug = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
/** A new key that no kind and no group uses yet: «my-idea», «my-idea-2», … (the key never changes, the name may). */
function freshKey(cfg, name, prefix) {
  const used = new Set([...cfg.groups.map((g) => g.key), ...cfg.groups.flatMap((g) => g.arts.map((a) => a.key))]);
  const base = `${prefix}-${slug(name) || 'neu'}`;
  let key = base;
  for (let i = 2; used.has(key); i++) key = `${base}-${i}`.slice(0, 40);
  return key;
}

/** A new kind of the user at the end of a group; the way is chosen now (L5 4a), the standard is «draft» (first a picture). Returns { cfg, key } or null without a name or a group. */
export function addArt(cfg, groupKey, name, route = 'draft') {
  const n = cleanName(name);
  if (!n || !hasGroup(cfg, groupKey)) return null;
  const key = freshKey(cfg, n, 'k');
  const way = ROUTES.includes(route) && route !== 'draft' ? route : null;
  return { cfg: { groups: cfg.groups.map((g) => (g.key === groupKey ? { ...g, arts: [...g.arts, { key, name: n, route: way }] } : g)) }, key };
}
/** A new, empty group at the end. Returns { cfg, key } or null without a name. */
export function addGroup(cfg, name) {
  const n = cleanName(name);
  if (!n) return null;
  const key = freshKey(cfg, n, 'g');
  return { cfg: { groups: [...cfg.groups, { key, name: n, arts: [] }] }, key };
}
/** The way of a kind: what the kind had as standard is stored as «nothing», so the first version stays «nothing stored». */
export const setRoute = (cfg, key, route) =>
  !ROUTES.includes(route) ? cfg : { groups: cfg.groups.map((g) => ({ ...g, arts: g.arts.map((a) => (a.key === key ? { ...a, route: route === standardRoute(key) ? null : route } : a)) })) };
