/**
 * Paket Y «Wetter-Kern» (Noah 20.10.2026 «1-5a», «1-8 alle»): ONE weather core for the whole app. It asks
 * Open-Meteo (free, no key, fair use) once per place for 16 days of hours, keeps the answer on this device
 * (db.meta, never in a backup) for 3 hours, and works out what each place of the app needs:
 *
 * - dayLine: the day in one line (low/high, first rain, strongest wind and where from);
 * - warningsOf: thunderstorm, storm, ice (around 0 °C with wet), heat, fog, snow;
 * - bestWindows (1a): the best day and start time for a ride of n hours in the next days;
 * - packHints: clothes by temperature, rain, wind and the cold morning against the warm midday;
 * - foehnBise, trainInstead («Heute lieber Zug?»), outdoorOk (the outdoor suggestion).
 *
 * Wind against your way (head-/tailwind along a route) stays in map/wxline.js (windParts, bearing);
 * this core gives it the hours. Everything is a suggestion: never a rating of danger (avalanches come
 * from the SLF bulletin, shown as it is), always switchable. Pure functions; loadCore takes the db and
 * a fetcher for tests. Tested in tests/wetter-kern.test.js.
 */

export const CORE_KEY = 'wx-core:';
export const CORE_MAX_AGE_H = 3;
/** Offline a kept answer is still shown up to this age (with its time). */
export const CORE_SHOW_H = 24;
export const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
export const HOURLY = ['temperature_2m', 'apparent_temperature', 'precipitation_probability', 'precipitation', 'weather_code', 'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m', 'cape', 'freezing_level_height', 'visibility', 'snowfall', 'snow_depth'];
export const DAILY = ['sunrise', 'sunset', 'uv_index_max'];

/** The limits (all km/h, °C, mm, %). Changed here, they change everywhere. */
export const LIMITS = {
  rainP: 50, // a rain chance worth a word
  rainMm: 0.3, // or this much in the hour
  heavyMm: 2, // heavy rain in an hour
  windy: 25, // mean wind that you feel on the bike
  gustWindy: 40,
  storm: 60, // gusts
  heat: 30,
  cold: 5,
  ice: 1, // at or below, with wet: ice possible
  cape: 800, // J/kg: thunderstorms possible (with a thunder code or a high chance)
  fogM: 1000, // visibility
};

/** The Landi rain radar (Noah: «unbedingt überall», the best rain forecast for Switzerland): opened, never framed or read. */
export const LANDI_RADAR = 'https://www.landi.ch/wetter/niederschlagsradar';
/** MeteoSwiss warnings (official, opened). */
export const METEOSWISS = 'https://www.meteoswiss.admin.ch/';

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (v) => Math.round(v * 10) / 10;

