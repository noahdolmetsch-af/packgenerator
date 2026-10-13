/**
 * SK «Seiten-Kacheln» (Noah 13.10.2026, «SK1–SK6 freigegeben», «SK7–SKX5 freigegeben»): the row of
 * tiles at the end of a page (Vergangene Touren, Rückblick, Velos, Material, Aktiv; not on Heute).
 * Pure rules, tested in tests/sk.test.js; the page state lives in the settings record `sk.page.<page>`
 * (goes into every backup).
 *
 *   - at most 7 tiles, plus 1 empty «+» tile that opens «Kacheln anpassen» (SK7)
 *   - sorted by use over the last 4 weeks (dated taps, older ones pruned); ties keep the page's order
 *   - a tile moved by hand is pinned at its place (SK7 «festgesteckt»)
 *   - «…» › Ausblenden hides a tile (Undo); «Wieder zeigen» brings it back (SK6)
 *   - a tile with nothing to say disappears by itself, with a quiet line under the tiles (SK7)
 *   - «+» with all 7 places full first asks which tile should go (Noah 13.10.2026, answer 1 b)
 * Everything is a suggestion: «Wie am Anfang» goes back to the page's own tiles.
 */

export const MAX_TILES = 7;
/** Noah 13.10.2026 (answer 4 a): «by use» counts the last 4 weeks only. */
export const USE_DAYS = 28;
/** Taps kept per tile at most (more never change the order within 4 weeks of normal use). */
const USE_CAP = 60;

export const skKey = (page) => `sk.page.${page}`;

/** A fresh page state: no pins, nothing hidden or added, no taps, no own tiles. */
export const emptyState = () => ({ pins: {}, hidden: [], added: [], uses: {}, own: [] });

/** A stored state with every field there (an old or broken record never breaks the page). */
export function normState(v) {
  const s = v && typeof v === 'object' ? v : {};
  return {
    pins: s.pins && typeof s.pins === 'object' ? { ...s.pins } : {},
    hidden: Array.isArray(s.hidden) ? [...s.hidden] : [],
    added: Array.isArray(s.added) ? [...s.added] : [],
    uses: s.uses && typeof s.uses === 'object' ? { ...s.uses } : {},
    own: Array.isArray(s.own) ? s.own.filter((o) => o && o.id && o.url) : [],
  };
}

/** Days from a to b (YYYY-MM-DD), calendar days. */
export function daysBetween(a, b) {
  const p = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((p(b) - p(a)) / 86400000);
}

/** Only the taps of the last USE_DAYS days (today included). */
export const recent = (days = [], today) => days.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && daysBetween(d, today) >= 0 && daysBetween(d, today) < USE_DAYS);

/** How often a tile was tapped in the last 4 weeks. */
export const useCount = (state, id, today) => recent(state.uses?.[id] ?? [], today).length;

/** Every tile's taps pruned to the last 4 weeks; tiles without a tap left are dropped. */
export function pruneUses(uses = {}, today) {
  const out = {};
  for (const [id, days] of Object.entries(uses)) {
    // only the old ones go (a device clock that was ahead keeps its taps until they are old)
    const keep = (Array.isArray(days) ? days : []).filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && daysBetween(d, today) < USE_DAYS).slice(-USE_CAP);
    if (keep.length) out[id] = keep;
  }
  return out;
}

/** One tap on a tile: counted with its day, old taps pruned. */
export function bumpUse(state, id, today) {
  const s = normState(state);
  s.uses = pruneUses({ ...s.uses, [id]: [...(s.uses[id] ?? []), today] }, today);
  return s;
}

/** An own link as a tile («Eigener Link», SK8 + SKX5). */
export const ownTile = (o) => ({ id: o.id, label: o.name || o.url, icon: 'link', url: o.url, own: true });

/**
 * Put pinned tiles at their place, the others around them in the given order.
 * pins: { id: slot }. A pin beyond the end lands at the end.
 */
export function placePins(list, pins = {}) {
  const pinned = list.filter((d) => Number.isInteger(pins[d.id])).sort((a, b) => pins[a.id] - pins[b.id]);
  const free = list.filter((d) => !Number.isInteger(pins[d.id]));
  const out = [];
  while (pinned.length || free.length) {
    const at = out.length;
    if (pinned.length && pins[pinned[0].id] <= at) out.push(pinned.shift());
    else if (free.length) out.push(free.shift());
    else out.push(pinned.shift());
  }
  return out;
}

