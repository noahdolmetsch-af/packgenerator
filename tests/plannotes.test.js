import { describe, it, expect } from 'vitest';
import { MADE, MADE_WORD, EXAMPLES, planNotesOf, addPlanNote, removePlanNote, setMade, setHelped, withTask, withStandard, planItem, dayBefore, planRepair, planLearning, rowId } from '../src/lib/plannotes.js';
import de from '../src/lib/i18n/de/index.js';

const at = new Date('2026-10-20T08:00:00Z');
const trip = { id: 'trip-x', title: 'Testtour', startDate: '2026-11-02', bikeId: 'bike-1', bike: 'Testvelo', domain: 'bikepacking', entries: [], ready: [] };

describe('planning notes', () => {
  it('adds trimmed notes and ignores empty words', () => {
    const list = addPlanNote([], '  Sonnencreme kaufen ', at);
    expect(list).toEqual([{ id: `pn-${at.getTime().toString(36)}`, text: 'Sonnencreme kaufen', at: at.toISOString(), made: null, helped: null }]);
    expect(addPlanNote(list, '   ', at)).toBe(list);
    const two = addPlanNote(addPlanNote(list, 'b', at), 'c', at);
    expect(new Set(two.map((n) => n.id)).size).toBe(3);
    expect(planNotesOf({})).toEqual([]);
    expect(removePlanNote(list, list[0].id)).toEqual([]);
  });

  it('marks what a note became and toggles «did it help»', () => {
    const [n] = addPlanNote([], 'Kette ölen', at);
    expect(setMade([n], n.id, { kind: 'ready', ref: rowId(n) })[0].made).toEqual({ kind: 'ready', ref: `plan-${n.id}` });
    const yes = setHelped([n], n.id, true);
    expect(yes[0].helped).toBe(true);
    expect(setHelped(yes, n.id, true)[0].helped).toBe(null);
    expect(setHelped(yes, n.id, false)[0].helped).toBe(false);
  });

  it('adds a task row once', () => {
    const [n] = addPlanNote([], 'Unterkunft bestätigen', at);
    const one = withTask([{ id: 'a', label: 'Helm', done: true }], n);
    expect(one.at(-1)).toEqual({ id: rowId(n), label: 'Unterkunft bestätigen', done: false });
    expect(withTask(one, n)).toBe(one);
    expect(withTask([{ id: 'b', label: 'unterkunft bestätigen', done: false }], n)).toHaveLength(1);
  });

  it('adds a standard row on top of the saved standard or the suggestion', () => {
    const [n] = addPlanNote([], 'Sonnencreme', at);
    const fallback = [{ id: 'helmet', label: 'Helmet', done: false }];
    expect(withStandard(null, fallback, n, 1)).toEqual([{ id: 'helmet', label: 'Helmet' }, { id: 'std-plan-1', label: 'Sonnencreme' }]);
    expect(withStandard([{ id: 's', label: 'Sonnencreme' }], fallback, n, 1)).toEqual([{ id: 's', label: 'Sonnencreme' }]);
  });

  it('makes an incomplete item in the area of the trip', () => {
    const [n] = addPlanNote([], 'Ersatzschlauch 29"', at);
    const it = planItem(n, { ...trip, domain: 'hiking' }, [{ id: 'LX03' }], 'now');
    expect(it).toMatchObject({ id: 'LX04', name: 'Ersatzschlauch 29"', weightG: null, weightStatus: 'missing', ownership: 'owned', domains: ['hiking'] });
  });

  it('dates a workshop job the calendar day before the start, never in the past', () => {
    expect(dayBefore('2026-11-02', '2026-10-20')).toBe('2026-11-01');
    expect(dayBefore('2026-03-01', '2026-02-01')).toBe('2026-02-28');
    expect(dayBefore('2026-03-29', '2026-03-01')).toBe('2026-03-28');
    expect(dayBefore('2026-10-21', '2026-10-21')).toBe('2026-10-21');
    expect(dayBefore(null, '2026-10-21')).toBe('2026-10-21');
    const [n] = addPlanNote([], 'Bremsbeläge prüfen lassen', at);
    expect(planRepair(n, trip, { id: 7, today: '2026-10-20' })).toMatchObject({ id: 7, bikeId: 'bike-1', subject: 'Testvelo', task: 'Bremsbeläge prüfen lassen', status: 'open', dueDate: '2026-11-01', source: 'Planning note', tripId: 'trip-x' });
  });

  it('turns a note into a learning with the next number', () => {
    const [n] = addPlanNote([], 'Powerbank laden', at);
    const l = planLearning({ ...n, made: { kind: 'item', ref: 'LX04' } }, trip, [{ id: 3 }, { id: 'x' }], 'now');
    expect(l).toMatchObject({ id: 4, topic: 'Planning', rule: 'Powerbank laden', itemIds: ['LX04'], source: 'Testtour', confirmed: 0 });
  });

  it('has German for every word it shows', () => {
    for (const w of [...MADE.map((m) => m.label), ...Object.values(MADE_WORD), ...EXAMPLES]) expect(de[w], w).toBeTruthy();
  });
});
