/**
 * «Luftschichten» (shared by «Nebelgrenze» and «Temperaturen nach Höhe», Noah 05.11.2026): ONE request per place for the
 * air layers of the weather model: temperature, humidity and height at nine pressure levels (1000 hPa ≈ 100 m up to
 * 600 hPa ≈ 4200 m above sea level), plus the cloud (low, mid, high), the sight and the temperature and humidity at the
 * ground. 3 days of hours, kept 3 h on this device like the weather core (db.meta, never in a backup); offline the kept
 * answer shows with its time. Whoever needs the air above the place reads it here (loadProfil) and does not ask again:
 *
 * - profile(hour, elev): the surface and the layers above the ground, from low to high → [{ z, t, rh }];
 * - tempAt(points, z): the temperature at a height, linear between the layers (null outside them).
 *
 * Pure apart from loadProfil (db and fetcher are passed in); tested in tests/nebelgrenze.test.js.
 */
import { CORE_MAX_AGE_H, CORE_SHOW_H, OPEN_METEO } from './kern.js';

export const PROFIL_KEY = 'wx-profil:';
/** The pressure levels (hPa) that carry the air layers (about 100, 300, 550, 800, 1000, 1500, 2000, 3000 and 4200 m). */
export const LEVELS = [1000, 975, 950, 925, 900, 850, 800, 700, 600];

const fin = (v) => typeof v === 'number' && Number.isFinite(v);

export const cacheKey = (place) => `${PROFIL_KEY}${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;

/** The Open-Meteo address: 3 days of hours, the low/mid/high cloud, the sight and the layers. */
export function profilUrl(place) {
  const hourly = ['temperature_2m', 'relative_humidity_2m', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high', 'visibility'];
  for (const l of LEVELS) hourly.push(`temperature_${l}hPa`, `relative_humidity_${l}hPa`, `geopotential_height_${l}hPa`);
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(3),
    longitude: Number(place.lon).toFixed(3),
    hourly: hourly.join(','),
    forecast_days: '3',
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  return `${OPEN_METEO}?${q}`;
}

/** Open-Meteo's answer → { elev, offset, hours: [{ ms, t, rh, low, mid, high, vis, lay: [[m, °C, %]] }] }. */
export function parseProfil(j) {
  const h = j?.hourly ?? {};
  const v = (a, i) => (fin(a?.[i]) ? a[i] : null);
  const hours = (h.time ?? []).map((s, i) => ({
    ms: s * 1000,
    t: v(h.temperature_2m, i),
    rh: v(h.relative_humidity_2m, i),
    low: v(h.cloud_cover_low, i),
    mid: v(h.cloud_cover_mid, i),
    high: v(h.cloud_cover_high, i),
    vis: v(h.visibility, i),
    lay: LEVELS.map((l) => [v(h[`geopotential_height_${l}hPa`], i), v(h[`temperature_${l}hPa`], i), v(h[`relative_humidity_${l}hPa`], i)]).filter((p) => p.every((x) => x != null)),
  }));
  return { elev: fin(j?.elevation) ? j.elevation : null, offset: fin(j?.utc_offset_seconds) ? j.utc_offset_seconds : 0, hours };
}

/**
 * The layers for a place: the kept answer when it is fresh, else one request (online). → { at, place, ...fog, old }
 * or null. A failing service keeps the old answer (up to CORE_SHOW_H) and says it is old.
 */
export async function loadProfil(db, place, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false, force = false } = {}) {
  if (!place || !fin(Number(place.lat)) || !fin(Number(place.lon))) return null;
  const key = cacheKey(place);
  const kept = (await db.meta.get(key)) ?? null;
  const fresh = kept && now - kept.at < CORE_MAX_AGE_H * 36e5;
  if ((!fresh || force) && online) {
    try {
      const res = await fetcher(profilUrl(place));
      if (res.ok) {
        const row = { key, at: now, place: { lat: Number(place.lat), lon: Number(place.lon) }, ...parseProfil(await res.json()) };
        await db.meta.put(row);
        return { ...row, old: false };
      }
    } catch {
      /* offline or the service failed: the kept answer below */
    }
  }
  if (kept && now - kept.at < CORE_SHOW_H * 36e5) return { ...kept, old: !fresh };
  return null;
}

/** The profile of an hour: the surface and the layers above the ground, from low to high → [{ z, t, rh }]. */
export function profile(h, elev) {
  const pts = [];
  if (fin(h?.t) && fin(h?.rh) && fin(elev)) pts.push({ z: elev, t: h.t, rh: h.rh });
  for (const [z, t, rh] of h?.lay ?? []) if (!fin(elev) || z > elev + 30) pts.push({ z, t, rh });
  return pts.sort((a, b) => a.z - b.z);
}

/** The temperature at a height, from the profile (linear between the layers); null outside it. */
export function tempAt(pts, z) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (z >= a.z && z <= b.z && b.z > a.z) return a.t + ((b.t - a.t) * (z - a.z)) / (b.z - a.z);
  }
  return null;
}

