// «Tour planen mit GPX»: a fictional route with two climbs for tests/routeclimbs.test.js and tests/e2e/tourplanen.spec.js.
/** A fictional GPX: flat 2 km, 300 m up over 5 km, down 3 km, 150 m up over 2 km, flat 1 km (≈111 m a point). */
export function testGpx() {
  const legs = [[18, 0], [45, 300], [27, -300], [18, 150], [9, 0]];
  const pts = [];
  let ele = 500;
  let lat = 46.5;
  pts.push([lat, ele]);
  for (const [n, d] of legs) for (let i = 0; i < n; i++) pts.push([(lat += 0.001), (ele += d / n)]);
  const trk = pts.map(([la, e]) => `<trkpt lat="${la.toFixed(5)}" lon="7.10000"><ele>${e.toFixed(1)}</ele></trkpt>`).join('');
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>test_data_gtp_ Zwei Hügel</name><trkseg>${trk}</trkseg></trk></gpx>`;
}

