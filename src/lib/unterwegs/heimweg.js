/**
 * Paket K «Unterwegs» (#94 «Take me home», #97 «Nächster Zug nach Hause»; Noah 19.10.2026 «1a und b»):
 * one tap shows the next 3 trains from where you are to your home place, right in the app, plus
 * buttons that open the way home by car, by bike or by public transport in Google Maps.
 *
 * - Trains come from transport.opendata.ch (free, no account; decision 19.10.2026).
 * - The location is read only when the button is pressed (decision 10.10.2026); it goes only into the
 *   questions to transport.opendata.ch and the Maps link, and is never stored.
 * - The home place is the device setting «homePlace» ({ name, lat, lon }, Ich › Einstellungen › Wohnort).
 *
 * Pure functions (fetch is passed in), tested in tests/unterwegs-heimweg.test.js.
 */

export const OPENDATA = 'https://transport.opendata.ch/v1';
/** How many connections the list shows (Noah «nächste 3 Züge»). */
export const TRAINS = 3;

const ok = (p) => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lon);
const r5 = (v) => Math.round(v * 1e5) / 1e5;

/** The nearest stations of a place. transport.opendata.ch calls the latitude x and the longitude y. */
export const stationsUrl = (p) => `${OPENDATA}/locations?x=${r5(p.lat)}&y=${r5(p.lon)}&type=station`;

/** The next connections between two stations (ids or names). */
export const connectionsUrl = (from, to, limit = TRAINS) => `${OPENDATA}/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`;

/** The nearest station with an id from a /locations answer, or null. */
export function nearestStation(json) {
  const list = Array.isArray(json?.stations) ? json.stations : [];
  const s = list.find((x) => x && (x.id || x.name));
  return s ? { id: s.id ? String(s.id) : null, name: String(s.name ?? ''), m: Number.isFinite(s.distance) ? Math.round(s.distance) : null } : null;
}

/** «00d01:23:00» → minutes (or null). */
export function durationMin(text) {
  const m = /^(\d+)d(\d\d):(\d\d)/.exec(String(text ?? ''));
  return m ? +m[1] * 1440 + +m[2] * 60 + +m[3] : null;
}

/** Minutes as «1 h 23» or «45 min». */
export const minText = (min) => (min == null ? '' : min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`);

/** An ISO time of the answer («2026-10-19T17:04:00+0200») as «17:04» on the clock of the place (always Swiss time there). */
export const clockOf = (iso) => (typeof iso === 'string' && /T\d\d:\d\d/.test(iso) ? iso.slice(11, 16) : '');

/** The connections of a /connections answer, made small and safe. */
export function parseConnections(json) {
  const list = Array.isArray(json?.connections) ? json.connections : [];
  return list
    .map((c) => {
      const dep = c?.from?.departure ?? null;
      const arr = c?.to?.arrival ?? null;
      if (!dep || !arr) return null;
      const lines = (c.sections ?? [])
        .map((s) => s?.journey)
        .filter(Boolean)
        .map((j) => [j.category, j.number].filter(Boolean).join(' ').trim() || j.name || '')
        .filter(Boolean);
      return {
        dep,
        arr,
        depTime: clockOf(dep),
        arrTime: clockOf(arr),
        from: String(c.from?.station?.name ?? ''),
        to: String(c.to?.station?.name ?? ''),
        platform: c.from?.platform ? String(c.from.platform) : '',
        delay: Number.isFinite(c.from?.delay) && c.from.delay > 0 ? c.from.delay : 0,
        transfers: Number.isFinite(c.transfers) ? c.transfers : Math.max(0, lines.length - 1),
        min: durationMin(c.duration),
        lines: lines.length ? lines : (c.products ?? []).map(String),
      };
    })
    .filter(Boolean);
}

/** «Nach Hause» in Google Maps: mode 'driving' | 'bicycling' | 'transit' | 'walking'. here may be null (Maps asks then). */
export function mapsHomeUrl(here, home, mode = 'driving') {
  const q = new URLSearchParams({ api: '1' });
  if (ok(here)) q.set('origin', `${r5(here.lat)},${r5(here.lon)}`);
  q.set('destination', ok(home) ? `${r5(home.lat)},${r5(home.lon)}` : String(home?.name ?? ''));
  q.set('travelmode', mode);
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/**
 * The trains home: the station nearest to you, the station nearest to home, and the next connections.
 * → { from, to, list } ; throws { code: 'nohome' | 'nostation' | 'same' | 'net' }.
 */
export async function trainsHome(here, home, doFetch = fetch) {
  if (!ok(home)) throw Object.assign(new Error('no home'), { code: 'nohome' });
  if (!ok(here)) throw Object.assign(new Error('no place'), { code: 'nostation' });
  const get = async (url) => {
    let res;
    try {
      res = await doFetch(url);
    } catch {
      throw Object.assign(new Error('net'), { code: 'net' });
    }
    if (!res.ok) throw Object.assign(new Error('net'), { code: 'net' });
    return res.json();
  };
  const [a, b] = await Promise.all([get(stationsUrl(here)), get(stationsUrl(home))]);
  const from = nearestStation(a);
  const to = nearestStation(b);
  if (!from || !to) throw Object.assign(new Error('no station'), { code: 'nostation' });
  if ((from.id && from.id === to.id) || (!from.id && from.name === to.name)) return { from, to, list: [], same: true };
  const list = parseConnections(await get(connectionsUrl(from.id ?? from.name, to.id ?? to.name)));
  return { from, to, list: list.slice(0, TRAINS), same: false };
}
