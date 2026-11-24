// «Suche findet mehr» und «Treffer lesbarer» (Warteliste 1, Noah 22.11.2026 «1a 4a 5a»): pure parts, fictional data only.
import { describe, it, expect } from 'vitest';
import { parts, markWords } from '../src/lib/suche/mark.js';
import { moreGroups, MORE_KIND } from '../src/lib/suche/mehr.js';
import { searchAll, KIND } from '../src/lib/search.js';
import { smartSearch } from '../src/lib/kisuche/smart.js';
import { FEATURES } from '../src/lib/features.js';

const more = {
  rides: [
    { id: 'a-1', name: 'Testrunde Uetliberg', day: '2026-05-02', km: 42.5, kind: 'ride', src: 'Strava' },
    { id: 'k-1', name: 'Feierabend', day: '2026-05-03', km: 20, kind: 'ride', src: 'hand', bike: 'Testvelo' },
  ],
  places: [{ id: 'p1', name: 'Testpass', ele: 2100 }],
  learnings: [{ id: 'l1', topic: 'Regen', rule: 'Bei Regen die Hardshell oben', action: '' }],
  visits: [{ id: 'v1', shop: 'Testwerkstatt', date: '2026-04-01', bike: 'Testvelo', parts: 'Kette ersetzt' }],
  sessions: [{ id: 's1', name: 'Testintervalle', day: '2026-05-04', mins: 60 }],
  tasks: [{ id: 'w-1', title: 'Testschlauch bestellen', due: null, own: true }],
};

describe('mark', () => {
  it('marks every word found, in any case, and keeps the text whole', () => {
    const p = parts('Hardshell Jacke', 'jacke hard');
    expect(p.map((x) => x.s).join('')).toBe('Hardshell Jacke');
    expect(p.filter((x) => x.m).map((x) => x.s)).toEqual(['Hard', 'Jacke']);
  });
  it('never makes markup out of a name and survives special characters', () => {
    expect(parts('<b>x</b> (a)', '(a)').filter((x) => x.m).map((x) => x.s)).toEqual(['(a)']);
    expect(parts('Zelt', '')).toEqual([{ s: 'Zelt', m: false }]);
    expect(markWords('a Zelt  zelt')).toEqual(['zelt']);
  });
});

describe('search finds more', () => {
  it('finds rides, places, learnings, bike care, training and tasks, each under its own kind', () => {
    for (const [q, kind] of [['uetliberg', 'ride'], ['feierabend', 'ride'], ['testpass', 'place'], ['hardshell', 'learning'], ['testwerkstatt', 'care'], ['testintervalle', 'training'], ['testschlauch', 'task']]) {
      const g = searchAll(q, { more }).find((x) => x.kind === kind);
      expect(g?.rows.length, `${q} → ${kind}`).toBeGreaterThan(0);
    }
  });
  it('finds nothing extra before the tables are loaded', () => {
    expect(searchAll('uetliberg', {}).some((x) => x.kind === 'ride')).toBe(false);
  });
  it('finds settings from the functions under Ich, each as a row that opens its page', () => {
    const f = FEATURES.find((x) => String(x.href ?? '').startsWith('#/me'));
    const g = moreGroups((...fs) => fs.join(' ').toLowerCase().includes(f.title.toLowerCase().split(' ')[0]), {}).setting;
    expect(g.some((r) => r.href === f.href)).toBe(true);
  });
  it('has a name and a maximum for every extra kind, and a ride row says day, km and bike', () => {
    for (const k of Object.keys(MORE_KIND)) expect(KIND[k].max).toBeGreaterThan(0);
    const r = searchAll('feierabend', { more }).find((x) => x.kind === 'ride').rows[0];
    expect(r.sub).toContain('20 km');
    expect(r.sub).toContain('Testvelo');
  });
  it('«Alle zeigen»: the chosen kind is not cut, the others are', () => {
    const rides = Array.from({ length: 9 }, (_, i) => ({ id: `a-${i}`, name: `Testrunde ${i}`, day: '2026-05-01', km: 10, kind: 'ride', src: 'Strava' }));
    const cut = searchAll('testrunde', { more: { rides } }).find((x) => x.kind === 'ride');
    expect(cut.rows.length).toBe(KIND.ride.max);
    expect(cut.more).toBe(9 - KIND.ride.max);
    const full = smartSearch('testrunde', { more: { rides }, full: 'ride' }).groups.find((x) => x.kind === 'ride');
    expect(full.rows.length).toBe(9);
    expect(full.more).toBe(0);
  });
});
