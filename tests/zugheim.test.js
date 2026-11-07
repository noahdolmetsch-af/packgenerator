// «Zug hin, Velo heim» (Träume und Neuland N7, Noah 27.10.2026 «1-5 a»): starts in unknown areas, trains, the way home.
import { describe, it, expect } from 'vitest';
import { trainStarts, askTrains, askRideHome, AROUND_KM } from '../src/lib/neuland/zugheim.js';

const P = 'test_data_gtp_';
const HOME = { lat: 47.0, lon: 8.0 };
// a municipality d km north (+) or east (lon) of home
const at = (id, dLat, dLon) => ({ id, name: `${P}${id}`, lat: HOME.lat + dLat / 111, lon: HOME.lon + dLon / 76 });
const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('starts', () => {
  const items = [
    at('n1', 46, 0), at('n2', 47, 3), at('n3', 44, -4), // north: a new area of three
    at('e1', 0, 45), // east: alone
    at('s1', -46, 0), at('s2', -47, 2), // south: two, one visited
    at('near', 5, 0), at('far', 150, 0),
  ];
  const cols = [{ id: 'municipalities', items, visited: new Set(['s2']) }];

  it('about the ride away, the newest area first, one per direction', () => {
    const got = trainStarts(cols, HOME, { rideKm: 60 });
    expect(got).toHaveLength(3);
    expect(got[0].around).toBe(3);
    expect(got.map((x) => x.id[0])).toEqual(['n', 'e', 's']);
    expect(got.every((x) => x.rideKm >= 40 && x.rideKm <= 70)).toBe(true);
    expect(got.some((x) => x.id === 's2' || x.id === 'near' || x.id === 'far')).toBe(false);
    expect(AROUND_KM).toBe(8);
  });

  it('nothing without home or municipalities', () => {
    expect(trainStarts(cols, null)).toEqual([]);
    expect(trainStarts([], HOME)).toEqual([]);
  });
});

describe('asking', () => {
  it('trains from the station nearest home to the one nearest the start', async () => {
    const asked = [];
    const fetcher = async (url) => {
      asked.push(url);
      if (url.includes('/locations') && url.includes('x=47&')) return json({ stations: [{ id: '1', name: `${P}Heimbahnhof`, distance: 300 }] });
      if (url.includes('/locations')) return json({ stations: [{ id: '2', name: `${P}Zielbahnhof`, distance: 500 }] });
      return json({ connections: [{ from: { departure: '2026-10-31T08:04:00+0100', platform: '3', station: { name: `${P}Heimbahnhof` } }, to: { arrival: '2026-10-31T09:10:00+0100', station: { name: `${P}Zielbahnhof` } }, duration: '00d01:06:00', transfers: 1, sections: [{ journey: { category: 'IR', number: '15' } }] }] });
    };
    const r = await askTrains({ lat: 47, lon: 8 }, { lat: 47.4, lon: 8 }, { fetcher });
    expect(r.from.name).toBe(`${P}Heimbahnhof`);
    expect(r.trains[0]).toMatchObject({ depTime: '08:04', arrTime: '09:10', min: 66, transfers: 1, platform: '3' });
    expect(asked.at(-1)).toContain('from=1&to=2');
    await expect(askTrains({ lat: 47, lon: 8 }, { lat: 47.4, lon: 8 }, { fetcher: async () => json({ stations: [] }) })).rejects.toThrow('nostation');
  });

  it('the way home by bike, one request from the start to home', async () => {
    const asked = [];
    const fetcher = async (url) => (asked.push(url), json({ features: [{ properties: { 'track-length': '61200', 'filtered ascend': '640' }, geometry: { coordinates: [[8, 47.4, 500], [8, 47.2, 450], [8, 47, 420]] } }] }));
    const r = await askRideHome({ lat: 47.4, lon: 8 }, { lat: 47, lon: 8 }, { fetcher });
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('lonlats=8.00000,47.40000|8.00000,47.00000');
    expect(r.km).toBe(61.2);
    expect(r.min).toBeGreaterThan(180);
    await expect(askRideHome({ lat: 47.4, lon: 8 }, { lat: 47, lon: 8 }, { fetcher: async () => json({}, 429) })).rejects.toThrow('busy');
  });
});

describe('bikeMinutes', () => {
  it('estimates the ride time from the road km', async () => {
    const { bikeMinutes } = await import('../src/lib/neuland/zugheim.js');
    expect(bikeMinutes(0)).toBe(0);
    expect(bikeMinutes(60)).toBeGreaterThan(bikeMinutes(30));
    expect(bikeMinutes(60)).toBeLessThan(60 * 4);
  });
});
