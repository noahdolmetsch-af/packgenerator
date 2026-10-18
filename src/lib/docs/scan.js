/**
 * Dokumente-PDF, the browser part of one page: read the photo, find the paper (Noah «3 beides
 * möglich»: found by itself, corners can be moved by hand), straighten, turn and give it its look
 * (Noah «4a»: black and white, gray or colour possible). Everything stays on the device.
 */
import { detectQuad, grayOf, quadSize, warp, applyMode, FULL_QUAD, PAGE_MAX } from '../docs.js';
import { t } from '../i18n.svelte.js';

/** Longest side of the photo kept while the page is edited (not stored). */
export const SOURCE_MAX = 2400;

/** A photo file → a canvas (at most SOURCE_MAX), turned the way the camera held it. */
export async function readPhoto(file) {
  if (!file?.type?.startsWith('image/')) throw new Error(t('Please choose a photo (JPG, PNG or HEIC as JPG).'));
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(t('This photo could not be read. Please choose a JPG or PNG.'));
  }
  const k = Math.min(1, SOURCE_MAX / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close?.();
  return c;
}

/** Find the paper on a small copy; corners in 0..1, or the whole photo when nothing clear is found. */
export function findPaper(canvas) {
  const k = 220 / Math.max(canvas.width, canvas.height);
  const w = Math.max(8, Math.round(canvas.width * k));
  const h = Math.max(8, Math.round(canvas.height * k));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const q = detectQuad(grayOf(ctx.getImageData(0, 0, w, h)), w, h);
  return { quad: q ?? FULL_QUAD.map((p) => ({ ...p })), found: !!q };
}

/**
 * The finished page: straightened inside «quad» (0..1), turned by «turn» quarter turns clockwise,
 * in «mode». Returns { src: JPEG data URL, w, h }.
 */
export function renderPage(canvas, quad, { turn = 0, mode = 'bw', max = PAGE_MAX } = {}) {
  const px = quad.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
  const { w, h } = quadSize(px, max);
  const sctx = canvas.getContext('2d', { willReadFrequently: true });
  const src = sctx.getImageData(0, 0, canvas.width, canvas.height);
  const flat = document.createElement('canvas');
  flat.width = w;
  flat.height = h;
  const fctx = flat.getContext('2d');
  const out = fctx.createImageData(w, h);
  warp(src, px, out);
  applyMode(out, mode);
  fctx.putImageData(out, 0, 0);
  const q = ((turn % 4) + 4) % 4;
  const done = document.createElement('canvas');
  done.width = q % 2 ? h : w;
  done.height = q % 2 ? w : h;
  const dctx = done.getContext('2d');
  dctx.translate(done.width / 2, done.height / 2);
  dctx.rotate((q * Math.PI) / 2);
  dctx.drawImage(flat, -w / 2, -h / 2);
  return { src: done.toDataURL('image/jpeg', mode === 'color' ? 0.78 : 0.7), w: done.width, h: done.height };
}

/** A photo kept as a photo (Noah's choice «Als Fotos behalten»): only made smaller, no cut. */
export function keepPhoto(canvas, { turn = 0, max = PAGE_MAX } = {}) {
  return renderPage(canvas, FULL_QUAD, { turn, mode: 'color', max });
}
