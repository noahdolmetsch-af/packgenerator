import { describe, it, expect, afterEach } from 'vitest';
import { overdueFor } from '../src/lib/workshop.js';
import { bikeCare, bikeCareWords, bikeCareLine, eventPrep, eventPrepLine, packStatus, packLine, isShortRide } from '../src/lib/readiness.js';
import { bikeChoice } from '../src/lib/choice.js';
import { withVisits } from '../src/lib/workshop.js';
import { ensureParts, logPart, CHECK_PARTS } from '../src/lib/care.js';
import { favouriteCounts, matches } from '../src/lib/gear.js';
import { parseBikesHash, bikesHash } from '../src/lib/bikes.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

// Fictional bikes and trips (AP06): the "sealant overdue" case, a bike without data, one with
// everything checked, and two upcoming trips.
const TODAY = '2026-10-07';
const sealantVisit = { id: 'v1', bikeId: 'full', date: '2026-06-26', shop: 'Shop', totalChf: 60, km: 1400, parts: [{ part: 'tyres', action: 'service', chf: 16, setup: { front: 'tubeless', rear: 'tubeless' } }, { part: 'fork', action: 'service', chf: 44 }, { part: 'shock', action: 'service', chf: 0 }] };
const checked = (bike, date, km) => {
  let parts = ensureParts(bike);
  for (const k of CHECK_PARTS) parts = logPart(parts, k, { date, km, value: null, action: 'check', result: 'ok', by: 'self' });
  return { ...bike, parts };
};
const full = checked({ id: 'full', name: 'Trail Full', type: 'Full suspension', km: 1460 }, '2026-06-26', 1400);
const hard = checked({ id: 'hard', name: 'Hardtail', type: 'Hardtail', km: 2287, tyreSetup: { front: 'tube', rear: 'tube' } }, '2026-09-01', 2200);
const blank = { id: 'blank', name: 'New bike', type: 'Gravel', km: 0, parts: [] };
const noKm = { id: 'nokm', name: 'Old bike', type: 'Gravel', km: null, parts: [] };
const visits = [sealantVisit];
const view = (b) => withVisits({ ...b, parts: ensureParts(b) }, visits);

const prepTasks = [
  { id: 1, area: 'Preparation', task: 'Check chain wear', leadWeeks: 2 },
  { id: 2, area: 'Preparation', task: 'Top up sealant', leadWeeks: 1 },
  { id: 3, area: 'Preparation', task: 'Pack spare tube', leadWeeks: 0 },
];
const repair = { id: 9, area: 'Repair', subject: 'Hardtail', bikeId: 'hard', task: 'Fix creaking bottom bracket', status: 'open' };
const soonTrip = { id: 'event', title: 'Event', startDate: '2026-10-15', event: true, days: 3, bikeId: 'hard', entries: [{ itemId: 'a', packed: true }, { itemId: 'b', packed: false }], ready: [{ id: 'r1', done: true }, { id: 'r2', done: false }] };
const laterTrip = { id: 'later', title: 'Later', startDate: '2026-11-20', days: 1, bikeId: 'full', entries: [], ready: [] };

describe('bike care: one statement per bike', () => {
  it('the sealant case: overdue by time counts as due, never "nothing due"', () => {
    const c = bikeCare(view(full), { visits, today: TODAY });
    expect(c.status).toBe('due');
    expect(c.rows.map((r) => r.kind)).toContain('time');
    const row = c.rows.find((r) => r.part === 'tyres');
    expect(row).toMatchObject({ name: 'Top up sealant', late: true });
    expect(row.detail).toBe('overdue for 13 days');
    const w = bikeCareWords(c);
    expect(w.tag).toBe('1 due');
    expect(w.text).toContain('Top up sealant');
    expect(c.href).toBe('#/bikes?tab=care&bike=full&open=1');
  });

  it('the same answer with or without a trip; the trip only adds "soon"', () => {
    const alone = bikeCare(view(full), { visits, today: TODAY });
    const withTrip = bikeCare(view(full), { visits, trip: laterTrip, today: TODAY });
    expect(withTrip.rows).toEqual(alone.rows);
    expect(withTrip.status).toBe(alone.status);
  });

  it('a bike without any record says "no data", not fine', () => {
    const c = bikeCare(view(blank), { visits, today: TODAY });
    expect(c.status).toBe('nodata');
    expect(bikeCareWords(c).tag).toBe('no data');
    const k = bikeCare(view(noKm), { visits, today: TODAY });
    expect(k.status).toBe('nodata');
    expect(k.kmMissing).toBe(true);
    expect(bikeCareWords(k).text).toMatch(/km not entered/);
  });

  it('a checked bike says "nothing due" and names what has no data', () => {
    const c = bikeCare(view(hard), { visits, today: TODAY });
    expect(c.status).toBe('ok');
    expect(bikeCareWords(c).tag).toBe('nothing due');
    expect(Object.values(bikeCareWords(c)).join(' ')).not.toMatch(/all fine/i);
  });

  it('open repairs of the bike count, Excel preparation tasks do not', () => {
    const c = bikeCare(view(hard), { tasks: [...prepTasks, repair], visits, trip: soonTrip, today: TODAY });
    expect(c.rows.map((r) => r.kind)).toEqual(['repair']);
    expect(c.rows[0].name).toBe('Fix creaking bottom bracket');
    expect(c.rows.some((r) => /chain wear|spare tube/i.test(r.name))).toBe(false);
  });

  it('several bikes: each gets its own state', () => {
    const states = [full, hard, blank, noKm].map((b) => bikeCare(view(b), { tasks: [repair], visits, today: TODAY }).status);
    expect(states).toEqual(['due', 'due', 'nodata', 'nodata']);
  });

  it('the line names the scope and the bike, in both languages', () => {
    const c = bikeCare(view(full), { visits, today: TODAY });
    expect(bikeCareLine(c)).toBe('Bike care · Trail Full: 1 due');
    lang.v = 'de';
    expect(bikeCareLine(c)).toBe('Velopflege · Trail Full: 1 fällig');
  });
});

