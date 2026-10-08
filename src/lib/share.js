/**
 * Share a packing list (Noah, 4.10.2026, answer 14: PDF and link).
 * PDF: the print view, "Save as PDF" in the print dialog.
 * Link: the list itself travels inside the address (after #/share/), packed small. Nothing is
 * uploaded anywhere; whoever opens the link sees a read-only list. Only the trip, the bags and
 * the item names, amounts and weights go in, nothing else from your data.
 */
import { zoneName } from './trips.js';
import { t, nameOf } from './i18n.svelte.js';

/** The small object that goes into the link. */
export function sharePayload(trip, stats, itemsById) {
  return {
    v: 1,
    t: trip.title,
    d: trip.startDate ?? null,
    n: trip.days ?? 1,
    b: trip.bike ?? null,
    w: stats.gearG + stats.onMeG,
    g: stats.zones
      .filter((z) => z.entries.length)
      .map((z) => [
        z.key === 'body' ? t('On me') : trip.purpose?.[z.key] || zoneName(z),
        z.entries.map((e) => {
          const it = itemsById[e.itemId];
          return [it ? nameOf(it) : e.itemId, e.qty || 1, it?.weightG == null ? null : it.weightG * (e.qty || 1)];
        }),
      ]),
  };
}

const toB64 = (bytes) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Object → short text for the address. */
export async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return toB64(await pipe(bytes, new CompressionStream('deflate-raw')));
}

/** Text from the address → object, or null when the link is broken. */
export async function decodeShare(text) {
  try {
    const bytes = await pipe(fromB64(text), new DecompressionStream('deflate-raw'));
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    return obj?.v === 1 && Array.isArray(obj.g) ? obj : null;
  } catch {
    return null;
  }
}

/**
 * v0.27.0 (Noah 1a, AP22): above this many characters a link is "long": it still works in the
 * browser, but some chat apps and mail programs cut it, so Pack adds a hint to use Print / PDF.
 */
export const SHARE_LONG = 4000;

/** The whole link for a list. */
export async function shareLink(obj, base = `${location.origin}${location.pathname}`) {
  return `${base}#/share/${await encodeShare(obj)}`;
}
