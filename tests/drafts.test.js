import { describe, it, expect } from 'vitest';
import { inProgress, tripRow, templateRow, savedLabel, keepDialog, freshDialogs, dialogRow, TEMPLATE_HOURS, DIALOG_DAYS } from '../src/lib/drafts.js';

// AP29 (Noah): the list "In progress" and the line "Saved 2 min ago". Fictional data only.
const TODAY = '2026-10-08';
const NOW = Date.parse('2026-10-08T12:00:00');
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
const tpl = (id, updatedAt) => ({ id: `test_data_gtp_tpl_${id}`, name: `test_data_gtp_ template ${id}`, entries: [], updatedAt });

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
    expect(r.state).toMatchObject({ key: 'ride', day: 2 });
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

describe('the list: most urgent first', () => {
  it('ride, soon, fresh debrief, dialog, upcoming, template, old debrief', () => {
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
      [tpl('recent', '2026-10-08T09:00:00.000Z'), tpl('stale', '2026-09-01T09:00:00.000Z')],
      TODAY,
      { now: NOW, dialogs: [{ id: 'draft-newTrip', kind: 'newTrip', data: { title: 'test_data_gtp_ half' }, savedAt: '2026-10-08T11:58:00.000Z' }] },
    );
    expect(rows.map((r) => r.id)).toEqual([
      'test_data_gtp_now',
      'test_data_gtp_soon',
      'test_data_gtp_fresh',
      'draft-newTrip',
      'test_data_gtp_next',
      'test_data_gtp_later',
      'test_data_gtp_tpl_recent',
      'test_data_gtp_old',
    ]);
  });

  it('two open debriefs of the same age group: the newest first', () => {
    const rows = inProgress([trip('a', '2026-10-03'), trip('b', '2026-10-06')], [], [], TODAY, { now: NOW });
    expect(rows.map((r) => r.id)).toEqual(['test_data_gtp_b', 'test_data_gtp_a']);
  });

  it('same date: the latest change first; nothing at all: empty', () => {
    const a = trip('a', '2026-10-20', { updatedAt: '2026-10-08T08:00:00.000Z' });
    const b = trip('b', '2026-10-20', { updatedAt: '2026-10-08T10:00:00.000Z' });
    expect(inProgress([a, b], [], [], TODAY, { now: NOW }).map((r) => r.id)).toEqual(['test_data_gtp_b', 'test_data_gtp_a']);
    expect(inProgress()).toEqual([]);
  });
});

describe('templates and half-filled dialogs', () => {
  it('a template counts while it was changed in the last 24 h', () => {
    expect(templateRow(tpl('x', new Date(NOW - (TEMPLATE_HOURS - 1) * 36e5).toISOString()), NOW)).toMatchObject({ kind: 'template', next: { href: '#/pack/templates/test_data_gtp_tpl_x', label: 'Edit' } });
    expect(templateRow(tpl('x', new Date(NOW - (TEMPLATE_HOURS + 1) * 36e5).toISOString()), NOW)).toBe(null);
    expect(templateRow(tpl('x', undefined), NOW)).toBe(null);
  });

  it('an untouched dialog leaves nothing; a typed one is kept', () => {
    const start = { title: '', startDate: '2026-10-08', days: 1, bikeId: 'test_data_gtp_bike' };
    expect(keepDialog('newTrip', { ...start }, start)).toBe(null);
    expect(keepDialog('newTrip', { ...start, title: '   ' }, start)).toBe(null);
    const kept = keepDialog('newTrip', { ...start, title: 'test_data_gtp_ Jura' }, start, '2026-10-08T11:00:00.000Z');
    expect(kept).toMatchObject({ id: 'draft-newTrip', kind: 'newTrip', savedAt: '2026-10-08T11:00:00.000Z', data: { title: 'test_data_gtp_ Jura' } });
    expect(keepDialog('newTrip', { ...start, days: 3 }, start)).not.toBe(null);
    expect(dialogRow(kept)).toMatchObject({ kind: 'dialog', title: 'test_data_gtp_ Jura', next: { href: '#/pack', resume: 'draft-newTrip' } });
    expect(dialogRow({ kind: 'newItem' })).toBe(null);
  });

  it('kept dialogs older than 7 days are forgotten', () => {
    const fresh = { id: 'a', kind: 'newTrip', savedAt: new Date(NOW - 36e5).toISOString() };
    const old = { id: 'b', kind: 'newTrip', savedAt: new Date(NOW - (DIALOG_DAYS + 1) * 864e5).toISOString() };
    expect(freshDialogs([old, fresh, null], NOW).map((d) => d.id)).toEqual(['a']);
  });
});

describe('saved label', () => {
  it('just now, minutes, hours, a date', () => {
    expect(savedLabel(new Date(NOW - 20e3).toISOString(), NOW)).toEqual({ label: 'Saved just now' });
    expect(savedLabel(new Date(NOW + 30e3).toISOString(), NOW)).toEqual({ label: 'Saved just now' });
    expect(savedLabel(new Date(NOW - 2 * 60e3).toISOString(), NOW)).toEqual({ label: 'Saved {n} min ago', n: 2 });
    expect(savedLabel(new Date(NOW - 3 * 36e5 - 1).toISOString(), NOW)).toEqual({ label: 'Saved {n} h ago', n: 3 });
    expect(savedLabel('2026-10-01T12:00:00', NOW)).toEqual({ label: 'Saved on {date}', date: '2026-10-01' });
    expect(savedLabel(null, NOW)).toBe(null);
    expect(savedLabel('not a date', NOW)).toBe(null);
  });
});
