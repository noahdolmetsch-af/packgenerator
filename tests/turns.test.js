// Abbiege-Hinweise (src/lib/live/turns.js): turns from the geometry of a GPX line. Fictional synthetic lines.
import { describe, it, expect } from 'vitest';
import { turnsOf, nextTurn, turnSay, turnText, roundM, TURN_KEYS } from '../src/lib/live/turns.js';
import { lineKm } from '../src/lib/race/race.js';
import de from '../src/lib/i18n/de/index.js';

const RAD = Math.PI / 180;
const M_LAT = 1 / 111195; // degrees latitude per metre

/** A seeded random (mulberry32), so the noisy lines are always the same. */
function rnd(seed = 7) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A walker: start somewhere fictional, then legs. ['go', m] straight ahead, ['turn', deg] on the spot
 * (positive = right), ['arc', deg, radiusM] a curve. Points every stepM; noiseM adds GPS jitter.
 */
function line(legs, { stepM = 15, noiseM = 0, seed = 7, lat0 = 46.5, lon0 = 8.0, head0 = 0 } = {}) {
  const r = rnd(seed);
  let lat = lat0;
  let lon = lon0;
  let h = head0;
  const out = [[lat, lon]];
  const move = (m) => {
    lat += Math.cos(h * RAD) * m * M_LAT;
    lon += (Math.sin(h * RAD) * m * M_LAT) / Math.cos(lat * RAD);
  };
  const push = () => {
    const g = () => (r() + r() + r() - 1.5) * 2 * noiseM; // spread about noiseM, up to 3 times as far
    out.push([lat + g() * M_LAT, lon + (g() * M_LAT) / Math.cos(lat * RAD)]);
  };
  for (const [kind, a, b] of legs) {
    if (kind === 'go') {
      for (let d = 0; d < a; ) {
        const s = Math.min(stepM, a - d);
        move(s);
        d += s;
        push();
      }
    } else if (kind === 'turn') h += a;
    else if (kind === 'arc') {
      const len = (Math.abs(a) * RAD * b) / 1;
      const steps = Math.max(1, Math.ceil(len / 2));
      for (let k = 0; k < steps; k++) {
        h += a / steps;
        move(len / steps);
        if (k % Math.max(1, Math.round(stepM / 2)) === 0) push();
      }
      push();
    }
  }
  return lineKm({ line: out });
}

describe('turnsOf', () => {
  it('a straight line has no turns', () => {
    expect(turnsOf(line([['go', 3000]]))).toEqual([]);
  });

  it('too short or empty lines give nothing', () => {
    expect(turnsOf([])).toEqual([]);
    expect(turnsOf(null)).toEqual([]);
    expect(turnsOf(line([['go', 100]]))).toEqual([]);
  });

  it('an L-shaped corner to the right gives one right turn at the corner', () => {
    const t = turnsOf(line([['go', 1000], ['turn', 90], ['go', 1000]]));
    expect(t).toHaveLength(1);
    expect(t[0].dir).toBe('right');
    expect(Math.abs(t[0].km - 1)).toBeLessThan(0.03);
    expect(t[0].deg).toBeGreaterThan(80);
    expect(t[0].deg).toBeLessThan(100);
    expect(Number.isFinite(t[0].lat) && Number.isFinite(t[0].lon)).toBe(true);
  });

  it('classifies left, slight, sharp and the U-turn', () => {
    const one = (deg) => turnsOf(line([['go', 800], ['turn', deg], ['go', 800]]));
    expect(one(-90)[0].dir).toBe('left');
    expect(one(45)[0].dir).toBe('slight-right');
    expect(one(-45)[0].dir).toBe('slight-left');
    expect(one(150)[0].dir).toBe('sharp-right');
    expect(one(-150)[0].dir).toBe('sharp-left');
    expect(one(20)).toEqual([]);
    // back on the same road
    const u = turnsOf(line([['go', 800], ['turn', 180], ['go', 800]]));
    expect(u).toHaveLength(1);
    expect(u[0].dir).toBe('u-turn');
  });

  it('two bends 20 m apart are one turn', () => {
    const t = turnsOf(line([['go', 800], ['turn', 45], ['go', 20], ['turn', 45], ['go', 800]], { stepM: 5 }));
    expect(t).toHaveLength(1);
    expect(t[0].dir).toBe('right');
  });

  it('a zigzag with 400 m legs gives every turn, alternating', () => {
    const legs = [['go', 600]];
    for (let i = 0; i < 6; i++) legs.push(['turn', i % 2 ? -90 : 90], ['go', 400]);
    const t = turnsOf(line(legs));
    expect(t.map((x) => x.dir)).toEqual(['right', 'left', 'right', 'left', 'right', 'left']);
  });

  it('a hairpin series on a pass road is one «bends» entry, not a hint every 150 m', () => {
    const legs = [['go', 800]];
    for (let i = 0; i < 8; i++) legs.push(['arc', i % 2 ? -180 : 180, 12], ['go', 150]);
    legs.push(['go', 800]);
    const t = turnsOf(line(legs, { stepM: 10 }));
    expect(t).toHaveLength(1);
    expect(t[0].dir).toBe('bends');
    expect(t[0].n).toBe(8);
    expect(t[0].toKm).toBeGreaterThan(t[0].km);
    expect(t[0].first).toBe('sharp-right');
  });

  it('two hairpins alone stay two sharp turns', () => {
    const t = turnsOf(line([['go', 800], ['arc', 180, 12], ['go', 150], ['arc', -180, 12], ['go', 800]], { stepM: 10 }));
    expect(t.map((x) => x.dir)).toEqual(['sharp-right', 'sharp-left']);
  });

  it('a sparse line (a point every 80 m) still finds the corner', () => {
    expect(turnsOf(line([['go', 1000], ['turn', 90], ['go', 1000]], { stepM: 80 })).map((x) => x.dir)).toEqual(['right']);
  });

  it('a tight 90° bend (radius 40 m) is a turn, a jog of 60 m two', () => {
    expect(turnsOf(line([['go', 600], ['arc', 90, 40], ['go', 600]], { stepM: 10 })).map((x) => x.dir)).toEqual(['right']);
    expect(turnsOf(line([['go', 600], ['turn', -90], ['go', 60], ['turn', 90], ['go', 600]], { stepM: 10 })).map((x) => x.dir)).toEqual(['left', 'right']);
  });

  it('wiggles every 70 m become one «bends» entry', () => {
    const t = turnsOf(line([['go', 300], ['turn', 50], ['go', 70], ['turn', -50], ['go', 70], ['turn', 50], ['go', 70], ['turn', -50], ['go', 500]], { stepM: 10 }));
    expect(t.map((x) => [x.dir, x.n])).toEqual([['bends', 4]]);
  });

  it('a long gentle curve does not fire', () => {
    expect(turnsOf(line([['go', 600], ['arc', 270, 100], ['go', 600]], { stepM: 10 }))).toEqual([]);
    expect(turnsOf(line([['go', 600], ['arc', -180, 70], ['go', 600]], { stepM: 10 }))).toEqual([]);
    expect(turnsOf(line([['go', 600], ['arc', 360, 60], ['go', 600]], { stepM: 10 }))).toEqual([]);
  });

  it('a noisy straight line (GPS jitter about 5 m, up to 15 m) gives no turns', () => {
    for (const seed of [1, 2, 3]) expect(turnsOf(line([['go', 10000]], { stepM: 10, noiseM: 5, seed }))).toEqual([]);
    expect(turnsOf(line([['go', 5000]], { stepM: 5, noiseM: 4 }))).toEqual([]);
  });

  it('a noisy corner is still found once', () => {
    const t = turnsOf(line([['go', 1000], ['turn', -90], ['go', 1000]], { stepM: 10, noiseM: 4 }));
    expect(t.map((x) => x.dir)).toEqual(['left']);
  });

  it('is fast on a long route (1000 km, 50k points)', () => {
    const legs = [];
    for (let i = 0; i < 250; i++) legs.push(['go', 2000], ['turn', i % 2 ? -70 : 70], ['go', 2000]);
    const pts = line(legs, { stepM: 20 });
    expect(pts.length).toBeGreaterThan(49000);
    const t0 = performance.now();
    const t = turnsOf(pts);
    const ms = performance.now() - t0;
    expect(t).toHaveLength(250);
    expect(t.every((x) => x.dir === (Math.round(x.km / 4 - 0.5) % 2 ? 'left' : 'right'))).toBe(true);
    expect(ms).toBeLessThan(1500);
    // nextTurn by binary search
    const s0 = performance.now();
    for (let k = 0; k < 10000; k++) nextTurn(t, k / 10);
    expect(performance.now() - s0).toBeLessThan(200);
  });
});

