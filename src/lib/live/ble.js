/**
 * Sensoren (Noah 20.10.2026 «Kann ich meinen Sensor da verbinden und den Wert gleich anzeigen lassen,
 * Herzfrequenz»): reading the standard Bluetooth sensor messages (Web Bluetooth, Chrome on Android and
 * the desktop). Pure: a DataView in, numbers out. Tested in tests/live-sensors.test.js.
 *
 * - heart rate (service 0x180D, measurement 0x2A37): beats per minute;
 * - cycling power (0x1818, 0x2A63): watts, and the cadence from the crank revolutions when it sends them;
 * - speed and cadence (0x1816, 0x2A5B): the cadence from the crank revolutions.
 * Health data is only shown and kept with the ride; nothing judges it.
 */

export const KINDS = {
  hr: { service: 'heart_rate', char: 'heart_rate_measurement', name: 'Heart rate', unit: 'bpm' },
  power: { service: 'cycling_power', char: 'cycling_power_measurement', name: 'Power', unit: 'W' },
  cadence: { service: 'cycling_speed_and_cadence', char: 'csc_measurement', name: 'Cadence', unit: 'rpm' },
};

/** Heart rate measurement → bpm (null when empty). Flag bit 0: the value is 16 bit. */
export function parseHeartRate(dv) {
  if (!dv || dv.byteLength < 2) return null;
  const flags = dv.getUint8(0);
  const bpm = flags & 1 ? (dv.byteLength >= 3 ? dv.getUint16(1, true) : null) : dv.getUint8(1);
  return Number.isFinite(bpm) && bpm > 0 && bpm < 255 ? bpm : null;
}

/**
 * Cycling power measurement → { watts, crank: { revs, time } | null }.
 * After flags (16 bit) and the power (sint16): optional pedal balance (bit 0, 1 byte), accumulated
 * torque (bit 2, 2 bytes), wheel revolutions (bit 4, 4 + 2 bytes), crank revolutions (bit 5, 2 + 2 bytes).
 */
export function parsePower(dv) {
  if (!dv || dv.byteLength < 4) return null;
  const flags = dv.getUint16(0, true);
  const watts = dv.getInt16(2, true);
  let o = 4;
  if (flags & 0x01) o += 1;
  if (flags & 0x04) o += 2;
  if (flags & 0x10) o += 6;
  let crank = null;
  if (flags & 0x20 && dv.byteLength >= o + 4) crank = { revs: dv.getUint16(o, true), time: dv.getUint16(o + 2, true) };
  return { watts: Math.max(0, watts), crank };
}

/** Speed and cadence measurement → { crank: { revs, time } | null }. Bit 0 wheel (4 + 2), bit 1 crank (2 + 2). */
export function parseCsc(dv) {
  if (!dv || dv.byteLength < 1) return null;
  const flags = dv.getUint8(0);
  let o = 1;
  if (flags & 1) o += 6;
  if (flags & 2 && dv.byteLength >= o + 4) return { crank: { revs: dv.getUint16(o, true), time: dv.getUint16(o + 2, true) } };
  return { crank: null };
}

/**
 * The cadence from two crank readings (revs and time in 1/1024 s, both rolling over at 65536).
 * → rpm, 0 when the crank stands, null when it cannot tell (the same reading twice).
 */
export function cadenceOf(prev, cur) {
  if (!prev || !cur) return null;
  const dr = (cur.revs - prev.revs + 65536) % 65536;
  const dt = (cur.time - prev.time + 65536) % 65536;
  if (dt === 0) return null;
  const rpm = (dr / (dt / 1024)) * 60;
  return rpm > 250 ? null : Math.round(rpm);
}

/** Keep a value at most every `everyS` seconds for the ride: [[sec, value]] (sec since the start). */
export function keepSample(list = [], sec, value, everyS = 5) {
  if (!Number.isFinite(value) || !Number.isFinite(sec)) return list;
  const last = list.at(-1);
  if (last && sec - last[0] < everyS) return list;
  list.push([Math.round(sec), Math.round(value)]);
  return list;
}

/** Average and highest of samples [[sec, value]] (zeros left out for power and cadence when asked). */
export function statsOf(list = [], { noZero = false } = {}) {
  const v = (list ?? []).map((x) => x[1]).filter((x) => Number.isFinite(x) && (!noZero || x > 0));
  if (!v.length) return null;
  return { avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), max: Math.max(...v), n: v.length };
}

/**
 * The limit hint (Noah «2a»: a tone when the pulse or the power stays above your own limit): above
 * the limit for `forS` seconds → true once; it can come again after the value was below the limit.
 * st: { since, rang } → { st, ring }
 */
export function limitStep(st = {}, { value, limit, now = Date.now(), forS = 60 } = {}) {
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(value)) return { st: { since: null, rang: !!st.rang }, ring: false };
  if (value > limit) {
    const since = st.since ?? now;
    if (!st.rang && now - since >= forS * 1000) return { st: { since, rang: true }, ring: true };
    return { st: { since, rang: !!st.rang }, ring: false };
  }
  return { st: { since: null, rang: false }, ring: false };
}
