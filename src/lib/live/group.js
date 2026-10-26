/**
 * Gruppen-Live-Karte (Noah 25.10.2026 «b»): a ride with friends on one map.
 *
 * On the live map «Invite the group» makes a group and a link to send by WhatsApp or SMS. Friends open
 * the link in the browser (no app, no sign-in, the guest page #/gruppe/<gid>/<key>). Only who taps
 * «Share my location» is on the map; everyone sees all members with name, km along the route and
 * «last seen X min ago». The group ends by itself after GROUP_HOURS (Redis deletes it with all places),
 * or at once when its maker ends it; a member can stop sharing and is gone.
 *
 * Sealed like the family link (spur/link.js): the group key is made on the device and travels only after
 * the # of the link, which no browser sends to a server. The server (/api/sync?action=group,
 * api/_lib/spur.js makeGroupHandler) keeps sealed names and places it cannot read.
 * Pure apart from fetch and crypto, tested in tests/group.test.js and tests/group-server.test.js.
 */
import { seal, unseal, newKey, LinkError, cutEnds, SPUR_URL } from '../spur/link.js';
import { encodePolyline, decodePolyline, simplify, distKm } from '../spur/polyline.js';
import { lineKm, snap } from '../race/race.js';
import { gpxOf } from '../tools/geo.js';

export const GROUP_URL = SPUR_URL.replace('action=spur', 'action=group');
/** Settings key of the live map's own group { gid, key, del, end, mid?, mdel?, name }. */
export const GROUP_KEY = 'live-group';
/** How long a group lives (hours; the server's most). */
export const GROUP_HOURS = 24;
/** How often a place is sent and the members are read (the server's daily cap: one call each time). */
export const GROUP_EVERY_MS = 2 * 60_000;
/** A member older than this is drawn pale («last seen …»); older than GONE_MIN not at all. */
export const STALE_MIN = 15;
export const GONE_MIN = 6 * 60;
/** A member further off the route than this gets no km along it. */
export const OFF_ROUTE_KM = 2;
export const NAME_MAX = 40;
export const GROUP_V = 1;

const r5 = (v) => Math.round(v * 1e5) / 1e5;
export const cleanName = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

/* ---------- the link ---------- */

/** «…#/gruppe/<gid>/<key>» → { gid, key } or null. */
export function parseGroupLink(hash = '') {
  const m = /^#\/gruppe\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\/?$/.exec(hash);
  return m ? { gid: m[1], key: m[2] } : null;
}
export const groupLinkOf = (gid, key, base = `${location.origin}${location.pathname}`) => `${base}#/gruppe/${gid}/${key}`;

/** The text of the invitation, and the WhatsApp and SMS links with it. */
export function inviteLinks(text) {
  const q = encodeURIComponent(text);
  return { whatsapp: `https://wa.me/?text=${q}`, sms: `sms:?&body=${q}` };
}

/* ---------- what is sealed ---------- */

/**
 * The route for the group: { v, t, km, l } (the line thinned; the first and last 500 m left out, so
 * home is not on the map). route: { line: [[lat, lon]], km }.
 */
export function routePayload(title, route) {
  const line = Array.isArray(route?.line) ? route.line.filter((p) => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1])) : [];
  if (line.length < 2) return { v: GROUP_V, t: String(title ?? '').slice(0, 120), km: 0, l: '' };
  const cut = cutEnds([simplify(line.map((p) => [p[0], p[1]]), 20)])[0];
  return { v: GROUP_V, t: String(title ?? '').slice(0, 120), km: Number(route.km) || 0, l: cut.length >= 2 ? encodePolyline(cut) : '' };
}

/** The opened route → { title, route: { line, km } | null }. */
export function readRoute(obj) {
  if (!obj || obj.v !== GROUP_V) return { title: '', route: null };
  const line = obj.l ? decodePolyline(obj.l) : [];
  return { title: String(obj.t ?? ''), route: line.length >= 2 ? { line, km: Number(obj.km) || 0 } : null };
}

/** One member's place: { v, n, lat, lon, at, w? } (w: 1 while «I am waiting here»). */
export function placePayload(name, here, now = Date.now(), { wait = false } = {}) {
  return { v: GROUP_V, n: cleanName(name), lat: r5(here.lat), lon: r5(here.lon), at: new Date(Number.isFinite(here.at) ? here.at : now).toISOString(), ...(wait ? { w: 1 } : {}) };
}

/** An opened place → { name, pos, at } or null. */
export function readPlace(obj) {
  if (!obj || obj.v !== GROUP_V || !Number.isFinite(obj.lat) || !Number.isFinite(obj.lon) || !Number.isFinite(Date.parse(obj.at))) return null;
  return { name: cleanName(obj.n), pos: [obj.lat, obj.lon], at: obj.at, wait: obj.w === 1 };
}

/** «I am waiting here» ends by itself once you rode on this far from the place where you waited (km). */
export const WAIT_LEAVE_KM = 0.3;
/** Still waiting? wait: { lat, lon } where «I am waiting here» was tapped, or null. */
export const stillWaiting = (wait, here) => !!wait && (!here || distKm([wait.lat, wait.lon], [here.lat, here.lon]) < WAIT_LEAVE_KM);

/** The route as a GPX file for friends (the line the group got, ends already left out). */
export const groupGpx = (title, route) => (route?.line?.length > 1 ? gpxOf(route.line, title || 'Gruppenfahrt') : '');
/** A file name for it: letters, digits and dashes only. */
export const gpxName = (title) => `${String(title || 'gruppenfahrt').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'gruppenfahrt'}.gpx`;

