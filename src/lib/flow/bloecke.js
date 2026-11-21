/**
 * «Block-Knöpfe» (Noah 21.11.2026 «a» und Festlegung «Abhaken»): after a tick the page «Geschafft» offers the duration in blocks
 * of a sport: sauna 1 to 4 times 12 minutes, running indoors 1 to 4 times 10 minutes. The block size is a setting per sport
 * (any sport can have one, the standard sizes are only a start), the button of the last choice is marked, and a tap saves the
 * minutes on the tick like the chips 30/45/60/90 do (lib/flow/feel.js).
 *
 * Setting (db.settings, in the backup, no schema change): BLOCKS_KEY = { [actId]: { size?: minutes, last?: blocks } }.
 * `size` is the block of that sport (missing = the standard of the sport, if it has one); `last` is the number of blocks
 * chosen the last time. Nothing is written into a tick but the minutes. Pure functions plus three small writers.
 */
import { INDOOR_RUN, cleanMin } from './usualmin.js';

export const BLOCKS_KEY = 'sport.blocks';
/** The numbers of blocks the buttons offer. */
export const COUNTS = [1, 2, 3, 4];

/**
 * Noah's standard blocks (21.11.2026): [words of the activity, block minutes, blocks marked at first]. First rule that fits.
 * «Rennen indoor» and «Laufen indoor» are one activity; two blocks of 10 minutes are marked at first.
 */
export const BLOCK_RULES = [
  [INDOOR_RUN, 10, 2],
  [/sauna/i, 12, 1],
];

/** The standard block of an activity ({ id, name, nameDe }) as { size, count }, or null when it has none. */
export function standardBlock(act) {
  const text = [act?.id, act?.name, act?.nameDe].filter(Boolean).join(' ');
  const rule = BLOCK_RULES.find(([re]) => re.test(text));
  return rule ? { size: rule[1], count: rule[2] } : null;
}

/** A number of blocks of COUNTS, else 0. */
export const cleanCount = (v) => (COUNTS.includes(Number(v)) ? Number(v) : 0);

/** The stored value made whole: only valid ids, sizes and counts stay. */
export function blocksMap(value) {
  const out = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const [id, v] of Object.entries(value)) {
    if (!id || !v || typeof v !== 'object') continue;
    const size = cleanMin(v.size);
    const last = cleanCount(v.last);
    if (size || last) out[id] = { ...(size ? { size } : {}), ...(last ? { last } : {}) };
  }
  return out;
}

/**
 * The blocks of an activity: { size, count, own } — size 0 when the sport has no blocks; count is the button to mark (the last
 * choice, else the standard's, else 1); own is true when the size was set by you.
 */
export function blockFor(map, actId, act = null) {
  const set = blocksMap(map)[actId] ?? {};
  const std = standardBlock(act ?? { id: actId });
  const size = set.size ?? std?.size ?? 0;
  if (!size) return { size: 0, count: 0, own: false };
  return { size, count: set.last ?? (set.size ? 1 : std?.count ?? 1), own: !!set.size };
}

/** The buttons for a block size: [{ n, min }]. */
export const blockChips = (size) => (cleanMin(size) ? COUNTS.map((n) => ({ n, min: n * size })) : []);

/** The block count a number of minutes is made of, or 0 (e.g. 24 minutes with blocks of 12 = 2). */
export const countOf = (size, min) => COUNTS.find((n) => n * size === Number(min)) ?? 0;

function put(map, actId, patch) {
  const next = blocksMap(map);
  const merged = { ...(next[actId] ?? {}), ...patch };
  for (const k of Object.keys(merged)) if (!merged[k]) delete merged[k];
  if (Object.keys(merged).length) next[actId] = merged;
  else delete next[actId];
  return blocksMap(next);
}

/** The map with the block size of one activity set (size > 0) or back to the standard (0 or empty). Never changes the input. */
export const withBlockSize = (map, actId, size) => put(map, actId, { size: cleanMin(size) });

/** The map with the last choice of one activity remembered. Never changes the input. */
export const withLast = (map, actId, n) => put(map, actId, { last: cleanCount(n) });

/** Read the setting. */
export async function readBlocks(db) {
  return blocksMap((await db.settings.get(BLOCKS_KEY))?.value);
}

async function write(db, map) {
  if (Object.keys(map).length) await db.settings.put({ key: BLOCKS_KEY, value: map });
  else await db.settings.delete(BLOCKS_KEY);
}

/** Save the block size of one activity (0 or empty = the standard); returns the map before, for «Undo». */
export async function saveBlockSize(db, actId, size) {
  const before = await readBlocks(db);
  await write(db, withBlockSize(before, actId, size));
  return before;
}

/** Remember the number of blocks chosen last for one activity. */
export async function rememberBlocks(db, actId, n) {
  await write(db, withLast(await readBlocks(db), actId, n));
}

/** Put a whole map back («Undo»). */
export async function restoreBlocks(db, before) {
  await write(db, blocksMap(before));
}
