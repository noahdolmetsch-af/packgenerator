import { describe, it, expect } from 'vitest';
import { bikeFit } from '../src/lib/bikefit.js';

// «Welches Velo passt?» (C3): fictional rows as bikeChoice makes them.
const row = (id, extra = {}) => ({ bike: { id }, full: false, gearL: 10, volumeL: 20, late: 0, care: { soon: [] }, lightest: false, totalG: 12000, missing: 0, current: false, ...extra });
const trip = (gainM, km = 100) => ({ route: { km, gainM } });

describe('bikeFit', () => {
  it('a bike with tight bags loses against one with room', () => {
    const f = bikeFit([row('a', { full: true, current: true }), row('b')], trip(500));
    expect(f.best).toBe('b');
    expect(f.byBike.a.cons).toContain('tight');
  });
  it('care due before the start counts against a bike', () => {
    const f = bikeFit([row('a', { late: 2 }), row('b')], trip(500));
    expect(f.best).toBe('b');
  });
  it('the lightest bike gets a plus only on a hilly route', () => {
    const flat = bikeFit([row('a', { lightest: true }), row('b')], trip(200));
    expect(flat.byBike.a.pros).not.toContain('light');
    const hilly = bikeFit([row('a', { lightest: true }), row('b')], trip(2500));
    expect(hilly.best).toBe('a');
    expect(hilly.why).toContain('light');
  });
  it('no clear winner or a single bike gives no best', () => {
    expect(bikeFit([row('a'), row('b')], trip(500)).best).toBe(null);
    expect(bikeFit([row('a')], trip(500)).best).toBe(null);
  });
});