/** Is a place near the route's start or end (home)? Then the maker's own place is not sent. */
export function nearHome(route, here, km = 0.5) {
  const line = route?.line ?? [];
  if (line.length < 2 || !here) return false;
  return [line[0], line.at(-1)].some((p) => distKm(p, [here.lat, here.lon]) < km);
}

/* ---------- the list ---------- */

/** Minutes since a time (never below 0). */
export const minutesAgo = (at, now = Date.now()) => Math.max(0, Math.floor((now - Date.parse(at)) / 60_000));

/**
 * The members for the list and the map: [{ m, name, pos, at, ago, stale, km }], the newest first.
 * places: [{ m, name, pos, at }]; route: { line, km } or null; me: own member id (marked `me`).
 */
export function memberRows(places = [], route = null, { now = Date.now(), me = null } = {}) {
  const pts = route ? lineKm(route) : [];
  return places
    .filter((p) => p && minutesAgo(p.at, now) <= GONE_MIN)
    .map((p) => {
      const s = pts.length > 1 ? snap(pts, { lat: p.pos[0], lon: p.pos[1] }) : null;
      const ago = minutesAgo(p.at, now);
      return { ...p, ago, stale: ago > STALE_MIN, km: s && Number.isFinite(s.offKm) && s.offKm <= OFF_ROUTE_KM ? Math.round(s.km * 10) / 10 : null, me: !!me && p.m === me };
    })
    .sort((a, b) => a.ago - b.ago || String(a.name).localeCompare(String(b.name)));
}

/* ---------- the server ---------- */

async function call(method, { step = null, gid = null, query = {}, body = null, doFetch = (...a) => fetch(...a), url = GROUP_URL } = {}) {
  const u = new URL(url);
  if (step) u.searchParams.set('step', step);
  if (gid) u.searchParams.set('gid', gid);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
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

async function openPlaces(members, key) {
  const out = [];
  for (const x of members ?? []) {
    const p = readPlace(await unseal(x.e, key));
    if (p) out.push({ m: x.m, ...p });
  }
  return out;
}

/** Make a group (with the route, when there is one). → { gid, key, del, end }. */
export async function createGroup({ title = '', route = null, hours = GROUP_HOURS } = {}, opts = {}) {
  const key = await newKey();
  const body = { hours };
  if (route?.line?.length > 1) body.e = await seal(routePayload(title, route), key);
  else if (title) body.e = await seal(routePayload(title, null), key);
  const d = await call('POST', { ...opts, step: 'new', body });
  return { gid: d.gid, key, del: d.del, end: d.end };
}

/** Read a group → { end, title, route, places }. withRoute false: only the places. */
export async function readGroup(gid, key, { withRoute = true, ...opts } = {}) {
  const d = await call('GET', { ...opts, gid, query: withRoute ? {} : { route: '0' } });
  const r = withRoute && d.e ? readRoute(await unseal(d.e, key)) : { title: '', route: null };
  return { end: d.end, title: r.title, route: r.route, places: await openPlaces(d.members, key) };
}

/**
 * Send my place. me: { mid, mdel } from an earlier call or null. → { mid, mdel, places } (the
 * members after the update, one call for both).
 */
export async function sharePlace(group, me, name, here, opts = {}) {
  const e = await seal(placePayload(name, here, opts.now, { wait: !!opts.wait }), group.key);
  const body = me?.mid && me?.mdel ? { gid: group.gid, mid: me.mid, del: me.mdel, e } : { gid: group.gid, e };
  const d = await call('POST', { ...opts, step: 'put', body });
  return { mid: d.mid, mdel: d.del ?? me?.mdel, places: await openPlaces(d.members, group.key) };
}

/** Stop sharing: my place is deleted from the group. */
export async function leaveGroup(group, me, opts = {}) {
  if (!group?.gid || !me?.mid || !me?.mdel) return;
  await call('POST', { ...opts, step: 'leave', body: { gid: group.gid, mid: me.mid, del: me.mdel } });
}

/** The maker ends the group: all places are deleted at once. */
export async function endGroup(group, opts = {}) {
  if (!group?.gid || !group?.del) return;
  await call('POST', { ...opts, step: 'end', body: { gid: group.gid, del: group.del } });
}

/** Is a kept group still running? */
export const groupRunning = (g, now = Date.now()) => !!g?.gid && !!g?.key && Date.parse(g.end) > now;

/** What a group error says (English keys for t()). */
export const GROUP_ERRORS = {
  network: 'No connection. The group map needs the internet.',
  not_found: 'The group ride has ended. The places are deleted.',
  broken: 'This link is not complete. Ask for it again.',
  too_many: 'Too many updates today. Try again tomorrow.',
  full: 'This group is full.',
  daily_cap: 'The server has done enough for today. It works again tomorrow.',
  storage_not_set_up: 'The share server is not ready yet.',
  server_error: 'The share server did not answer. Try again later.',
};

/** Up to two initials of a name (for the dot on the map). */
export const initials = (name) =>
  String(name ?? '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/** After the ride: end the kept group of the live map (all places deleted). → true when one ran. */
export async function endKeptGroup(db, opts = {}) {
  const g = (await db.settings.get(GROUP_KEY))?.value ?? null;
  if (!g) return false;
  try {
    await endGroup(g, opts);
  } catch {
    /* offline or gone: the server deletes it at the latest after GROUP_HOURS */
  }
  await db.settings.delete(GROUP_KEY);
  return groupRunning(g);
}

/** A small sign per kind of stop, for the dots and the list on the friends' page. */
export const STOP_GLYPH = { water: '💧', food: '🍽', shop: '🛒', fuel: '⛽', toilet: 'WC', atm: '¤', pharmacy: '✚', repair: '🔧', bike: '🚲', station: '🚉', sleep: '🛏', shelter: '⛺' };
