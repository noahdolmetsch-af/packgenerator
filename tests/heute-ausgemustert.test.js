// «Jetzt dran» (Heute): a retired bike never shows up as an idea, a care row or a count (Noah 05.11.2026:
// «Gravel Factor LS» was retired, yet «Idee: heute mit dem Gravel Factor LS fahren» stayed). Fictional data only.
import './setup/de.js';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { quickPlan } from '../src/lib/quickstart.js';
import { lastBikeId } from '../src/lib/dayride.js';
import { appDates } from '../src/lib/merken/appdates.js';
import { hintsFor } from '../src/lib/sk/pages.js';

const NOW = new Date('2026-11-05T10:00:00');
const TODAY = '2026-11-05';
const rot = { id: 'rot', name: 'Testvelo Rot', order: 0 };
const blau = { id: 'blau', name: 'Testvelo Blau', order: 1, retired: { at: '2026-11-01', reason: 'sold', note: '' }, archived: true };
// the retired bike was ridden last
const trips = [{ id: 'T1', title: 'Testtour', bikeId: 'blau', bike: 'Testvelo Blau', startDate: '2026-11-03', finished: true, createdAt: '2026-11-03T08:00:00Z' }];
const repair = (bikeId) => ({ id: 1, task: 'Bremsbelag', bikeId, status: 'needed', area: 'Bike' });

describe('the idea of the day (quickPlan, lastBikeId)', () => {
  it('lastBikeId skips a retired bike, even when its trip is the newest', () => {
    expect(lastBikeId(trips, [blau, rot], TODAY)).toBe('rot');
  });
  it('quickPlan never picks a retired bike: not by the last trip, not by an explicit id', () => {
    expect(quickPlan(trips, [blau, rot], { now: NOW }).bike.id).toBe('rot');
    expect(quickPlan(trips, [blau, rot], { now: NOW, bikeId: 'blau' }).bike.id).toBe('rot');
  });
  it('only retired bikes: no idea at all', () => {
    expect(quickPlan(trips, [blau], { now: NOW })).toBeNull();
    expect(lastBikeId(trips, [blau], TODAY)).toBeNull();
  });
  it('an active bike still works as before', () => {
    expect(quickPlan([], [rot], { now: NOW }).bike.id).toBe('rot');
  });
});

describe('other places that count bikes', () => {
  const texts = { pack: (x) => x, tripSub: '', care: (b, r) => `${b}: ${r}`, careSub: '' };
  it('the agenda lists care of an active bike, not of a retired one', () => {
    const rows = (bikes) => appDates({ trips: [], bikes, visits: [], tasks: [repair('rot'), { ...repair('blau'), id: 2 }], today: TODAY, texts }).map((r) => r.key);
    expect(rows([rot, blau]).some((k) => k.startsWith('care:rot'))).toBe(true);
    expect(rows([rot, blau]).some((k) => k.startsWith('care:blau'))).toBe(false);
  });
  it('the Quick Links hint «bikes with something due» does not count a retired bike', () => {
    const hint = (bikes) => hintsFor('quick', { bikes, trips: [], visits: [], maintenance: [repair('rot'), { ...repair('blau'), id: 2 }], settings: [] }, TODAY).velocare;
    expect(hint([rot, blau]).text).toMatch(/^1 /);
    expect(hint([blau]).text).toBeUndefined(); // no active bike: «no bikes yet», not «1 bike with something due»
  });
});

describe('Heute reads only active bikes', () => {
  const src = readFileSync(new URL('../src/pages/Home.svelte', import.meta.url), 'utf8');
  it('the list «bikes» of Heute is made of active bikes; a trip still finds its bike by allBikes', () => {
    expect(src).toMatch(/const bikes = \$derived\(activeBikes\(allBikes\)\)/);
    expect(src).toMatch(/shownBike = \$derived\(shown \? allBikes\.find/);
  });
  it('the Schnellstart writes the trip on an active bike', () => {
    expect(src).toMatch(/const raw = sortBikes\(activeBikes\(\$bikesQ/);
  });
});
