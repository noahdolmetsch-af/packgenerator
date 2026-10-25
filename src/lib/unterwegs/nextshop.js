// «Nächster Laden» on Unterwegs: the next shop ahead of km among the stops loaded along the route.
/** pois: [{ kind, name, km }] (km along the whole route); km: where you are. Returns { name, dist } or null. */
export function nextShopOf(pois = [], km = null, rangeKm = 80) {
  if (!Number.isFinite(km)) return null;
  let best = null;
  for (const p of pois) {
    if (p?.kind !== 'shop' || !Number.isFinite(p.km) || p.km < km - 0.1 || p.km - km > rangeKm) continue;
    if (!best || p.km < best.km) best = p;
  }
  return best ? { name: best.name || '', dist: Math.max(0, Math.round((best.km - km) * 10) / 10) } : null;
}
