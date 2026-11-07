/**
 * The kinds of steps of «Weg zum Ziel». One file per kind in this folder, one line each here (so that several
 * pull requests only touch one line each). Order = order in the sheet «New way».
 */
import own from './own.js';
import rennplanung from './rennplanung.js';
import packen from './packen.js';
import essen from './essen.js';

export const TYPES = [own, rennplanung, packen, essen];

export const typeOf = (id) => TYPES.find((t) => t.type === id) ?? own;

/** The steps every kind suggests for a goal: [{ type, title, offset, note? }]. A type that fails adds nothing. */
export function suggestions(goal, types = TYPES) {
  return types.flatMap((t) => {
    try {
      return (t.defaults?.(goal) ?? []).map((s) => ({ ...s, type: t.type }));
    } catch {
      return [];
    }
  });
}
