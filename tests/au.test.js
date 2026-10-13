// v0.127.0 Gesamtprüfung A-U1, A-U2, A-U5 (mockups, Noah 13.10.2026 «A-U1–A-U5 freigeben»). Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { similarHours, nameClash, SIMILAR_N } from '../src/lib/formprefill.js';

const trip = (id, days, hours, startDate, extra = {}) => ({ id, title: `test_data_gtp_${id}`, days, hours, startDate, bikeId: 'b1', ...extra });

describe('A-U5: the riding hours of similar trips', () => {
  const trips = [
    trip('a', 2, 5, '2026-09-20'),
    trip('b', 2, 4, '2026-08-10'),
    trip('c', 2, 6, '2026-10-04'),
    trip('d', 2, 1, '2026-05-01'), // older than the newest three
    trip('e', 1, 2, '2026-10-01'),
    trip('f', 2, 9, '2026-10-10', { skipped: true }),
    trip('g', 2, 8, '2026-10-11', { packs: [] }), // not by bike
    trip('h', 2, null, '2026-10-12'),
  ];
  it('takes the middle of the newest three bike trips with the same days', () => {
    expect(SIMILAR_N).toBe(3);
    expect(similarHours(trips, 2)).toEqual({ hours: 5, n: 3 });
    expect(similarHours(trips, 1)).toEqual({ hours: 2, n: 1 });
    expect(similarHours(trips, 3)).toBeNull();
    expect(similarHours([], 2)).toBeNull();
  });
  it('rounds to half an hour and leaves out the trip being made', () => {
    expect(similarHours([trip('a', 1, 2.2, '2026-10-01'), trip('b', 1, 3.1, '2026-10-02')], 1)).toEqual({ hours: 2.5, n: 2 });
    expect(similarHours(trips, 2, 'c')).toEqual({ hours: 4, n: 3 });
  });
});

describe('A-U5: the check at the name field', () => {
  const trips = [trip('a', 1, 2, '2026-05-02', { title: 'Jura' }), trip('b', 1, 2, '2026-06-02', { title: 'Jura (2)' })];
  it('finds the same name (case and spaces ignored) and suggests a free one', () => {
    const c = nameClash(' jura ', trips);
    expect(c.trip.id).toBe('a');
    expect(c.suggestion).toBe('jura (3)');
    expect(nameClash('Jura Süd', trips)).toBeNull();
    expect(nameClash('', trips)).toBeNull();
    expect(nameClash('Jura', trips, 'a')).toBeNull(); // the trip itself
  });
});

describe('A-U2: one way for errors and empty views', () => {
  const src = new URL('../src/', import.meta.url).pathname;
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.svelte')) files.push(p);
    }
  };
  walk(src);
  const read = (p) => readFileSync(p, 'utf8');
  it('the pages sit inside a <svelte:boundary> with the error page', () => {
    const app = read(join(src, 'App.svelte'));
    expect(app).toMatch(/<svelte:boundary onerror=/);
    expect(app).toMatch(/\{#snippet failed\(error, reset\)\}<ErrorPage/);
  });
  it('the empty building block is used widely and the old own empty cards are gone', () => {
    const users = files.filter((p) => /import Empty from '[./]+(lib\/)?ui\/Empty\.svelte'/.test(read(p)));
    // grep count (validation of A-U2): 5 files before, 22 more since v0.127.0
    expect(users.length).toBeGreaterThanOrEqual(27);
    const own = files.filter((p) => /class="card empty"|class="rv-box pad empty"|<p class="card">\{t\('No (bikes|trips|gear|favourites)/.test(read(p)));
    expect(own).toEqual([]);
  });
});
