/**
 * The kinds of own map points (Paket U2 «Karte» › Eigene Punkte). name: English key for t().
 * «Alle Daten anpassbar» (Noah 21.10.2026 «4a»): renamed, own, hidden and deleted kinds come from
 * «Listen und Typen» (applists.js 'pointKinds'). A point keeps its kind when the kind is
 * deleted; it then shows with the Standard name, or as «Note» for a deleted own kind.
 */
import { hasId, nameOf, offered } from '../applists.js';

export const OWN_KINDS = [
  { key: 'note', name: 'Note|point' },
  { key: 'water', name: 'Water' },
  { key: 'food', name: 'Food|point' },
  { key: 'sleep', name: 'Place to sleep' },
  { key: 'danger', name: 'Danger' },
  { key: 'view', name: 'View|point' },
];
export const OWN_KIND_KEYS = OWN_KINDS.map((k) => k.key);
/** The Standard as list entries. */
export const POINT_KINDS_STD = OWN_KINDS.map((k) => ({ id: k.key, name: k.name }));
/** A kind a point may have: a Standard one or an own one of the list. */
export const isPointKind = (k) => typeof k === 'string' && (OWN_KIND_KEYS.includes(k) || hasId('pointKinds', POINT_KINDS_STD, k));
/** The name of a kind for the page (an unknown one: «Note»). */
export const pointKindName = (k, tr = (s) => s) => nameOf('pointKinds', POINT_KINDS_STD, k, tr, tr('Note|point'));
/** The kinds offered in the window of a point (keep: the point's kind). */
export const pointKindsOffered = (keep = null) => offered('pointKinds', POINT_KINDS_STD, keep);
