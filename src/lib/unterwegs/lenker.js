/**
 * Paket K #114 «Lenker-Ansicht» (Noah 19.10.2026 «2 a und b möglich»): Unterwegs turned sideways for
 * the handlebar, with a few big numbers. At the start four fixed ones (time, km, metres up, next
 * meal); you choose up to 6 yourself and put them in order (arrows and drag). Setting 'lenker'
 * = { tiles: [keys] } (db.settings).
 *
 * The km are a guess from the start time and your pace, unless «Mit GPS messen» is on while the view
 * is open (the location then stays in this view only and is never stored).
 * Pure functions, tested in tests/unterwegs-lenker.test.js.
 */
export const LENKER_KEY = 'lenker';
export const MAX_TILES = 6;
/** The four fixed start numbers (Noah «a»: Zeit, km, Höhenmeter, nächstes Essen). */
export const DEFAULT_TILES = ['clock', 'km', 'up', 'eat'];

/** Every number the view can show (label: English key for t(); unit shown small). */
export const TILES = [
  { key: 'clock', label: 'Time', unit: '' },
  { key: 'ride', label: 'Riding time', unit: 'h' },
  { key: 'km', label: 'km so far', unit: 'km' },
  { key: 'left', label: 'km to go', unit: 'km' },
  { key: 'up', label: 'Metres up today', unit: 'm' },
  { key: 'eat', label: 'Next meal', unit: 'min' },
  { key: 'arrive', label: 'Arrival', unit: '' },
  { key: 'sunset', label: 'Sunset', unit: '' },
  { key: 'temp', label: 'Temperature', unit: '°C' },
  { key: 'speed', label: 'Speed (GPS)', unit: 'km/h' },
];
const KEYS = new Set(TILES.map((x) => x.key));

/** The stored choice made safe: known keys, no doubles, 1 to MAX_TILES, else the default. */
export function tilesOf(v) {
  const list = Array.isArray(v?.tiles) ? [...new Set(v.tiles.filter((k) => KEYS.has(k)))].slice(0, MAX_TILES) : [];
  return list.length ? list : [...DEFAULT_TILES];
}

/** Switch a tile on or off (keeps at least one and at most MAX_TILES). */
export function toggleTile(list, key) {
  if (list.includes(key)) return list.length > 1 ? list.filter((k) => k !== key) : list;
  return list.length < MAX_TILES && KEYS.has(key) ? [...list, key] : list;
}

/** Move a tile from one place to another. */
export function moveTile(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
/** 'YYYY-MM-DDTHH:MM' (local) → ms. */
export const localMs = (s) => (typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(s) ? new Date(`${s.slice(0, 16)}:00`).getTime() : null);
const clock = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * The value of each tile now. ctx: { now (ms), startAt, endAt ('YYYY-MM-DDTHH:MM' local), km (stage),
 * gainM, kmh (pace), arrive ('HH:MM'), sunset ('HH:MM'), temp (°C), nextEat (ms), gps: { km, kmh } | null }.
 * → { [key]: { value: string, guess: boolean } } ; value '–' when unknown.
 */
export function tileValues(ctx = {}) {
  const now = ctx.now ?? Date.now();
  const start = localMs(ctx.startAt);
  const h = start != null && now > start ? (now - start) / 36e5 : 0;
  const gpsKm = ctx.gps && Number.isFinite(ctx.gps.km) ? ctx.gps.km : null;
  const guessKm = Number.isFinite(ctx.km) && ctx.kmh > 0 ? Math.min(ctx.km, h * ctx.kmh) : null;
  const done = gpsKm ?? guessKm;
  const r1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const dash = { value: '–', guess: false };
  const v = (value, guess = false) => ({ value: String(value), guess });
  return {
    clock: v(clock(now)),
    ride: start != null && now > start ? v(`${Math.floor(h)}:${pad(Math.floor((h % 1) * 60))}`) : dash,
    km: done != null ? v(r1(done), gpsKm == null) : dash,
    left: done != null && Number.isFinite(ctx.km) ? v(r1(Math.max(0, ctx.km - done)), gpsKm == null) : dash,
    up: Number.isFinite(ctx.gainM) ? v(Math.round(ctx.gainM)) : dash,
    eat: Number.isFinite(ctx.nextEat) ? v(Math.max(0, Math.ceil((ctx.nextEat - now) / 60000))) : dash,
    arrive: ctx.arrive ? v(ctx.arrive) : dash,
    sunset: ctx.sunset ? v(ctx.sunset) : dash,
    temp: Number.isFinite(ctx.temp) ? v(Math.round(ctx.temp)) : dash,
    speed: ctx.gps && Number.isFinite(ctx.gps.kmh) ? v(Math.round(ctx.gps.kmh)) : dash,
  };
}

/** Add one GPS fix to the measured way: { km, kmh, last } (jumps under 15 m and inaccurate fixes are left out). */
export function addFix(track, fix, dist) {
  const t = track ?? { km: 0, kmh: null, last: null };
  if (!fix || !Number.isFinite(fix.lat) || (fix.acc != null && fix.acc > 50)) return t;
  if (!t.last) return { ...t, last: fix };
  const d = dist(t.last, fix);
  if (d < 0.015) return t;
  const hrs = (fix.at - t.last.at) / 36e5;
  const kmh = Number.isFinite(fix.speed) && fix.speed != null ? fix.speed * 3.6 : hrs > 0 ? d / hrs : t.kmh;
  return { km: t.km + d, kmh: kmh > 120 ? t.kmh : kmh, last: fix };
}
