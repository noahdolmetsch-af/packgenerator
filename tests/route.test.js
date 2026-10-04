import { describe, it, expect } from 'vitest';
import { parseGpx, routeStats, ridingHours, distKm, thin } from '../src/lib/route.js';

// Three points north along a meridian: 0.1° latitude ≈ 11.12 km each.
const gpx = `<?xml version="1.0"?><gpx version="1.1"><trk><name>Jura &amp; back</name><trkseg>
<trkpt lat="47.0" lon="7.0"><ele>500</ele></trkpt>
<trkpt lat="47.1" lon="7.0"><ele>501</ele></trkpt>
<trkpt lat="47.2" lon="7.0"><ele>900</ele></trkpt>
<trkpt lat="47.3" lon="7.0"><ele>700</ele></trkpt>
</trkseg></trk></gpx>`;

describe('GPX route (answer 12b)', () => {
  it('reads points, distance, climbing and start', () => {
    const r = routeStats(parseGpx(gpx), 'jura.gpx');
    expect(r.name).toBe('Jura & back');
    expect(r.km).toBeCloseTo(33.4, 0);
    expect(r.gainM).toBe(400); // the 1 m wiggle does not count
    expect(r.lossM).toBe(200);
    expect(r.start).toEqual({ lat: 47, lon: 7 });
    expect(r.line).toHaveLength(4);
  });
  it('reads route points and refuses other files', () => {
    const rte = '<gpx><rte><rtept lat="46" lon="8"/><rtept lat="46.1" lon="8"/></rte></gpx>';
    expect(routeStats(parseGpx(rte), 'x.gpx')).toMatchObject({ name: 'x', gainM: 0 });
    expect(() => parseGpx('<html></html>')).toThrow(/not a GPX/);
    expect(() => parseGpx('<gpx><trk></trk></gpx>')).toThrow(/no route/);
  });
  it('guesses riding hours a day and thins long tracks', () => {
    expect(ridingHours({ km: 160, gainM: 1200 }, 2)).toBe(6); // (10 + 2) / 2
    expect(ridingHours({ km: 0 })).toBeNull();
    expect(distKm({ lat: 47, lon: 7 }, { lat: 47.1, lon: 7 })).toBeCloseTo(11.12, 1);
    const many = Array.from({ length: 1000 }, (_, i) => ({ lat: i / 1000, lon: 0 }));
    const t = thin(many, 200);
    expect(t).toHaveLength(200);
    expect(t.at(-1)).toEqual([0.999, 0]);
  });
});

describe('bike photo size (answer 13b)', () => {
  it('fits the longest side into the limit and never makes photos bigger', async () => {
    const { fitSize } = await import('../src/lib/photo.js');
    expect(fitSize(4000, 3000, 1400)).toEqual({ w: 1400, h: 1050 });
    expect(fitSize(3000, 4000, 1400)).toEqual({ w: 1050, h: 1400 });
    expect(fitSize(800, 600, 1400)).toEqual({ w: 800, h: 600 });
  });
});
