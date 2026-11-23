// «Fenster teilen» (Wetter-Ausbau H, Noah 22.11.2026 «a»): the best window as one short text.
import { describe, it, expect } from 'vitest';
import { windowFacts, windowText } from '../src/lib/wetter/teilen.js';

const win = { date: '2026-11-25', start: Date.UTC(2026, 10, 25, 9), end: Date.UTC(2026, 10, 25, 13), line: { tmin: 2, tmax: 10, rainFrom: null, windMax: 9, dir: 270 } };
const say = {
  day: () => 'Wed',
  hm: (ms) => `${new Date(ms).getUTCHours()}:00`,
  num: (n) => String(n),
  compass: () => 'west',
  t: (k, v = {}) => k.replace(/\{(\w+)\}/g, (_, x) => v[x]),
};

describe('windowFacts', () => {
  it('takes the facts of a window', () => {
    expect(windowFacts(win)).toMatchObject({ date: '2026-11-25', tmin: 2, tmax: 10, rain: false, wind: 9, dir: 270 });
  });
  it('is null without a window or without times', () => {
    expect(windowFacts(null)).toBeNull();
    expect(windowFacts({ date: 'x' })).toBeNull();
  });
});

describe('windowText', () => {
  it('writes one line for the group', () => {
    expect(windowText(windowFacts(win), say)).toBe('Wed 9:00–13:00, 2–10 °C, dry, wind 9 km/h from the west. Start 9:00.');
  });
  it('says rain and leaves out what it does not know', () => {
    const f = windowFacts({ ...win, line: { tmin: 5, tmax: 5, rainFrom: 1, windMax: null, dir: null } });
    expect(windowText(f, say)).toBe('Wed 9:00–13:00, 5 °C, rain possible. Start 9:00.');
    expect(windowText(windowFacts({ ...win, line: null }), say)).toBe('Wed 9:00–13:00, dry. Start 9:00.');
  });
  it('is empty without facts', () => expect(windowText(null, say)).toBe(''));
});
