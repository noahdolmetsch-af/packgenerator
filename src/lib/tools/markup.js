/**
 * «Bild bearbeiten» (Noah 28.10.2026 «1a 2a 3a 4a 5a», thread «Screenshot-Werkzeug im Werkzeugkasten"):
 * the pages of Werkzeugkasten › Bild bearbeiten. A screenshot is taken on the phone as always, then chosen
 * here; each page can be turned, cut, drawn and written on, and all pages become one PDF or single pictures.
 * Pure helpers on top (tested in tests/markup.test.js), browser helpers below. Everything stays on the device.
 */

/** Longest side of a page in pixels: screenshots stay sharp, big camera photos get smaller. */
export const PAGE_MAX = 2400;
/** At most so many pages at once (memory on a phone). */
export const MAX_PAGES = 30;

/** The size a page gets: the longest side at most `max`, never bigger than it was. */
export function pageSize(w, h, max = PAGE_MAX) {
  const k = Math.min(1, max / Math.max(1, w, h));
  return {
    w: Math.max(1, Math.round(w * k)),
    h: Math.max(1, Math.round(h * k)),
  };
}

/** A list with the item at `from` moved to `to` (out of range: the list as it was). */
export function moveTo(list, from, to) {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const l = [...list];
  const [x] = l.splice(from, 1);
  l.splice(to, 0, x);
  return l;
}

/** The file name of the result: «bild-2026-10-28.pdf», or «bild-2026-10-28-2.jpg» for page 2 of several. */
export function resultName(day, ext, n = 0, of = 1) {
  return `bild-${day}${of > 1 ? `-${n + 1}` : ''}.${ext}`;
}

/** A data URL as bytes. */
export function dataUrlBytes(src) {
  const b64 = String(src).split(',')[1] ?? '';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------- browser only ---------- */

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  return [c, g];
}

/** A chosen picture (File, any size) as a page: a JPEG data URL, longest side at most PAGE_MAX. */
export async function pageFromFile(file) {
  const { loadImage } = await import('./phototools.js');
  const img = await loadImage(file);
  const { w, h } = pageSize(img.width, img.height);
  const [c, g] = canvasOf(w, h);
  g.drawImage(img, 0, 0, w, h);
  img.close?.();
  return c.toDataURL('image/jpeg', 0.9);
}

/** The page turned a quarter to the right. */
export async function turnRight(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const [c, g] = canvasOf(img.naturalHeight, img.naturalWidth);
  g.translate(c.width, 0);
  g.rotate(Math.PI / 2);
  g.drawImage(img, 0, 0);
  return c.toDataURL('image/jpeg', 0.9);
}

/** One PDF of all pages (each fits on A4, landscape pages lie across). → Blob. */
export async function pagesToPdf(srcs) {
  const { mergeParts } = await import('./pdftools.js');
  const { bytes } = await mergeParts(srcs.map((s) => ({ kind: 'jpg', bytes: dataUrlBytes(s) })));
  return new Blob([bytes], { type: 'application/pdf' });
}

/** A page as a JPEG Blob. */
export function pageBlob(src) {
  return new Blob([dataUrlBytes(src)], { type: 'image/jpeg' });
}
