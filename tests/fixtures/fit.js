/**
 * v0.68.0 (Q1): a tiny FIT file writer for the tests (fictional rides only). It writes what
 * src/lib/kmbook.js parseFit reads: file_id, device_info (the unit, bike sensors, a heart rate strap),
 * sport (the profile name) and session (start, sport, distance). The CRC is left at 0 (not checked).
 */
const FIT_EPOCH = 631065600;

/** Field types: [base type byte, size]. */
const T = { u8: [0x02, 1], enum: [0x00, 1], u16: [0x84, 2], u32: [0x86, 4], u32z: [0x8c, 4], u16z: [0x8b, 2], s32: [0x85, 4], s8: [0x01, 1] };

function message(local, num, fields) {
  // fields: [[fieldNum, type, value]] or [[fieldNum, 'str', value, size]]
  const def = [0x40 | local, 0, 0, num & 0xff, num >> 8, fields.length];
  const data = [local];
  for (const [n, type, value, size] of fields) {
    if (type === 'str') {
      const bytes = [...new TextEncoder().encode(value)].slice(0, size - 1);
      def.push(n, size, 0x07);
      data.push(...bytes, ...new Array(size - bytes.length).fill(0));
    } else {
      const [base, sz] = T[type];
      def.push(n, sz, base);
      const v = value < 0 ? value + 2 ** (8 * sz) : value;
      for (let i = 0; i < sz; i++) data.push(Math.floor(v / 2 ** (8 * i)) & 0xff);
    }
  }
  return [...def, ...data];
}

/**
 * One ride as FIT bytes. start: ISO time (UTC); km; product (3843 Edge 1040, 4061 Edge 540);
 * serial: the unit; profile: the Garmin profile name; sensors: [{ serial, type }] (type 123 speed,
 * 120 heart rate); sport 2 = cycling; subSport (v0.69.1) 46 gravel, 8 mountain, 47 e-bike mountain.
 */
export function fitRide({ start, km, product = 3843, serial = 3300001, profile = 'Gravel', sensors = [], sport = 2, subSport = 0 }) {
  const t = Math.round(Date.parse(start) / 1000) - FIT_EPOCH;
  const body = [
    ...message(0, 0, [[0, 'enum', 4], [1, 'u16', 1], [2, 'u16', product], [3, 'u32z', serial], [4, 'u32', t]]),
    ...message(1, 23, [[0, 'u8', 0], [1, 'u8', 255], [3, 'u32z', serial], [4, 'u16', product], [25, 'enum', 5]]),
    ...sensors.flatMap((s, i) => message(1, 23, [[0, 'u8', i + 1], [1, 'u8', s.type ?? 123], [3, 'u32z', s.serial], [4, 'u16', 0], [25, 'enum', 1]]).slice(i === 0 ? 0 : 0)),
    ...message(2, 12, [[0, 'enum', sport], [1, 'enum', subSport], [3, 'str', profile, 16]]),
    ...message(3, 18, [[2, 'u32', t], [5, 'enum', sport], [6, 'enum', subSport], [9, 'u32', Math.round(km * 100000)]]),
  ];
  const header = [14, 0x20, 0x08, 0x08, ...[0, 8, 16, 24].map((s) => (body.length >> s) & 0xff), 0x2e, 0x46, 0x49, 0x54, 0, 0];
  return new Uint8Array([...header, ...body, 0, 0]);
}

/**
 * «FIT-Dateien ganz lesen» (27.10.2026): a recorded ride as FIT bytes (fictional, around Zurich). One
 * point every `step` seconds going north-east at ~25 km/h, with heart rate, cadence, power and
 * temperature; a session with NP/IF/TSS, L/R balance and training effect; `laps` lap messages,
 * `gears` gear change events, the unit and a power meter with their battery.
 * noPos: records without a position (an indoor ride).
 */
export function fitActivity({ start = '2026-06-14T06:00:00Z', n = 120, step = 5, laps = 2, gears = 3, session = true, noPos = false } = {}) {
  const t0 = Math.round(Date.parse(start) / 1000) - FIT_EPOCH;
  const deg = (d) => Math.round(d / (180 / 2 ** 31));
  const body = [...message(0, 0, [[0, 'enum', 4], [1, 'u16', 1], [2, 'u16', 4634], [3, 'u32z', 3300009], [4, 'u32', t0]])];
  for (let i = 0; i < n; i++) {
    const lat = 47.37 + i * 0.00025;
    const lon = 8.54 + i * 0.00025;
    const fields = [[253, 'u32', t0 + i * step]];
    if (!noPos) fields.push([0, 's32', deg(lat)], [1, 's32', deg(lon)]);
    fields.push([2, 'u16', Math.round((410 + i * 0.5 + 500) * 5)], [3, 'u8', 130 + (i % 20)], [4, 'u8', 85], [7, 'u16', 180 + (i % 40)], [13, 's8', 14 + Math.floor(i / 60)], [30, 'u8', 0x80 | 52]);
    body.push(...message(4, 20, fields));
  }
  for (let g = 0; g < gears; g++) body.push(...message(5, 21, [[253, 'u32', t0 + 10 + g * 20], [0, 'enum', 42], [1, 'enum', 3]]));
  for (let l = 0; l < laps; l++) body.push(...message(6, 19, [[253, 'u32', t0 + (l + 1) * Math.floor((n * step) / laps)], [2, 'u32', t0 + l * Math.floor((n * step) / laps)]]));
  body.push(...message(1, 23, [[253, 'u32', t0 + n * step], [0, 'u8', 0], [1, 'u8', 255], [3, 'u32z', 3300009], [11, 'enum', 3]]));
  body.push(...message(1, 23, [[253, 'u32', t0 + n * step], [0, 'u8', 1], [1, 'u8', 11], [3, 'u32z', 7700001], [11, 'enum', 4], [10, 'u16', Math.round(2.9 * 256)]]));
  if (session)
    body.push(...message(3, 18, [[253, 'u32', t0 + n * step], [2, 'u32', t0], [5, 'enum', 2], [6, 'enum', 0], [34, 'u16', 205], [36, 'u16', 804], [35, 'u16', 563], [37, 'u16', 0x8000 | 5100], [24, 'u8', 31], [137, 'u8', 12]]));
  const header = [14, 0x20, 0x08, 0x08, ...[0, 8, 16, 24].map((s) => (body.length >> s) & 0xff), 0x2e, 0x46, 0x49, 0x54, 0, 0];
  return new Uint8Array([...header, ...body, 0, 0]);
}
