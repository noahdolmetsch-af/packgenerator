/**
 * «Analyse» saved views (Noah 27.10.2026 idea «gespeicherte Ansichten», mockups M3/M4 «Ansichten»): a name
 * for what you look at now (the values, period, filter and look of «Eigenes Diagramm», and the sources and
 * period of the tiles), one tap brings it back. Every view can be added, renamed, moved and deleted; the
 * two starters are only suggestions. Pure; kept in settings under VIEWS_KEY.
 */
export const VIEWS_KEY = 'analyseViews';
export const MAX_VIEWS = 20;
export const NAME_MAX = 40;

/** The starters (names go through t() when shown; once you change the list they are yours). */
export const STARTERS = [
  { id: 'start-all', starter: 'Everything at a glance|views', diagram: { keys: ['sleep', 'rhr', 'azm', 'km:bike', 'felt:energy'], period: '90', step: 'day', mode: 'rows' }, tiles: {} },
  { id: 'start-sleep', starter: 'Sleep and training|views', diagram: { keys: ['sleep', 'sleepScore', 'rhr', 'hrv', 'azm', 'cardioLoad'], period: '90', step: 'day', mode: 'rows' }, tiles: {} },
];

const DIAGRAM_PARTS = ['keys', 'period', 'step', 'mode', 'own', 'filter', 'rowFilters', 'mark', 'band'];
const TILE_PARTS = ['period', 'on', 'all'];
const pick = (o, parts) => Object.fromEntries(parts.filter((k) => o && o[k] !== undefined).map((k) => [k, JSON.parse(JSON.stringify(o[k]))]));

/** The views read from settings: null (never changed) → the starters; broken entries are left out. */
export function cleanViews(v) {
  if (!Array.isArray(v)) return STARTERS.map((s) => ({ ...s }));
  return v
    .filter((x) => x && typeof x.id === 'string' && (typeof x.name === 'string' || typeof x.starter === 'string'))
    .slice(0, MAX_VIEWS)
    .map((x) => ({ id: x.id, ...(x.name != null ? { name: String(x.name).slice(0, NAME_MAX) } : { starter: x.starter }), diagram: pick(x.diagram, DIAGRAM_PARTS), tiles: pick(x.tiles, TILE_PARTS) }));
}

/** A new view of what you see now. id: from the caller (time based). */
export const makeView = (id, name, diagram, tiles) => ({ id, name: String(name).trim().slice(0, NAME_MAX), diagram: pick(diagram, DIAGRAM_PARTS), tiles: pick(tiles, TILE_PARTS) });

export const renameView = (views, id, name) => views.map((v) => (v.id === id ? { id: v.id, name: String(name).trim().slice(0, NAME_MAX), diagram: v.diagram, tiles: v.tiles } : v));

export function moveView(views, from, to) {
  if (from === to || from < 0 || from >= views.length) return views;
  const next = [...views];
  const [x] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, x);
  return next;
}

/** The diagram state a view brings back: its parts over what the diagram has now (colours, recent stay). */
export const applyDiagram = (now, view) => ({ ...(now ?? {}), ...pick(view.diagram, DIAGRAM_PARTS) });

/** Is what you see now the view? (Only the parts the view keeps count.) */
export function sameAs(view, diagram, tiles) {
  const eq = (a, b, parts) => parts.every((k) => a?.[k] === undefined || JSON.stringify(a[k]) === JSON.stringify(b?.[k]));
  return eq(view.diagram, diagram, DIAGRAM_PARTS) && eq(view.tiles, tiles, TILE_PARTS);
}
