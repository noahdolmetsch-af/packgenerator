/**
 * «Meine Sportarten» (Noah 02.11.2026 «4a»): sports with the same name (Gym twice, Eishockey twice) get a hint to
 * rename or pause one; nothing is merged by itself. Pure, tested in tests/similar.test.js.
 */

/** The name without case, accents, spaces and a trailing «(…)». */
export function nameKey(name = '') {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Groups of two or more sports with the same name key, except the ones the person said «Leave it» to.
 * list: [{ id, name }]; ok: the keys to leave. → [{ key, name, ids }] in the order of the list.
 */
export function similarNames(list = [], ok = []) {
  const groups = new Map();
  for (const a of list) {
    const key = nameKey(a.name);
    if (!key || ok.includes(key)) continue;
    const g = groups.get(key) ?? { key, name: a.name, ids: [] };
    g.ids.push(a.id);
    groups.set(key, g);
  }
  return [...groups.values()].filter((g) => g.ids.length > 1);
}
