import { describe, it, expect } from 'vitest';
import { QUICK_PROBLEMS, PRIORITIES, PRIORITY_NAME, deadlineOf, isLate, FIXES, TOPICS, splitProblems, addLine, startBike, buildProblems, classify, stepFor, repeats, problemWish } from '../src/lib/problems.js';
import DE from '../src/lib/i18n/de/index.js';

// v0.45.2 (Noah on the bike): several problems with one bike at once, from the + menu.
const bikes = [{ id: 'scale', name: 'Scott Scale' }, { id: 'factor', name: 'Factor LS' }];

describe('problems with a bike', () => {
  it('one problem per line: list marks, blank lines and doubles dropped', () => {
    expect(splitProblems('- Zu wenig Luft\n2. Sattel zu tief\n\n• Schaltung vorne laden\nsattel zu tief')).toEqual(['Zu wenig Luft', 'Sattel zu tief', 'Schaltung vorne laden']);
    expect(splitProblems('a; b')).toEqual(['a', 'b']);
    expect(splitProblems('  ')).toEqual([]);
  });

  it('a quick button adds its own line once', () => {
    expect(addLine('', 'Saddle too low')).toBe('Saddle too low');
    expect(addLine('Air\n', 'Saddle too low')).toBe('Air\nSaddle too low');
    expect(addLine('saddle too low', 'Saddle too low')).toBe('saddle too low');
  });

  it('starts with the bike of the running trip, else the last one, else the first', () => {
    expect(startBike(bikes, { trip: { bikeId: 'factor' }, last: 'scale' })).toBe('factor');
    expect(startBike(bikes, { last: 'factor' })).toBe('factor');
    expect(startBike(bikes, { last: 'gone' })).toBe('scale');
    expect(startBike([], {})).toBe('');
  });

  it('each line becomes its own open repair for the bike; the photo goes with the first only', () => {
    const { notes, repairs } = buildProblems(['Luft', 'Sattel', 'Akku'], { bike: bikes[1], photo: 'data:x', rows: [{ id: 4 }, { id: 'x' }], now: '2026-10-09T11:00:00Z', stamp: 's' });
    expect(repairs.map((r) => r.id)).toEqual([5, 6, 7]);
    expect(repairs.every((r) => r.bikeId === 'factor' && r.status === 'open' && r.category === 'Repair' && r.subject === 'Factor LS')).toBe(true);
    expect(repairs.map((r) => r.task)).toEqual(['Luft', 'Sattel', 'Akku']);
    expect(repairs.map((r) => r.photo)).toEqual(['data:x', null, null]);
    expect(notes.map((n) => n.id)).toEqual(['note-s-0', 'note-s-1', 'note-s-2']);
    expect(notes.every((n) => n.status === 'sorted' && n.to.kind === 'repair')).toBe(true);
    expect(notes.map((n) => n.to.ref)).toEqual([5, 6, 7]);
  });

  it('while a trip runs the notes carry the trip and day', () => {
    const { notes } = buildProblems(['Luft'], { bike: bikes[0], ctx: { tripId: 't1', day: 2 }, stamp: 's' });
    expect(notes[0]).toMatchObject({ tripId: 't1', day: 2 });
  });

  it('every quick problem has a German text', () => {
    for (const q of QUICK_PROBLEMS) expect(DE[q], q).toBeTruthy();
  });

  it("sorts Noah's three problems by itself (1a)", () => {
    expect(classify('Zu wenig Luft in den Reifen')).toEqual({ topic: 'air', fix: 'self', part: 'tyres' });
    expect(classify('Sattel zu tief')).toEqual({ topic: 'saddle', fix: 'self', part: 'cockpit' });
    expect(classify('Schaltung vorne aufladen')).toMatchObject({ topic: 'battery', fix: 'self' });
    expect(classify('Bremse hinten quietscht')).toMatchObject({ topic: 'brake', fix: 'guide' });
    expect(classify('Reifen kaputt, ersetzen')).toMatchObject({ topic: 'air', fix: 'part' });
    expect(classify('Gabel Service fällig')).toMatchObject({ topic: 'wheel', fix: 'shop' });
    expect(classify('Rahmen fühlt sich komisch an')).toEqual({ topic: null, fix: 'self', part: null });
    expect(classify('Ausgang')).toMatchObject({ topic: null });
  });

  it('saved repairs carry the topic and the way to fix; each has a first step', () => {
    const { repairs } = buildProblems(['Zu wenig Luft', 'Werkstatt: Speiche locker'], { bike: bikes[1], stamp: 's' });
    expect(repairs.map((r) => [r.topic, r.fix, r.source])).toEqual([['air', 'self', 'Problem'], ['wheel', 'shop', 'Problem']]);
    expect(stepFor(repairs[0])).toBe('Pump to your pressure and check the valve.');
    expect(stepFor(repairs[1])).toBe('Goes into the order for the bike shop.');
    expect(stepFor({ fix: 'part' })).toMatch(/wishlist/);
    expect(stepFor({ fix: 'self', topic: null })).toBe(null);
  });

  it('the same problem twice in 30 days on one bike → the lasting fix (3b)', () => {
    const r = (topic, logDate, bikeId = 'factor') => ({ topic, logDate, bikeId });
    const rows = [r('air', '2026-09-20'), r('air', '2026-10-09'), r('air', '2026-08-01'), r('saddle', '2026-10-09'), r('air', '2026-10-01', 'scale')];
    expect(repeats(rows, 'factor', '2026-10-09')).toEqual([{ topic: 'air', count: 2, text: TOPICS.find((x) => x.key === 'air').repeat }]);
    expect(repeats(rows, 'scale', '2026-10-09')).toEqual([]);
  });

  it('a part needed goes on the wishlist once', () => {
    const rep = { task: 'Reifen kaputt', logDate: '2026-10-09' };
    const w = problemWish(rep, bikes[1], [], 'BI01');
    expect(w).toMatchObject({ id: 'BI01', name: 'Reifen kaputt (Factor LS)', ownership: 'wishlist', category: 'bike' });
    expect(problemWish(rep, bikes[1], [w], 'BI02')).toBe(null);
  });

  it('every way to fix, step and lasting fix has a German text', () => {
    for (const f of Object.values(FIXES)) expect(DE[f], f).toBeTruthy();
    for (const x of TOPICS) {
      expect(DE[x.step], x.step).toBeTruthy();
      expect(DE[x.repeat], x.repeat).toBeTruthy();
    }
    expect(DE[stepFor({ fix: 'shop' })]).toBeTruthy();
    expect(DE[stepFor({ fix: 'part' })]).toBeTruthy();
  });

  it('priority (required in the form) and deadline go into every repair (Noah)', () => {
    const { repairs } = buildProblems(['a', 'b'], { bike: bikes[0], priority: 'high', dueDate: '2026-10-12', stamp: 's' });
    expect(repairs.map((r) => [r.priority, r.dueDate, r.beforeRide])).toEqual([['high', '2026-10-12', false], ['high', '2026-10-12', false]]);
    const ride = buildProblems(['a'], { bike: bikes[0], priority: 'low', beforeRide: true, stamp: 's' }).repairs[0];
    expect(deadlineOf(ride, '2026-10-11')).toBe('2026-10-11');
    expect(deadlineOf(ride)).toBe(null);
    expect(isLate(repairs[0], '2026-10-13')).toBe(true);
    expect(isLate(repairs[0], '2026-10-12')).toBe(false);
    for (const p of PRIORITIES) expect(DE[PRIORITY_NAME[p]]).toBeTruthy();
  });
});
