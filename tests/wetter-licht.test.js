// «Sonnenauf- und -untergang und Licht» (Noah 04.11.2026 «5 alle»): the light of a day from the weather core.
import { describe, it, expect } from 'vitest';
import { lightDay, lightDays, hm, LAMP_MIN } from '../src/lib/wetter/licht.js';

const H = 36e5;
const t0 = Date.UTC(2026, 10, 4, 0); // 04.11.2026 00:00 UTC, offset 0 (made-up place)
const core = { offset: 0, days: [
  { date: '2026-11-04', rise: t0 + 6.5 * H, set: t0 + 16.75 * H },
  { date: '2026-11-05', rise: t0 + 30.6 * H, set: t0 + 40.7 * H },
] };

describe('lightDay', () => {
  it('gives sunrise, sunset, the length and the time for the lamp', () => {
    const l = lightDay(core, '2026-11-04');
    expect(l.lengthMin).toBe(615);
    expect(l.lampOn).toBe(t0 + 16.75 * H - LAMP_MIN * 60000);
    expect(l.lampOff).toBe(t0 + 6.5 * H + LAMP_MIN * 60000);
  });
  it('is null without sun times or when sunset is before sunrise', () => {
    expect(lightDay(core, '2026-12-01')).toBeNull();
    expect(lightDay({ days: [{ date: 'x', rise: null, set: 5 }] }, 'x')).toBeNull();
    expect(lightDay({ days: [{ date: 'x', rise: 10, set: 5 }] }, 'x')).toBeNull();
  });
});

describe('lightDays', () => {
  it('names today and tomorrow', () => {
    const d = lightDays(core, t0 + 9 * H);
    expect(d.map((x) => x.day)).toEqual(['today', 'tomorrow']);
  });
  it('leaves a day out when the core does not have it', () => {
    expect(lightDays({ ...core, days: [core.days[0]] }, t0 + 9 * H).map((x) => x.day)).toEqual(['today']);
  });
});

describe('hm', () => {
  it('splits minutes', () => {
    expect(hm(615)).toEqual({ h: 10, m: 15 });
  });
});
