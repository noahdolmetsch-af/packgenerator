import { describe, it, expect } from 'vitest';
import { tripEnd, isOver, toDebrief, nextTrip, newDebrief, debriefCounts, suggestions, applyDebrief, learningsFor, unusedTimes, kmUpdate, tipsByItem } from '../src/lib/debrief.js';

const trip = {
  id: 't1', title: '303', startDate: '2026-10-15', days: 3, templateId: 'tpl1',
  entries: [
    { itemId: 'RAIN', slot: 'seat', qty: 1 },
    { itemId: 'PUMP', slot: 'frame', qty: 1 },
    { itemId: 'JERSEY', slot: 'seat', qty: 2 },
    { itemId: 'TUBE', slot: 'tool', qty: 1 },
  ],
};
const items = [
  { id: 'RAIN', name: 'Rain trousers', category: 'rain', weightG: 210, ownership: 'owned', role: 'optional' },
  { id: 'PUMP', name: 'Mini pump', category: 'tools', weightG: 95, ownership: 'owned', role: 'standard' },
  { id: 'JERSEY', name: 'Spare jersey', category: 'onbike', weightG: 160, ownership: 'owned', role: 'standard' },
  { id: 'TUBE', name: 'Tube', category: 'tools', weightG: 100, ownership: 'owned', role: 'standard' },
  { id: 'LAMP', name: 'Headlamp', category: 'light', weightG: 60, ownership: 'owned' },
];
const learnings = [
  { id: 1, topic: 'Clothing', rule: 'Too many spare clothes.', itemIds: ['JERSEY'], priority: 'high' },
  { id: 2, topic: 'Night', rule: 'Take a headlamp at night.', itemIds: ['LAMP'], priority: 'high', confirmed: 1 },
  { id: 3, topic: 'Food', rule: 'Drink enough water in the heat.', itemIds: [], priority: 'medium' },
  { id: 4, topic: 'Open question', rule: 'Which tent?', itemIds: [], priority: 'high' },
];
const templates = [{ id: 'tpl1', name: 'Bikepacking 3 days', entries: [{ itemId: 'RAIN', slot: 'seat', qty: 1 }, { itemId: 'JERSEY', slot: 'seat', qty: 1 }] }];

const filled = () => ({
  ...newDebrief(trip, 'x'),
  weather: 'warmer',
  items: { RAIN: 'unused', JERSEY: 'unused', PUMP: 'broken' },
  missing: [{ id: 'm1', name: 'Chain lube', itemId: null }, { id: 'm2', name: 'Headlamp', itemId: 'LAMP' }],
  note: 'Heatwave: no rain trousers.',
});

describe('when a trip wants a debrief', () => {
  it('knows the last day and whether it is over', () => {
    expect(tripEnd(trip)).toBe('2026-10-17');
    expect(isOver(trip, '2026-10-17')).toBe(false);
    expect(isOver(trip, '2026-10-18')).toBe(true);
  });
  it('lists finished trips without a done debrief, and finds the next trip', () => {
    const old = { ...trip, id: 't0', startDate: '2026-06-01', days: 6 };
    expect(toDebrief([trip, old], [], '2026-10-04').map((t) => t.id)).toEqual(['t0']);
    expect(toDebrief([trip, old], [{ tripId: 't0', status: 'done' }], '2026-10-04')).toEqual([]);
    expect(toDebrief([trip, old], [{ tripId: 't0', status: 'draft' }], '2026-10-04').length).toBe(1);
    expect(nextTrip([trip, old], '2026-10-04').id).toBe('t1');
    expect(nextTrip([trip, old], '2026-10-16').id).toBe('t1');
    expect(nextTrip([trip, old], '2026-10-18')).toBeNull();
  });
});

describe('debrief summary', () => {
  it('counts what was not used and its weight', () => {
    const c = debriefCounts(filled(), trip, items);
    expect(c).toMatchObject({ unused: 2, unusedG: 210 + 2 * 160, broken: 1, missing: 2 });
  });
  it('suggests changes, grouped', () => {
    const s = suggestions(filled(), trip, items, learnings, templates);
    const ids = s.map((x) => x.id);
    expect(ids).toContain('cold:RAIN');
    expect(ids).toContain('cold:JERSEY'); // warm clothing first, not "optional" as well
    expect(ids).not.toContain('optional:JERSEY');
    expect(ids).toContain('wish:m1');
    expect(ids).not.toContain('wish:m2'); // already in the gear
    expect(ids).toContain('broken:PUMP');
    expect(ids).toEqual(expect.arrayContaining(['confirm:1', 'confirm:2', 'learn:note', 'template:tpl1']));
  });
  it('suggests leaving a standard item at home only on the third trip without it (answer 8b)', () => {
    const d = { ...filled(), weather: 'planned' };
    const past = (tripId, status = 'done') => ({ tripId, status, items: { JERSEY: 'unused' } });
    expect(suggestions(d, trip, items, [], [], [past('a')]).map((x) => x.id)).not.toContain('optional:JERSEY');
    // A draft and this trip's own debrief do not count.
    expect(suggestions(d, trip, items, [], [], [past('a'), past('b', 'draft'), past('t1')]).map((x) => x.id)).not.toContain('optional:JERSEY');
    const s = suggestions(d, trip, items, [], [], [past('a'), past('b')]);
    expect(s.map((x) => x.id)).toContain('optional:JERSEY');
    expect(s.find((x) => x.id === 'optional:JERSEY').detail).toMatch(/3 trips/);
    expect(s.map((x) => x.id)).not.toContain('cold:RAIN');
    expect(unusedTimes([past('a'), past('b'), past('c', 'draft')])).toEqual({ JERSEY: 2 });
  });
  it('adds the km of the trip to the bike once (answer 7a)', () => {
    const d = { ...newDebrief(trip, 'x'), km: '312' };
    expect(kmUpdate({ km: 1000 }, d)).toEqual({ km: 1312, kmApplied: 312 });
    expect(kmUpdate({}, d)).toEqual({ km: 312, kmApplied: 312 });
    // Opened again and corrected: only the difference.
    expect(kmUpdate({ km: 1312 }, { ...d, km: 300, kmApplied: 312 })).toEqual({ km: 1300, kmApplied: 300 });
    expect(kmUpdate({ km: 1312 }, { ...d, kmApplied: 312 })).toBeNull();
    expect(kmUpdate(null, d)).toBeNull();
  });
  it('picks one learning per item as a packing hint (answer 3a)', () => {
    const tips = tipsByItem([...learnings, { id: 5, topic: 'Night', rule: 'Low', itemIds: ['LAMP'], priority: 'low' }, { id: 6, topic: 'Open question', rule: 'Q', itemIds: ['PUMP'], priority: 'high' }]);
    expect(tips.LAMP.id).toBe(2);
    expect(tips.JERSEY.id).toBe(1);
    expect(tips.PUMP).toBeUndefined();
  });
});

