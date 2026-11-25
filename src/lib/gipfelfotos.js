/**
 * Own photos of the visits of the summit book (Noah 24.11.2026 «alle 1-5 zusammen», idea 3). They sit in their own
 * setting, not in the book, so the book stays small and light to read: { [visitId]: [dataUrl, …] }, shrunk on the
 * device (photo.js), at most PHOTOS_MAX per visit. Pure, tested in tests/gipfelbuch.test.js.
 */
export const FOTO_KEY = 'gipfelbuch-fotos';
export const PHOTOS_MAX = 3;

/** The stored value made whole: only images that are data addresses. */
export function fotosOf(value) {
  const out = {};
  for (const [id, list] of Object.entries(value && typeof value === 'object' ? value : {})) {
    const ok = (Array.isArray(list) ? list : []).filter((u) => typeof u === 'string' && /^data:image\//.test(u)).slice(0, PHOTOS_MAX);
    if (ok.length) out[id] = ok;
  }
  return out;
}
/** One photo more for a visit (the oldest of a full visit makes room). */
export function addFoto(fotos, visitId, url) {
  return { ...fotos, [visitId]: [...(fotos[visitId] ?? []), url].slice(-PHOTOS_MAX) };
}
/** One photo less (by place in the list); an empty visit leaves the map. */
export function removeFoto(fotos, visitId, index) {
  const rest = (fotos[visitId] ?? []).filter((_, i) => i !== index);
  const { [visitId]: _gone, ...others } = fotos;
  return rest.length ? { ...others, [visitId]: rest } : others;
}
/** The photos of the visits that are gone leave with them. */
export function pruneFotos(fotos, book) {
  const ids = new Set(book.visits.map((v) => v.id));
  return Object.fromEntries(Object.entries(fotos).filter(([id]) => ids.has(id)));
}
