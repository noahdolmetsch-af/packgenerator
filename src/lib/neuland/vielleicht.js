/**
 * «Eine Regel für Pässe» in Neuland (Noah 04.11.2026 «1a»): a pass the line passed between 600 m and 1.2 km
 * from its top is not counted by itself; it is listed as «Maybe ridden: please confirm» (passregel.js).
 * Pure, tested in tests/passregel.test.js. Only the built-in passes (not own entries) are looked at.
 */
import { lineBox, lineKm } from './geo.js';
import { MAYBE_KM, hitLevel } from '../passregel.js';

/**
 * part: a collection { id, items, visited: Map } of computeFrom(); tracks: tracksOf(); nope: state.nope[cid].
 * → [{ id, item, day, tripId, rideId, km }], the earliest day first; never an item that counts already or
 * that you said «not there» to.
 */
export function maybeOf(part, tracks = [], nope = {}) {
  if (part?.id !== 'passes') return [];
  const open = part.items.filter((i) => !i.own && Number.isFinite(i.lat) && Number.isFinite(i.lon) && !part.visited.has(i.id) && !nope[i.id]);
  if (!open.length) return [];
  const pad = MAYBE_KM / 70;
  const out = new Map();
  for (const tr of tracks) {
    const box = lineBox(tr.pts);
    for (const it of open) {
      if (it.lat < box[0] - pad || it.lat > box[2] + pad || it.lon < box[1] - pad * 1.5 || it.lon > box[3] + pad * 1.5) continue;
      const d = lineKm([it.lat, it.lon], tr.pts);
      if (hitLevel(d) !== 'maybe') continue;
      const cur = out.get(it.id);
      if (!cur || tr.day < cur.day) out.set(it.id, { id: it.id, item: it, day: tr.day, tripId: tr.tripId ?? null, rideId: tr.rideId ?? null, km: Math.min(d, cur?.km ?? Infinity) });
      else cur.km = Math.min(cur.km, d);
    }
  }
  return [...out.values()].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.item.name.localeCompare(b.item.name, 'de')));
}
