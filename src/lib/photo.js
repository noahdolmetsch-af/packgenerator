/**
 * Photos (Noah, 4.10.2026, answer 13b: a photo of the own bike in Pack).
 * A phone photo is several MB; it is made smaller on the device before it is stored, so the
 * database and backup files stay small (about 100–250 KB per photo).
 */

/** Longest side in pixels after shrinking. */
export const PHOTO_MAX = 1400;

/** Size (w, h) that fits into max × max and keeps the shape. */
export function fitSize(w, h, max = PHOTO_MAX) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** Read an image file, shrink it and return a JPEG data URL. Needs a browser. */
export async function shrinkImage(file, max = PHOTO_MAX, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or HEIC as JPG).');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { w, h } = fitSize(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}
