/**
 * Paket S «Reise-Spur» (Noah 19.10.2026 «4a»): the read-only link of a tour for the family, no account.
 *
 * What goes in (chosen when the link is made): the line per day, the km, the «Hier bin ich» places
 * with their text, and the notes' texts only when ticked. Never a photo (answer 3a: photos stay on
 * the device). Start and end of the whole tour can be cut by 500 m, so the link does not show
 * where you live.
 *
 * Sealed on the device (AES-GCM 256): the key is made here and travels only after the # of the link,
 * which no browser sends to a server. The server (/api/sync?action=spur, api/_lib/spur.js) keeps the sealed envelope, the device
 * keeps the delete code (trip.spurLink) to update or delete the link.
 * Pure apart from fetch and crypto (both exist in browsers and in Node), tested in tests/spur.test.js.
 */
import { encodePolyline, decodePolyline, simplify, distKm } from './polyline.js';
import { zurichTime } from './spur.js';

export const SPUR_URL = 'https://packgen-three.vercel.app/api/sync?action=spur';
export const CUT_KM = 0.5;
export const LINK_V = 1;

const r5 = (v) => Math.round(v * 1e5) / 1e5;

/** Drop the first and the last `km` of a list of lines (in order), so home is not on the map. */
export function cutEnds(lines, km = CUT_KM) {
  const out = lines.map((l) => l.slice());
  const trim = (fromEnd) => {
    let left = km;
    const order = fromEnd ? [...out.keys()].reverse() : [...out.keys()];
    for (const i of order) {
      const l = fromEnd ? out[i].reverse() : out[i];
      while (l.length >= 2 && left > 0) {
        const d = distKm(l[0], l[1]);
        if (d <= left) {
          left -= d;
          l.shift();
        } else {
          const u = left / d;
          l[0] = [l[0][0] + (l[1][0] - l[0][0]) * u, l[0][1] + (l[1][1] - l[0][1]) * u];
          left = 0;
        }
      }
      if (fromEnd) out[i].reverse();
      if (left <= 0) break;
      if (l.length < 2) out[i] = [];
    }
  };
  trim(false);
  trim(true);
  return out;
}

/**
 * The small object behind the link. spur: tourSpur(); opts: { places, notes, cut }.
 * { v, t, d, n, km, at, days: [{ d, km, l: [polyline], p: [[lat, lon, 'HH:MM', text]], x: [['HH:MM', text, lat?, lon?]] }] }
 */
export function linkPayload(trip, spur, { places = true, notes = false, cut = true } = {}, now = new Date()) {
  const days = spur.days.map((d) => ({ d: d.day, km: d.km, lines: d.lines.filter((l) => !l.hidden && l.pts.length >= 2).map((l) => simplify(l.pts, 12)), day: d }));
  if (cut) {
    const flat = days.flatMap((x) => x.lines);
    const cutLines = cutEnds(flat);
    let k = 0;
    for (const x of days) x.lines = x.lines.map(() => cutLines[k++]).filter((l) => l.length >= 2);
  }
  const near = (pos) => {
    if (!cut || !pos) return false;
    const all = days.flatMap((x) => x.lines);
    const first = spur.days.flatMap((d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2))[0]?.pts[0];
    const last = spur.days.flatMap((d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2)).at(-1)?.pts.at(-1);
    return all.length > 0 && [first, last].some((e) => e && distKm(e, pos) < CUT_KM);
  };
  const time = (at) => (at ? zurichTime(Date.parse(at)) : '');
  return {
    v: LINK_V,
    t: String(trip.title ?? '').slice(0, 120),
    d: trip.startDate ?? null,
    n: spur.days.length,
    km: spur.km,
    at: now.toISOString(),
    days: days.map((x) => ({
      d: x.d,
      km: x.km,
      l: x.lines.map((l) => encodePolyline(l)),
      p: places ? x.day.places.filter((p) => p.pos && !near(p.pos)).map((p) => [r5(p.pos[0]), r5(p.pos[1]), time(p.at), String(p.text ?? '').slice(0, 500)]) : [],
      x: notes ? x.day.notes.filter((m) => String(m.text ?? '').trim()).map((m) => (m.pos && !near(m.pos) ? [time(m.at), String(m.text).slice(0, 500), r5(m.pos[0]), r5(m.pos[1])] : [time(m.at), String(m.text).slice(0, 500)])) : [],
    })),
  };
}

