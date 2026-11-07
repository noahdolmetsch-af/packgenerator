/**
 * The kinds of steps of «Weg zum Ziel». One file per kind in this folder; this file collects them by itself, so a
 * new kind is a new file and nothing else: no line here, so parallel pull requests never conflict over it.
 *
 * A file in this folder is a kind when its default export has a `type` (a text); `index.js` is skipped. Helper code
 * that is not a kind goes elsewhere (src/lib/weg/), not in this folder.
 *
 * Order = order in the sheet «New way»: by `order` (a number in the kind; «Own step» is 0, the first kinds 10 to 50),
 * a kind without `order` comes after them, in the order of its `type` (alphabetical). Give a new kind an `order` only
 * if it must stand somewhere else.
 */
const files = import.meta.glob(['./*.js', '!./index.js'], { eager: true, import: 'default' });

const DEFAULT_ORDER = 1000;

/** Pure and exported for the test: the kinds out of the default exports of the files, in the order above. */
export function collect(modules) {
  return modules
    .filter((t) => t && typeof t.type === 'string' && t.type)
    .sort((a, b) => (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER) || (a.type < b.type ? -1 : a.type > b.type ? 1 : 0));
}

export const TYPES = collect(Object.values(files));

export const typeOf = (id) => TYPES.find((t) => t.type === id) ?? TYPES.find((t) => t.type === 'own');

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
