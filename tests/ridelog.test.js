// Fahrt-Protokoll (Noah 01.11.2026 «4a»): gaps, restarts and the text of a recording row, with made-up points.
import { describe, it, expect } from 'vitest';
import { gapsOf, rideLog, rideLogText } from '../src/lib/live/ridelog.js';
import { forgotStep } from '../src/lib/tourenc/pausewhy.js';

const start = Date.UTC(2026, 10, 1, 19, 40);
// points every 5 s along 47° N, then a 20 min gap with 9 km between
const pts = [[47, 8, 0], [47, 8.001, 5], [47, 8.002, 10], [47.0, 8.13, 1210], [47.0, 8.131, 1215]];
const row = { startAt: start, km: 9.4, pts, breaks: [], log: [[start, 's'], [start + 60_000, 'h'], [start + 1_200_000, 'v'], [start + 1_200_100, 'L0'], [start + 1_200_200, 'c'], [start + 1, 'zz']] };

describe('Fahrt-Protokoll', () => {
  it('finds the gaps with their length and the way between the points', () => {
    const g = gapsOf(pts, start);
    expect(g).toHaveLength(1);
    expect(g[0].s).toBe(1200);
    expect(g[0].m).toBeGreaterThan(8000);
    expect(gapsOf(pts, start, 3000)).toHaveLength(0);
  });
  it('counts points, restarts, hidden and lost locks; unknown codes are left out', () => {
    const l = rideLog(row);
    expect(l.points).toBe(5);
    expect(l.restarts).toBe(1);
    expect(l.hidden).toBe(1);
    expect(l.lockLost).toBe(1);
    expect(l.events).toHaveLength(5);
    expect(l.gapS).toBe(1200);
  });
  it('writes one line per fact', () => {
    const L = { points: 'Points', km: 'km', first: 'First', last: 'Last', gaps: 'Gaps', restarts: 'Restarts', hidden: 'Hidden', lockLost: 'Lock lost', pauses: 'Pauses', codes: { s: 'Start', h: 'Hidden' } };
    const text = rideLogText(rideLog(row), L);
    expect(text).toContain('Points: 5');
    expect(text).toContain('Gaps: 1 (20 min)');
    expect(text).toMatch(/Start/);
    expect(rideLogText(rideLog(null), L)).toContain('Points: 0');
  });
});

describe('«Aufzeichnung ohne Route» (Noah 01.11.2026 «2a»)', () => {
  it('no speed (a GPS gap) is no standing: nothing is asked afterwards', () => {
    let st = {};
    let now = start;
    // standing for a minute, then 25 min without a speed, then riding on: only the first minute stood
    for (const kmh of [0, 0, 0]) {
      const r = forgotStep(st, { kmh, now });
      st = r.st;
      now += 20_000;
    }
    const gap = forgotStep(st, { kmh: null, now: now + 25 * 60_000 });
    expect(gap.st.since).toBeNull();
    const go = forgotStep(gap.st, { kmh: 18, now: now + 26 * 60_000 });
    expect(go.ask).toBeNull();
  });
});
