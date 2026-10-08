import { describe, it, expect } from 'vitest';
import { inProgress, tripRow, rowActions, actionChanges, hasWork, autoKeep, leaveWindow } from '../src/lib/drafts.js';
import { itemRecord, itemDraft } from '../src/lib/gear.js';
import { toDebrief } from '../src/lib/debrief.js';

// AP29 (Noah, v0.35.0): the list "In progress" behind the band's "{n} more". Fictional data only.
const TODAY = '2026-10-08';
const entry = (id, packed = false) => ({ itemId: id, slot: 'seat', qty: 1, packed });
const trip = (id, startDate, extra = {}) => ({
  id: `test_data_gtp_${id}`,
  title: `test_data_gtp_ ${id}`,
  startDate,
  days: 1,
  entries: [entry('a'), entry('b')],
  ready: [{ id: 'r1', label: 'test_data_gtp_ check', done: false }],
  createdAt: '2026-10-01T08:00:00.000Z',
  ...extra,
});

describe('one trip: state and next step', () => {
  it('far away, nothing ticked: planning, next Plan', () => {
    const r = tripRow(trip('far', '2026-10-20'), null, TODAY);
    expect(r).toMatchObject({ kind: 'trip', state: { key: 'plan' }, next: { step: 'plan', href: '#/pack', label: 'Plan|stage' } });
    expect(r.next.tripId).toBe('test_data_gtp_far');
  });

  it('empty list: nothing on it yet, next Plan', () => {
    expect(tripRow(trip('empty', '2026-10-09', { entries: [] }), null, TODAY)).toMatchObject({ state: { key: 'empty' }, next: { step: 'plan' } });
  });

  it('within two days: packing x/y, next Pack (packing day)', () => {
    const r = tripRow(trip('soon', '2026-10-10', { entries: [entry('a', true), entry('b'), entry('c')] }), null, TODAY);
    expect(r.state).toMatchObject({ key: 'packing', done: 1, total: 3, label: 'Packing {done}/{total}' });
    expect(r.next).toMatchObject({ step: 'pack', href: '#/pack?day' });
  });

  it('started packing long before: packing too, next Pack', () => {
    const r = tripRow(trip('early', '2026-10-30', { entries: [entry('a', true), entry('b')] }), null, TODAY);
    expect(r.state.key).toBe('packing');
    expect(r.next.step).toBe('pack');
  });

  it('all in the bags, ready check open: ready check x/y', () => {
    const r = tripRow(trip('check', '2026-10-09', { entries: [entry('a', true)], ready: [{ id: 'r1', done: true }, { id: 'r2', done: false }] }), null, TODAY);
    expect(r.state).toMatchObject({ key: 'ready', done: 1, total: 2 });
    expect(r.next.href).toBe('#/pack?day');
  });

  it('all packed and checked: Packed, next On the way (bike) or the trip (no bike)', () => {
    const done = trip('done', '2026-10-09', { entries: [entry('a', true)], ready: [{ id: 'r1', done: true }] });
    expect(tripRow(done, null, TODAY)).toMatchObject({ state: { key: 'packed' }, next: { step: 'ride', href: '#/ride' } });
    expect(tripRow({ ...done, packs: [] }, null, TODAY)).toMatchObject({ next: { step: 'trip', href: '#/pack' } });
  });

  it('under way: day n, next On the way', () => {
    const r = tripRow(trip('now', '2026-10-07', { days: 3 }), null, TODAY);
    expect(r).toMatchObject({ kind: 'ride', state: { key: 'ride', day: 2 } });
    expect(r.next.step).toBe('ride');
  });

  it('over: debrief open or started; saved, skipped or never packed: not listed', () => {
    const over = trip('over', '2026-10-05');
    expect(tripRow(over, null, TODAY)).toMatchObject({ kind: 'debrief', state: { key: 'debrief' }, next: { step: 'debrief', href: '#/debrief/test_data_gtp_over' } });
    expect(tripRow(over, { tripId: over.id, status: 'draft', updatedAt: '2026-10-07T10:00:00.000Z' }, TODAY)).toMatchObject({ state: { key: 'debriefDraft' }, updatedAt: '2026-10-07T10:00:00.000Z' });
    expect(tripRow(over, { tripId: over.id, status: 'done' }, TODAY)).toBe(null);
    expect(tripRow({ ...over, entries: [] }, null, TODAY)).toBe(null);
    expect(tripRow(trip('skip', '2026-10-10', { skipped: true }), null, TODAY)).toBe(null);
  });

  it('ended early on the ride day (finished): the debrief, even before the last day', () => {
    const r = tripRow(trip('early', '2026-10-08', { days: 3, finished: '2026-10-08' }), null, TODAY);
    expect(r.kind).toBe('debrief');
  });

  it('without a change time: the creation time', () => {
    expect(tripRow(trip('t', '2026-10-20'), null, TODAY).updatedAt).toBe('2026-10-01T08:00:00.000Z');
    expect(tripRow(trip('t', '2026-10-20', { updatedAt: '2026-10-08T11:00:00.000Z' }), null, TODAY).updatedAt).toBe('2026-10-08T11:00:00.000Z');
  });
});

