// v0.30.1: Noah's phone test of 0.29.2 (findings A2, C1, C5). Fictional items only (test_data_gtp_).
import { describe, it, expect } from 'vitest';
import { stage, blocks, NO_ROUTE_HOURS } from '../src/lib/ride.js';
import { blockPlan } from '../src/lib/blockplan.js';
import { layerSuggest, rainOf, isRainBlock } from '../src/lib/layers.js';
import { applyContext } from '../src/lib/context.js';
import { rowReasons } from '../src/lib/reasons.js';
import { upcomingTrips } from '../src/lib/care.js';
import { currentTrip } from '../src/lib/gear/assign.js';
import { pastTrips } from '../src/lib/hubs.js';
import { nextTrip, isOver } from '../src/lib/debrief.js';

const item = (id, f) => ({ id, name: `test_data_gtp_ ${id}`, category: 'other', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], domains: ['bikepacking'], defaultBag: 'seat', ...f });

describe('A2: "+ Rain" brings the rain gear', () => {
  const jacket = item('jacket', { sets: ['u-regen'] });
  const pants = item('pants', { sets: ['u-rain-gear'] });
  const marked = item('marked', { rain: 'optional', sets: ['u-regen'] });
  const terrain = item('terrain', { sets: ['u-terrain'] });
  const items = [jacket, pants, marked, terrain];

  it('an item in an own rain building block counts as rain gear; its own setting wins', () => {
    expect(isRainBlock('u-regen')).toBe(true);
    expect(isRainBlock('u-rain-gear')).toBe(true);
    expect(isRainBlock('u-terrain')).toBe(false);
    expect(isRainBlock('base')).toBe(false);
    expect(rainOf(jacket)).toBe('yes');
    expect(rainOf(marked)).toBe('optional');
    expect(rainOf(terrain)).toBeNull();
  });

  it('rain on a trip adds them (with the reason "Rain"), dry takes them out again', () => {
    const dry = { overnight: 'none', days: 1, hours: 2, wx: { min: 6, max: 12, rain: 'none' }, entries: [] };
    expect(layerSuggest(dry, items)).toEqual([]);
    const wet = { ...dry, wx: { ...dry.wx, rain: 'rain' } };
    expect(layerSuggest(wet, items).map((r) => [r.id, r.why, r.optional])).toEqual([['jacket', 'Rain', false], ['pants', 'Rain', false], ['marked', 'Rain, optional', true]]);
    const added = applyContext(wet, items, dry).entries;
    expect(added.map((e) => [e.itemId, e.src])).toEqual([['jacket', 'context'], ['pants', 'context']]);
    expect(rowReasons({ ...wet, entries: added }, items).jacket.line).toContain('Rain');
    expect(applyContext({ ...wet, entries: added, wx: dry.wx }, items, { ...wet, entries: added }).entries).toEqual([]);
  });

  it('On the way puts the rain-block jacket on when it rains', () => {
    const rows = [{ startAt: '2026-10-08T09:00', endAt: '2026-10-08T12:00', kmFrom: null, kmTo: null, rest: false }];
    const p = blockPlan(rows, [{ item: jacket, qty: 1, place: 'Seat pack' }], { tripWx: { min: 8, max: 12, rain: 'rain' } });
    expect(p.rows[0].wear.map((w) => w.id)).toEqual(['jacket']);
  });
});

describe('C1: On the way without a route still has blocks and a Now card', () => {
  const trip = { id: 't', startDate: '2026-10-08', days: 1, hours: 2, entries: [] };

  it('the stage takes the riding hours of the trip; today without a start time starts now', () => {
    const st = stage(trip, 0, null, { today: '2026-10-08', nowStart: '15:00' });
    expect(st).toMatchObject({ km: null, hours: 2, hoursGuess: false, start: '15:00', startAt: '2026-10-08T15:00', endAt: '2026-10-08T17:00', arrive: '17:00' });
    // Another day, or a start time set: as before (08:00 / the time set).
    expect(stage(trip, 0, null, { today: '2026-10-07', nowStart: '15:00' }).start).toBe('08:00');
    expect(stage({ ...trip, rideStart: { 0: '07:30' } }, 0, null, { today: '2026-10-08', nowStart: '15:00' }).start).toBe('07:30');
    // No riding hours: one block assumed.
    expect(stage({ ...trip, hours: null }, 0)).toMatchObject({ hours: NO_ROUTE_HOURS, hoursGuess: true });
    // No date: nothing to plan.
    expect(stage({ ...trip, startDate: null }, 0).hours).toBeNull();
  });

  it('blocks by time (3 h, the last one shorter), without km', () => {
    const st = stage({ ...trip, hours: 4 }, 0, null, { today: '2026-10-08', nowStart: '09:00' });
    const rows = blocks(trip, st);
    expect(rows.map((b) => [b.from, b.to, b.kmFrom, b.kmTo])).toEqual([['09:00', '12:00', null, null], ['12:00', '13:00', null, null]]);
    const p = blockPlan(rows, [{ item: item('bottle', { waterL: 0.5 }), qty: 1, place: 'Frame' }], { tripWx: { min: 10, max: 18, rain: 'none' } });
    expect(p.rows[0].drinkL).toBe(1.5);
    // Refill in time, not in km.
    expect(p.rows[0].refillKm).toEqual([]);
    expect(p.rows[0].refillAt).toEqual(['10:00', '11:00']);
  });

  it('a route keeps its km blocks', () => {
    const st = stage({ ...trip, route: { km: 60, gainM: 0 } }, 0);
    expect(blocks(trip, st)[0].kmFrom).toBe(0);
  });
});

describe('C5: a trip ended early is past everywhere', () => {
  const today = '2026-10-08';
  const ended = { id: 'ended', title: 'test_data_gtp_ ended', startDate: today, days: 1, finished: today, entries: [{ itemId: 'x' }] };
  const ahead = { id: 'ahead', title: 'test_data_gtp_ ahead', startDate: '2026-10-20', days: 2, entries: [] };

  it('past trips list it, the next trip and the upcoming trips do not', () => {
    expect(isOver(ended, today)).toBe(true);
    expect(pastTrips([ended, ahead], [], today).map((r) => r.trip.id)).toEqual(['ended']);
    expect(nextTrip([ended, ahead], today).id).toBe('ahead');
    expect(upcomingTrips([ended, ahead], today).map((t) => t.id)).toEqual(['ahead']);
    expect(currentTrip([ended, ahead], null, today).id).toBe('ahead');
  });
});