describe('nextTurn', () => {
  const turns = [
    { km: 1, dir: 'right', deg: 90 },
    { km: 2.5, dir: 'left', deg: 90 },
  ];
  it('gives the next turn ahead with its distance in m', () => {
    expect(nextTurn(turns, 0.8)).toMatchObject({ km: 1, dir: 'right', distM: 200 });
    expect(nextTurn(turns, 1.005)).toMatchObject({ km: 1, distM: 0 }); // just at it
    expect(nextTurn(turns, 1.05)).toMatchObject({ km: 2.5, distM: 1450 });
    expect(nextTurn(turns, 3)).toBeNull();
    expect(nextTurn([], 1)).toBeNull();
    expect(nextTurn(turns, null)).toBeNull();
  });
});

describe('roundM, turnText and turnSay', () => {
  it('rounds 50 m steps under 300 m, 100 m above', () => {
    expect(roundM(212)).toBe(200);
    expect(roundM(230)).toBe(250);
    expect(roundM(20)).toBe(50);
    expect(roundM(340)).toBe(300);
    expect(roundM(1260)).toBe(1300);
  });

  const left = { km: 4.2, dir: 'left', deg: 88 };
  it('says «In 200 m …» once, then «Now …» once', () => {
    const said = new Set();
    expect(turnSay(left, 600, said)).toBeNull();
    const far = turnSay(left, 212, said);
    expect(far).toEqual({ id: 'turn:4.2:far', key: 'In {m} m turn left', vars: { m: 200 } });
    said.add(far.id);
    expect(turnSay(left, 150, said)).toBeNull();
    expect(turnSay(left, 60, said)).toBeNull();
    const now = turnSay(left, 30, said);
    expect(now).toEqual({ id: 'turn:4.2:now', key: 'Turn left now', vars: {} });
    said.add(now.id);
    expect(turnSay(left, 10, said)).toBeNull();
  });

  it('the text for the arrow at any distance', () => {
    expect(turnText(left, 900)).toEqual({ key: 'In {m} m turn left', vars: { m: 900 } });
    expect(turnText({ km: 1, dir: 'u-turn' }, 20).key).toBe('Make a U-turn now');
    expect(turnText({ km: 1, dir: 'bends', n: 6, toKm: 2.24 }, 400)).toEqual({ key: 'In {m} m: {n} bends over {km} km', vars: { m: 400, n: 6, km: 1.2 } });
    expect(turnText(null, 100)).toBeNull();
  });

  it('every hint text has a German text', () => {
    for (const k of TURN_KEYS) expect(de[k], k).toBeTruthy();
  });
});
