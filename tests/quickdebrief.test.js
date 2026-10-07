import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { quickDebrief, templateOffer, templateName, bikeKind, newDebrief, suggestions, toDebrief } from '../src/lib/debrief.js';
import { saveTripAsTemplate, loadTemplates, saveTemplates } from '../src/lib/templates.js';
import { lang } from '../src/lib/i18n.svelte.js';

// v0.24.1 (Noah 3a and 4a): "All good" on Today and the template offer after a day trip. Fictional data.
afterEach(() => (lang.v = 'en'));

const NOW = '2026-10-07T18:00:00.000Z';
const trip = (id, extra = {}) => ({
  id: `test_data_gtp_${id}`, title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: '2026-10-05', days: 1, bikeId: 'bike-test', bike: 'Test bike',
  entries: [{ itemId: 'A', slot: 'seat', qty: 1 }, { itemId: 'B', slot: 'frame', qty: 1 }], status: 'planned', ...extra,
});

describe('quickDebrief: "All good" on Today', () => {
  it('saves a finished debrief: as planned, right, fine, everything used, nothing applied', () => {
    const d = quickDebrief(trip('day'), null, NOW);
    expect(d).toMatchObject({
      tripId: 'test_data_gtp_day', status: 'done', weather: 'planned', amount: 'right', bags: 'fine',
      items: {}, missing: [], note: '', applied: [], doneAt: NOW, updatedAt: NOW, km: null, kmApplied: 0,
    });
    // the same shape as a debrief from the three steps
    expect(Object.keys(d).sort()).toEqual([...Object.keys(newDebrief(trip('day'), NOW)), 'doneAt'].sort());
  });

  it('a draft keeps its km, note, ride notes and answers; only the empty ones are filled', () => {
    const draft = { ...newDebrief(trip('day'), 'earlier'), weather: 'colder', km: 42, note: 'test_data_gtp_ windy', rideNotes: [{ at: 'x', text: 'test_data_gtp_ flat' }] };
    const d = quickDebrief(trip('day'), draft, NOW);
    expect(d).toMatchObject({ weather: 'colder', amount: 'right', bags: 'fine', km: 42, kmApplied: 0, note: 'test_data_gtp_ windy', status: 'done', createdAt: 'earlier' });
    expect(d.rideNotes).toEqual(draft.rideNotes);
    // the draft itself is not changed
    expect(draft.status).toBe('draft');
    expect(draft.amount).toBe(null);
  });

  it('the trip no longer waits for a debrief', () => {
    const t = trip('day');
    expect(toDebrief([t], [], '2026-10-07')).toHaveLength(1);
    expect(toDebrief([t], [quickDebrief(t, null, NOW)], '2026-10-07')).toHaveLength(0);
  });

  it('nothing is suggested for an "All good" without a note', () => {
    const t = trip('day');
    expect(suggestions(quickDebrief(t, null, NOW), t, [{ id: 'A', name: 'a', role: 'standard' }, { id: 'B', name: 'b' }])).toEqual([]);
  });
});

describe('template offer after the first day trip', () => {
  const day = trip('day');
  it('a one-day bike trip without a template is offered', () => {
    expect(templateOffer(day, [], [day])).toBe(true);
  });

  it('not for several days, a trip without a bike, a trip from a template, or after "No thanks"', () => {
    expect(templateOffer(trip('long', { days: 3 }), [], [])).toBe(false);
    expect(templateOffer(trip('walk', { domain: 'weekend', packs: [{ key: 'bag', name: 'Travel bag' }], bikeId: null }), [], [])).toBe(false);
    expect(templateOffer(trip('tpl', { templateId: 'tpl-x' }), [], [])).toBe(false);
    expect(templateOffer(trip('no', { tplOffer: 'no' }), [], [])).toBe(false);
    expect(templateOffer(null, [], [])).toBe(false);
  });

  it('not when a template was already saved from a day trip of this area and bike', () => {
    const first = trip('first');
    const tpl = { id: 'tpl-1', name: 'MTB day ride', fromTrip: first.id, entries: [] };
    expect(templateOffer(day, [tpl], [first, day])).toBe(false);
    // from a longer trip, another bike, or an unknown trip: still offered
    expect(templateOffer(day, [tpl], [{ ...first, days: 3 }, day])).toBe(true);
    expect(templateOffer(day, [tpl], [{ ...first, bikeId: 'bike-other' }, day])).toBe(true);
    expect(templateOffer(day, [{ ...tpl, fromTrip: null }], [first, day])).toBe(true);
  });

  it('the name: the bike kind, else the bike name, else "Day ride"; never a name that is taken', () => {
    expect(bikeKind({ type: 'Full suspension' })).toBe('MTB');
    expect(bikeKind({ type: 'Hardtail' })).toBe('MTB');
    expect(bikeKind({ type: 'Road / gravel' })).toBe('Gravel');
    expect(bikeKind({ name: 'x' })).toBe(null);
    expect(templateName(day, { name: 'Test MTB', type: 'Hardtail' })).toBe('MTB day ride');
    expect(templateName(day, { name: 'Test bike' })).toBe('Day ride Test bike');
    expect(templateName({ ...day, bike: undefined }, null)).toBe('Day ride');
    expect(templateName(day, { type: 'Hardtail' }, [{ name: 'mtb day ride' }, { name: 'MTB day ride 2' }])).toBe('MTB day ride 3');
    lang.v = 'de';
    expect(templateName(day, { type: 'Hardtail' })).toBe('MTB-Tagestour');
    expect(templateName(day, { name: 'Test bike' })).toBe('Tagestour Test bike');
  });
});

describe('saving a trip as template (shared by the dialog and the offer)', () => {
  it('saves, points the trip to it, refuses an empty or taken name', async () => {
    const db = createDb('quick-tpl-test');
    const t = trip('save');
    await db.trips.put(t);
    await saveTemplates(db, [{ id: 'tpl-old', name: 'Taken', entries: [] }]);
    expect(await saveTripAsTemplate(db, t, '  ')).toEqual({ error: 'empty', name: '' });
    expect(await saveTripAsTemplate(db, t, 'taken')).toEqual({ error: 'taken', name: 'taken' });
    const out = await saveTripAsTemplate(db, t, ' MTB day ride ');
    expect(out.name).toBe('MTB day ride');
    const list = await loadTemplates(db);
    expect(list.map((x) => x.name)).toEqual(['Taken', 'MTB day ride']);
    expect(list[1]).toMatchObject({ id: out.id, fromTrip: t.id, entries: [{ itemId: 'A', slot: 'seat', qty: 1 }, { itemId: 'B', slot: 'frame', qty: 1 }] });
    expect((await db.trips.get(t.id)).templateId).toBe(out.id);
    // the saved template now stops the offer for the next day trip on this bike
    expect(templateOffer(trip('next'), list, [await db.trips.get(t.id), trip('next')])).toBe(false);
    db.close();
  });
});
