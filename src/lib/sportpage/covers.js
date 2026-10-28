/**
 * «Bild pro Sportart» (Noah 27.10.2026 «1a»): every sport page can carry a cover photo, like Tennis (P4).
 * One settings row holds them all: { [sportId]: { cover: dataURL, y: 0–100 } }. Without a photo the page
 * shows the app's suggestion: the sport's colour with its symbol. The photo stays on the device and goes into
 * the backup (settings), like the Tennis cover. Pure functions, no database.
 */
export const COVER_KEY = 'sport.covers';

const clampY = (y) => (Number.isFinite(Number(y)) ? Math.max(0, Math.min(100, Math.round(Number(y)))) : 50);

/** The cover of one sport: { cover: string | null, y }. */
export function coverOf(value, id) {
  const c = value && typeof value === 'object' ? value[id] : null;
  return { cover: typeof c?.cover === 'string' && c.cover.startsWith('data:image/') ? c.cover : null, y: clampY(c?.y) };
}

/** Set (or with cover null remove) the cover of one sport; the others stay. */
export function withCover(value, id, { cover = null, y = 50 } = {}) {
  const next = { ...(value && typeof value === 'object' ? value : {}) };
  if (cover) next[id] = { cover, y: clampY(y) };
  else delete next[id];
  return next;
}
