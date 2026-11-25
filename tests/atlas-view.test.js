// «Rennatlas» (Noah 24.11.2026): filters, status, the three cards, the year line and the calendar file.
import { describe, it, expect } from 'vitest';
import { rowOf, keyOf } from '../src/lib/race/atlas.js';
import { span, statusOf, lineOf, fits, newFilter, activeCount, matches, facets, switchCounts, sorted, dueCards, yearLine, freeCounts, yearsOfMine, pointsOf, calendarOf, diffDays } from '../src/lib/race/atlas-view.js';

const TODAY = '2026-11-24';
const R = (x) => rowOf({ date: '2027-06-01', days: '2', ...x });
const ROWS = [
  R({ name: 'Seeweg', date: '2027-05-01', days: '2', registered: true, status: 'Anmeldung öffnet', land: 'Schweiz', surface: 'Gravel / Mischbelag', lat: 47.05, lon: 8.31 }),
  R({ name: 'Passrunde', date: '2027-06-12', days: '6–10', registered: true, status: 'Anmeldung offen', land: 'Schweiz', surface: 'MTB / Offroad' }),
  R({ name: 'Talrunde', date: '2027-06-18', days: '2–3', registered: true, land: 'Deutschland', surface: 'Strasse' }),
  R({ name: 'Juraweg', date: '2027-06-02', days: '3–5', fav: true, status: 'Anmeldung öffnet', opens: '2026-12-01', land: 'Schweiz', surface: 'Gravel / Mischbelag' }),
  R({ name: 'Stadtlauf', date: '2027-05-28', days: '2–3', fav: true, status: 'Anmeldung öffnet', opens: '2027-01-10', closes: '2027-01-16', land: 'Schweiz', surface: 'Gravel / Mischbelag' }),
  R({ name: 'Herbstpass', date: '2027-09-18', days: '4', status: 'Anmeldung offen', land: 'Frankreich', surface: 'Gravel / Mischbelag' }),
  R({ name: 'Ohne Tag', date: '', days: '3', land: 'Italien', surface: 'Strasse', status: 'Geschlossen / vergangen' }),
];
const mine = ROWS.filter((r) => r.registered || r.fav);
const ctx = { today: TODAY, mine };

describe('days and status', () => {
  it('reads the span of days', () => {
    expect(span(ROWS[1])).toEqual({ min: 6, max: 10 });
    expect(span(ROWS[5])).toEqual({ min: 4, max: 4 });
    expect(span({ days: 1, daysText: '' })).toEqual({ min: 1, max: 1 });
  });
  it('says how a registration stands', () => {
    expect(statusOf(ROWS[0], TODAY).kind).toBe('mine');
    expect(statusOf(ROWS[3], TODAY)).toEqual({ kind: 'soon', days: 7 });
    expect(statusOf({ ...ROWS[3], opens: '2026-11-01' }, TODAY).kind).toBe('open');
    expect(statusOf(ROWS[6], TODAY).kind).toBe('shut');
    expect(statusOf({ status: 'etwas Neues' }, TODAY)).toEqual({ kind: 'unk', text: 'etwas Neues' });
    expect(statusOf({}, TODAY)).toEqual({ kind: 'unk' });
  });
  it('keeps two rest days behind a race', () => {
    expect(lineOf(ROWS[1])).toEqual({ from: '2027-06-12', minTo: '2027-06-17', maxTo: '2027-06-21', restTo: '2027-06-23' });
    expect(lineOf(ROWS[6])).toBeNull();
  });
});

