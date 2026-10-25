/**
 * Paket P8 «Fotoalbum» (Noah 21.10.2026 «7a», mockups design/fotoalbum): all photos of the app on one page, by month and
 * by place. Album photos are your own (added here or under Was mir gut tut, photos table with album: true); bike photos
 * (setup, wear, before packing) and the photos of notes on a trip come by themselves and are changed where they live.
 * An album photo: { id, album: true, data, name (caption), place, day, addedAt, greet (false: not on Heute) }.
 * Pure functions, tested in tests/fotoalbum.test.js.
 */

/** The filter chips, in this order (English keys for t()). */
export const KINDS = [
  { key: 'all', name: 'All|photos' },
  { key: 'album', name: 'Album|photos' },
  { key: 'bike', name: 'Bike|photos' },
  { key: 'tour', name: 'Trip|photos' },
];

const dayOf = (...xs) => {
  for (const x of xs) if (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x)) return x.slice(0, 10);
  return '';
};

/**
 * Every photo of the app as one list, newest first:
 * [{ id, src, kind: 'album'|'bike'|'tour', sub: 'setup'|'wear'|'pack'|'note'|'', day, month, place, caption, greet, rec, href }].
 * photos: the photos table; notes: the notes (a photo on a note of a trip is a trip photo); trips, bikes: for the names.
 */
export function allPhotos({ photos = [], notes = [], trips = [], bikes = [] } = {}) {
  const bikeName = Object.fromEntries(bikes.map((b) => [b.id, b.name ?? '']));
  const trip = Object.fromEntries(trips.map((x) => [x.id, x]));
  const out = [];
  for (const p of photos) {
    if (!p?.data) continue;
    if (p.album) {
      out.push({ id: p.id, src: p.data, kind: 'album', sub: '', day: dayOf(p.day, p.addedAt), place: String(p.place ?? '').trim(), caption: String(p.name ?? '').trim(), greet: p.greet !== false, rec: p, href: '' });
    } else if (p.bikeId) {
      const sub = p.wear ? 'wear' : p.pack ? 'pack' : 'setup';
      out.push({ id: p.id, src: p.data, kind: 'bike', sub, day: dayOf(p.day, p.date, p.addedAt), place: bikeName[p.bikeId] ?? '', caption: String(p.name ?? '').trim(), greet: false, rec: p, href: `#/bikes?bike=${encodeURIComponent(p.bikeId)}` });
    }
  }
  for (const n of notes) {
    const tr = n?.tripId ? trip[n.tripId] : null;
    if (!tr || n.trashedAt) continue;
    const list = [n.photo, ...(n.photos ?? [])].filter(Boolean);
    list.forEach((src, i) =>
      out.push({ id: `note:${n.id}:${i}`, src, kind: 'tour', sub: 'note', day: dayOf(n.at), place: String(tr.title ?? '').trim(), caption: String(n.text ?? n.title ?? '').trim().slice(0, 80), greet: false, rec: null, href: `#/debrief/${encodeURIComponent(tr.id)}` }),
    );
  }
  for (const x of out) x.month = x.day.slice(0, 7);
  return out.sort((a, b) => b.day.localeCompare(a.day) || String(b.id).localeCompare(String(a.id)));
}

/** How many per kind: { all, album, bike, tour }. */
export function countKinds(list = []) {
  const c = { all: list.length, album: 0, bike: 0, tour: 0 };
  for (const x of list) if (x.kind in c) c[x.kind] += 1;
  return c;
}

/** The photos of one kind ('all' = every one). */
export const ofKind = (list, kind = 'all') => (kind === 'all' ? list : list.filter((x) => x.kind === kind));

/** By month, newest first: [{ key: 'YYYY-MM' | '', places: ['…'], photos }]. A photo without a date goes last. */
export function byMonth(list = []) {
  const m = new Map();
  for (const x of list) {
    if (!m.has(x.month)) m.set(x.month, []);
    m.get(x.month).push(x);
  }
  return [...m.entries()]
    .sort((a, b) => (!a[0] ? 1 : !b[0] ? -1 : b[0].localeCompare(a[0])))
    .map(([key, photos]) => ({ key, places: [...new Set(photos.map((x) => x.place).filter(Boolean))], photos }));
}

/** By place, the place with the most photos first, then A–Z; photos without a place last: [{ key, photos }]. */
export function byPlace(list = []) {
  const m = new Map();
  for (const x of list) {
    const k = x.place || '';
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return [...m.entries()]
    .sort((a, b) => (!a[0] ? 1 : !b[0] ? -1 : b[1].length - a[1].length || a[0].localeCompare(b[0])))
    .map(([key, photos]) => ({ key, photos }));
}

/** The places of the album photos, for the suggestions when you type a place. */
export const placesOf = (list = []) => [...new Set(list.filter((x) => x.kind === 'album' && x.place).map((x) => x.place))].sort((a, b) => a.localeCompare(b));

/** A new album photo record (id with a random part: the clock can stand still in tests). */
export function newAlbumPhoto(data, { day, now = new Date().toISOString(), place = '' } = {}) {
  return { id: `album-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, bikeId: null, tripId: null, album: true, name: '', place: String(place).trim().slice(0, 60), day: day ?? now.slice(0, 10), data, addedAt: now };
}

/** What changes on an album photo: caption, place, day, greet. Other fields stay. */
export function albumPatch({ caption, place, day, greet } = {}) {
  const p = {};
  if (caption != null) p.name = String(caption).trim().slice(0, 60);
  if (place != null) p.place = String(place).trim().slice(0, 60);
  if (day != null && /^\d{4}-\d{2}-\d{2}$/.test(day)) p.day = day;
  if (greet != null) p.greet = !!greet;
  return p;
}

/** The size of all photos in bytes (data URLs: about 3/4 of their length). */
export const sizeOf = (list = []) => Math.round(list.reduce((n, x) => n + String(x.src ?? '').length * 0.75, 0));
