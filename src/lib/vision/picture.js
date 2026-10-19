/**
 * Paket L2 «Bilderkennung»: the photo on the device. It is drawn into a canvas at most MAX pixels wide
 * (enough for the recognition, quick on a phone); parts of it are cut out for the «Was ist das?» row.
 * Nothing is stored: the photo lives only while the page is open.
 */
import * as engine from './engine.js';
import { regionsOf } from './recognize.js';

export const MAX = 1280;

/** A photo file → a canvas (turned upright as the camera took it, at most MAX px on its long side). */
export async function photoCanvas(file, max = MAX) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}

/** A part of the canvas as its own canvas (a little margin around it). */
export function cut(canvas, box, pad = 0.06) {
  const px = box.w * pad;
  const py = box.h * pad;
  const x = Math.max(0, Math.floor(box.x - px));
  const y = Math.max(0, Math.floor(box.y - py));
  const w = Math.max(1, Math.min(canvas.width - x, Math.ceil(box.w + 2 * px)));
  const h = Math.max(1, Math.min(canvas.height - y, Math.ceil(box.h + 2 * py)));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return c;
}

/** A small picture (data URL) of a part, for the list rows. */
export function thumb(canvas, box, size = 96) {
  const part = cut(canvas, box);
  const k = size / Math.max(part.width, part.height);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(part.width * k));
  c.height = Math.max(1, Math.round(part.height * k));
  c.getContext('2d').drawImage(part, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

/**
 * The regions of a photo with what the device sees in each: label, the three best names, the fingerprint
 * and a small picture. The grid parts only get a fingerprint (to find taught things again).
 */
export async function lookAt(canvas, eng = engine) {
  const dets = await eng.detect(canvas);
  const regions = regionsOf(dets, canvas.width, canvas.height);
  for (const r of regions) {
    const part = cut(canvas, r.box);
    r.emb = await eng.embed(part);
    if (!r.grid) {
      r.cls = await eng.classify(part);
      r.thumb = thumb(canvas, r.box);
    }
  }
  return regions;
}

/** The photo made small for the KI-Helfer: JPEG, at most 1024 px → { type, data (base64) }. */
export async function forHelper(canvas, max = 1024) {
  const k = Math.min(1, max / Math.max(canvas.width, canvas.height));
  const c = document.createElement('canvas');
  c.width = Math.round(canvas.width * k);
  c.height = Math.round(canvas.height * k);
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', 0.75);
  return { type: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) };
}
