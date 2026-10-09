// v0.38.0 "Heute und Menü": Today's bike buttons, the ready light, the jumps and the season (quickcare.js).
import { describe, it, expect } from 'vitest';
import { defaultParts, logPart, PART } from '../src/lib/care.js';
import { readyLight, LIGHT_WORD, quickHints, quickLog, addPressure, parseBar, kmFrom, stepWear, dueAll, yearAgo, seasonNumbers, QUICK } from '../src/lib/quickcare.js';

const TODAY = '2026-10-09';
const e = (date, km, extra) => ({ date, km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...extra });

/** A fictional full-suspension bike with everything recorded recently: nothing due. */
function fresh() {
  let parts = defaultParts({ type: 'Full suspension' });
  for (const p of parts) parts = logPart(parts, p.key, e('2026-10-01', 4990, { action: 'service', result: 'done' }));
  return { id: 'test_data_gtp_bike', name: 'test_data_gtp_ Bike', type: 'Full suspension', km: 5000, kmDate: '2026-10-01', tyreSetup: { front: 'tubeless', rear: 'tubeless' }, parts };
}

describe('the six bike buttons', () => {
  it('come in the order Noah chose', () => {
    expect(QUICK).toEqual(['chain', 'wear', 'wash', 'sealant', 'pressure', 'km']);
  });

  it('log the chain as a service with date and km, by me', () => {
    const bike = fresh();
    const r = quickLog(bike, 'chain', { today: TODAY });
    expect(r.entry).toMatchObject({ date: TODAY, km: 5000, action: 'service', result: 'done', by: 'self' });
    expect(r.changes.parts.find((p) => p.key === 'chain').history.at(-1)).toEqual(r.entry);
    // nothing else changes
    expect(r.changes.parts.find((p) => p.key === 'padsF')).toEqual(bike.parts.find((p) => p.key === 'padsF'));
  });

  it('log chain wear as a check with the value; at the limit it is work needed', () => {
    const bike = fresh();
    expect(quickLog(bike, 'wear', { today: TODAY, value: 0.3 }).entry).toMatchObject({ action: 'check', result: 'ok', value: 0.3 });
    expect(quickLog(bike, 'wear', { today: TODAY, value: PART.chain.limit }).entry.result).toBe('needed');
    expect(quickLog(bike, 'wear', { today: TODAY, value: 'x' })).toBe(null);
    expect(quickLog(bike, 'wear', { today: TODAY, value: 9 })).toBe(null);
  });

  it('log sealant as a service and the pressure as a check of the tyres', () => {
    const bike = fresh();
    expect(quickLog(bike, 'sealant', { today: TODAY }).changes.parts.find((p) => p.key === 'tyres').history.at(-1)).toMatchObject({ action: 'service', result: 'done', date: TODAY });
    const p = quickLog(bike, 'pressure', { today: TODAY });
    expect(p.entry).toMatchObject({ action: 'check', result: 'ok' });
    const withP = addPressure({ ...bike, parts: p.changes.parts }, { f: 1.6, r: 1.8, today: TODAY });
    expect(withP.find((x) => x.key === 'tyres').history.at(-1)).toMatchObject({ pressureF: 1.6, pressureR: 1.8 });
    expect(addPressure(bike, { f: 1.6, today: TODAY })).toBe(null); // no check today
  });

  it('keep a wash in the bike\'s own list', () => {
    const bike = fresh();
    const r = quickLog(bike, 'wash', { today: TODAY });
    expect(r.changes).toEqual({ washes: [{ date: TODAY, km: 5000, by: 'self' }] });
    expect(quickLog({ ...bike, washes: r.changes.washes }, 'wash', { today: TODAY }).changes.washes).toHaveLength(2);
    expect(quickLog(bike, 'nothing', { today: TODAY })).toBe(null);
  });

  it('read the pressure, the km and the chain wear as typed', () => {
    expect(parseBar('1,8')).toBe(1.8);
    expect(parseBar('2 bar')).toBe(2);
    expect(parseBar('')).toBe(null);
    expect(parseBar('20')).toBeNaN();
    expect(kmFrom('+42', 5000)).toBe(5042);
    expect(kmFrom('5100', 5000)).toBe(5100);
    expect(kmFrom('', 5000)).toBe(null);
    expect(kmFrom('+0', 5000)).toBeNaN();
    expect(kmFrom('abc', 5000)).toBeNaN();
    expect(stepWear(0.3, 1)).toBe(0.35);
    expect(stepWear(0, -1)).toBe(0);
    expect(stepWear(1.5, 1)).toBe(1.5);
  });

  it('show what comes next on each button', () => {
    const bike = fresh();
    const h = quickHints(bike, { today: TODAY });
    expect(h.chain).toEqual({ left: PART.chain.everyKm - 10, every: PART.chain.everyKm });
    expect(h.km).toBe(5000);
    expect(h.wash).toBe(null);
    expect(h.sealant.days).toBeGreaterThan(30);
    expect(quickHints({ ...bike, tyreSetup: { front: 'tube', rear: 'tube' } }, { today: TODAY }).sealant).toBe(false);
    const wear = quickLog(bike, 'wear', { today: TODAY, value: 0.35 });
    expect(quickHints({ ...bike, parts: wear.changes.parts }, { today: TODAY }).wear).toBe(0.35);
  });
});

