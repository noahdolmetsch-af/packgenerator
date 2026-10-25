/**
 * Paket C: the editable kinds of its pages (meaning tags of a trip, own bingo fields, kinds of special
 * days). App rule «Gruppen überall» and «alles selbst ändern»: every kind can be added, renamed, sorted
 * (arrows and drag) and deleted; a deleted kind asks where its entries go («Ohne …» first).
 * A kind: { id, name } for an own one, { id, std } for a built-in one (std: the English key for t(),
 * a renamed built-in keeps `std` and gets `name`, which never goes through t()).
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, uid, move } from './base.js';

/** The stored kinds made safe; without a record the built-in ones (std: [{ id, std }]). */
export function kindsOf(value, std = []) {
  if (!Array.isArray(value)) return std.map((k) => ({ ...k }));
  const seen = new Set();
  return value
    .filter((k) => k && k.id && !seen.has(k.id) && (seen.add(k.id), clean(k.name, 40) || k.std))
    .map((k) => ({ id: String(k.id), ...(k.std ? { std: String(k.std) } : {}), ...(clean(k.name, 40) ? { name: clean(k.name, 40) } : {}) }));
}
/** The name to show: an own or renamed name as typed, a built-in one through tr (t). */
export const kindName = (k, tr = (s) => s) => (k?.name ? k.name : k?.std ? tr(k.std) : '');
export function addKind(kinds, name, id = uid('k')) {
  const n = clean(name, 40);
  if (!n || kinds.some((k) => kindName(k).toLowerCase() === n.toLowerCase())) return kinds;
  return [...kinds, { id, name: n }];
}
export function renameKind(kinds, id, name) {
  const n = clean(name, 40);
  return n ? kinds.map((k) => (k.id === id ? { ...k, name: n } : k)) : kinds;
}
export const dropKind = (kinds, id) => kinds.filter((k) => k.id !== id);
export const moveKind = move;
