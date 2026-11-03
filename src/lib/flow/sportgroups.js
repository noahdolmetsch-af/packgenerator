/**
 * «Meine Sportarten» Gruppen, Suche, Filter (Noah 02.11.2026 «3a»): the person's own groups of sports (Kraft,
 * Erholung, Alltag …). A group is {id, name, collapsed?} in the setting `flow.sportGroups` (the order of the list is
 * the order on the page); an activity belongs to one by `act.group` (none: «Ohne Gruppe»). Nothing here changes the
 * order of «Tick off today». Pure, tested in tests/sportgroups.test.js.
 */
export const GROUPS_KEY = 'flow.sportGroups';

const clean = (name) => String(name ?? '').trim().slice(0, 40);

/** A new group at the end; an empty name adds nothing. */
export function addGroup(groups = [], name, id = `sg-${Date.now().toString(36)}`) {
  const n = clean(name);
  return n ? [...groups, { id, name: n }] : groups;
}

export const renameGroup = (groups = [], id, name) => (clean(name) ? groups.map((g) => (g.id === id ? { ...g, name: clean(name) } : g)) : groups);

export const toggleCollapsed = (groups = [], id) => groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g));

/** One place up (-1) or down (+1). */
export function moveGroup(groups = [], id, dir) {
  const i = groups.findIndex((g) => g.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= groups.length) return groups;
  const out = [...groups];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export const removeGroup = (groups = [], id) => groups.filter((g) => g.id !== id);

/** The activities of one group (null: no group; an unknown group id counts as none). */
export const inGroup = (acts = [], groups = [], id = null) => {
  const known = new Set(groups.map((g) => g.id));
  return acts.filter((a) => (id === null ? !a.group || !known.has(a.group) : a.group === id));
};

/** The page's sections: every group in order, then the sports without a group (only when groups exist). */
export function sections(acts = [], groups = []) {
  if (!groups.length) return [{ group: null, acts }];
  const out = groups.map((g) => ({ group: g, acts: inGroup(acts, groups, g.id) }));
  const rest = inGroup(acts, groups, null);
  return rest.length ? [...out, { group: null, acts: rest }] : out;
}

/** Search by name and the filter «open today»; stateOf(id) gives the state with `open`. */
export function filterActs(acts = [], { q = '', open = false } = {}, nameOf = (a) => a.name, stateOf = () => null) {
  const needle = String(q).trim().toLowerCase();
  return acts.filter((a) => (!needle || String(nameOf(a)).toLowerCase().includes(needle)) && (!open || !!stateOf(a.id)?.open));
}
