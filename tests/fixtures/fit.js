/**
 * v0.68.0 (Q1): a tiny FIT file writer for the tests (fictional rides only). It writes what
 * src/lib/kmbook.js parseFit reads: file_id, device_info (the unit, bike sensors, a heart rate strap),
 * sport (the profile name) and session (start, sport, distance). The CRC is left at 0 (not checked).
 */
const FIT_EPOCH = 631065600;

/** Field types: [base type byte, size]. */
const T = { u8: [0x02, 1], enum: [0x00, 1], u16: [0x84, 2], u32: [0x86, 4], u32z: [0x8c, 4], u16z: [0x8b, 2] };

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
      for (let i = 0; i < sz; i++) data.push((value / 2 ** (8 * i)) & 0xff);
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
