// Paket M «Aus Touren lernen»: Chronik-Karte and #/chronik (lernen/chronik.js, zeitachse.js), Monatskarte
// and Jahresbrief (lernen/gelernt.js), the year as slides (lernen/jahrstory.js). Fictional data
// (tests/e2e/lernen-fixture.js), today 19 October 2026.
import { describe, it, expect } from 'vitest';
import { lernenData, P, addDays } from './e2e/lernen-fixture.js';
import { chronik, chronikView, noteLine, projectLines, thinLine } from '../src/lib/lernen/chronik.js';
import { timeline, monthPage, passes, CHRONIK_FILTERS } from '../src/lib/lernen/zeitachse.js';
import { monthCard, yearLetter, tripScore, monthsWithData, yearsWithData } from '../src/lib/lernen/gelernt.js';
import { storySlides, storyReady, yearOfHash, stepTo } from '../src/lib/lernen/jahrstory.js';

const TODAY = '2026-10-19';
const F = lernenData(TODAY);
const T = F.tables;

describe('chronik: this day and this month in earlier years', () => {
  const c = chronik({ ...T, today: TODAY });
  it('lists the trip and the ride of exactly one year ago on «Tag», newest year first', () => {
    expect(c.day.map((e) => e.id)).toEqual([`${P}jura`, `${P}ride1`]);
    const jura = c.day[0];
    expect(jura).toMatchObject({ kind: 'trip', year: '2025', km: 132, note: 'Zu viel Werkzeug dabei.', href: `#/debrief/${P}jura` });
    expect(jura.lines).toHaveLength(1);
    expect(c.day[1]).toMatchObject({ kind: 'ride', km: 35, href: `#/debrief/ride/${P}ride1` });
  });
  it('«Monat» adds the trip of two years ago in the same month, never this year', () => {
    expect(c.month.map((e) => e.id)).toEqual([`${P}jura`, `${P}ride1`, `${P}seen`]);
    expect(c.month.some((e) => e.year === '2026')).toBe(false);
  });
  it('a day of a multi-day trip counts (its second day)', () => {
    const next = chronik({ ...T, today: addDays(TODAY, 1) });
    expect(next.day.map((e) => e.id)).toEqual([`${P}jura`]);
  });
  it('shows the day first, the month when the day is empty, and keeps a chosen view', () => {
    expect(chronikView(c).mode).toBe('day');
    const empty = chronik({ ...T, today: '2026-10-25' });
    expect(chronikView(empty)).toMatchObject({ mode: 'month' });
    expect(chronikView(empty).list.length).toBe(3);
    expect(chronikView(c, 'month').list.length).toBe(3);
  });
  it('a called-off trip and an activity on a ride day do not show', () => {
    const trips = T.trips.map((x) => (x.id === `${P}jura` ? { ...x, skipped: true } : x));
    const acts = [{ id: 'a1', day: '2025-10-19', name: 'Same ride', kind: 'bike', km: 35 }, { id: 'a2', day: '2024-10-19', name: 'Run', kind: 'run', km: 8 }];
    const x = chronik({ ...T, trips, activities: acts, today: TODAY });
    expect(x.day.map((e) => e.id)).toEqual([`${P}ride1`, 'a2']);
  });
  it('without today nothing', () => expect(chronik({ ...T })).toEqual({ day: [], month: [] }));
});

describe('the small map', () => {
  it('fits every line into the box', () => {
    const m = projectLines([{ id: 'a', lines: [[[47, 8], [47.1, 8.2]]] }, { id: 'b', lines: [[[46.9, 8.1], [47, 8.3]]] }], 300, 160, 10);
    expect(m.paths).toHaveLength(2);
    const nums = m.paths.flatMap((p) => p.d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number));
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums.filter((_, i) => i % 2 === 0))).toBeLessThanOrEqual(300);
  });
  it('null without a line; long lines get thinner', () => {
    expect(projectLines([{ id: 'a', lines: [] }])).toBeNull();
    expect(thinLine(Array.from({ length: 500 }, (_, i) => [i, i]), 100)).toHaveLength(100);
  });
  it('noteLine: first line, at most 90 characters', () => {
    expect(noteLine('Eins\nZwei')).toBe('Eins');
    expect(noteLine('x'.repeat(200)).length).toBe(90);
    expect(noteLine(null)).toBe('');
  });
});

describe('#/chronik: one time line per month', () => {
  const extra = {
    visits: [{ id: 'v1', bikeId: `${P}bike`, date: '2026-10-02', shop: 'Velo Test', parts: [{ part: 'chain' }] }],
    maintenance: [{ id: 1, task: 'Bremse entlüften', subject: 'Gravel', status: 'done', statusDate: '2026-10-05' }, { id: 2, task: 'offen', status: 'open' }],
    flowLog: [{ id: 'f1', actId: 'meditation', day: '2026-10-06', min: 12 }, { id: 'f2', actId: 'run', day: '2026-10-06' }],
    notes: [{ id: 'n1', at: '2026-10-07T08:00:00.000Z', text: 'Neue Schläuche kaufen\nbald', status: 'open' }],
    bikes: [{ id: `${P}bike`, name: 'Testvelo' }],
  };
  const all = timeline({ ...T, ...extra, today: TODAY });
  it('has every kind, newest first', () => {
    expect(new Set(all.map((e) => e.kind))).toEqual(new Set(['trip', 'ride', 'care', 'meditation', 'note']));
    expect(all.map((e) => e.date)).toEqual([...all.map((e) => e.date)].sort().reverse());
    expect(all.find((e) => e.id === 'n1').title).toBe('Neue Schläuche kaufen');
    expect(all.find((e) => e.id === 'v1')).toMatchObject({ kind: 'care', sub: 'Testvelo', velo: true });
    expect(all.some((e) => e.id === 'f2' || e.id === 'm-2')).toBe(false);
  });
  it('a month page groups by day and counts per month under the filter', () => {
    const p = monthPage(all, '2026-10', 'all');
    expect(p.n).toBe(5); // «Herbstrunde» (9 Oct), the visit, the repair, the meditation, the note
    expect(p.days[0].date >= p.days.at(-1).date).toBe(true);
    const velo = monthPage(all, '2026-10', 'velo');
    expect(velo.days.flatMap((d) => d.entries).every((e) => e.velo)).toBe(true);
    expect(monthPage(all, null, 'notes').month).toBe('2026-10');
    expect(passes({ kind: 'note' }, 'trips')).toBe(false);
    expect(CHRONIK_FILTERS.map((f) => f.key)).toEqual(['all', 'velo', 'trips', 'care', 'meditation', 'notes']);
  });
});

