/**
 * Paket D «Mit Freunden»: a message ↔ the short code in a link (JSON, deflate, base64url), as the
 * shared packing list does (share.js). Nothing is uploaded; the code is the message.
 */
import { cleanEnvelope } from './freunde.js';

const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Message → code. */
export async function encodeEnvelope(env) {
  return toB64(await pipe(new TextEncoder().encode(JSON.stringify(env)), new CompressionStream('deflate-raw')));
}

/** Code → message (cleaned), or null when the link is broken. */
export async function decodeEnvelope(code) {
  try {
    const bytes = await pipe(fromB64(decodeURIComponent(String(code))), new DecompressionStream('deflate-raw'));
    return cleanEnvelope(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
