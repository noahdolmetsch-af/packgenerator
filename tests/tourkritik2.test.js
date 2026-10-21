import { describe, it, expect } from 'vitest';
import { ridesWx } from '../src/lib/touren/ridewx.js';

describe('ridesWx (Strava check #8)', () => {
  it('takes the measured weather at each ride start', () => {
    const acts = [{ wxRide: { t: 9.2, wind: 4.1, code: 2 } }, { wxRide: { t: 16.6, wind: 7, code: 3 } }, { name: 'no weather yet' }];
    expect(ridesWx(acts)).toEqual({ tmin: 9, tmax: 17, wmin: 4, wmax: 7, wet: false, n: 2 });
  });
  it('knows rain and gives null without any weather', () => {
    expect(ridesWx([{ wxRide: { t: 12, wind: null, code: 61 } }]).wet).toBe(true);
    expect(ridesWx([{}, null])).toBeNull();
  });
});