describe('filters', () => {
  it('counts what is on and filters by text without accents', () => {
    const f = newFilter();
    expect(activeCount(f)).toBe(0);
    expect(ROWS.filter((r) => matches(r, { ...f, q: 'SCHWEIZ' }, ctx))).toHaveLength(4);
    expect(ROWS.filter((r) => matches(r, { ...f, q: 'stadtlauf' }, ctx))).toHaveLength(1);
    expect(activeCount({ ...f, q: 'x', surface: ['Strasse'], dmin: 3, opens30: true })).toBe(4);
  });
  it('filters surface, country and days together', () => {
    const f = { ...newFilter(), surface: ['Gravel / Mischbelag'], land: ['Schweiz'], dmin: 4, dmax: 6 };
    expect(ROWS.filter((r) => matches(r, f, ctx)).map((r) => r.name)).toEqual(['Juraweg']);
  });
  it('knows a registration that opens in 30 days and one that is open', () => {
    expect(ROWS.filter((r) => matches(r, { ...newFilter(), opens30: true }, ctx)).map((r) => r.name)).toEqual(['Juraweg']);
    expect(ROWS.filter((r) => matches(r, { ...newFilter(), open: true }, ctx)).map((r) => r.name)).toEqual(['Herbstpass']);
  });
  it('shows what fits between yours', () => {
    expect(fits(ROWS[5], mine)).toBe(true);
    expect(fits(R({ name: 'Mitten drin', date: '2027-06-14', days: '2' }), mine)).toBe(false);
    expect(fits(ROWS[6], mine)).toBe(false);
    expect(switchCounts(ROWS, newFilter(), ctx).fits).toBe(ROWS.filter((r) => fits(r, mine)).length);
  });
  it('makes the chips with counts, the most common first', () => {
    const f = facets(ROWS);
    expect(f.surface[0]).toEqual({ key: 'Gravel / Mischbelag', n: 4 });
    expect(f.land[0]).toEqual({ key: 'Schweiz', n: 4 });
    expect([f.fav, f.registered]).toEqual([2, 3]);
  });
  it('sorts', () => {
    expect(sorted(ROWS, 'date').at(-1).name).toBe('Ohne Tag');
    expect(sorted(ROWS, 'opens')[0].name).toBe('Juraweg');
    expect(sorted(ROWS, 'name')[0].name).toBe('Herbstpass');
  });
});

describe('the three cards', () => {
  it('takes the next two registrations of your favourites, and the registered one that is not open', () => {
    const c = dueCards(ROWS, TODAY);
    expect(c.soon.row.name).toBe('Juraweg');
    expect(c.soon.days).toBe(7);
    expect(c.then.row.name).toBe('Stadtlauf');
    expect(c.then.days).toBe(diffDays(TODAY, '2027-01-10'));
    expect(c.check.name).toBe('Seeweg');
    expect(dueCards([], TODAY)).toEqual({ soon: null, then: null, check: null });
  });
});

describe('the year line', () => {
  const line = yearLine(ROWS, mine, 2027);
  it('shows the months around your races', () => {
    expect(line.from).toBe('2027-04-01');
    expect(line.to).toBe('2027-07-31');
    expect(line.items.map((x) => x.row.name)).toEqual(['Seeweg', 'Stadtlauf', 'Juraweg', 'Passrunde', 'Talrunde']);
  });
  it('finds the pairs that do not fit and says how short the first must be', () => {
    const names = line.pairs.map((p) => `${p.a.name}+${p.b.name}`);
    expect(names).toContain('Passrunde+Talrunde');
    const p = line.pairs.find((x) => x.a.name === 'Passrunde');
    expect(p.sure).toBe(false);
    expect(p.atMost).toBe(6);
    expect(line.pairs.find((x) => x.a.name === 'Stadtlauf' && x.b.name === 'Juraweg')).toBeUndefined();
  });
  it('finds the free windows and counts what would fit', () => {
    const wins = freeCounts(line, ROWS, mine);
    expect(wins.length).toBeGreaterThan(0);
    expect(wins.every((w) => w.from <= w.to)).toBe(true);
    expect(wins.reduce((a, w) => a + w.n, 0)).toBe(0); // Herbstpass lies after the shown cut
  });
  it('has nothing without a race in the year', () => {
    expect(yearLine(ROWS, mine, 2030).items).toEqual([]);
  });
  it('lists the years, the coming first', () => {
    expect(yearsOfMine(mine, TODAY)).toEqual(['2027']);
    expect(yearsOfMine([R({ name: 'A', date: '2025-03-01' }), R({ name: 'B', date: '2028-03-01' })], TODAY)).toEqual(['2028', '2025']);
  });
});

describe('map points and calendar', () => {
  it('uses only the races with a position', () => {
    expect(pointsOf(mine).map((p) => p.row.name)).toEqual(['Seeweg']);
  });
  it('writes all-day events', () => {
    const races = calendarOf('races', mine, TODAY);
    expect(races).toContain('BEGIN:VCALENDAR');
    expect(races.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(races).toContain('DTSTART;VALUE=DATE:20270501');
    expect(races).toContain('DTEND;VALUE=DATE:20270503');
    const opens = calendarOf('opens', mine, TODAY);
    expect(opens.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(opens).toContain('DTSTART;VALUE=DATE:20261201');
    expect(calendarOf('opens', [], TODAY)).toBe('');
    expect(new Set(races.match(/UID:[^\r]+/g)).size).toBe(5);
    expect(keyOf(ROWS[0])).toContain('seeweg');
  });
});
