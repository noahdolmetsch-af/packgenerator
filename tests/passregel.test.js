// «Eine Regel für Pässe» (Entdecken und Sammeln, Noah 04.11.2026 «1a»): 600 m sure, to 1.2 km please confirm.
import { describe, it, expect } from 'vitest';
import { SURE_KM, MAYBE_KM, hitLevel } from '../src/lib/passregel.js';
import { PASSES, RADIUS_KM, passHitsOnLine, passesOnLine } from '../src/lib/paesse/katalog.js';
import { suggestions, stateOf, collectAll } from '../src/lib/paesse/sammlung.js';
import { maybeOf } from '../src/lib/neuland/vielleicht.js';
import { tracksOf } from '../src/lib/neuland/neuland.js';

const FURKA = PASSES.find((p) => p.key === 'furka');
// a straight east-west line this many km north of the pass top (0.01° of latitude is about 1.11 km)
const lineAt = (km) => [[FURKA.lat + km / 111.2, FURKA.lon - 0.05], [FURKA.lat + km / 111.2, FURKA.lon + 0.05]];

describe('one rule for passes', () => {
  it('sure up to 600 m, maybe up to 1.2 km, then nothing', () => {
    expect(SURE_KM).toBe(0.6);
    expect(MAYBE_KM).toBe(1.2);
    expect(RADIUS_KM).toBe(MAYBE_KM);
    expect(hitLevel(0)).toBe('sure');
    expect(hitLevel(0.6)).toBe('sure');
    expect(hitLevel(0.61)).toBe('maybe');
    expect(hitLevel(1.2)).toBe('maybe');
    expect(hitLevel(1.21)).toBeNull();
    expect(hitLevel(NaN)).toBeNull();
    expect(hitLevel(-1)).toBeNull();
  });

  it('«Pässe sammeln» gives the distance and the level with every suggestion', () => {
    const src = [{ id: 'r1', date: '2026-07-01', title: 'Sure', line: lineAt(0.2) }];
    const [s] = suggestions(src, stateOf(null));
    expect(s.key).toBe('furka');
    expect(s.level).toBe('sure');
    expect(s.km).toBeCloseTo(0.2, 1);
    const [m] = suggestions([{ id: 'r2', date: '2026-07-02', title: 'Maybe', line: lineAt(0.9) }], stateOf(null));
    expect(m.level).toBe('maybe');
    expect(m.km).toBeCloseTo(0.9, 1);
    expect(suggestions([{ id: 'r3', date: '2026-07-03', line: lineAt(1.5) }], stateOf(null))).toEqual([]);
  });

  it('a later sure ride makes a pass sure, the first ride stays the one named', () => {
    const src = [
      { id: 'a', date: '2026-07-01', title: 'First', line: lineAt(0.9) },
      { id: 'b', date: '2026-08-01', title: 'Second', line: lineAt(0.1) },
    ];
    const [s] = suggestions(src, stateOf(null));
    expect(s.date).toBe('2026-07-01');
    expect(s.level).toBe('sure');
  });

  it('«Collect all» takes only what the caller hands over (the sure ones)', () => {
    const sugg = suggestions([
      { id: 'a', date: '2026-07-01', line: lineAt(0.2) },
      { id: 'b', date: '2026-07-02', line: [[46.62, 8.3], [46.6, 8.4]] },
    ], stateOf(null));
    const sure = sugg.filter((x) => x.level === 'sure');
    expect(collectAll(stateOf(null), sure).list.map((p) => p.key)).toEqual(['furka']);
  });

  it('keeps passHitsOnLine and passesOnLine in step', () => {
    expect(passHitsOnLine(lineAt(0.3))[0].key).toBe('furka');
    expect(passesOnLine(lineAt(0.3))).toEqual(['furka']);
    expect(passHitsOnLine([[46.5, 8]])).toEqual([]);
  });
});

describe('Neuland: maybe ridden', () => {
  const pass = { id: 'p-furkapass', name: 'Furkapass', lat: FURKA.lat, lon: FURKA.lon, alt: 2429 };
  const part = (extra = {}) => ({ id: 'passes', items: [pass], visited: new Map(), ...extra });
  const tracks = (km, day = '2026-07-04') => tracksOf({ rides: [{ id: 'r1', date: day, tripId: 't1', line: lineAt(km) }], today: '2026-10-19' });

  it('lists a pass the line passed between 600 m and 1.2 km away, not a sure or a far one', () => {
    const [m] = maybeOf(part(), tracks(0.9));
    expect(m).toMatchObject({ id: 'p-furkapass', day: '2026-07-04', tripId: 't1', rideId: 'r1' });
    expect(m.km).toBeCloseTo(0.9, 1);
    expect(maybeOf(part(), tracks(0.3))).toEqual([]); // sure: Neuland counts it by itself
    expect(maybeOf(part(), tracks(1.6))).toEqual([]);
  });

  it('leaves out passes that count, passes marked «not there», own entries and other collections', () => {
    expect(maybeOf(part({ visited: new Map([['p-furkapass', { day: '2026-01-01' }]]) }), tracks(0.9))).toEqual([]);
    expect(maybeOf(part(), tracks(0.9), { 'p-furkapass': { day: '2026-07-05' } })).toEqual([]);
    expect(maybeOf(part({ items: [{ ...pass, own: true }] }), tracks(0.9))).toEqual([]);
    expect(maybeOf({ ...part(), id: 'huts' }, tracks(0.9))).toEqual([]);
  });

  it('names the earliest day', () => {
    const t2 = tracksOf({ rides: [{ id: 'b', date: '2026-08-01', line: lineAt(0.8) }, { id: 'a', date: '2026-07-01', line: lineAt(1.0) }], today: '2026-10-19' });
    const [m] = maybeOf(part(), t2);
    expect(m.day).toBe('2026-07-01');
    expect(m.km).toBeCloseTo(0.8, 1);
  });
});
