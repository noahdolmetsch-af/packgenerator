/**
 * Erinnerungen aufs Handy (Web-Push, Noah 15.10.2026 «1a 2b 3a 4b 5a», 18.10.2026 «2b» cron-job.org):
 * sending one push message without a library, with node:crypto only.
 *
 * - VAPID (RFC 8292): a short ES256 token that tells the push service (Google for Chrome on Android)
 *   that the message comes from this server. Paket B: the server makes the key pair itself and keeps
 *   it in Upstash (api/push.js vapidKeys; VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in Vercel only as an
 *   override), base64url like the browser's PushManager wants it. The subject is an https address
 *   (RFC 8292 allows it), so no e-mail address is needed in the public repo.
 * - The message is encrypted for the one phone (RFC 8291, «aes128gcm»): only that browser can read it,
 *   the push service only passes it on.
 */
import { createECDH, createCipheriv, createPrivateKey, hkdfSync, randomBytes, sign } from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const fromB64u = (s) => Buffer.from(String(s ?? ''), 'base64url');
const hkdf = (ikm, salt, info, len) => Buffer.from(hkdfSync('sha256', ikm, salt, info, len));

/** A new VAPID key pair (base64url): public = the 65-byte point, private = the 32-byte d. */
export function newVapidKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
}

/** Is this a usable key pair (right lengths)? */
export const vapidOk = (v) => fromB64u(v?.publicKey).length === 65 && fromB64u(v?.privateKey).length === 32 && /^(mailto:|https:)/.test(v?.subject ?? '');

/** The Authorization header for one push service (aud = its origin), valid 12 hours. */
export function vapidHeader(endpoint, { publicKey, privateKey, subject }, now = Date.now()) {
  const enc = (o) => b64u(JSON.stringify(o));
  const head = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })}`;
  const pub = fromB64u(publicKey);
  const key = createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
  const sig = sign('sha256', Buffer.from(head), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${b64u(sig)}, k=${publicKey}`;
}

/**
 * The encrypted body for one subscription (keys.p256dh, keys.auth from the browser).
 * salt and the server's key pair are new for every message; tests may pass their own.
 */
export function encrypt(text, keys, { salt = randomBytes(16), ecdh = null } = {}) {
  const ua = fromB64u(keys?.p256dh);
  const authSecret = fromB64u(keys?.auth);
  if (ua.length !== 65 || authSecret.length < 16) throw new Error('bad subscription keys');
  const as = ecdh ?? createECDH('prime256v1');
  if (!ecdh) as.generateKeys();
  const asPub = as.getPublicKey();
  const shared = as.computeSecret(ua);
  const ikm = hkdf(shared, authSecret, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(text, 'utf8'), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const head = Buffer.alloc(21);
  salt.copy(head, 0);
  head.writeUInt32BE(4096, 16);
  head.writeUInt8(asPub.length, 20);
  return Buffer.concat([head, asPub, body]);
}

/**
 * Send one message. → the push service's status: 201 sent; 404/410 the phone is gone (delete it).
 * payload: { title, body, url, tag }.
 */
export async function sendPush(sub, payload, vapid, { doFetch = (...a) => fetch(...a), ttl = 6 * 3600, now = Date.now() } = {}) {
  const res = await doFetch(sub.endpoint, {
    method: 'POST',
    headers: { TTL: String(ttl), Urgency: 'normal', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', Authorization: vapidHeader(sub.endpoint, vapid, now) },
    body: encrypt(JSON.stringify(payload), sub.keys),
  });
  return res.status;
}
