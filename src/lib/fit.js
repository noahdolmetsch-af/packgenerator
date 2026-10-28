/**
 * «FIT-Dateien ganz lesen» (thread «Geräte und Datenquellen», Noah 27.10.2026 «2a»): a recorded ride as
 * a FIT file (Garmin Edge, Wahoo, Hammerhead, Coros, Polar, Suunto and most watches export it) gives
 * the same ride numbers as a GPX, plus what only the unit knows:
 *
 * - per point (record): position, elevation, time, heart rate, cadence, power, temperature
 * - per ride (session): normalized power, intensity factor, training stress score, left/right
 *   balance, training effect (aerobic and anaerobic), when the unit writes them
 * - laps (lap messages), gear changes (event 42/43, electronic shifting), the battery of the unit and
 *   of each sensor at the end of the ride (device_info)
 *
 * Only what the file holds is kept, nothing is guessed. Everything is read in the browser; the file
 * never leaves the device. Garmin's recovery time is not in the public FIT profile, so it is not read.
 * Pure functions, tested in tests/fit.test.js (fictional files from tests/fixtures/fit.js).
 */
import { t } from './i18n.svelte.js';
import { analysePoints } from './gpx.js';

const FIT_EPOCH = 631065600; // 1989-12-31T00:00:00Z in Unix seconds
const SEMI = 180 / 2 ** 31; // semicircles → degrees

/** Base types: [size, kind, invalid value]. */
const BASE = {
  0x00: [1, 'u8', 0xff], 0x01: [1, 's8', 0x7f], 0x02: [1, 'u8', 0xff], 0x83: [2, 's16', 0x7fff], 0x84: [2, 'u16', 0xffff],
  0x85: [4, 's32', 0x7fffffff], 0x86: [4, 'u32', 0xffffffff], 0x07: [1, 'str', null], 0x88: [4, 'f32', null], 0x89: [8, 'f64', null],
  0x0a: [1, 'u8', 0], 0x8b: [2, 'u16', 0], 0x8c: [4, 'u32', 0], 0x0d: [1, 'u8', 0xff],
};

function value(dv, u8, p, size, type, little) {
  const [bsize, kind, invalid] = BASE[type] ?? [size, 'skip', null];
  if (kind === 'str') {
    let s = '';
    for (let i = 0; i < size && u8[p + i]; i++) s += String.fromCharCode(u8[p + i]);
    try {
      s = decodeURIComponent(escape(s));
    } catch {
      /* not UTF-8: keep the bytes */
    }
    return s || null;
  }
  if (kind === 'skip' || size < bsize) return null;
  let v;
  if (kind === 'u8') v = dv.getUint8(p);
  else if (kind === 's8') v = dv.getInt8(p);
  else if (kind === 'u16') v = dv.getUint16(p, little);
  else if (kind === 's16') v = dv.getInt16(p, little);
  else if (kind === 'u32') v = dv.getUint32(p, little);
  else if (kind === 's32') v = dv.getInt32(p, little);
  else if (kind === 'f32') v = dv.getFloat32(p, little);
  else v = dv.getFloat64(p, little);
  return invalid != null && v === invalid ? null : v;
}

/** Messages this file reads: file_id 0, sport 12, session 18, lap 19, record 20, event 21, device_info 23. */
const WANT = new Set([0, 12, 18, 19, 20, 21, 23]);

/**
 * All wanted messages of a FIT file, in order: [{ num, f: { fieldNum: value } }]. Handles compressed
 * timestamp headers (the time goes into field 253). Throws a plain message when it is no FIT file.
 */
export function fitMessages(buffer) {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (u8.length < 12) throw new Error(t('This is not a FIT file.'));
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const hsize = u8[0];
  if (hsize < 12 || String.fromCharCode(u8[8], u8[9], u8[10], u8[11]) !== '.FIT') throw new Error(t('This is not a FIT file.'));
  const end = Math.min(u8.length, hsize + dv.getUint32(4, true));
  const defs = {};
  const out = [];
  let last = null; // the last full timestamp, for compressed headers
  let p = hsize;
  let guard = 0;
  while (p < end && guard++ < 5_000_000) {
    const h = u8[p++];
    if (!(h & 0x80) && h & 0x40) {
      const local = h & 0x0f;
      const little = u8[p + 1] === 0;
      const num = dv.getUint16(p + 2, little);
      const n = u8[p + 4];
      p += 5;
      const fields = [];
      for (let i = 0; i < n; i++, p += 3) fields.push({ num: u8[p], size: u8[p + 1], type: u8[p + 2] });
      let devSize = 0;
      if (h & 0x20) {
        const nd = u8[p++];
        for (let i = 0; i < nd; i++, p += 3) devSize += u8[p + 1];
      }
      defs[local] = { num, little, fields, devSize };
      continue;
    }
    const compressed = !!(h & 0x80);
    const local = compressed ? (h >> 5) & 0x03 : h & 0x0f;
    const def = defs[local];
    if (!def) throw new Error(t('The FIT file is damaged.'));
    const want = WANT.has(def.num);
    const f = {};
    for (const x of def.fields) {
      if (want || x.num === 253) f[x.num] = p + x.size <= u8.length ? value(dv, u8, p, x.size, x.type, def.little) : null;
      p += x.size;
    }
    p += def.devSize;
    if (compressed && last != null) {
      const off = h & 0x1f;
      let ts = (last & ~0x1f) + off;
      if (off < (last & 0x1f)) ts += 0x20;
      f[253] = ts;
    }
    if (f[253] != null) last = f[253];
    if (want) out.push({ num: def.num, f });
  }
  return out;
}

