// «Tour planen mit GPX» (Noah 20.10.2026 «3a und b»): the fine profile and every climb of a planned tour.
// The climbs come from the race code (race/climbs-lib.js); here: the view around a climb, the colours, the
// notes, a GPX route with two climbs, and every text of the new files in German.
import { describe, it, expect } from 'vitest';
import de from '../src/lib/i18n/de/index.js';
import { parseGpx, routeStats } from '../src/lib/route.js';
import { climbsDetail } from '../src/lib/race/climbs-lib.js';
import { STEEPNESS } from '../src/lib/map/fineprofile.js';
import { testGpx } from './fixtures/zweihuegel-gpx.js';
import { minOf, viewFor, colourOf, notesOf, withNote, PLAN_DEFAULT_MIN, PLAN_MIN_GAINS, SHORT_LIST } from '../src/lib/route/routeclimbs.js';

describe('Tour planen mit GPX: climbs of a planned route', () => {
  const route = routeStats(parseGpx(testGpx()), 'zwei.gpx');
  it('the GPX import keeps the fine profile and finds both climbs', () => {
    expect(route.profileFine?.d?.length).toBeGreaterThan(100);
    const list = climbsDetail({ route, minGain: PLAN_DEFAULT_MIN });
    expect(list.length).toBe(2);
    expect(list[0].gain).toBeGreaterThan(270);
    expect(list[0].avg).toBeGreaterThan(4);
    expect(list[1].gain).toBeGreaterThan(120);
    expect(list[0].bars.length).toBeGreaterThan(40); // a bar every 100 m
    expect(list[0].estimated).toBe(false);
    expect(climbsDetail({ route, minGain: 200 }).length).toBe(1);
  });
  it('the view around a climb stays inside the route and is at least 300 m', () => {
    expect(viewFor({ fromKm: 2, toKm: 7 }, 13.3)).toEqual({ from: 0.75, to: 8.25 });
    expect(viewFor({ fromKm: 0, toKm: 0.1 }, 13.3)).toEqual({ from: 0, to: 0.4 });
    expect(viewFor({ fromKm: 12, toKm: 13.3 }, 13.3).to).toBe(13.3);
  });
  it('the minimum: stored on the trip, else the default', () => {
    expect(minOf({})).toBe(PLAN_DEFAULT_MIN);
    expect(minOf({ climbMin: 200 })).toBe(200);
    expect(minOf({ climbMin: 5 })).toBe(PLAN_DEFAULT_MIN);
    expect(PLAN_MIN_GAINS).toContain(PLAN_DEFAULT_MIN);
    expect(SHORT_LIST).toBeGreaterThan(2);
  });
  it('the colours are the ones of the profile', () => {
    const colours = STEEPNESS.map((s) => s.colour);
    for (const p of [-14, -7, 0, 4, 7, 10, 13, 20]) expect(colours).toContain(colourOf(p));
    expect(colourOf(10)).toBe(STEEPNESS.find((s) => s.key === 'u3').colour);
  });
  it('notes: add, change, remove; nothing else is kept', () => {
    expect(notesOf({ climbNotes: { a: 'x', b: '', c: 3 } })).toEqual({ a: 'x' });
    expect(notesOf({ climbNotes: [] })).toEqual({});
    const n = withNote({}, '2', ' kleiner Gang ');
    expect(n).toEqual({ 2: 'kleiner Gang' });
    expect(withNote(n, '2', '')).toEqual({});
  });
});

describe('Tour planen mit GPX in German', () => {
  const src = import.meta.glob(['../src/lib/route/RouteClimbs.svelte', '../src/lib/map/ProfileStrip.svelte', '../src/lib/pack/RouteCard.svelte'], { eager: true, query: '?raw', import: 'default' });
  const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  it('every t() text has a German entry with the same placeholders', () => {
    const lit = `'((?:[^'\\\\]|\\\\.)*)'`;
    const missing = [];
    for (const [file, text] of Object.entries(src)) {
      const keys = new Set();
      for (const m of text.matchAll(new RegExp(`\\bt\\(\\s*${lit}`, 'g'))) keys.add(m[1]);
      for (const m of text.matchAll(new RegExp(`\\btn\\([^,]+,\\s*${lit}\\s*,\\s*${lit}`, 'g'))) (keys.add(m[1]), keys.add(m[2]));
      for (const k0 of keys) {
        const k = k0.replace(/\\'/g, "'");
        if (!(k in de)) missing.push(`${file.split('/').pop()}: ${k}`);
        else if (ph(k) !== ph(de[k])) missing.push(`${file.split('/').pop()}: placeholders of ${k}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
