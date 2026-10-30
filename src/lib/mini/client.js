/**
 * Mini-Tools (Noah 28.10.2026 «1b»): the device side of a question shared by link (server: api/_lib/mini.js).
 *
 * - The question is sealed with a link key (spur/link.js seal), which travels only after the # of the link.
 * - The maker also makes a key pair (ECDH P-256). The public half goes inside the sealed question; the private
 *   half stays on the maker's device. Each answer is sealed on the answering device for that public key only:
 *   other people with the link cannot read it, and neither can the server.
 * Pure apart from fetch and crypto (both exist in browsers and in Node), tested in tests/mini-server.test.js.
 */
import { seal, unseal, newKey, LinkError, SPUR_URL } from '../spur/link.js';

export const MINI_URL = SPUR_URL.replace('action=spur', 'action=mini');
export const MINI_DAYS = 30;

const b64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64 = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
const EC = { name: 'ECDH', namedCurve: 'P-256' };

/** A new key pair → { pub (text for the question), priv (JWK, kept on the maker's device) }. */
export async function newPair() {
  const k = await crypto.subtle.generateKey(EC, true, ['deriveKey']);
  return { pub: b64(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))), priv: await crypto.subtle.exportKey('jwk', k.privateKey) };
}

const aesFrom = (privateKey, publicKey, use) => crypto.subtle.deriveKey({ name: 'ECDH', public: publicKey }, privateKey, { name: 'AES-GCM', length: 256 }, false, [use]);

/** An answer → sealed for the maker's public key only (my one-time public key, iv and the text, packed). */
export async function sealFor(obj, pubText) {
  const owner = await crypto.subtle.importKey('raw', unb64(pubText), EC, false, []);
  const mine = await crypto.subtle.generateKey(EC, true, ['deriveKey']);
  const key = await aesFrom(mine.privateKey, owner, 'encrypt');
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(obj)), new CompressionStream('deflate-raw'));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, packed));
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', mine.publicKey));
  const all = new Uint8Array(pub.length + iv.length + ct.length);
  all.set(pub);
  all.set(iv, pub.length);
  all.set(ct, pub.length + iv.length);
  return b64(all);
}

/** A sealed answer → object, or null (not for this key, broken). */
export async function openWith(envelope, privJwk) {
  try {
    const all = unb64(envelope);
    const theirs = await crypto.subtle.importKey('raw', all.subarray(0, 65), EC, false, []);
    const mine = await crypto.subtle.importKey('jwk', privJwk, EC, false, ['deriveKey']);
    const key = await aesFrom(mine, theirs, 'decrypt');
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(65, 77) }, key, all.subarray(77));
    return JSON.parse(new TextDecoder().decode(await pipe(new Uint8Array(pt), new DecompressionStream('deflate-raw'))));
  } catch {
    return null;
  }
}

async function call(method, { step = null, id = null, body = null, doFetch = (...a) => fetch(...a), url = MINI_URL } = {}) {
  const u = new URL(url);
  if (step) u.searchParams.set('step', step);
  if (id) u.searchParams.set('id', id);
  let res;
  try {
    res = await doFetch(String(u), { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new LinkError('network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new LinkError(data?.code ?? (res.status === 404 ? 'not_found' : 'server_error'));
  return data;
}

/**
 * Put a question on the server. question: { kind, title, … } (the public key is added here).
 * → { id, key, del, end, priv } (keep all of it on the maker's device).
 */
export async function createQuestion(question, { days = MINI_DAYS, ...opts } = {}) {
  const key = await newKey();
  const pair = await newPair();
  const e = await seal({ ...question, pk: pair.pub }, key);
  const d = await call('POST', { ...opts, step: 'new', body: { e, days } });
  return { id: d.id, key, del: d.del, end: d.end, priv: pair.priv, pub: pair.pub };
}

/** The maker changes the question (e.g. its title). srv: { id, key, del, pub }. */
export async function editQuestion(srv, question, opts = {}) {
  const e = await seal({ ...question, pk: srv.pub }, srv.key);
  await call('POST', { ...opts, step: 'edit', body: { id: srv.id, del: srv.del, e } });
}

/** Anyone with the link: the question → { end, question } (question null when the link is broken). */
export async function openQuestion(id, key, opts = {}) {
  const d = await call('GET', { ...opts, id });
  return { end: d.end, n: Number(d.n) || 0, question: await unseal(d.e, key) };
}

/** The maker: all answers, opened → { end, answers: [{ a, at, ...answer }] } (unreadable ones left out). */
export async function readAnswers(srv, opts = {}) {
  const d = await call('POST', { ...opts, step: 'read', body: { id: srv.id, del: srv.del } });
  const answers = [];
  for (const x of d.answers ?? []) {
    const v = await openWith(x.e, srv.priv);
    if (v && typeof v === 'object') answers.push({ ...v, a: x.a, at: x.at, t0: x.t0 ?? x.at });
  }
  return { end: d.end, answers };
}

/** Send my answer (mine: { aid, del } from an earlier answer, or null). → { aid, del, at }. */
export async function sendAnswer(id, pub, answer, mine = null, opts = {}) {
  const e = await sealFor(answer, pub);
  const body = mine?.aid && mine?.del ? { id, aid: mine.aid, del: mine.del, e } : { id, e };
  const d = await call('POST', { ...opts, step: 'answer', body });
  return { aid: d.aid, del: d.del ?? mine?.del, at: d.at };
}

/** The maker ends the question: everything on the server is deleted (an unknown question counts as ended). */
export async function endQuestion(srv, opts = {}) {
  if (!srv?.id || !srv?.del) return;
  await call('POST', { ...opts, step: 'end', body: { id: srv.id, del: srv.del } });
}

/** My place among all answers, by when they came in first (sign-up list). mine: { aid, del } → { pos, n }. */
export async function myPlace(id, mine, opts = {}) {
  const d = await call('POST', { ...opts, step: 'place', body: { id, aid: mine.aid, del: mine.del } });
  return { pos: d.pos, n: d.n };
}

/** I take my answer back (it is deleted on the server). */
export async function leaveAnswer(id, mine, opts = {}) {
  await call('POST', { ...opts, step: 'leave', body: { id, aid: mine.aid, del: mine.del } });
}

/** The maker takes one answer off the list (back: true puts it on again, for Undo). */
export async function dropAnswer(srv, aid, { back = false, ...opts } = {}) {
  await call('POST', { ...opts, step: 'drop', body: { id: srv.id, del: srv.del, aid, back } });
}

/** «…#/mitmachen/<id>/<key>» → { id, key } or null. */
export function parseJoinLink(hash = '') {
  const m = /^#\/mitmachen\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\/?$/.exec(hash);
  return m ? { id: m[1], key: m[2] } : null;
}
export const joinLinkOf = (id, key, base = `${location.origin}${location.pathname}`) => `${base}#/mitmachen/${id}/${key}`;

/** What an error says (English keys for t()). */
export const MINI_ERRORS = {
  network: 'No connection. This needs the internet once.',
  not_found: 'This question has ended. The answers are deleted.',
  broken: 'This link is not complete. Ask for it again.',
  too_many: 'Too many answers today. Try again tomorrow.',
  full: 'This question has enough answers.',
  forbidden: 'This answer was sent from another device.',
  gone: 'Your answer is not there any more.',
  daily_cap: 'The server has done enough for today. It works again tomorrow.',
  storage_not_set_up: 'The share server is not ready yet.',
  server_error: 'The share server did not answer. Try again later.',
};
