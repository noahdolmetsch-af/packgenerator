/**
 * Paket S «Reise-Spur» (Noah 19.10.2026 «1a und b 2a 3a 4a 5a»): small tools for route lines.
 * A line is [[lat, lon], …]. Strava sends its line in Google's «encoded polyline» format
 * (summary_polyline); the share link uses the same format because it is about 5× smaller than JSON.
 * Pure, tested in tests/spur.test.js.
 */

/** Google encoded polyline → [[lat, lon], …] (precision 5). A broken text gives []. */
export function decodePolyline(text, precision = 5) {
  if (typeof text !== 'string' || !text) return [];
  const k = 10 ** precision;
  const out = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let shift = 0;
    let res = 0;
    let b;
    do {
      if (i >= text.length) return null;
      b = text.charCodeAt(i++) - 63;
      if (b < 0 || b > 63) return null;
      res |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && shift < 35);
    return res & 1 ? ~(res >> 1) : res >> 1;
  };
  while (i < text.length) {
    const a = next();
    const b = next();
    if (a == null || b == null) return [];
    lat += a;
    lon += b;
    out.push([lat / k, lon / k]);
  }
  return out.every(([la, lo]) => Math.abs(la) <= 90 && Math.abs(lo) <= 180) ? out : [];
}

/** [[lat, lon], …] → Google encoded polyline (precision 5). */
export function encodePolyline(line, precision = 5) {
  const k = 10 ** precision;
  let out = '';
  let pLat = 0;
  let pLon = 0;
  const put = (v) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    out += String.fromCharCode(n + 63);
  };
  for (const [lat, lon] of line ?? []) {
    const a = Math.round(lat * k);
    const b = Math.round(lon * k);
    put(a - pLat);
    put(b - pLon);
    pLat = a;
    pLon = b;
  }
  return out;
}

const R = 6371.0088;
/** Distance in km between two points [lat, lon] (haversine). */
export function distKm(a, b) {
  const toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR;
  const dLon = (b[1] - a[1]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Length of a line in km. */
export function lineKm(line) {
  let km = 0;
  for (let n = 1; n < (line?.length ?? 0); n++) km += distKm(line[n - 1], line[n]);
  return km;
}

/**
 * A thinner line that keeps the shape (Ramer–Douglas–Peucker, tolerance in metres, on a flat
 * approximation which is exact enough for a few hundred km). Keeps the first and the last point.
 */
export function simplify(line, tolM = 15) {
  const pts = line ?? [];
  if (pts.length < 3) return pts.slice();
  const lat0 = (pts[0][0] * Math.PI) / 180;
  const mx = 111_320 * Math.cos(lat0);
  const my = 110_540;
  const xy = pts.map(([la, lo]) => [lo * mx, la * my]);
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const tol2 = tolM * tolM;
  while (stack.length) {
    const [s, e] = stack.pop();
    const [ax, ay] = xy[s];
    const [bx, by] = xy[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let best = -1;
    let bi = -1;
    for (let n = s + 1; n < e; n++) {
      const [px, py] = xy[n];
      let d2;
      if (!len2) d2 = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d2 = (px - ax - u * dx) ** 2 + (py - ay - u * dy) ** 2;
      }
      if (d2 > best) {
        best = d2;
        bi = n;
      }
    }
    if (best > tol2 && bi > 0) {
      keep[bi] = 1;
      stack.push([s, bi], [bi, e]);
    }
  }
  return pts.filter((_, n) => keep[n]);
}

/** The point at a share (0…1) of the way along a line, by distance; null without a line. */
export function pointAlong(line, frac) {
  if (!line?.length) return null;
  if (line.length === 1) return line[0];
  const f = Math.max(0, Math.min(1, Number(frac) || 0));
  const total = lineKm(line);
  if (!total) return line[0];
  let want = total * f;
  for (let n = 1; n < line.length; n++) {
    const d = distKm(line[n - 1], line[n]);
    if (want <= d) {
      const u = d ? want / d : 0;
      return [line[n - 1][0] + (line[n][0] - line[n - 1][0]) * u, line[n - 1][1] + (line[n][1] - line[n - 1][1]) * u];
    }
    want -= d;
  }
  return line[line.length - 1];
}

/** { s, w, n, e } around all lines and points, or null. */
export function boundsOf(lines = [], points = []) {
  let s = 90;
  let w = 180;
  let n = -90;
  let e = -180;
  let any = false;
  const add = ([la, lo]) => {
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    any = true;
    s = Math.min(s, la);
    n = Math.max(n, la);
    w = Math.min(w, lo);
    e = Math.max(e, lo);
  };
  for (const l of lines) for (const p of l ?? []) add(p);
  for (const p of points) add(p);
  return any ? { s, w, n, e } : null;
}
