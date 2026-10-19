/**
 * P8 «Automatischer Abgleich»: the pairing code and what the devices make of it.
 *
 * The code (20 random bytes, 32 letters and digits) is the one secret both devices share. From it each
 * device derives, with HKDF:
 * - the token it shows the server (the server keeps only sha256 of it as the name of the space);
 * - the AES-GCM key that seals every record before it leaves the device;
 * - an HMAC key that turns «table + id» into an opaque name, so the server does not see ids either.
 * The code stays on the devices (meta table, never exported); a lost code means pairing again.
 */

const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
export const CODE_BYTES = 20;

/** 20 random bytes as 8 groups of 4, e.g. "7K2M-…". */
export function newCode(rand = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  return formatCode(encode(rand(CODE_BYTES)));
}

function encode(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHA[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHA[(value << (5 - bits)) & 31];
  return out;
}

const formatCode = (s) => s.match(/.{1,4}/g).join('-');

/** A typed or pasted code (any case, with or without dashes and spaces) → its normal form, or null. */
export function readCode(text) {
  const s = String(text ?? '')
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (s.length !== 32 || [...s].some((c) => !ALPHA.includes(c))) return null;
  return formatCode(s);
}

function decode(code) {
  const s = code.replace(/-/g, '');
  const out = [];
  let bits = 0;
  let value = 0;
  for (const c of s) {
    value = (value << 5) | ALPHA.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out.slice(0, CODE_BYTES));
}

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** The keys of a code: { token, seal, name } (token: 64 hex; seal: AES-GCM key; name: HMAC key). */
export async function keysOf(code) {
  const norm = readCode(code);
  if (!norm) throw new Error('bad code');
  const base = await crypto.subtle.importKey('raw', decode(norm), 'HKDF', false, ['deriveBits', 'deriveKey']);
  const salt = enc.encode('pack-generator-sync');
  const info = (s) => ({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(s) });
  const token = hex(await crypto.subtle.deriveBits(info('pg-sync-auth'), base, 256));
  const seal = await crypto.subtle.deriveKey(info('pg-sync-enc'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const name = await crypto.subtle.deriveKey(info('pg-sync-rec'), base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  return { token, seal, name };
}

/** The opaque name of a record on the server (32 hex). */
export async function recName(keys, table, id) {
  const sig = await crypto.subtle.sign('HMAC', keys.name, enc.encode(`${table}\u0000${JSON.stringify(id)}`));
  return hex(sig).slice(0, 32);
}

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Seal any JSON value: base64 of 12 bytes IV + AES-GCM ciphertext. */
export async function seal(keys, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keys.seal, enc.encode(JSON.stringify(value))));
  const all = new Uint8Array(12 + data.length);
  all.set(iv);
  all.set(data, 12);
  return toB64(all);
}

/** Open a sealed envelope; null when it is broken or sealed with another code. */
export async function unseal(keys, b64) {
  try {
    const all = fromB64(b64);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, keys.seal, all.subarray(12));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}
