/**
 * «Verbesserungs-Logbuch» step 3 (Noah 21.11.2026 «2b»): the photo of the page, always with an entry made by the button «Verbessern».
 * The whole page is rebuilt, also the part you only see by scrolling, up to 6000 px high (html-to-image, loaded only now with `await import()`,
 * so the core stays small). The chosen block gets an orange frame, and the picture is kept as a small JPEG (150–300 KB) on the entry. It stays on this device and in the backup, never
 * in the public repo. Maps, a canvas and a drawing can come out empty: that is known. When it fails or the memory for photos is full, the
 * entry is kept without it and says «Photo not possible».
 */

/** The longest side of the picture in pixels, the size it aims at and the most all photos of the log may take together. */
export const PHOTO_MAX_SIDE = 1440;
export const PHOTO_TARGET = 150 * 1024;
export const PHOTO_LIMIT = 400 * 1024; // a single picture above this is not kept
export const PHOTO_CAP = 40 * 1024 * 1024;
/** The whole page (Noah 21.11.2026 «scrolling screenshot»): a tall picture is allowed a bit more, and is cut at a height a phone can still draw. */
export const FULL_MAX_WIDTH = 1000;
export const FULL_MAX_HEIGHT = 6000;
export const FULL_TARGET = 300 * 1024;
export const FULL_LIMIT = 700 * 1024;
const QUALITIES = [0.72, 0.6, 0.5, 0.4, 0.3];

/** The size in bytes of a data URL (base64). */
export const dataBytes = (url) => {
  const s = String(url ?? '');
  const at = s.indexOf(',');
  return at < 0 ? 0 : Math.round(((s.length - at - 1) * 3) / 4);
};

/** All photos of the entries together, in bytes. */
export const photoBytes = (list = []) => list.reduce((sum, e) => sum + dataBytes(e.photo), 0);

/** True when one more picture of this size would not fit under the cap. */
export const capReached = (list = [], add = PHOTO_TARGET) => photoBytes(list) + add > PHOTO_CAP;

/**
 * The size of the whole-page picture: as it is, or smaller so it is at most `maxW` wide and `maxH` high (the page is cut there).
 * Returns { w, h, cut }: `cut` is true when the page was taller than the picture can be.
 */
export function fullSize(w, h, maxW = FULL_MAX_WIDTH, maxH = FULL_MAX_HEIGHT) {
  const f = Math.min(1, maxW / Math.max(w, 1));
  const cut = h * f > maxH;
  const height = Math.min(h * f, maxH);
  return { w: Math.max(1, Math.round(w * f)), h: Math.max(1, Math.round(height)), f, cut };
}

/** The size of the picture: as it is, or smaller so the longest side is at most `max`. */
export function fitSize(w, h, max = PHOTO_MAX_SIDE) {
  const f = Math.min(1, max / Math.max(w, h, 1));
  return { w: Math.max(1, Math.round(w * f)), h: Math.max(1, Math.round(h * f)) };
}

/**
 * The first quality (best first) whose JPEG fits the target. encode(q) returns the data URL. When none fits, the smallest one that stays
 * under the limit; null when even that is too big.
 */
export function squeeze(encode, target = PHOTO_TARGET, limit = PHOTO_LIMIT, qualities = QUALITIES) {
  let last = null;
  for (const q of qualities) {
    last = encode(q);
    if (dataBytes(last) <= target) return last;
  }
  return dataBytes(last) <= limit ? last : null;
}

const within = (ms, p) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

/**
 * The photo of the screen as a data URL, or { note } when it did not work.
 * el: the chosen block (gets an orange frame for the moment), nothing for the whole page.
 * Returns { photo, note }: note is null, 'failed' or 'cap'.
 */
export async function takePhoto(el = null, { existing = [], win = globalThis.window, doc = globalThis.document, full = true } = {}) {
  if (capReached(existing, full ? FULL_TARGET : PHOTO_TARGET)) return { photo: null, note: 'cap' };
  const saved = el ? { outline: el.style.outline, offset: el.style.outlineOffset } : null;
  try {
    const { toCanvas } = await import('html-to-image');
    if (el) {
      el.style.outline = '4px solid var(--improve)';
      el.style.outlineOffset = '2px';
    }
    const w = win.innerWidth;
    const h = win.innerHeight;
    const pageH = Math.max(h, Math.ceil(doc.documentElement?.scrollHeight ?? h));
    // one shot of the page from the top (height `ph`), or of the screen as it is (`ph` = the screen height, moved by the scroll)
    const shoot = (ph, moved) => {
      const tall = moved || ph > h + 1;
      return within(
        15000,
        toCanvas(doc.body, {
          width: w,
          height: ph,
          pixelRatio: 1,
          cacheBust: false,
          style: { transform: moved ? `translate(${-win.scrollX}px, ${-win.scrollY}px)` : 'none', margin: '0' },
          // the button, the band, the layer and the window of «Verbessern» are not part of the picture; a bar that is fixed to the screen
          // would sit in the wrong place on a tall or scrolled page, so it stays out there
          filter: (n) => {
            if (n?.nodeType !== 1) return true;
            if (n.hasAttribute?.('data-no-improve') || n.tagName === 'DIALOG') return false;
            if (tall && n.tagName !== 'BODY' && win.getComputedStyle(n).position === 'fixed') return false;
            return true;
          },
        })
      );
    };
    let canvas = null;
    let target = PHOTO_TARGET;
    let limit = PHOTO_LIMIT;
    if (full) {
      try {
        const { h: fh, f } = fullSize(w, pageH);
        canvas = await shoot(Math.min(pageH, Math.round(fh / f)), false);
        target = FULL_TARGET;
        limit = FULL_LIMIT;
      } catch {
        canvas = null; // a very long page can be too much for the phone: the screen as it is still works
      }
    }
    if (!canvas) canvas = await shoot(h, win.scrollY > 0);
    const size = canvas.height > h + 1 ? fullSize(canvas.width, canvas.height) : fitSize(canvas.width, canvas.height);
    const out = doc.createElement('canvas');
    out.width = size.w;
    out.height = size.h;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff'; // JPEG has no see-through
    ctx.fillRect(0, 0, size.w, size.h);
    ctx.drawImage(canvas, 0, 0, size.w, size.h);
    const photo = squeeze((q) => out.toDataURL('image/jpeg', q), target, limit);
    return photo ? { photo, note: null } : { photo: null, note: 'failed' };
  } catch {
    return { photo: null, note: 'failed' };
  } finally {
    if (el && saved) {
      el.style.outline = saved.outline;
      el.style.outlineOffset = saved.offset;
    }
  }
}