const scaled = (v, div) => (v == null ? null : Math.round((v / div) * 10) / 10);
/** Session left/right balance (u16): bit 15 = the value is the right leg, low 14 bits = percent × 100. */
function balance16(v) {
  if (v == null || v === 0xffff) return null;
  const pct = (v & 0x3fff) / 100;
  if (!(pct > 0 && pct < 100)) return null;
  const right = v & 0x8000 ? pct : 100 - pct;
  return { left: Math.round(100 - right), right: Math.round(right) };
}
/** Record left/right balance (u8): bit 7 = right, low 7 bits = percent. */
function balance8(v) {
  if (v == null || v === 0xff) return null;
  const pct = v & 0x7f;
  if (!(pct > 0 && pct < 100)) return null;
  return v & 0x80 ? pct : 100 - pct;
}

/** ANT+ device types the ride page names. */
const KIND = { 11: 'power', 120: 'heart rate', 121: 'speed', 122: 'cadence', 123: 'speed', 34: 'shifting', 40: 'radar', 35: 'light' };
/** FIT battery_status: 1 new, 2 good, 3 ok, 4 low, 5 critical. */
export const BATTERY = { 1: 'new', 2: 'good', 3: 'ok', 4: 'low', 5: 'critical' };

/**
 * The extra values of the unit, from the messages: { np, ifac, tss, lr, te, teAn, laps, gears,
 * battery: [{ kind, status, volt }] } with only the fields the file has; null when it has none.
 */
export function deviceValues(msgs) {
  const s = msgs.find((m) => m.num === 18)?.f ?? {};
  const out = {};
  if (s[34] != null && s[34] > 0) out.np = s[34];
  if (s[36] != null && s[36] > 0) out.ifac = Math.round(s[36]) / 1000;
  if (s[35] != null && s[35] > 0) out.tss = scaled(s[35], 10);
  let lr = balance16(s[37]);
  if (!lr) {
    // from the points: the mean right share while pedalling
    let sum = 0;
    let n = 0;
    for (const m of msgs) {
      if (m.num !== 20) continue;
      const r = balance8(m.f[30]);
      if (r != null) (sum += r), n++;
    }
    if (n >= 10) {
      const right = Math.round(sum / n);
      lr = { left: 100 - right, right };
    }
  }
  if (lr) out.lr = lr;
  if (s[24] != null && s[24] > 0) out.te = scaled(s[24], 10);
  if (s[137] != null && s[137] > 0) out.teAn = scaled(s[137], 10);
  const laps = msgs.filter((m) => m.num === 19).length;
  if (laps > 1) out.laps = laps;
  const gears = msgs.filter((m) => m.num === 21 && (m.f[0] === 42 || m.f[0] === 43)).length;
  if (gears) out.gears = gears;
  // the last word of each device on its battery (a unit writes device_info at start and end)
  const bat = new Map();
  for (const m of msgs) {
    if (m.num !== 23) continue;
    const st = BATTERY[m.f[11]];
    const volt = m.f[10] != null ? Math.round((m.f[10] / 256) * 100) / 100 : null;
    if (!st && volt == null) continue;
    const idx = m.f[0] ?? 0;
    const kind = idx === 0 ? 'unit' : KIND[m.f[1]] ?? 'sensor';
    bat.set(`${idx}-${m.f[3] ?? ''}`, { kind, ...(st ? { status: st } : {}), ...(volt != null ? { volt } : {}) });
  }
  if (bat.size) out.battery = [...bat.values()];
  return Object.keys(out).length ? out : null;
}

/** The points of a ride from the record messages, as gpx.js reads them. Points without a position are left out. */
export function fitPoints(msgs) {
  const out = [];
  for (const m of msgs) {
    if (m.num !== 20) continue;
    const f = m.f;
    if (f[0] == null || f[1] == null || f[253] == null) continue;
    const lat = f[0] * SEMI;
    const lon = f[1] * SEMI;
    if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) continue;
    const alt = f[78] ?? f[2];
    const p = { lat, lon, ele: alt != null ? alt / 5 - 500 : null, t: (f[253] + FIT_EPOCH) * 1000 };
    if (f[3] > 20 && f[3] < 250) p.hr = f[3];
    if (f[4] != null && f[4] < 250) p.cad = f[4];
    if (f[7] != null && f[7] < 3000) p.w = f[7];
    if (f[13] != null && f[13] > -40 && f[13] < 60) p.temp = f[13];
    out.push(p);
  }
  return out;
}

/** Is this file a FIT file (by its first bytes)? */
export const isFit = (u8) => u8?.length >= 12 && String.fromCharCode(u8[8], u8[9], u8[10], u8[11]) === '.FIT';

/**
 * One FIT activity → the same ride record as analyseRide (src/lib/gpx.js), plus `device` (the extra
 * values, see deviceValues) and `source: 'fit'`. Throws a plain message for a course without times
 * or an indoor ride without positions.
 */
export function analyseFit(buffer, file = '') {
  const msgs = fitMessages(buffer);
  const pts = fitPoints(msgs);
  if (pts.length < 2) {
    const any = msgs.some((m) => m.num === 20);
    throw new Error(any ? t('This FIT file has no positions (an indoor ride?). Upload a ride recorded outside.') : t('This file has no times. Upload a recorded ride, not a planned route.'));
  }
  const name = file.replace(/\.fit$/i, '') || t('Ride|dayride');
  const ride = analysePoints(pts, name, file);
  const device = deviceValues(msgs);
  return { ...ride, source: 'fit', ...(device ? { device } : {}) };
}
