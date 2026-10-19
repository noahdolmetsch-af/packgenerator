// «Mehr Inhalt» T2 «Harte Stücke dieser Fahrt» and T5 «Deine Hausrunde über die Zeit» (Noah 15.10.2026
// «1-5 a»): the pure maths. Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { hardPieces, piecesSummary, homeLoop, powerZone, HARD_SHARE, MIN_PIECE, MAX_DIP } from '../src/lib/training/inhalt/inhalt-fahrt.js';
import { powerBounds } from '../src/lib/training.js';

const FTP = 250;
/** A course one point per minute: W per minute from a list, heart rate 130 + W/20. */
const prof = (ws, { step = 1, breaks = [] } = {}) => ({ pts: ws.map((w, i) => [i * step, 500, Math.round(130 + w / 20), w]), breaks });
const easy = (n) => Array(n).fill(150);
const hard = (n, w = 240) => Array(n).fill(w);

describe('hard pieces', () => {
  it('finds 4 × 5 minutes with 3 easier minutes between, as the rules in the source say', () => {
    expect([HARD_SHARE, MIN_PIECE, MAX_DIP]).toEqual([0.9, 3, 1]);
    const ws = [...easy(10), ...hard(5), ...easy(3), ...hard(5), ...easy(3), ...hard(5), ...easy(3), ...hard(5), ...easy(10)];
    const p = hardPieces(prof(ws), FTP);
    expect(p.map((x) => [x.from, x.to, x.mins, x.w])).toEqual([[10, 15, 5, 240], [18, 23, 5, 240], [26, 31, 5, 240], [34, 39, 5, 240]]);
    expect(p[0].hr).toBe(142);
    expect(p[0].zone).toBe(4);
    const s = piecesSummary(p, FTP);
    expect(s).toEqual({ same: true, n: 4, mins: 5, w: 240, zone: 4, pause: 3, ids: [0, 1, 2, 3] });
  });

  it('keeps one easier minute inside a piece, two end it; under 3 minutes is no piece', () => {
    const one = hardPieces(prof([...easy(3), ...hard(3), 200, ...hard(3), ...easy(3)]), FTP);
    expect(one).toHaveLength(1);
    expect(one[0].mins).toBe(7);
    expect(one[0].w).toBe(Math.round((240 * 6 + 200) / 7));
    const two = hardPieces(prof([...easy(3), ...hard(3), 200, 200, ...hard(3), ...easy(3)]), FTP);
    expect(two.map((x) => x.mins)).toEqual([3, 3]);
    expect(hardPieces(prof([...easy(3), ...hard(2), ...easy(3)]), FTP)).toEqual([]);
    // exactly 90 % counts
    expect(hardPieces(prof([...easy(2), ...hard(3, FTP * 0.9), ...easy(2)]), FTP)).toHaveLength(1);
  });

  it('a break ends a piece; points closer than a minute count by their time', () => {
    const ws = [...easy(3), ...hard(4), 0, 0, ...hard(4), ...easy(3)];
    const p = hardPieces(prof(ws, { breaks: [[7, 9]] }), FTP);
    expect(p.map((x) => [x.from, x.to])).toEqual([[3, 7], [9, 13]]);
    // half-minute points: 7 points = 3.5 minutes; a 2-point dip (1 minute) stays inside
    const half = hardPieces(prof([...easy(4), ...hard(4), 200, 200, ...hard(3), ...easy(4)], { step: 0.5 }), FTP);
    expect(half).toHaveLength(1);
    expect(half[0].mins).toBe(4.5);
  });

  it('nothing without power, FTP or points; zones from the FTP', () => {
    expect(hardPieces(null, FTP)).toEqual([]);
    expect(hardPieces(prof(hard(10)), null)).toEqual([]);
    expect(hardPieces({ pts: hard(10).map((_, i) => [i, 500, 140, null]) }, FTP)).toEqual([]);
    expect(piecesSummary([], FTP)).toBe(null);
    const b = powerBounds(FTP);
    expect(powerZone(b[2], FTP)).toBe(3);
    expect(powerZone(b[2] + 1, FTP)).toBe(4);
    expect(powerZone(9999, FTP)).toBe(7);
  });

  it('pieces of different length: the biggest equal group, else all together', () => {
    const ws = [...easy(3), ...hard(5, 250), ...easy(3), ...hard(5, 250), ...easy(5), ...hard(12, 230), ...easy(3)];
    const p = hardPieces(prof(ws), FTP);
    expect(p.map((x) => x.mins)).toEqual([5, 5, 12]);
    const s = piecesSummary(p, FTP);
    expect(s).toMatchObject({ same: true, n: 2, mins: 5, w: 250, pause: 3, ids: [0, 1] });
    const lone = piecesSummary([p[2]], FTP);
    expect(lone).toEqual({ same: false, n: 1, mins: 12, w: 230 });
  });
});

describe('home loop', () => {
  const ride = (id, day, f = {}) => ({ id, day, time: '08:00', kind: 'bike', name: 'test_data_gtp_Hausrunde', km: 30, movingS: 3600, hrAvg: 140, wDevice: true, wAvg: 200, ...f });

  it('needs 3 rides on the same route', () => {
    const a = ride('a', '2026-10-01');
    expect(homeLoop([a, ride('b', '2026-09-01')], a)).toBe(null);
    expect(homeLoop([a, ride('b', '2026-09-01'), ride('c', '2026-08-01', { km: 40 })], a)).toBe(null); // km not within 10 %
    expect(homeLoop([a, ride('b', '2026-09-01'), ride('c', '2026-08-01', { name: 'other' })], a)).toBe(null);
  });

  it('time, speed, power, heart rate and watts per beat, oldest first; this ride against the mean of the others', () => {
    const me = ride('me', '2026-10-10', { movingS: 3520, hrAvg: 136, wAvg: 210 });
    const all = [me, ride('b', '2026-09-01', { movingS: 3600, hrAvg: 140 }), ride('c', '2026-08-01', { movingS: 3600, hrAvg: 140, wDevice: false, wAvg: null }), ride('x', '2026-07-01', { kind: 'run' })];
    const h = homeLoop(all, me);
    expect(h.power).toBe(true);
    expect(h.eff).toBe('wpb');
    expect(h.n).toBe(3);
    expect(h.rows.map((r) => r.id)).toEqual(['c', 'b', 'me']);
    expect(h.rows[2]).toMatchObject({ me: true, s: 3520, kmh: 30.7, w: 210, hr: 136, eff: 1.54 });
    expect(h.rows[0]).toMatchObject({ w: null, eff: null });
    expect(h.dS).toBe(-80); // 1:20 faster
    expect(h.dHr).toBe(-4);
  });

  it('without power: heart rate per km/h; at most max rows, always with this ride', () => {
    const rides = Array.from({ length: 10 }, (_, i) => ride(`r${i}`, `2026-0${Math.floor(i / 3) + 1}-1${i % 3}`, { wDevice: false, wAvg: null }));
    const me = rides[0];
    const h = homeLoop(rides, me, { max: 4 });
    expect(h.eff).toBe('bpk');
    expect(h.rows).toHaveLength(4);
    expect(h.rows.some((r) => r.me)).toBe(true);
    expect(h.rows.find((r) => r.me).eff).toBe(Math.round((140 / 30) * 100) / 100);
    expect(h.dS).toBe(0);
    expect(h.dHr).toBe(0);
  });
});
