import { describe, it, expect } from 'vitest';
import { spotRoundPlan, planSpotRound, TURN } from '../src/lib/neuland/runde.js';
import { bearing } from '../src/lib/ueberraschung.js';
import { distKm } from '../src/lib/route.js';

const home = { lat: 47.3769, lon: 8.5417 };
const spot = { lat: 47.45, lon: 8.6 };

describe('Neuland-Runde (N2)', () => {
  it('plans a triangle through the spot, the other side on request', () => {
    const r = spotRoundPlan(home, spot, 1);
    expect(r.via[0]).toEqual(spot);
    const d = distKm(home, spot);
    expect(distKm(home, r.via[1])).toBeCloseTo(d * 0.7, 1);
    const turn = (bearing(home, r.via[1]) - bearing(home, spot) + 360) % 360;
    expect(turn).toBeCloseTo(TURN, 0);
    const l = spotRoundPlan(home, spot, -1);
    expect((bearing(home, spot) - bearing(home, l.via[1]) + 360) % 360).toBeCloseTo(TURN, 0);
    expect(r.km).toBeGreaterThan(2 * d);
  });

  it('needs a home and a spot not at home', () => {
    expect(spotRoundPlan(null, spot)).toBeNull();
    expect(spotRoundPlan(home, { lat: 'x', lon: 1 })).toBeNull();
    expect(spotRoundPlan(home, home)).toBeNull();
  });

  it('asks the router once with home, spot, side point, home', async () => {
    const urls = [];
    const fetcher = async (u) => (urls.push(u), { ok: true, status: 200, json: async () => ({ features: [{ geometry: { coordinates: [[8.54, 47.37, 400], [8.6, 47.45, 450], [8.54, 47.37, 400]] }, properties: { 'track-length': 24000, 'filtered ascend': 210 } }] }) });
    const plan = spotRoundPlan(home, spot, 1);
    const r = await planSpotRound(home, plan, { fetcher, now: 1 });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('lonlats=8.54170,47.37690|8.60000,47.45000|');
    expect(r).toMatchObject({ km: 24, gainM: 210 });
    await expect(planSpotRound(home, null)).rejects.toThrow('failed');
  });
});