describe('the list: most urgent first (only trips and debriefs, Noah 3b)', () => {
  it('ride, soon, fresh debrief, upcoming, old debrief (older than 7 days at the bottom, 2a)', () => {
    const rows = inProgress(
      [
        trip('later', '2026-10-25'),
        trip('old', '2026-08-01'),
        trip('soon', '2026-10-09'),
        trip('fresh', '2026-10-05'),
        trip('next', '2026-10-15'),
        trip('now', '2026-10-08'),
        trip('saved', '2026-10-02'),
      ],
      [{ tripId: 'test_data_gtp_saved', status: 'done' }],
      TODAY,
    );
    expect(rows.map((r) => r.id)).toEqual(['test_data_gtp_now', 'test_data_gtp_soon', 'test_data_gtp_fresh', 'test_data_gtp_next', 'test_data_gtp_later', 'test_data_gtp_old']);
  });

  it('a packed trip stays until it is over, next On the way (7a); then it becomes its debrief', () => {
    const packed = trip('packed', '2026-10-12', { entries: [entry('a', true)], ready: [{ id: 'r1', done: true }] });
    expect(inProgress([packed], [], TODAY)[0]).toMatchObject({ state: { key: 'packed' }, next: { step: 'ride' } });
    expect(inProgress([packed], [], '2026-10-13')[0]).toMatchObject({ kind: 'debrief' });
  });

  it('cleans itself up (8a+b): skipped, finished without debrief, saved debrief drop out', () => {
    const rows = inProgress(
      [trip('skip', '2026-10-20', { skipped: true }), trip('nodeb', '2026-10-05', { noDebrief: true, status: 'done' }), trip('saved', '2026-10-05'), trip('keep', '2026-10-20')],
      [{ tripId: 'test_data_gtp_saved', status: 'done' }],
      TODAY,
    );
    expect(rows.map((r) => r.id)).toEqual(['test_data_gtp_keep']);
  });

  it('two open debriefs of the same age group: the newest first', () => {
    const rows = inProgress([trip('a', '2026-10-03'), trip('b', '2026-10-06')], [], TODAY);
    expect(rows.map((r) => r.id)).toEqual(['test_data_gtp_b', 'test_data_gtp_a']);
  });

  it('same date: the latest change (updatedAt) first; nothing at all: empty', () => {
    const a = trip('a', '2026-10-20', { updatedAt: '2026-10-08T08:00:00.000Z' });
    const b = trip('b', '2026-10-20', { updatedAt: '2026-10-08T10:00:00.000Z' });
    expect(inProgress([a, b], [], TODAY).map((r) => r.id)).toEqual(['test_data_gtp_b', 'test_data_gtp_a']);
    expect(inProgress()).toEqual([]);
  });
});