describe('applying a debrief', () => {
  it('changes only what was ticked', () => {
    const d = filled();
    const out = applyDebrief(d, trip, items, learnings, templates, ['cold:RAIN', 'wish:m1', 'broken:PUMP', 'confirm:2', 'learn:note', 'template:tpl1'], { now: 'N' });
    expect(out.items.find((i) => i.id === 'RAIN').coldBelow).toBe(10);
    expect(out.items.find((i) => i.id === 'JERSEY')).toBeUndefined();
    const wishes = out.items.filter((i) => i.ownership === 'wishlist');
    expect(wishes.map((w) => w.name)).toEqual(['Chain lube', 'Mini pump']);
    expect(new Set(wishes.map((w) => w.id)).size).toBe(2);
    expect(out.learnings.find((l) => l.id === 2).confirmed).toBe(2);
    expect(out.learnings.find((l) => l.id === 5)).toMatchObject({ rule: 'Heatwave: no rain trousers.', source: '303' });
    const tpl = out.templates[0];
    expect(tpl.entries.map((e) => e.itemId)).toEqual(['LAMP']);
  });
  it('changes nothing without ticks', () => {
    expect(applyDebrief(filled(), trip, items, learnings, templates, [])).toEqual({ items: [], learnings: [], templates: null, notes: [] });
  });
});

describe('learnings for a trip', () => {
  it('picks important ones for the season, never open questions', () => {
    const top = learningsFor(trip, learnings, 2);
    expect(top.map((l) => l.id)).toEqual([2, 1]);
    expect(learningsFor({ ...trip, startDate: '2026-07-01' }, learnings, 3).map((l) => l.id)).not.toContain(4);
  });
});

// v0.26.1 (AP20, Noah 20a, 19b): what was missing becomes "Take … next time"; notes on the way become learnings.
describe('missing items and notes on the way (v0.26.1)', () => {
  it('suggests "Take … next time" per missing thing and saves it only when ticked', () => {
    const d = filled();
    const s = suggestions(d, trip, items, learnings, templates);
    expect(s.filter((x) => x.id.startsWith('next:')).map((x) => [x.group, x.label])).toEqual([
      ['learn', 'Take Chain lube next time'],
      ['learn', 'Take Headlamp next time'],
    ]);
    expect(applyDebrief(d, trip, items, learnings, templates, []).learnings).toEqual([]);
    const out = applyDebrief(d, trip, items, learnings, templates, ['next:m2'], { now: 'N' });
    expect(out.learnings).toEqual([expect.objectContaining({ rule: 'Take Headlamp next time', itemIds: ['LAMP'], source: '303', topic: 'Debrief' })]);
    const out2 = applyDebrief(d, trip, items, learnings, templates, ['next:m1', 'next:m2']);
    expect(out2.learnings.map((l) => l.id)).toEqual([5, 6]);
    expect(out2.learnings[0].itemIds).toEqual([]);
  });
  it('turns a note on the way into a learning and reports the Inbox note to sort', () => {
    const d = { ...newDebrief(trip, 'x'), rideNotes: [
      { key: 'ride:0', at: '2026-10-15T10:00:00Z', day: 0, text: 'Old ride note' },
      { key: 'ride:note-a', at: '2026-10-16T09:00:00Z', day: 1, text: 'Gloves too thin', noteId: 'note-a' },
    ] };
    const ids = suggestions(d, trip, items, [], []).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['ride:0', 'ride:note-a']));
    const out = applyDebrief(d, trip, items, [], [], ['ride:note-a']);
    expect(out.learnings).toEqual([expect.objectContaining({ id: 1, rule: 'Gloves too thin', topic: 'Ride day', source: '303' })]);
    expect(out.notes).toEqual([{ id: 'note-a', learningId: 1 }]);
  });
});