describe('event preparation: the Excel tasks of one trip', () => {
  it('counts per trip, with overdue', () => {
    const p = eventPrep(soonTrip, prepTasks, TODAY);
    expect(p).toMatchObject({ scope: 'prep', tripId: 'event', open: 3, overdue: 1, total: 3, status: 'open' });
    expect(eventPrepLine(p)).toBe('Event preparation: 3 open (1 overdue)');
    expect(p.href).toBe('#/bikes?tab=care&trip=event');
  });

  it('several upcoming trips each keep their own list (PF13: shown for every trip)', () => {
    const a = eventPrep(soonTrip, prepTasks, TODAY);
    const b = eventPrep({ ...laterTrip, prep: { 1: { result: 'done' } } }, prepTasks, TODAY);
    expect(a.open).toBe(3);
    expect(b).toMatchObject({ open: 2, overdue: 0, done: 1 });
    expect(eventPrepLine(b)).toBe('Event preparation: 2 open');
    expect(eventPrepLine(eventPrep(soonTrip, [], TODAY))).toBe('Event preparation: no tasks');
  });
});

describe('packing status', () => {
  it('packed items and the ready check of one trip', () => {
    const s = packStatus(soonTrip);
    expect(s).toMatchObject({ packed: 1, count: 2, ready: 1, readyTotal: 2, status: 'open' });
    expect(packLine(s)).toBe('Packing status: 1 packed · 1 still to pack · ready check 1 checked · 1 open');
    expect(packStatus(laterTrip).status).toBe('empty');
  });
});

describe('the bike comparison uses the same bike care', () => {
  it('due and late from bikeCare', () => {
    const rows = bikeChoice(soonTrip, [view(full), view(hard)], { visits, tasks: [repair], today: TODAY });
    const f = rows.find((r) => r.bike.id === 'full');
    expect(f.late).toBe(bikeCare(view(full), { visits, today: TODAY }).rows.length);
    expect(f.care.status).toBe('due');
    expect(rows.find((r) => r.bike.id === 'hard').care.rows[0].kind).toBe('repair');
  });
});

describe('links', () => {
  it('Care with a trip', () => {
    expect(parseBikesHash('#/bikes?tab=care&trip=event')).toEqual({ tab: 'care', bike: null, open: false, trip: 'event' });
    expect(bikesHash({ tab: 'care', trip: 'event' })).toBe('#/bikes?tab=care&trip=event');
    expect(bikesHash({ tab: 'setup', trip: 'event' })).toBe('#/bikes');
  });
});

describe('favourites on one basis (AP05)', () => {
  const items = [
    { id: 'a', favorite: true, ownership: 'owned' },
    { id: 'b', favorite: true, ownership: 'unclear' },
    { id: 'c', favorite: true, ownership: 'wishlist' },
    { id: 'd', favorite: true, ownership: 'to-buy' },
    { id: 'e', favorite: true, ownership: 'gone' },
    { id: 'f', favorite: null, ownership: 'owned' },
  ];
  it('counts inventory, wishlist and gone apart', () => {
    expect(favouriteCounts(items)).toEqual({ inventory: 2, wishlist: 2, gone: 1, all: 5 });
    expect(favouriteCounts([])).toEqual({ inventory: 0, wishlist: 0, gone: 0, all: 0 });
  });
  it('the filter shows only favourites, also when there are none', () => {
    expect(items.filter((i) => matches(i, { fav: true })).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect([{ id: 'x', ownership: 'owned' }].filter((i) => matches(i, { fav: true }))).toEqual([]);
  });
});

describe('overdue in words (Noah 3a, 2026-10-07)', () => {
  it('days, then weeks, then months', () => {
    expect(overdueFor('2026-10-07', '2026-10-07')).toBe('due today');
    expect(overdueFor('2026-10-06', '2026-10-07')).toBe('overdue for 1 day');
    expect(overdueFor('2026-09-16', '2026-10-07')).toBe('overdue for 3 weeks');
    expect(overdueFor('2026-07-01', '2026-10-07')).toBe('overdue for 3 months');
  });
});

describe('v0.25.0 short ride (Noah 10)', () => {
  it('1 day and not an event: no bike care step; more days or an event: bike care again', () => {
    expect(isShortRide({ days: 1 })).toBe(true);
    expect(isShortRide({})).toBe(true);
    expect(isShortRide({ days: 2 })).toBe(false);
    expect(isShortRide({ days: 1, event: true })).toBe(false);
    expect(isShortRide({ days: 1, prep: { t1: { done: true } } })).toBe(false);
    expect(isShortRide(null)).toBe(false);
  });
});