/** The payload back into lines for the viewer (or null when it is not one). */
export function readPayload(obj) {
  if (!obj || obj.v !== LINK_V || !Array.isArray(obj.days)) return null;
  return {
    title: String(obj.t ?? ''),
    start: obj.d ?? null,
    km: Number(obj.km) || 0,
    at: obj.at ?? null,
    days: obj.days.map((x, i) => ({
      day: String(x.d ?? ''),
      n: i + 1,
      km: Number(x.km) || 0,
      lines: (x.l ?? []).map((s) => decodePolyline(s)).filter((l) => l.length >= 2),
      places: (x.p ?? []).map(([lat, lon, time, text]) => ({ pos: [lat, lon], time, text })),
      notes: (x.x ?? []).map(([time, text, lat, lon]) => ({ time, text, pos: Number.isFinite(lat) ? [lat, lon] : null })),
    })),
  };
}

/* ---------- sealing ---------- */

const b64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

/** A new key (43 characters for the link). */
export async function newKey() {
  const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return b64(new Uint8Array(await crypto.subtle.exportKey('raw', k)));
}

const importKey = (text) => crypto.subtle.importKey('raw', unb64(text), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

/** Object → sealed envelope (packed small, then AES-GCM; iv in front). */
export async function seal(obj, keyText) {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(obj)), new CompressionStream('deflate-raw'));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(keyText), packed));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv);
  all.set(ct, iv.length);
  return b64(all);
}

/** Sealed envelope → object, or null (wrong key, broken link). */
export async function unseal(envelope, keyText) {
  try {
    const all = unb64(envelope);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, await importKey(keyText), all.subarray(12));
    return JSON.parse(new TextDecoder().decode(await pipe(new Uint8Array(pt), new DecompressionStream('deflate-raw'))));
  } catch {
    return null;
  }
}

/* ---------- the link ---------- */

/** «…#/spur-link/<id>/<key>» → { id, key } or null. */
export function parseLink(hash = '') {
  const m = /^#\/spur-link\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\/?$/.exec(hash);
  return m ? { id: m[1], key: m[2] } : null;
}

export const linkOf = (id, key, base = `${location.origin}${location.pathname}`) => `${base}#/spur-link/${id}/${key}`;

export class LinkError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

async function call(method, { step = null, id = null, body = null, doFetch = (...a) => fetch(...a), url = SPUR_URL } = {}) {
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
 * Make or update the link of a trip. old: trip.spurLink { id, key, del } or null.
 * → { id, key, del, at } (keep it on the trip).
 */
export async function putLink(payload, old = null, opts = {}) {
  const key = old?.key ?? (await newKey());
  const e = await seal(payload, key);
  if (old?.id && old?.del) {
    try {
      const d = await call('POST', { ...opts, step: 'put', body: { id: old.id, del: old.del, e } });
      return { id: old.id, key, del: old.del, at: d.at };
    } catch (err) {
      if (err.code !== 'not_found') throw err;
      // expired or deleted elsewhere: a new link
    }
  }
  const fresh = old?.id ? await newKey() : key;
  const e2 = fresh === key ? e : await seal(payload, fresh);
  const d = await call('POST', { ...opts, step: 'put', body: { e: e2 } });
  return { id: d.id, key: fresh, del: d.del, at: d.at };
}

/** Delete a link (an unknown link counts as deleted). */
export async function deleteLink(link, opts = {}) {
  if (!link?.id || !link?.del) return;
  await call('POST', { ...opts, step: 'delete', body: { id: link.id, del: link.del } });
}

/** The viewer: fetch and open the tour behind a link → readPayload() or throws LinkError. */
export async function openLink(id, key, opts = {}) {
  const d = await call('GET', { ...opts, id });
  const obj = readPayload(await unseal(d.e, key));
  if (!obj) throw new LinkError('broken');
  return obj;
}

/** What a link error says to the reader (English keys for t()). */
export const LINK_ERRORS = {
  network: 'No connection. The link needs the internet once.',
  not_found: 'This link was deleted or has expired.',
  broken: 'This link is not complete. Ask for it again.',
  too_many: 'Too many links today. Try again tomorrow.',
  storage_not_set_up: 'The share server is not ready yet.',
  server_error: 'The share server did not answer. Try again later.',
};
