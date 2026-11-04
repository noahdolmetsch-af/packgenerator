// «Wetter-Sprüche auf Mundart» (Idee 27): the saying by kind of weather, warmth and day.
import { describe, it, expect } from 'vitest';
import { MUNDART, mundartFor, HOT_C, COLD_C } from '../src/lib/home/mundart.js';

const wx = (kind, temp = 15, when = 'today') => ({ kind, temp, when });

describe('mundartFor', () => {
  it('has sayings for every kind, none empty and none left with a placeholder', () => {
    for (const [k, list] of Object.entries(MUNDART)) {
      expect(list.length, k).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < list.length; i++) {
        const s = mundartFor(k === 'hot' ? wx('dry', HOT_C) : k === 'cold' ? wx('dry', COLD_C) : wx(k), `2026-11-${String(1 + i).padStart(2, '0')}`);
        expect(s, `${k} ${i}`).toBeTruthy();
        expect(s).not.toMatch(/\{[dD]\}/);
      }
    }
  });
  it('picks by kind and warmth', () => {
    const d = '2026-11-03';
    expect(MUNDART.rain).toContain(MUNDART.rain.find((x) => mundartFor(wx('rain'), d) === x.replace('{D}', 'Hüt').replace('{d}', 'hüt')));
    expect(mundartFor(wx('dry', 30), d)).toMatch(/Hitz|heiss/);
    expect(mundartFor(wx('dryuntil', 0), d)).toMatch(/chalt|frisch/);
    expect(mundartFor(wx('rain', 30), d)).not.toMatch(/Hitz/); // rain wins over heat
  });
  it('is the same all day and changes with the day', () => {
    expect(mundartFor(wx('dry'), '2026-11-03')).toBe(mundartFor(wx('dry'), '2026-11-03'));
    const seen = new Set(['03', '04', '05', '06'].map((x) => mundartFor(wx('dry'), `2026-11-${x}`)));
    expect(seen.size).toBeGreaterThan(1);
  });
  it('says «morn» for tomorrow and «hüt» for today', () => {
    const all = (when) => [1, 2, 3, 4].map((x) => mundartFor(wx('rain', 12, when), `2026-11-0${x}`)).join(' ');
    expect(all('tomorrow')).toMatch(/[Mm]orn/);
    expect(all('today')).toMatch(/[Hh]üt/);
  });
  it('says nothing without a weather line', () => {
    expect(mundartFor(null, '2026-11-03')).toBe(null);
    expect(mundartFor({ text: 'x' }, '2026-11-03')).toBe(null);
  });
});