describe('the ready light', () => {
  it('is green with nothing due, red with something due, always with a word', () => {
    const bike = fresh();
    expect(readyLight(bike, { today: TODAY }).tone).toBe('ok');
    const late = { ...bike, km: 5400 }; // the chain wax (every 150 km) is due
    const r = readyLight(late, { today: TODAY });
    expect(r.tone).toBe('due');
    expect(r.n).toBeGreaterThan(0);
    for (const tone of ['due', 'soon', 'ok', 'nodata']) expect(LIGHT_WORD[tone]).toBeTruthy();
  });

  it('is yellow when a part comes close to its limit', () => {
    const bike = fresh();
    const r = readyLight({ ...bike, km: 5000 + Math.ceil(PART.chain.everyKm * 0.85) - 10 }, { today: TODAY });
    expect(r.tone).toBe('soon');
  });

  it('never says ready without data', () => {
    expect(readyLight({ id: 'x', name: 'x', parts: [] }, { today: TODAY }).tone).toBe('nodata');
  });

  it('counts the points due on all bikes', () => {
    const bike = fresh();
    const d = dueAll([bike, { ...bike, id: 'b2', km: 5400 }], { today: TODAY });
    expect(d.bikes).toBe(1);
    expect(d.points).toBeGreaterThan(0);
  });
});

describe('a year ago and the season', () => {
  const trip = (id, startDate, extra) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 2, entries: [], status: 'done', finished: startDate, ...extra });

  it('finds the trip closest to this day last year, with its learnings', () => {
    const trips = [trip('a', '2025-10-12'), trip('b', '2025-08-01'), trip('c', '2026-10-01')];
    const r = yearAgo(trips, [{ tripId: 'a', status: 'done' }], [{ source: 'test_data_gtp_ a' }, { source: 'other' }], TODAY);
    expect(r.trip.id).toBe('a');
    expect(r.learnings).toBe(1);
    expect(r.debriefed).toBe(true);
    expect(yearAgo([trip('b', '2025-08-01')], [], [], TODAY)).toBe(null);
  });

  it('is only there when the year has something', () => {
    expect(seasonNumbers([], [], [], [], [], TODAY)).toBe(null);
    const bike = { ...fresh(), washes: [{ date: '2026-05-01', km: 100, by: 'self' }] };
    const s = seasonNumbers([bike], [], [], [], [], TODAY);
    expect(s.year).toBe('2026');
    expect(s.jobs).toBeGreaterThan(0);
    const v = seasonNumbers([], [], [], [{ id: 'v', bikeId: 'x', date: '2026-03-01', totalChf: 120, parts: [] }], [], TODAY);
    expect(v.cost).toMatchObject({ year: '2026' });
  });
});
