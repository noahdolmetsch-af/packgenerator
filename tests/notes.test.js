import { describe, it, expect } from 'vitest';
import { newNote, guessBike, guessKind, sortNote, nextNumber } from '../src/lib/notes.js';
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
