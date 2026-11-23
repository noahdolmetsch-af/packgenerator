/**
 * «Strasse nass oder trocken» (Wetter-Ausbau F, Noah 22.11.2026 «a»): after rain the road needs some hours to dry. From the rain of
 * the last 24 hours (the weather core keeps yesterday too) and the temperature and wind since, the page says «Road still wet until
 * about 11:00» or «Road dry again». It helps with mudguards and the chain. A guess from the weather model, not a measurement
 * of the road: it says «about», and it stays quiet when it has not rained for a day. Pure functions, tested in tests/wetter-strasse.test.js.
 */
const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const HOUR = 36e5;

/** Rain in one hour that wets a road (mm). */
export const ROAD_WET_MM = 0.2;
/** How far back the rain counts (hours). */
export const LOOK_BACK_H = 24;
/** After this many hours without rain a dry road is no news any more. */
export const QUIET_AFTER_H = 12;

/** Hours a road needs to dry after the rain stopped: the colder the slower; wind helps; below 2 °C it does not dry by itself. */
export function dryHours(tempC, windKmh) {
  if (!fin(tempC)) return 4;
  if (tempC < 2) return Infinity;
  let h = tempC >= 18 ? 2 : tempC >= 10 ? 3 : tempC >= 5 ? 5 : 8;
  if (fin(windKmh) && windKmh >= 20) h -= 1;
  return Math.max(1, h);
}

/**
 * The road now. core: the weather core (hours with ms, rainMm, temp, wind). → null (nothing to say) or
 * { kind: 'raining' } | { kind: 'wet', until (ms | null: it does not dry in the cold) } | { kind: 'dry', since (ms) }.
 */
export function roadState(core, now = Date.now()) {
  const hours = (core?.hours ?? []).filter((h) => h.ms <= now && h.ms >= now - LOOK_BACK_H * HOUR);
  if (!hours.length) return null;
  const wetHour = (h) => fin(h.rainMm) && h.rainMm >= ROAD_WET_MM;
  const current = hours.find((h) => now >= h.ms && now < h.ms + HOUR);
  if (current && wetHour(current)) return { kind: 'raining' };
  const last = [...hours].reverse().find(wetHour);
  if (!last) return null;
  const stopped = last.ms + HOUR;
  const since = hours.filter((h) => h.ms >= stopped);
  const temps = since.map((h) => h.temp).filter(fin);
  const winds = since.map((h) => h.wind).filter(fin);
  const temp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : (current?.temp ?? null);
  const wind = winds.length ? winds.reduce((a, b) => a + b, 0) / winds.length : null;
  const need = dryHours(temp, wind);
  if (!Number.isFinite(need)) return { kind: 'wet', until: null };
  const dryAt = stopped + need * HOUR;
  if (dryAt > now) return { kind: 'wet', until: dryAt };
  return now - stopped < QUIET_AFTER_H * HOUR ? { kind: 'dry', since: dryAt } : null;
}
