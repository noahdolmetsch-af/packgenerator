// «Quick Links» Schritt 4 (Noah 28.10.2026 «6a 7a», «20: 30 Tage»): recently opened, suggest pinning, clean-up.
import { describe, it, expect } from 'vitest';
import { starter, addView } from '../src/lib/quick/quicklinks.js';
import { cleanUsage, recordVisit, suggestions, stalePins, usePin, pinsAt, pathOf, daysBetween, RECENT_MAX } from '../src/lib/quick/usage.js';

const day = (n) => { const d = new Date(Date.UTC(2026, 9, 1 + n)); return d.toISOString().slice(0, 10); };

describe('Quick Links usage', () => {
  it('counts calendar days and page paths', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(pathOf('#/trips?f=x')).toBe('#/trips');
    expect(pathOf('#/')).toBe('#/');
    expect(cleanUsage(null)).toMatchObject({ start: null, recent: [], days: {} });
  });

  it('keeps the last pages, newest first, each once; Today and Quick Links do not count', () => {
    let u = cleanUsage(null);
    u = recordVisit(u, '#/trips', 'Touren', day(0));
    u = recordVisit(u, '#/bikes', 'Velos', day(0));
    u = recordVisit(u, '#/trips?f=planned', 'Touren', day(1));
    u = recordVisit(u, '#/', 'Heute', day(1));
    u = recordVisit(u, '#/quick', 'Quick Links', day(1));
    expect(u.recent.map((r) => r.href)).toEqual(['#/trips?f=planned', '#/bikes']);
    expect(u.start).toBe(day(0));
    for (let i = 0; i < 10; i++) u = recordVisit(u, `#/p${i}`, `P${i}`, day(2));
    expect(u.recent).toHaveLength(RECENT_MAX);
  });

  it('suggests a page opened on 3 days in 2 weeks that is not pinned; «No, thanks» holds 30 days', () => {
    let u = cleanUsage(null);
    let s = starter();
    for (const n of [0, 3, 6]) u = recordVisit(u, '#/calendar', 'Kalender', day(n));
    expect(suggestions(u, s, day(6))).toEqual([{ href: '#/calendar', title: 'Kalender' }]);
    expect(suggestions(u, s, day(20))).toEqual([]); // too long ago
    expect(suggestions({ ...u, no: { '#/calendar': day(6) } }, s, day(7))).toEqual([]);
    s = addView(s, '#/calendar', 'Kalender');
    expect(suggestions(u, s, day(6))).toEqual([]);
  });

  it('offers pins not opened for 30 days; opening or «Keep» resets it; a new pin counts from its day', () => {
    let u = recordVisit(cleanUsage(null), '#/trips', 'Touren', day(0));
    let s = starter();
    expect(stalePins(u, s, day(29))).toEqual([]);
    expect(stalePins(u, s, day(30))).toHaveLength(s.pins.length);
    const id = s.pins[0].id;
    u = usePin(u, id, day(25));
    expect(stalePins(u, s, day(30))).not.toContain(id);
    expect(stalePins({ ...u, keep: { [s.pins[1].id]: day(30) } }, s, day(40))).not.toContain(s.pins[1].id);
    s = addView(s, '#/calendar', 'Kalender', '', day(20));
    expect(stalePins(u, s, day(40))).not.toContain(s.pins.at(-1).id);
    expect(pinsAt(s, '#/calendar?x=1')).toEqual([s.pins.at(-1).id]);
  });
});
