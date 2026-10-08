import { describe, it, expect } from 'vitest';
import { newNote, guessBike, guessKind, sortNote, nextNumber, runningTrip, rideContext, tripNotes } from '../src/lib/notes.js';
import { addRideNote } from '../src/lib/ride.js';
import { taskBike, openRepairs } from '../src/lib/care.js';

const bikes = [
  { id: 'scott-hardtail', name: 'Scott Scale' },
  { id: 'fully', name: 'Scott Spark' },
  { id: 'factor-ls', name: 'Factor LS' },
  { id: 'canyon-world-cup', name: 'Canyon Lux World Cup' },
];
const AT = '2026-10-05T08:00:00.000Z';
const note = (text, over = {}) => newNote({ text, page: 'pack', tripId: 'trip-1', bikeId: 'fully', ...over }, { id: 'n1', now: AT });

describe('quick note', () => {
  it('keeps the moment: date, page, next trip and bike', () => {
    expect(note('  Rear brake squeaks  ')).toMatchObject({ id: 'n1', at: AT, text: 'Rear brake squeaks', page: 'pack', tripId: 'trip-1', bikeId: 'fully', status: 'open', to: null });
  });

  it('finds the bike in the text, else keeps the note’s own bike', () => {
    expect(guessBike('Gravel: bar tape is torn', bikes, 'fully')).toBe('factor-ls');
    expect(guessBike('Hardtail rear tyre loses air', bikes)).toBe('scott-hardtail');
    expect(guessBike('the Spark creaks', bikes)).toBe('fully');
    expect(guessBike('buy new gloves', bikes, 'fully')).toBe('fully');
  });

  it('guesses where a note belongs', () => {
    expect(guessKind(note('Bremse hinten quietscht'))).toBe('repair');
    expect(guessKind(note('Next time take the warm gloves'))).toBe('learning');
    expect(guessKind(note('Brauche eine neue Stirnlampe'))).toBe('wish');
    expect(guessKind(note('Nice view at the pass'))).toBe('trip');
    expect(guessKind(note('Nice view at the pass', { tripId: null }))).toBe('learning');
  });

  it('becomes a repair that Bike care shows for the right bike', () => {
    const out = sortNote(note('Rear brake squeaks'), 'repair', { bikeId: 'fully', ids: { task: 12 }, now: AT, bikeName: 'Scott Spark' });
    expect(out.repair).toMatchObject({ id: 12, task: 'Rear brake squeaks', status: 'open', source: 'Quick note' });
    expect(taskBike(out.repair)).toBe('fully');
    expect(openRepairs([out.repair])).toHaveLength(1);
    expect(out.note).toMatchObject({ status: 'sorted', to: { kind: 'repair', label: 'Repair · Scott Spark', ref: 12 }, sortedAt: AT });
  });

  it('becomes a wishlist item, a learning, a trip note, or is just done', () => {
    const wish = sortNote(note('Brauche eine neue Stirnlampe mit mehr Akku für die Nacht'), 'wish', { ids: { item: 'LX07' }, now: AT });
    expect(wish.item).toMatchObject({ id: 'LX07', ownership: 'wishlist', weightStatus: 'missing' });
    expect(wish.item.name.length).toBeLessThanOrEqual(60);
    const learn = sortNote(note('Next time take the warm gloves'), 'learning', { ids: { learning: 4 }, now: AT });
    expect(learn.learning).toMatchObject({ id: 4, rule: 'Next time take the warm gloves', topic: 'Quick note' });
    const trip = sortNote(note('Nice view'), 'trip', { tripId: 'trip-1', now: AT });
    expect(trip.tripNote).toEqual({ tripId: 'trip-1', text: 'Nice view', at: AT });
    expect(trip.note.to).toMatchObject({ kind: 'trip', ref: 'trip-1' });
    const done = sortNote(note('Called the shop'), 'done', { now: AT });
    expect(Object.keys(done)).toEqual(['note']);
  });

  it('finds the next free number id', () => {
    expect(nextNumber([])).toBe(1);
    expect(nextNumber([{ id: 3 }, { id: 'x' }, { id: 9 }])).toBe(10);
  });
});

// v0.26.1 (AP20, Noah 19 a+b): a note on the way belongs to the trip and its day, and stays in the Inbox.
describe('notes on the way (v0.26.1)', () => {
  const trips = [
    { id: 'test_data_gtp_jura', title: 'Jura', startDate: '2026-10-10', days: 3, entries: [] },
    { id: 'test_data_gtp_next', title: 'Next', startDate: '2026-10-20', days: 1, entries: [] },
    { id: 'test_data_gtp_ended', title: 'Ended', startDate: '2026-10-11', days: 1, finished: '2026-10-11', entries: [] },
  ];
  it('knows the running trip and its day', () => {
    expect(runningTrip(trips, '2026-10-09')).toBeNull();
    expect(rideContext(trips, '2026-10-10')).toEqual({ tripId: 'test_data_gtp_jura', day: 0 });
    expect(rideContext(trips, '2026-10-12')).toEqual({ tripId: 'test_data_gtp_jura', day: 2 });
    expect(rideContext(trips, '2026-10-13')).toBeNull(); // after the last day
    expect(rideContext([{ ...trips[0], finished: '2026-10-11' }], '2026-10-11')).toBeNull(); // ended on the ride day
  });
  it('a note written while riding keeps trip and day and stays open in the Inbox', () => {
    const n = newNote({ text: 'Gloves too thin', page: 'ride', tripId: 'test_data_gtp_jura', day: 1 }, { id: 'n9', now: AT });
    expect(n).toMatchObject({ tripId: 'test_data_gtp_jura', day: 1, status: 'open' });
    expect(newNote({ text: 'x' }, { id: 'n0', now: AT })).not.toHaveProperty('day');
  });
  it('collects the notes on the way of one trip: debrief notes and Inbox notes, each once', () => {
    const notes = [
      newNote({ text: 'Gloves too thin', tripId: 'test_data_gtp_jura', day: 1 }, { id: 'n1', now: '2026-10-11T09:00:00Z' }),
      newNote({ text: 'Before the trip', tripId: 'test_data_gtp_jura' }, { id: 'n2', now: '2026-10-08T09:00:00Z' }), // no day: not on the way
      newNote({ text: 'Other trip', tripId: 'test_data_gtp_next', day: 0 }, { id: 'n3', now: '2026-10-20T09:00:00Z' }),
      newNote({ text: 'Sorted onto the trip', tripId: 'test_data_gtp_jura', day: 2 }, { id: 'n4', now: '2026-10-12T09:00:00Z' }),
    ];
    // n4 was sorted from the Inbox onto the trip: it is in the debrief too, but shown once.
    let d = addRideNote(null, trips[0], 'Old note in the debrief', 0, '2026-10-10T12:00:00Z');
    d = addRideNote(d, trips[0], 'Sorted onto the trip', 2, '2026-10-12T09:00:00Z');
    expect(tripNotes(d, notes, 'test_data_gtp_jura')).toEqual([
      { key: 'ride:0', at: '2026-10-10T12:00:00Z', day: 0, text: 'Old note in the debrief' },
      { key: 'ride:n1', at: '2026-10-11T09:00:00Z', day: 1, text: 'Gloves too thin', noteId: 'n1' },
      { key: 'ride:1', at: '2026-10-12T09:00:00Z', day: 2, text: 'Sorted onto the trip' },
    ]);
    expect(tripNotes(null, notes, 'test_data_gtp_next').map((n) => n.text)).toEqual(['Other trip']);
  });
});
