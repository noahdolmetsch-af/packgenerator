/**
 * «Träume und Neuland» (Noah 27.10.2026 «5b»): the Neuland page (an object: collections, ticks, own lists)
 * and «Neuland des Jahres» in Ich › Was mir gut tut (a list of your own entries) both saved under the
 * setting 'neuland', so each could hide or overwrite the other. «Neuland des Jahres» has its own setting
 * now ('neulandYear'). This moves a list found under 'neuland' over, once: on every start and after an
 * import (updates.js), and before the Neuland page saves. Entries already under 'neulandYear' stay; the
 * same id is not added twice. Nothing else is touched. Returns true when it moved something.
 */
export const OLD_KEY = 'neuland';
export const YEAR_KEY = 'neulandYear';

export async function splitNeuland(db) {
  const first = await db.settings.get(OLD_KEY);
  if (!Array.isArray(first?.value)) return false;
  let moved = false;
  await db.transaction('rw', db.settings, async () => {
    const old = await db.settings.get(OLD_KEY);
    if (!Array.isArray(old?.value)) return;
    const cur = await db.settings.get(YEAR_KEY);
    const have = Array.isArray(cur?.value) ? cur.value : [];
    const ids = new Set(have.map((x) => x?.id));
    await db.settings.put({ key: YEAR_KEY, value: [...have, ...old.value.filter((x) => x && !ids.has(x.id))] });
    await db.settings.delete(OLD_KEY);
    moved = true;
  });
  return moved;
}
