/**
 * Paket L «Werkzeugkasten» (#310 Fotos verkleinern, zuschneiden, freistellen). The math is pure and
 * tested in tests/werkzeugkasten.test.js; the canvas work runs only in the browser.
 *
 * Freistellen (Noah 19.10.2026 «4a»): a model for the background is loaded once from the internet
 * (about 45 MB) and then kept by the browser, so it works offline after the first time. It runs on the
 * device; the photo never leaves it. Library: transformers.js; model ISNet (free, Apache 2.0), with
 * BiRefNet lite as the second choice when the first cannot be loaded.
 */

/** The sizes to choose (longest side in pixels; 0 = keep). Labels are English keys for t(). */
export const SIZES = [
  { px: 0, label: 'Original|photo' },
  { px: 2048, label: 'Large|photo' },
  { px: 1280, label: 'Medium|photo' },
  { px: 800, label: 'Small|photo' },
];

/** The shapes to cut to (w/h; 0 = free). */
export const SHAPES = [
  { key: 'free', ratio: 0, label: 'Free|shape' },
  { key: '1:1', ratio: 1, label: 'Square|shape' },
  { key: '4:3', ratio: 4 / 3, label: '4:3' },
  { key: '3:4', ratio: 3 / 4, label: '3:4' },
  { key: '16:9', ratio: 16 / 9, label: '16:9' },
];

/** w×h made to fit in `max` on the longest side (never bigger). */
export function fitSize(w, h, max) {
  if (!max || (w <= max && h <= max)) return { w, h };
  const s = max / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

/** The biggest rectangle of the ratio in the middle of w×h: { x, y, w, h }. ratio 0 = all. */
export function centerCrop(w, h, ratio) {
  if (!ratio) return { x: 0, y: 0, w, h };
  if (w / h > ratio) {
    const cw = Math.round(h * ratio);
    return { x: Math.round((w - cw) / 2), y: 0, w: cw, h };
  }
  const ch = Math.round(w / ratio);
  return { x: 0, y: Math.round((h - ch) / 2), w, h: ch };
}

/** A crop rectangle kept inside the photo and at least 16 px big. */
export function clampCrop(r, w, h) {
  const cw = Math.max(16, Math.min(w, Math.round(r.w)));
  const ch = Math.max(16, Math.min(h, Math.round(r.h)));
  return { x: Math.max(0, Math.min(w - cw, Math.round(r.x))), y: Math.max(0, Math.min(h - ch, Math.round(r.y))), w: cw, h: ch };
}

/**
 * Moves one corner (or the whole frame: 'move') of the crop by dx, dy (photo pixels), keeping the ratio
 * when one is set. Returns the new rectangle inside the photo.
 */
export function dragCrop(r, handle, dx, dy, w, h, ratio = 0) {
  if (handle === 'move') return clampCrop({ ...r, x: r.x + dx, y: r.y + dy }, w, h);
  let { x, y } = r;
  let x2 = r.x + r.w;
  let y2 = r.y + r.h;
  if (handle.includes('w')) x += dx;
  if (handle.includes('e')) x2 += dx;
  if (handle.includes('n')) y += dy;
  if (handle.includes('s')) y2 += dy;
  x = Math.max(0, Math.min(x, x2 - 16));
  y = Math.max(0, Math.min(y, y2 - 16));
  x2 = Math.min(w, Math.max(x2, x + 16));
  y2 = Math.min(h, Math.max(y2, y + 16));
  let nw = x2 - x;
  let nh = y2 - y;
  if (ratio) {
    if (nw / nh > ratio) nw = nh * ratio;
    else nh = nw / ratio;
    if (handle.includes('w')) x = x2 - nw;
    if (handle.includes('n')) y = y2 - nh;
  }
  return clampCrop({ x, y, w: nw, h: nh }, w, h);
}

/** The file name of the result: «velo.jpg» → «velo-klein.jpg». */
export function outName(name, suffix, ext) {
  const base = String(name || 'foto').replace(/\.[a-z0-9]+$/i, '') || 'foto';
  return `${base}-${suffix}.${ext}`;
}

/* ---------- browser only ---------- */

/** A File/Blob as an ImageBitmap (or <img>) with its size. */
export async function loadImage(blob) {
  if (globalThis.createImageBitmap) {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      /* fall back to <img> */
    }
  }
  const src = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(src), 1000);
  }
}

/** Draws part of the image (crop) at the size (w×h) and gives a Blob (JPEG, or PNG for see-through). */
export async function render(img, crop, w, h, { type = 'image/jpeg', quality = 0.85 } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (type === 'image/jpeg') {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
  }
  g.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return await new Promise((res) => c.toBlob(res, type, quality));
}

/** For shrinkPdf: a JPEG made smaller in the browser. */
export async function recodeJpeg(bytes, { quality = 0.6, maxSide = 1600 } = {}) {
  const img = await loadImage(new Blob([bytes], { type: 'image/jpeg' }));
  const w = img.width;
  const h = img.height;
  const s = fitSize(w, h, maxSide);
  const blob = await render(img, { x: 0, y: 0, w, h }, s.w, s.h, { quality });
  img.close?.();
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: s.w, height: s.h };
}

export const CUTOUT_LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm';
export const CUTOUT_MODELS = ['onnx-community/ISNet-ONNX', 'onnx-community/BiRefNet_lite-ONNX'];
let segmenter = null;

/** Is the model already on this device (kept by the browser)? */
export async function cutoutReady() {
  try {
    for (const k of await caches.keys()) {
      const c = await caches.open(k);
      if ((await c.keys()).some((r) => CUTOUT_MODELS.some((m) => r.url.includes(m)) && r.url.includes('.onnx'))) return true;
    }
  } catch {
    /* no cache storage */
  }
  return false;
}

/**
 * Cuts the main subject out of the photo: a PNG with a see-through background.
 * onprogress(share 0–1) while the model loads the first time.
 */
export async function cutout(blob, { onprogress = () => {} } = {}) {
  if (!segmenter) {
    const tf = await import(/* @vite-ignore */ CUTOUT_LIB);
    tf.env.allowLocalModels = false;
    const done = {};
    const progress_callback = (p) => {
      if (p.status === 'progress' && p.total) {
        done[p.file] = [p.loaded, p.total];
        const all = Object.values(done);
        onprogress(all.reduce((a, [l]) => a + l, 0) / all.reduce((a, [, t]) => a + t, 0));
      }
    };
    let last = null;
    for (const m of CUTOUT_MODELS) {
      try {
        segmenter = await tf.pipeline('background-removal', m, { dtype: 'q8', progress_callback });
        break;
      } catch (err) {
        last = err;
      }
    }
    if (!segmenter) throw last ?? new Error('no model');
  }
  const src = URL.createObjectURL(blob);
  try {
    const out = await segmenter(src);
    return await out.toBlob('image/png');
  } finally {
    URL.revokeObjectURL(src);
  }
}
