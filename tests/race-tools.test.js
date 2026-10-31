// «Werkzeug passend zum Velo» (Noah 27.10.2026): tools and spares from the race's bike. Made-up bikes.
import { describe, it, expect } from 'vitest';
import { suggestTools, toolsOf, fresh } from '../src/lib/race/tools-lib.js';

const ids = (list) => list.map((x) => x.id);

describe('tools for the bike', () => {
  it('tubeless: plugs, sealant, valve and one tube; no patch kit', () => {
    const got = ids(suggestTools({ parts: [] }, { front: 'tubeless', rear: 'tubeless' }));
    expect(got).toEqual(expect.arrayContaining(['tl-plugs', 'tl-sealant', 'tl-valve', 'tl-tube1']));
    expect(got).not.toContain('tl-patches');
  });
  it('tubes or unknown: two tubes and a patch kit, the reason says which', () => {
    const tube = suggestTools(null, { front: 'tube', rear: 'tube' });
    expect(ids(tube)).toEqual(expect.arrayContaining(['tl-tubes', 'tl-patches']));
    expect(tube.find((x) => x.id === 'tl-tubes').why).toBe('Your tyres have tubes');
    expect(suggestTools(null).find((x) => x.id === 'tl-tubes').why).toBe('Tubeless or tubes is not set for this bike');
  });
  it('reads the cogs, the pad model, suspension and battery of the bike', () => {
    const bike = { parts: [{ key: 'cassette', attrs: { cogs: '12-fach' } }, { key: 'padsR', model: 'Sample pads B01' }, { key: 'fork', model: 'Sample fork 100' }, { key: 'battery', model: '' }] };
    const got = suggestTools(bike, { front: 'tubeless', rear: 'tubeless' });
    expect(got.find((x) => x.id === 'tl-link')).toMatchObject({ text: 'Quick link for {n}-speed', vars: { n: '12' } });
    expect(got.find((x) => x.id === 'tl-pads').vars).toEqual({ model: 'Sample pads B01' });
    expect(ids(got)).toContain('tl-shockpump');
    expect(ids(got)).not.toContain('tl-battery');
  });
  it('your saved list wins; fresh suggestions keep the ticks', () => {
    expect(toolsOf({ tools: [{ id: 'a', text: 'Spoke key', done: true }] })).toEqual([{ id: 'a', text: 'Spoke key', why: '', done: true }]);
    const t = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k]) : s);
    const first = toolsOf({}, { parts: [{ key: 'cassette', attrs: { cogs: 11 } }] }, undefined, t);
    expect(first.find((x) => x.id === 'tl-link').text).toBe('Quick link for 11-speed');
    const again = fresh(null, undefined, t, [{ id: 'tl-multi', done: true }]);
    expect(again.find((x) => x.id === 'tl-multi').done).toBe(true);
  });
});
