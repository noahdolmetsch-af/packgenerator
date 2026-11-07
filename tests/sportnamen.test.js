// «Sportarten umbenennen funktioniert nicht» (Noah 05.11.2026): the four bike sports have their own list,
// and a renamed sport has the same name on every page. Fictional names only.
import { describe, it, expect, afterEach } from 'vitest';
import { SPORTS, STD_SPORTS, BIKE_DAY_SPORTS, setSportNames, sportLabel } from '../src/lib/sportlist.js';
import { allSports } from '../src/lib/sportsbase.js';
import { orderSports, kindText } from '../src/lib/sports.js';
import { listFor, STANDARD_LIST } from '../src/lib/standard.js';
import { edit, remove, toggleHidden } from '../src/lib/lists.js';
import { setDomains, DOMAINS, DOMAIN } from '../src/lib/domains.js';

afterEach(() => {
  setDomains(listFor('domains', {}));
  setSportNames(listFor('tripSports', {}), DOMAIN);
});

describe('tripSports', () => {
  it('is a list of exactly the four bike sports that have no area', () => {
    expect(STANDARD_LIST.tripSports.entries().map((e) => e.id)).toEqual(BIKE_DAY_SPORTS);
    for (const k of BIKE_DAY_SPORTS) expect(DOMAINS.map((d) => d.key)).not.toContain(k);
  });

  it('a renamed Gravel shows its new name in the list of all sports and keeps its place', () => {
    const e = listFor('tripSports', {}).find((x) => x.id === 'gravel');
    const all = { tripSports: edit(undefined, e, { name: 'Schotter' }) };
    setSportNames(listFor('tripSports', all), DOMAIN);
    const s = allSports({ domains: DOMAINS, acts: [] }).find((x) => x.key === 'gravel');
    expect(s.name).toBe('Schotter');
    expect(s.raw).toBe(true);
    expect(allSports({ domains: DOMAINS, acts: [] }).map((x) => x.key).slice(0, 5)).toEqual(['cycling', 'gravel', 'xc', 'downhill', 'bikepacking']);
    // never through t(): a typed name is kept as it is
    expect(sportLabel(SPORTS.find((x) => x.key === 'gravel'), () => 'WRONG')).toBe('Schotter');
  });

  it('back to the Standard brings the name back', () => {
    const e = listFor('tripSports', {}).find((x) => x.id === 'xc');
    setSportNames(listFor('tripSports', { tripSports: edit(undefined, e, { name: 'Gelände' }) }), DOMAIN);
    expect(SPORTS.find((x) => x.key === 'xc').name).toBe('Gelände');
    setSportNames(listFor('tripSports', {}), DOMAIN);
    const std = SPORTS.find((x) => x.key === 'xc');
    expect(std.name).toBe(STD_SPORTS.find((x) => x.key === 'xc').name);
    expect(std.raw).toBe(false);
  });

  it('hidden and deleted sports are not offered for a new trip, but a trip being edited keeps its sport', () => {
    const e = listFor('tripSports', {}).find((x) => x.id === 'downhill');
    setSportNames(listFor('tripSports', { tripSports: toggleHidden(undefined, 'downhill') }), DOMAIN);
    expect(orderSports([]).map((s) => s.key)).not.toContain('downhill');
    expect(orderSports([], 'downhill').map((s) => s.key)).toContain('downhill');
    expect(allSports({ domains: DOMAINS, acts: [] }).map((x) => x.key)).not.toContain('downhill');
    setSportNames(listFor('tripSports', { tripSports: remove(undefined, e) }), DOMAIN);
    expect(orderSports([]).map((s) => s.key)).not.toContain('downhill');
  });
});

describe('a sport with its own area (Skitouren, Wandern, Bikepacking)', () => {
  it('follows the name of its area on every page, also in the kind of a trip', () => {
    const ski = listFor('domains', {}).find((x) => x.id === 'ski');
    setDomains(listFor('domains', { domains: edit(undefined, ski, { name: 'Tourenski' }) }));
    setSportNames(listFor('tripSports', {}), DOMAIN);
    expect(allSports({ domains: DOMAINS, acts: [] }).find((x) => x.key === 'ski').name).toBe('Tourenski');
    expect(kindText({ domain: 'ski' }, () => 'WRONG')).toBe('Tourenski');
  });

  it('a Standard sport keeps its translated name', () => {
    setSportNames(listFor('tripSports', {}), DOMAIN);
    expect(kindText({ domain: 'ski' }, (x) => `T:${x}`)).toBe('T:Ski touring|sport');
  });
});
