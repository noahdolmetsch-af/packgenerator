/**
 * «Bilder in der App» (Noah 20.10.2026 «1b 2a 3a 4a 5a»): the browser part for photos that are already
 * small JPEG data URLs (problem photos, setup photos): cut a photo, and make one PDF of several photos
 * that goes to Ich › Dokumente (the same PDF maker as «Dokument fotografieren», pdf-lib, loaded only then).
 * Everything stays on the device.
 */
import { makePdf } from '../docs/pdf.js';
import { addDoc } from '../docs/client.svelte.js';
import { dataBytes } from '../docs.js';

/** A data URL as a picture with its size. */
export async function loadSrc(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

/** The part crop = { x, y, w, h } (photo pixels) of the photo as a new JPEG data URL. */
export async function cropSrc(src, crop, quality = 0.85) {
  const img = await loadSrc(src);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(crop.w));
  c.height = Math.max(1, Math.round(crop.h));
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

/** 4a: one PDF of all photos, kept in Ich › Dokumente (the group «Imported PDFs»). → the new document. */
export async function photosToPdf(srcs, { name = 'Photos', note = '' } = {}) {
  const pages = [];
  for (const src of srcs) {
    const img = await loadSrc(src);
    pages.push({ src, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
  }
  const data = await makePdf(pages, { title: name });
  return addDoc({ kind: 'pdf', name, source: 'camera', pages: pages.length, bytes: dataBytes(data), mode: 'color', data, ...(note ? { note } : {}) });
}
