/**
 * Paket L «Werkzeugkasten» (Bildformat umwandeln, Noah 19.10.2026): HEIC, WebP, PNG, AVIF → JPG (or PNG),
 * on the device. HEIC (iPhone photos) needs a small library, loaded once from the internet and then kept
 * by the browser. The pure parts are tested in tests/werkzeugkasten.test.js.
 */
import { loadImage, render } from './phototools.js';

export const HEIC_LIB = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
export const TARGETS = [
  { key: 'jpg', type: 'image/jpeg', label: 'JPG' },
  { key: 'png', type: 'image/png', label: 'PNG' },
];

/** HEIC/HEIF by type or by name (some phones give no type). */
export const isHeic = (f) => /hei[cf]/i.test(f?.type ?? '') || /\.hei[cf]$/i.test(f?.name ?? '');

/** «IMG_0042.HEIC» → «IMG_0042.jpg». */
export const convertedName = (name, ext) => `${String(name || 'bild').replace(/\.[a-z0-9]+$/i, '') || 'bild'}.${ext}`;

const extOf = (name) => (String(name ?? '').match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase().replace('jpeg', 'jpg');
/**
 * Einzelidee 38 «Bild umwandeln ohne Überschreiben»: the new names of a batch. Each keeps the old name (its
 * origin); a picture that already has the new format gets «-suffix» («velo.jpg» → «velo-umgewandelt.jpg»), and
 * two pictures with the same name get «-2», «-3», so no new file has the name of an old one or of another.
 */
export function freeNames(names = [], ext, suffix = 'converted') {
  const taken = new Set(names.map((n) => String(n ?? '').toLowerCase()));
  const used = new Set();
  return names.map((n) => {
    let out = convertedName(n, ext);
    if (extOf(n) === ext.replace('jpeg', 'jpg') || taken.has(out.toLowerCase())) out = convertedName(`${String(n || 'bild').replace(/\.[a-z0-9]+$/i, '') || 'bild'}-${suffix}.x`, ext);
    const base = out.replace(/\.[a-z0-9]+$/i, '');
    for (let k = 2; used.has(out.toLowerCase()) || (taken.has(out.toLowerCase()) && k < 99); k++) out = `${base}-${k}.${ext}`;
    used.add(out.toLowerCase());
    return out;
  });
}

let heic = null;
function loadHeic() {
  heic ??= new Promise((ok, no) => {
    if (window.heic2any) return ok(window.heic2any);
    const s = document.createElement('script');
    s.src = HEIC_LIB;
    s.onload = () => (window.heic2any ? ok(window.heic2any) : no(new Error('heic')));
    s.onerror = () => ((heic = null), no(new Error('heic')));
    document.head.append(s);
  });
  return heic;
}

/** One picture → a Blob of the target type. Browser only. */
export async function convertImage(file, target = TARGETS[0]) {
  let src = file;
  if (isHeic(file)) {
    const h = await loadHeic();
    const out = await h({ blob: file, toType: target.type, quality: 0.9 });
    return Array.isArray(out) ? out[0] : out;
  }
  const img = await loadImage(src);
  const w = img.width;
  const h = img.height;
  const blob = await render(img, { x: 0, y: 0, w, h }, w, h, { type: target.type, quality: 0.9 });
  img.close?.();
  return blob;
}