/**
 * The page's tiles as they show now.
 * catalog: [{ id, label, icon, extra? }] in the page's own order (extra: only after «Dazunehmen»).
 * hints: { id: { text } | { quiet: 'nothing due' } }.
 * → { shown (≤ 7), quiet: [{ tile, text }], overflow, hidden, extras, full, sorted }
 */
export function arrange(catalog, state, hints = {}, today) {
  const s = normState(state);
  const all = [...catalog, ...s.own.map(ownTile)];
  const order = new Map(all.map((d, i) => [d.id, i]));
  const isOn = (d) => (!d.extra || s.added.includes(d.id)) && !s.hidden.includes(d.id);
  const active = all.filter(isOn);
  const quiet = active.filter((d) => hints[d.id]?.quiet).map((tile) => ({ tile, text: hints[tile.id].quiet }));
  const live = active.filter((d) => !hints[d.id]?.quiet);
  const byUse = [...live].sort((a, b) => useCount(s, b.id, today) - useCount(s, a.id, today) || order.get(a.id) - order.get(b.id));
  const sorted = placePins(byUse, s.pins);
  return {
    shown: sorted.slice(0, MAX_TILES),
    overflow: sorted.slice(MAX_TILES),
    quiet,
    hidden: all.filter((d) => s.hidden.includes(d.id)),
    extras: all.filter((d) => d.extra && !s.added.includes(d.id) && !s.hidden.includes(d.id)),
    full: sorted.length >= MAX_TILES,
    sorted,
    byUse: live.some((d) => useCount(s, d.id, today) > 0),
    today,
  };
}

/** Pin a tile at a slot; another tile pinned there lets go. */
export function pin(state, id, slot) {
  const s = normState(state);
  for (const [k, v] of Object.entries(s.pins)) if (v === slot || k === id) delete s.pins[k];
  s.pins[id] = slot;
  return s;
}

/** Let a pinned tile go: it sorts by use again. */
export function unpin(state, id) {
  const s = normState(state);
  delete s.pins[id];
  return s;
}

/**
 * Move a tile by hand (in «Kacheln anpassen» or «Nach vorne»): it is pinned at its new place.
 * ids: the order shown now; to: the new index.
 */
export function moveTile(state, ids, id, to) {
  const at = ids.indexOf(id);
  if (at < 0) return normState(state);
  const slot = Math.max(0, Math.min(ids.length - 1, to));
  return pin(state, id, slot);
}

/** Hide a tile («…» › Ausblenden, or its switch in «Kacheln anpassen»). */
export function hideTile(state, id) {
  const s = normState(state);
  if (!s.hidden.includes(id)) s.hidden.push(id);
  delete s.pins[id];
  return s;
}

/** «Wieder zeigen». */
export function showTile(state, id) {
  const s = normState(state);
  s.hidden = s.hidden.filter((x) => x !== id);
  return s;
}

/** Does adding a tile need the «which tile goes» step first? (Noah, answer 1 b) */
export const needsChoice = (arrangement) => arrangement.shown.length >= MAX_TILES;

/**
 * Add a tile via «+» («Dazunehmen» or «Wieder zeigen»). goes: the tile that makes room when all 7
 * places are full (it is hidden, and the new tile takes its place). Without goes on a full row
 * nothing changes: the caller asks first.
 */
export function addTile(state, arrangement, id, goes = null) {
  let s = normState(state);
  if (needsChoice(arrangement)) {
    if (!goes) return s;
    const slot = arrangement.shown.findIndex((d) => d.id === goes);
    const wasPinned = Number.isInteger(s.pins[goes]);
    s = hideTile(s, goes);
    if (wasPinned && slot >= 0) s = pin(s, id, slot);
  }
  s.hidden = s.hidden.filter((x) => x !== id);
  if (!s.added.includes(id)) s.added.push(id);
  // a new tile has no taps yet: it starts with one so it is not the first to drop off
  if (!s.uses[id]?.length && arrangement.today) s = bumpUse(s, id, arrangement.today);
  return s;
}

/** An own link becomes a tile of this page. */
export function addOwn(state, arrangement, link, goes = null) {
  let s = normState(state);
  const id = link.id ?? `own-${Math.random().toString(36).slice(2, 8)}`;
  s.own = [...s.own.filter((o) => o.id !== id), { id, url: link.url, name: link.name }];
  s = addTile(s, arrangement, id, goes);
  return s;
}

/** «Wie am Anfang»: the page's own tiles in their order again. Own links stay (you typed them). */
export function resetState(state) {
  const s = normState(state);
  return { ...emptyState(), own: s.own };
}