describe('the ••• actions: safe first, never delete a past trip', () => {
  it('upcoming: Not riding + Discard; under way: End; debrief: Finish without debrief', () => {
    expect(rowActions(tripRow(trip('far', '2026-10-20'), null, TODAY))).toEqual(['skip', 'discard']);
    expect(rowActions(tripRow(trip('now', '2026-10-07', { days: 3 }), null, TODAY))).toEqual(['end']);
    expect(rowActions(tripRow(trip('over', '2026-10-05'), null, TODAY))).toEqual(['noDebrief']);
    expect(rowActions(null)).toEqual([]);
    expect(rowActions(tripRow(trip('far', '2026-10-20'), null, TODAY), { current: 'test_data_gtp_far' })).toEqual(['skip']);
  });

  it('the changes: skipped, finished today, finished without a debrief (gone from toDebrief too)', () => {
    expect(actionChanges('skip', TODAY)).toEqual({ skipped: true });
    expect(actionChanges('end', TODAY)).toEqual({ finished: TODAY });
    expect(actionChanges('discard', TODAY)).toBe(null);
    const over = { ...trip('over', '2026-10-05'), ...actionChanges('noDebrief', TODAY) };
    expect(tripRow(over, null, TODAY)).toBe(null);
    expect(toDebrief([over, trip('open', '2026-10-05')], [], TODAY).map((x) => x.id)).toEqual(['test_data_gtp_open']);
  });

  it('work on a trip: a tick, a done check, a route', () => {
    expect(hasWork(trip('plain', '2026-10-20'))).toBe(false);
    expect(hasWork(trip('tick', '2026-10-20', { entries: [entry('a', true)] }))).toBe(true);
    expect(hasWork(trip('check', '2026-10-20', { ready: [{ id: 'r', done: true }] }))).toBe(true);
    expect(hasWork(trip('route', '2026-10-20', { route: { km: 40 } }))).toBe(true);
  });
});

describe('nothing typed is lost (Noah 4b + 5a): new trip, new item, quick note', () => {
  it('saves only a new thing with a name typed in this window, not after it ended', () => {
    expect(autoKeep({ name: 'test_data_gtp_ Jura' })).toBe(true);
    expect(autoKeep({ name: '   ' })).toBe(false);
    expect(autoKeep({ name: 'test_data_gtp_ Jura', changed: false })).toBe(false); // the app's own name, or one from the search
    expect(autoKeep({ name: 'test_data_gtp_ Jura', ended: true })).toBe(false); // after Create / Save / Discard
    expect(autoKeep({ name: 'test_data_gtp_ Jura', isNew: false })).toBe(false); // editing an existing trip saves on Save, as before
    expect(autoKeep()).toBe(false);
  });

  it('closing keeps it; Discard removes only what this window made; Save is the full save', () => {
    expect(leaveWindow('close', { made: true })).toBe('keep');
    expect(leaveWindow('close', { made: false, typed: true })).toBe('keep'); // typed just before closing
    expect(leaveWindow('close', { made: false, typed: false })).toBe('nothing');
    expect(leaveWindow('discard', { made: true })).toBe('delete');
    expect(leaveWindow('discard', { made: false, typed: true })).toBe('nothing');
    expect(leaveWindow('save', { made: true })).toBe('save');
  });

  it('a new item saved while typing keeps its id on the next save; another category gives the next free id of it', () => {
    const items = [{ id: 'EL01', category: 'elec', name: 'test_data_gtp_ lamp' }];
    const draft = { ...itemDraft(null), name: 'test_data_gtp_ charger', category: 'elec' };
    const first = itemRecord(draft, { items });
    expect(first.id).toBe('EL02');
    // the window leaves its own item out when it counts, so the same item keeps EL02
    const others = [...items, first].filter((i) => i.id !== first.id);
    expect(itemRecord({ ...draft, note: 'test_data_gtp_ more' }, { items: others }).id).toBe('EL02');
    expect(itemRecord({ ...draft, category: 'light' }, { items: others }).id).not.toBe('EL02');
  });
});