describe('Monatskarte', () => {
  it('this month: the trip, the new learning, the template, what stays home', () => {
    const m = monthCard({ ...T, pace: F.pace, month: '2026-10', today: TODAY });
    const keys = m.lines.map((l) => l.key);
    expect(keys.slice(0, 4)).toEqual(['trips', 'learnings', 'templates', 'home']);
    expect(m.lines[0]).toMatchObject({ n: 1, km: 81 });
    expect(m.lines.find((l) => l.key === 'home')).toMatchObject({ n: 1, names: [`${P}Daunenweste`] });
    expect(m.lines.find((l) => l.key === 'pace')).toMatchObject({ kmh: 18, climbMh: 650 });
    expect(m.lines.length).toBeLessThanOrEqual(6);
  });
  it('the clothing border moves with «too cold»', () => {
    const m = monthCard({ ...T, month: F.days.c2.slice(0, 7), today: TODAY });
    const cl = m.lines.find((l) => l.key === 'clothing');
    expect(cl.to - cl.from).toBe(1);
  });
  it('an empty month says so', () => expect(monthCard({ ...T, month: '2026-02', today: TODAY }).empty).toBe(true));
  it('months and years with data, newest first', () => {
    const ms = monthsWithData({ ...T, today: TODAY });
    expect(ms[0]).toBe('2026-10');
    expect(ms).toContain('2025-10');
    expect(yearsWithData({ ...T, today: TODAY })).toEqual(['2026', '2025', '2024']);
  });
});

describe('Jahresbrief', () => {
  const y = yearLetter({ ...T, year: 2026, today: TODAY });
  it('counts the year: trips, km, Hm, days, the longest, the month with the most km', () => {
    expect(y).toMatchObject({ year: '2026', trips: 3, km: 56 + 245 + 81, gainM: 600 + 4200 + 900, days: 5, learnings: 2 });
    expect(y.longest).toMatchObject({ title: `${P}Passfahrt`, km: 245 });
    expect(y.topMonth.month).toBe(F.days.c2.slice(0, 7));
  });
  it('what you take less of now, and the trip that fit best', () => {
    expect(y.less).toEqual([`${P}Daunenweste`]);
    expect(y.best.title).toBe(`${P}Herbstrunde`);
    expect(y.best.note).toBe('Alles passte.');
  });
  it('a year without anything is empty', () => expect(yearLetter({ ...T, year: 2019, today: TODAY }).empty).toBe(true));
  it('tripScore: a rating counts first, else the answers', () => {
    expect(tripScore({ status: 'draft' })).toBeNull();
    expect(tripScore({ status: 'done', rating: 4 })).toBe(40);
    expect(tripScore({ status: 'done', amount: 'right', bags: 'fine', clothing: 'fit', weather: 'planned', missing: [], items: {} })).toBe(6);
  });
});

describe('Jahr als Bildgeschichte', () => {
  it('cover, one slide per trip (oldest first), numbers, Neu, thanks', () => {
    const s = storySlides({ ...T, year: '2026', photos: { [`${P}pass`]: [{ data: 'data:image/jpeg;base64,AAA', day: F.days.c2 }] }, neu: ['Erster Pass über 2000 m', ''], today: TODAY });
    expect(s.map((x) => x.kind)).toEqual(['cover', 'trip', 'trip', 'trip', 'number', 'number', 'number', 'neu', 'thanks']);
    expect(s[1].title).toBe(`${P}Frühlingsschlaufe`);
    expect(s[2]).toMatchObject({ photo: 'data:image/jpeg;base64,AAA', km: 245, note: 'Lange Abfahrten, kalte Finger.' });
    expect(s[3].photo).toBeNull();
    expect(s[3].lines).toHaveLength(1);
    expect(s[4]).toEqual({ kind: 'number', key: 'km', value: 382 });
    expect(s[7].items).toEqual(['Erster Pass über 2000 m']);
  });
  it('a past year works, an empty one has cover and thanks', () => {
    expect(storySlides({ ...T, year: '2025', today: TODAY }).filter((x) => x.kind === 'trip')).toHaveLength(1);
    expect(storySlides({ ...T, year: '2010', today: TODAY }).map((x) => x.kind)).toEqual(['cover', 'thanks']);
  });
  it('storyReady from 1 December, the year from the address, steps stay inside', () => {
    expect(storyReady('2026-11-30')).toBe(false);
    expect(storyReady('2026-12-01')).toBe(true);
    expect(storyReady('2026-12-31')).toBe(true);
    expect(storyReady('2027-01-01')).toBe(false);
    expect(yearOfHash('#/jahr/2024', TODAY)).toBe('2024');
    expect(yearOfHash('#/jahr', TODAY)).toBe('2026');
    expect(stepTo(0, -1, 5)).toBe(0);
    expect(stepTo(4, 1, 5)).toBe(4);
  });
});
