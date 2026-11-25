/**
 * «Frag Gemini» photo (Noah 23.11.2026 «1a»): the photo is made small on the device before it goes out (at most 1024 px on the
 * long side, JPEG), so little leaves the phone and the free limit lasts. The pure part is tested; shrink() needs a browser.
 */
export const MAX_SIDE = 1024;

/** The size of a photo of w × h fitted into max px on the long side (never bigger than it is). */
export function fitSize(w, h, max = MAX_SIDE) {
  if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 };
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** A picture file → { mime: 'image/jpeg', data (base64, no prefix), preview (data address for the screen) }, or null. */
export async function shrink(file, { max = MAX_SIDE, quality = 0.8 } = {}) {
  if (!file || !/^image\//.test(file.type ?? '')) return null;
  try {
    const bmp = await createImageBitmap(file);
    const { w, h } = fitSize(bmp.width, bmp.height, max);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const preview = canvas.toDataURL('image/jpeg', quality);
    return { mime: 'image/jpeg', data: preview.split(',')[1] ?? '', preview };
  } catch {
    return null;
  }
}
