/**
 * «Sammlungen mit Charakter» (Noah 04.11.2026 «1a 2a 3a 4b 5a», Entdecken und Sammeln, Idee 2): every collection gets
 * a look of its own, a small picture and a tint, and «Own collection» starts from a template (viewpoints, gorges,
 * old trails, gravel climbs). Pure functions (no screen), tested in tests/neuland-look.test.js.
 *
 * The look is kept in the Neuland state (`look: { [collectionId]: { icon, tint } }`, in the backup like the rest). A
 * collection without an entry has its default look; nothing else changes for the data that exists.
 */
import { stateOf, isBuiltIn } from './neuland.js';

/** The pictures to choose from (keys; LookBadge.svelte draws them). */
export const ICONS = ['mountain', 'binoculars', 'waves', 'droplets', 'landmark', 'footprints', 'bike', 'tree', 'tent', 'coffee', 'camera', 'flower', 'castle', 'route', 'sun', 'pin'];
/** The tints (LookBadge.svelte maps each to the app's colour tokens, so they follow every palette and the dark mode). */
export const TINTS = ['ok', 'hi', 'warn', 'brand', 'ink'];

/** The look of the built-in collections. */
export const DEFAULT_LOOKS = {
  cantons: { icon: 'landmark', tint: 'ink' },
  countries: { icon: 'route', tint: 'ink' },
  passes: { icon: 'mountain', tint: 'hi' },
  huts: { icon: 'tent', tint: 'ok' },
  peaks: { icon: 'mountain', tint: 'brand' },
  lakes: { icon: 'waves', tint: 'ok' },
  municipalities: { icon: 'pin', tint: 'ink' },
  towers: { icon: 'binoculars', tint: 'warn' },
  bridges: { icon: 'route', tint: 'warn' },
  waterfalls: { icon: 'droplets', tint: 'ok' },
};
/** The look of an own collection that has none chosen. */
export const OWN_LOOK = { icon: 'pin', tint: 'ok' };

/** Starting points for «Own collection»: name (an English key for t(), kept as the own name once chosen) and look. */
export const TEMPLATES = [
  { key: 'viewpoints', name: 'Viewpoints', icon: 'binoculars', tint: 'warn' },
  { key: 'gorges', name: 'Gorges', icon: 'waves', tint: 'ok' },
  { key: 'trails', name: 'Old trails', icon: 'footprints', tint: 'brand' },
  { key: 'gravel', name: 'Gravel climbs', icon: 'bike', tint: 'hi' },
];

const okIcon = (v) => (ICONS.includes(v) ? v : null);
const okTint = (v) => (TINTS.includes(v) ? v : null);

/** A stored look cleaned: only known pictures and tints; null when nothing usable is left. */
export function cleanLook(v) {
  const icon = okIcon(v?.icon);
  const tint = okTint(v?.tint);
  return icon || tint ? { ...(icon ? { icon } : {}), ...(tint ? { tint } : {}) } : null;
}

/** The look to show for a collection: what was chosen, else the default of a built-in one, else the own default. Always both parts. */
export function lookOf(state, cid) {
  const base = DEFAULT_LOOKS[cid] ?? OWN_LOOK;
  const own = cleanLook(stateOf(state).look?.[cid]);
  return { icon: own?.icon ?? base.icon, tint: own?.tint ?? base.tint };
}

/** Choose the look of a collection (a part left out stays as it is). */
export function setLook(state, cid, look) {
  const s = stateOf(state);
  const next = cleanLook({ ...(s.look[cid] ?? {}), ...(look ?? {}) });
  const m = { ...s.look };
  if (next) m[cid] = next;
  else delete m[cid];
  return { ...s, look: m };
}

/** Back to the default look. */
export function resetLook(state, cid) {
  const s = stateOf(state);
  const m = { ...s.look };
  delete m[cid];
  return { ...s, look: m };
}

/** Does this collection have a look of its own choosing (so «Back to the default» makes sense)? */
export const hasOwnLook = (state, cid) => !!cleanLook(stateOf(state).look?.[cid]);

export { isBuiltIn };
