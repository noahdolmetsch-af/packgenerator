/**
 * v0.41.0: a synthetic, fictional GPX ride for the tests (no real ride, no real person).
 * legs: [{ km, kmh, gainM }] ridden one after the other, or { stopMin } for standing still
 * (with a little GPS jitter). A point every `step` seconds, heading east from a made-up start.
 */
export function makeGpx({ name = 'test_data_gtp_ ride', start = '2026-06-01T06:00:00Z', legs = [], step = 10, ele0 = 400, lat = 46.5, lon = 7.5 } = {}) {
  const pts = [];
  let at = Date.parse(start);
  let x = lon;
  let ele = ele0;
  const kmPerDegLon = 111.32 * Math.cos((lat * Math.PI) / 180);
  pts.push({ lat, lon: x, ele, at });
  let n = 0;
  for (const leg of legs) {
    if (leg.stopMin) {
      const steps = Math.round((leg.stopMin * 60) / step);
      for (let i = 0; i < steps; i++) {
        at += step * 1000;
        const j = ((n++ % 5) - 2) * 0.00003; // ±3 m of jitter
        pts.push({ lat: lat + j, lon: x - j, ele, at });
      }
      continue;
    }
    const hours = leg.km / leg.kmh;
    const steps = Math.max(1, Math.round((hours * 3600) / step));
    for (let i = 0; i < steps; i++) {
      at += step * 1000;
      x += leg.km / steps / kmPerDegLon;
      ele += (leg.gainM ?? 0) / steps;
      pts.push({ lat, lon: x, ele, at });
    }
  }
  const trkpts = pts.map((p) => `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"><ele>${p.ele.toFixed(1)}</ele><time>${new Date(p.at).toISOString().replace('.000', '')}</time></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test_data_gtp_" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${name}</name></metadata>
<trk><name>${name}</name><trkseg>
${trkpts}
</trkseg></trk>
</gpx>
`;
}