/** The cache key of a place (about 1 km): the same place shares one answer. */
export const coreKey = (place) => `${CORE_KEY}${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;

/** The Open-Meteo address for a place. */
export function coreUrl(place, days = 16) {
  const q = new URLSearchParams({
    latitude: Number(place.lat).toFixed(3),
    longitude: Number(place.lon).toFixed(3),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
    forecast_days: String(days),
    past_days: '1', // yesterday as it came (forecast against reality, treffer.js)
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  return `${OPEN_METEO}?${q}`;
}

/**
 * The answer as the app keeps it: { lat, lon, elev, offset (s), hours: [{ ms, temp, feels, rainP, rainMm,
 * code, wind, gust, dir, cape, frz, vis, snowCm, depth }], days: [{ date, rise, set, uv }] }.
 */
export function parseCore(j) {
  const h = j?.hourly ?? {};
  const v = (a, i) => (fin(a?.[i]) ? a[i] : null);
  const hours = (h.time ?? []).map((s, i) => ({
    ms: s * 1000,
    temp: v(h.temperature_2m, i),
    feels: v(h.apparent_temperature, i),
    rainP: v(h.precipitation_probability, i),
    rainMm: v(h.precipitation, i),
    code: v(h.weather_code, i),
    wind: v(h.wind_speed_10m, i),
    gust: v(h.wind_gusts_10m, i),
    dir: v(h.wind_direction_10m, i),
    cape: v(h.cape, i),
    frz: v(h.freezing_level_height, i),
    vis: v(h.visibility, i),
    snowCm: v(h.snowfall, i),
    depth: v(h.snow_depth, i),
  }));
  const d = j?.daily ?? {};
  const offset = fin(j?.utc_offset_seconds) ? j.utc_offset_seconds : 0;
  const days = (d.time ?? []).map((s, i) => ({ date: localDate(s * 1000, offset), rise: fin(d.sunrise?.[i]) ? d.sunrise[i] * 1000 : null, set: fin(d.sunset?.[i]) ? d.sunset[i] * 1000 : null, uv: v(d.uv_index_max, i) }));
  return { lat: j?.latitude ?? null, lon: j?.longitude ?? null, elev: fin(j?.elevation) ? j.elevation : null, offset, hours, days };
}

/** The local date (YYYY-MM-DD) and hour of a time at the place. */
export const localDate = (ms, offset = 0) => new Date(ms + offset * 1000).toISOString().slice(0, 10);
export const localHour = (ms, offset = 0) => new Date(ms + offset * 1000).getUTCHours();

/** The time of hour h on date at the place (ms). */
export const atLocal = (date, h, offset = 0) => Date.parse(`${date}T00:00:00Z`) + h * 36e5 - offset * 1000;

/**
 * The core for a place: the kept answer when it is fresh, else one request (online). → { at, place, ...core,
 * old: bool } or null. A failing service keeps the old answer (up to CORE_SHOW_H) and says it is old.
 */
export async function loadCore(db, place, { fetcher = fetch, now = Date.now(), online = typeof navigator === 'undefined' ? true : navigator.onLine !== false, force = false } = {}) {
  if (!place || !fin(Number(place.lat)) || !fin(Number(place.lon))) return null;
  const key = coreKey(place);
  const kept = (await db.meta.get(key)) ?? null;
  const fresh = kept && now - kept.at < CORE_MAX_AGE_H * 36e5;
  if ((!fresh || force) && online) {
    try {
      const res = await fetcher(coreUrl(place));
      if (res.ok) {
        const row = { key, at: now, place: { lat: Number(place.lat), lon: Number(place.lon), name: place.name ?? '' }, ...parseCore(await res.json()) };
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

/** The hours from fromMs (incl.) to toMs (excl.). */
export const hoursBetween = (core, fromMs, toMs) => (core?.hours ?? []).filter((h) => h.ms >= fromMs - 1 && h.ms < toMs);

/** Is the hour wet (rain worth a word)? */
export const wet = (h) => (fin(h?.rainP) && h.rainP >= LIMITS.rainP) || (fin(h?.rainMm) && h.rainMm >= LIMITS.rainMm);
/** A thunder code (95–99) or much energy with a high rain chance. */
export const thundery = (h) => (fin(h?.code) && h.code >= 95) || (fin(h?.cape) && h.cape >= LIMITS.cape && fin(h?.rainP) && h.rainP >= 40);

/** The day in one line: { tmin, tmax, rainFrom (ms | null), rainMm, windMax, gustMax, dir, feelsMin }. */
export function dayLine(hours = []) {
  const vals = (k) => hours.map((h) => h[k]).filter(fin);
  const t = vals('temp');
  if (!t.length) return null;
  const windiest = hours.filter((h) => fin(h.wind)).reduce((a, b) => (!a || b.wind > a.wind ? b : a), null);
  const rain = hours.find(wet) ?? null;
  return {
    tmin: Math.round(Math.min(...t)),
    tmax: Math.round(Math.max(...t)),
    feelsMin: vals('feels').length ? Math.round(Math.min(...vals('feels'))) : null,
    rainFrom: rain?.ms ?? null,
    rainMm: r1(vals('rainMm').reduce((s, x) => s + x, 0)),
    windMax: windiest ? Math.round(windiest.wind) : null,
    gustMax: vals('gust').length ? Math.round(Math.max(...vals('gust'))) : null,
    dir: windiest && fin(windiest.dir) ? Math.round(windiest.dir) : null,
  };
}

/**
 * The warnings in these hours, each kind once (the first hour it applies): thunder, storm, ice, heat, fog,
 * snow. → [{ kind, at, value }] in time order. wasWet: rain in the hours before (ice on wet roads).
 */
export function warningsOf(hours = [], { wasWet = false } = {}) {
  const out = new Map();
  let wetBefore = wasWet;
  for (const h of hours) {
    const add = (kind, value) => out.has(kind) || out.set(kind, { kind, at: h.ms, value });
    if (thundery(h)) add('thunder', h.cape ?? null);
    if (fin(h.gust) && h.gust >= LIMITS.storm) add('storm', Math.round(h.gust));
    if (fin(h.temp) && h.temp <= LIMITS.ice && (wet(h) || wetBefore)) add('ice', Math.round(h.temp));
    if (fin(h.temp) && h.temp >= LIMITS.heat) add('heat', Math.round(h.temp));
    if (fin(h.vis) && h.vis < LIMITS.fogM) add('fog', Math.round(h.vis));
    if (fin(h.snowCm) && h.snowCm >= 0.5) add('snow', h.snowCm);
    if (wet(h)) wetBefore = true;
  }
  return [...out.values()].sort((a, b) => a.at - b.at);
}

/** English keys for t() of the warnings. */
export const WARN_TEXT = {
  thunder: 'Thunderstorms possible from {at}',
  storm: 'Storm gusts up to {v} km/h from {at}',
  ice: 'Ice possible from {at} ({v} °C and wet)',
  heat: 'Heat up to {v} °C from {at}: drink more',
  fog: 'Fog from {at} (sight {v} m)',
  snow: 'Snow from {at}',
};

/**
 * How unpleasant one riding hour is (0 = perfect). Rain counts most, then thunder, storm and ice, then
 * wind, cold, heat and the dark. sun: { rise, set } of that day (the dark outside costs).
 */
export function hourCost(h, sun = null) {
  if (!h) return 99;
  let c = 0;
  if (fin(h.rainP)) c += (h.rainP / 100) * 4;
  if (fin(h.rainMm)) c += Math.min(6, h.rainMm * 3);
  if (thundery(h)) c += 8;
  if (fin(h.gust) && h.gust >= LIMITS.storm) c += 6;
  if (fin(h.wind) && h.wind > 15) c += (h.wind - 15) / 6;
  const t = fin(h.feels) ? h.feels : h.temp;
  if (fin(t) && t < 10) c += (10 - t) / 3;
  if (fin(t) && t > 27) c += (t - 27) / 2;
  if (fin(h.temp) && h.temp <= LIMITS.ice) c += 4;
  if (sun?.rise && sun?.set && (h.ms < sun.rise - 18e5 || h.ms > sun.set)) c += 3;
  return r1(c);
}

/**
 * Suggestion 1a: the best start time of each day for a ride of durH hours, starting at the earliest at
 * `earliest` and ending at the latest at `latest` (local hours). → [{ date, start (ms), end (ms), cost,
 * line, warnings }] one per day (the days that have the whole window), and `best` the lowest cost (with
 * a nearer day winning when they are close). days: how many days from today (from `fromDate`).
 */
export function bestWindows(core, { durH = 4, earliest = 7, latest = 20, days = 7, fromDate = null, now = Date.now() } = {}) {
  if (!core?.hours?.length) return { days: [], best: null };
  const off = core.offset ?? 0;
  const first = fromDate ?? localDate(now, off);
  const dur = Math.max(1, Math.min(14, Math.round(durH)));
  const out = [];
  for (let n = 0; n < days; n++) {
    const date = localDate(Date.parse(`${first}T12:00:00Z`) + n * 864e5, 0);
    const sun = core.days?.find((d) => d.date === date) ?? null;
    let best = null;
    for (let s = earliest; s + dur <= Math.max(latest, earliest + dur); s++) {
      const start = atLocal(date, s, off);
      if (start < now - 36e5 * 0.5) continue;
      const hs = hoursBetween(core, start, start + dur * 36e5);
      if (hs.length < dur) continue;
      const cost = r1(hs.reduce((sum, h) => sum + hourCost(h, sun), 0) / dur);
      if (!best || cost < best.cost) best = { date, start, end: start + dur * 36e5, cost, hours: hs };
    }
    if (best) out.push({ date: best.date, start: best.start, end: best.end, cost: best.cost, line: dayLine(best.hours), warnings: warningsOf(best.hours) });
  }
  // a later day must be clearly better to win (0.5 per day further away)
  const best = out.reduce((a, b, i) => (!a || b.cost + i * 0.5 < a.cost + out.indexOf(a) * 0.5 ? b : a), null);
  return { days: out, best };
}

/** A cost as a word: 'good' | 'ok' | 'poor' | 'bad' (English keys in COST_WORD). */
export const costWord = (c) => (c < 1.5 ? 'good' : c < 3.5 ? 'ok' : c < 6 ? 'poor' : 'bad');
export const COST_WORD = { good: 'Good', ok: 'Fair', poor: 'Poor', bad: 'Bad' };

/**
 * What to wear and take for these riding hours. → [{ key, why }] in packing order. The cold morning: when
 * the start is 8 °C or more colder than the warmest hour, a layer you can take off.
 */
export function packHints(hours = []) {
  const line = dayLine(hours);
  if (!line) return [];
  const out = [];
  const feels = line.feelsMin ?? line.tmin;
  if (hours.some(wet)) out.push({ key: 'rainjacket', why: 'rain' });
  if ((line.windMax ?? 0) >= LIMITS.windy || (line.gustMax ?? 0) >= LIMITS.gustWindy) out.push({ key: 'windjacket', why: 'wind' });
  const startT = hours.find((h) => fin(h.temp))?.temp;
  if (fin(startT) && line.tmax - startT >= 8) out.push({ key: 'layer', why: 'coldmorning' });
  if (feels < 15) out.push({ key: 'armwarmers', why: 'cool' });
  if (feels < 8) out.push({ key: 'longgloves', why: 'cold' });
  if (feels < LIMITS.cold) out.push({ key: 'overshoes', why: 'cold' }, { key: 'cap', why: 'cold' });
  if (line.tmax >= LIMITS.heat - 3) out.push({ key: 'water', why: 'heat' });
  return out;
}
/** English keys for t() of the pack hints. */
export const PACK_TEXT = {
  rainjacket: 'Rain jacket',
  windjacket: 'Wind jacket',
  layer: 'A layer to take off (cold start, warm later)',
  armwarmers: 'Arm and knee warmers',
  longgloves: 'Long gloves',
  overshoes: 'Overshoes',
  cap: 'Cap under the helmet',
  water: 'An extra bottle (heat)',
};

/**
 * Föhn or Bise (Swiss words; a hint, not a forecast): Bise = mean wind from north-east (20°–90°) of 20 km/h
 * or more; Föhn = gusts of 40 km/h or more from the south (150°–220°) and dry. → 'foehn' | 'bise' | null.
 */
export function foehnBise(hours = []) {
  const bise = hours.filter((h) => fin(h.dir) && h.dir >= 20 && h.dir <= 90 && fin(h.wind) && h.wind >= 20).length;
  const foehn = hours.filter((h) => fin(h.dir) && h.dir >= 150 && h.dir <= 220 && fin(h.gust) && h.gust >= 40 && !wet(h)).length;
  if (foehn >= 2 && foehn >= bise) return 'foehn';
  if (bise >= 2) return 'bise';
  return null;
}

/**
 * «Heute lieber Zug?» for the ways at commuting times (07–09 and 16–19 local, or your own hours): heavy rain,
 * a storm, ice or a thunderstorm in them. → { why: [kinds], at } or null.
 */
export function trainInstead(core, date, { slots = [[7, 9], [16, 19]] } = {}) {
  if (!core?.hours?.length) return null;
  const off = core.offset ?? 0;
  const why = new Set();
  let at = null;
  for (const [a, b] of slots) {
    for (const h of hoursBetween(core, atLocal(date, a, off), atLocal(date, b, off))) {
      const k = (fin(h.rainMm) && h.rainMm >= LIMITS.heavyMm) ? 'rain' : thundery(h) ? 'thunder' : fin(h.gust) && h.gust >= LIMITS.storm ? 'storm' : fin(h.temp) && h.temp <= LIMITS.ice && wet(h) ? 'ice' : null;
      if (k) {
        why.add(k);
        at ??= h.ms;
      }
    }
  }
  return why.size ? { why: [...why], at } : null;
}

/** The outdoor suggestion (Aktiv, meditation outside): the next dry, mild, calm hour from now within 12 h. */
export function outdoorOk(core, now = Date.now()) {
  const hs = hoursBetween(core, now - 36e5, now + 12 * 36e5);
  const ok = (h) => !wet(h) && !thundery(h) && (!fin(h.wind) || h.wind < 25) && fin(h.temp) && h.temp >= 5 && h.temp <= 30;
  const h = hs.find((x) => x.ms + 36e5 > now && ok(x));
  return h ? { at: Math.max(h.ms, now), temp: Math.round(h.temp), now: h.ms <= now } : null;
}

/** The first hour of rain from now within `aheadH` hours (for «Radar» on Heute): ms or null. */
export const rainWithin = (core, now = Date.now(), aheadH = 3) => hoursBetween(core, now - 36e5 + 1, now + aheadH * 36e5).find((h) => h.ms + 36e5 > now && wet(h))?.ms ?? null;

/**
 * Schnee und Lawinen (4a): where the route goes high. snow line ≈ freezing level − 300 m (lowest in the
 * hours); routeTopM: the highest point of the route. → { line, top, above: bool, newCm, depthCm } or null
 * when the route stays well below (more than 500 m under the snow line) and no snow lies.
 */
export function snowOnRoute(hours = [], routeTopM = null) {
  const frz = hours.map((h) => h.frz).filter(fin);
  const depth = Math.max(0, ...hours.map((h) => h.depth).filter(fin));
  const newCm = r1(hours.map((h) => h.snowCm).filter(fin).reduce((s, x) => s + x, 0));
  if (!frz.length) return null;
  const line = Math.max(0, Math.round((Math.min(...frz) - 300) / 100) * 100);
  const top = fin(routeTopM) ? Math.round(routeTopM) : null;
  const above = top != null && top >= line;
  if (!above && (top == null || top < line - 500) && !(depth > 0) && !(newCm > 0)) return null;
  return { line, top, above, newCm, depthCm: Math.round(depth * 100) };
}

/** The highest point of a profile [[km, m], …] (m) or null. */
export const routeTop = (profile = []) => {
  const m = (profile ?? []).map((p) => (Array.isArray(p) ? p[1] : p?.m)).filter(fin);
  return m.length ? Math.max(...m) : null;
};

/** Dark before the end of the ride: minutes after sunset (0 when back before). */
export const darkAfter = (core, end) => {
  const set = core?.days?.find((d) => d.date === localDate(end, core.offset ?? 0))?.set;
  return set && end > set ? Math.round((end - set) / 6e4) : 0;
};
