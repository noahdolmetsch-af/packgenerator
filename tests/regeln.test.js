import { describe, it, expect, afterEach } from 'vitest';
import { RAIN_LIMIT, rainLimitOf, rainLimit, setRainLimit, wetPct, wetHour } from '../src/lib/rainlimit.svelte.js';
import { DEFAULT_RULES, situationHits } from '../src/lib/situation.js';
import { toWx } from '../src/lib/weather.js';
import { isWet } from '../src/lib/wardrobe.js';
import { layerSuggest } from '../src/lib/layers.js';
import { dayDry } from '../src/lib/home/heute.js';
import { DAY_CLOCK, DAY_PARTS, partOfDay, isEveningOn, clockOf } from '../src/lib/dayclock.js';
import { helloPart } from '../src/lib/home/hallo.js';
import { QUIET_FROM, QUIET_TO } from '../src/lib/quiet.js';
import { EVENING_HOUR } from '../src/lib/phase.js';
import { REMIND_HOUR } from '../src/lib/flowbag.js';
import { NEVER_USED_MIN } from '../src/lib/neverused.js';
import { NEVER_AFTER } from '../src/lib/gear/material.js';
import { BALLAST_AFTER } from '../src/lib/packhints.js';
import { LEAVE_AFTER } from '../src/lib/debrief.js';
import { deadWeight } from '../src/lib/insights.js';
import { PART, CHECK_KM, firstDue, checkKmOf, checkState, serviceDue, wear } from '../src/lib/care.js';
import { CARE_ITEMS, careStd, careItems, careRow, carePlan, careChange, careResetAll, checkCare } from '../src/lib/care/plan.js';
import { timeDue } from '../src/lib/workshop.js';
import { lastTripOn } from '../src/lib/trips.js';

afterEach(() => setRainLimit(RAIN_LIMIT));

describe('RE1 one rain limit', () => {
  it('the standard is the limit of the rule Regen', () => {
    expect(DEFAULT_RULES.rain.limit).toBe(RAIN_LIMIT);
    expect(rainLimitOf(null)).toBe(RAIN_LIMIT);
    expect(rainLimitOf([{ key: 'rain', rule: { on: true, metric: 'rainPct', cmp: 'gte', limit: 45 } }])).toBe(45);
    // another value than the rain chance, or a broken one: the standard
    expect(rainLimitOf([{ key: 'rain', rule: { metric: 'minC', limit: 4 } }])).toBe(RAIN_LIMIT);
    expect(rainLimitOf([{ key: 'rain', rule: { metric: 'rainPct', limit: 'x' } }])).toBe(RAIN_LIMIT);
  });
  it('wet from the limit on, everywhere the same', () => {
    expect(wetPct(RAIN_LIMIT)).toBe(true);
    expect(wetPct(RAIN_LIMIT - 1)).toBe(false);
    expect(wetPct(null)).toBe(false);
    expect(wetHour({ rainMm: 0.5, rainPct: 0 })).toBe(true);
    expect(wetHour({ rainMm: 0, rainPct: RAIN_LIMIT })).toBe(true);
    expect(toWx([{ min: 8, max: 15, rainMm: 0, rainPct: RAIN_LIMIT }]).rain).toBe('showers');
    expect(toWx([{ min: 8, max: 15, rainMm: 0, rainPct: RAIN_LIMIT - 1 }]).rain).toBe('none');
    setRainLimit(50);
    expect(rainLimit()).toBe(50);
    expect(toWx([{ min: 8, max: 15, rainMm: 0, rainPct: 40 }]).rain).toBe('none');
    expect(wetPct(40)).toBe(false);
  });
  it('the suggestion of the day and What to wear follow the limit', () => {
    const p = Array(24).fill(0);
    p[12] = 35;
    const fc = { days: [{ date: '2026-10-09', hourly: { p } }] };
    expect(dayDry(fc, '2026-10-09')).toBe(false);
    setRainLimit(50);
    expect(dayDry(fc, '2026-10-09')).toBe(true);
    expect(isWet({ wx: { rain: 'none', rainPct: 40 } }, 30)).toBe(true);
    expect(isWet({ wx: { rain: 'none', rainPct: 20 } }, 30)).toBe(false);
  });
  it('2a: the rain jacket comes along by itself over the limit, with its reason', () => {
    const jacket = { id: 'J1', name: 'Rain jacket', rain: 'yes', ownership: 'owned', weightG: 210 };
    const trip = { id: 't', startDate: '2026-10-10', days: 2, wx: { min: 8, max: 15, rain: 'none', rainPct: 40 }, entries: [] };
    const rows = layerSuggest(trip, [jacket], 30);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'J1', optional: false, pct: 40 });
    expect(rows[0].why).toContain('40');
    expect(layerSuggest(trip, [jacket], 50)).toHaveLength(0);
    // the block Regen is suggested at the same limit
    expect(situationHits(trip, null).rain).toMatchObject({ kind: 'rain', pct: 40 });
  });
});

describe('RE2 never used only from 3 trips on', () => {
  it('one number everywhere', () => {
    expect(NEVER_USED_MIN).toBe(3);
    for (const n of [NEVER_AFTER, BALLAST_AFTER, LEAVE_AFTER]) expect(n).toBe(NEVER_USED_MIN);
  });
  it('the year review counts dead weight from that number on', () => {
    const items = [{ id: 'A', name: 'A', weightG: 100, ownership: 'owned' }];
    expect(deadWeight(items, { A: { taken: NEVER_USED_MIN - 1, used: 0 } }).dead).toHaveLength(0);
    expect(deadWeight(items, { A: { taken: NEVER_USED_MIN, used: 0 } }).dead).toHaveLength(1);
  });
});

describe('RE4 one day clock', () => {
  it('morning until 11, day until 18, evening 18-22, night 22-6', () => {
    expect(DAY_CLOCK).toEqual({ morning: 6, day: 11, evening: 18, night: 22 });
    const want = (h) => (h >= 22 || h < 6 ? 'night' : h < 11 ? 'morning' : h < 18 ? 'day' : 'evening');
    for (let h = 0; h < 24; h++) {
      expect(partOfDay(h), `${h}:00`).toBe(want(h));
      expect(helloPart(h), `${h}:00`).toBe(partOfDay(h));
    }
    expect(DAY_PARTS.every((p) => Number.isInteger(DAY_CLOCK[p]))).toBe(true);
    expect(clockOf('day')).toBe('11:00');
    expect(isEveningOn(17)).toBe(false);
    expect(isEveningOn(18)).toBe(true);
  });
  it('the night quiet, the evening of a trip and the reminder use it', () => {
    expect([QUIET_FROM, QUIET_TO]).toEqual([DAY_CLOCK.night, DAY_CLOCK.morning]);
    expect(EVENING_HOUR).toBe(DAY_CLOCK.evening);
    expect(REMIND_HOUR).toBe(DAY_CLOCK.evening);
  });
});

describe('RE5 care per bike', () => {
  it('first wins: km and/or days (5a)', () => {
    expect(firstDue({ sinceKm: 100, everyKm: 150 })).toMatchObject({ due: false, by: null, kmLeft: 50 });
    expect(firstDue({ sinceKm: 160, everyKm: 150, sinceDays: 10, everyDays: 60 })).toMatchObject({ due: true, by: 'km' });
    expect(firstDue({ sinceKm: 20, everyKm: 150, sinceDays: 61, everyDays: 60 })).toMatchObject({ due: true, by: 'days', daysLeft: -1 });
    expect(firstDue({ sinceKm: null, everyKm: 150, sinceDays: 30, everyDays: 60 })).toMatchObject({ due: false, frac: 0.5 });
    expect(firstDue({})).toMatchObject({ due: false, frac: null });
  });
  it('the standard comes from the part template', () => {
    expect(careStd('wax')).toEqual({ everyKm: PART.chain.everyKm, everyDays: null });
    expect(careStd('chainwear')).toEqual({ warnAt: PART.chain.warnAt, limit: PART.chain.limit });
    expect(careStd('sealant')).toEqual({ everyKm: null, everyDays: PART.tyres.everyDays });
    expect(careStd('check')).toEqual({ everyKm: CHECK_KM });
    for (const c of CARE_ITEMS) for (const k of c.parts) expect(PART[k], k).toBeTruthy();
  });
  const bike = { id: 'b1', name: 'Gravel Grinder', type: 'Gravel', km: 2288, parts: [{ key: 'chain', model: '', history: [{ date: '2026-09-19', km: 2000, action: 'service', result: 'done' }] }] };
  it('an old bike without settings shows today numbers, nothing changed', () => {
    const plan = carePlan(bike);
    expect(plan.rows.map((r) => r.key)).toEqual(careItems(bike).map((c) => c.key));
    expect(plan.rows.map((r) => r.key)).not.toContain('shock');
    expect(plan.changed).toBe(0);
    expect(plan.on).toBe(plan.n);
    expect(checkKmOf(bike)).toBe(CHECK_KM);
  });
  it('an own interval is stored on the part and every rule follows', () => {
    const ch = careChange(bike, 'wax', { values: { everyKm: 300, everyDays: null } });
    const b2 = { ...bike, ...ch };
    expect(careRow(b2, 'wax')).toMatchObject({ on: true, changed: true, values: { everyKm: 300 } });
    expect(serviceDue(bike).map((s) => s.key)).toContain('chain'); // 288 km since: due with 150
    expect(serviceDue(b2)).toHaveLength(0); // not with 300
    // back to the standard: the field goes, the part is as before
    const b3 = { ...b2, ...careChange(b2, 'wax', { values: null }) };
    expect(Object.hasOwn(b3.parts.find((p) => p.key === 'chain'), 'everyKm')).toBe(false);
  });
  it('days for the chain: due by time too, whichever comes first', () => {
    const b2 = { ...bike, ...careChange(bike, 'wax', { values: { everyKm: 1000, everyDays: 20 } }) };
    const rows = timeDue(b2, { front: null, rear: null }, '2026-10-14');
    expect(rows.find((r) => r.key === 'chain')).toMatchObject({ overdue: true });
  });
  it('off: no reminder, the history stays', () => {
    const b2 = { ...bike, ...careChange(bike, 'wax', { on: false }) };
    expect(careRow(b2, 'wax').on).toBe(false);
    expect(serviceDue(b2)).toHaveLength(0);
    expect(b2.parts.find((p) => p.key === 'chain').history).toHaveLength(1);
    const worn = { ...bike, parts: [{ key: 'chain', history: [{ date: '2026-10-01', km: 2200, action: 'check', value: 0.6 }] }] };
    expect(wear(worn.parts[0])).toBe('worn');
    const off = { ...worn, ...careChange(worn, 'chainwear', { on: false }) };
    expect(wear(off.parts.find((p) => p.key === 'chain'))).toBeNull();
    const noCheck = { ...bike, ...careChange(bike, 'check', { on: false }) };
    expect(checkKmOf(noCheck)).toBeNull();
    expect(checkState(noCheck)).toMatchObject({ rows: [], due: 0, every: null });
  });
  it('notes per care and reset all', () => {
    let b2 = { ...bike, ...careChange(bike, 'wax', { values: { everyKm: 200 }, note: 'Hot wax' }) };
    b2 = { ...b2, ...careChange(b2, 'check', { values: { everyKm: 1500 } }) };
    expect(careRow(b2, 'wax').note).toBe('Hot wax');
    expect(carePlan(b2).changed).toBe(2);
    const reset = careResetAll(b2);
    const b3 = { ...b2, parts: reset.parts };
    if (reset.checkKm === undefined) delete b3.checkKm;
    expect(carePlan(b3).changed).toBe(0);
    expect(b3.careNotes.wax).toBe('Hot wax');
  });
  it('checks what is typed', () => {
    expect(checkCare('wax', { everyKm: null, everyDays: null })).toEqual({ error: 'interval' });
    expect(checkCare('wax', { everyKm: -5 })).toEqual({ error: 'number' });
    expect(checkCare('chainwear', { warnAt: 0.6, limit: 0.5 })).toEqual({ error: 'wear' });
    expect(checkCare('pads', { warnAt: 40, limit: 50 })).toEqual({ error: 'wear' });
    expect(checkCare('pads', { warnAt: 70, limit: 50 })).toEqual({ values: { warnAt: 70, limit: 50 } });
    expect(checkCare('wax', {}, false)).toEqual({ values: null });
  });
});

describe('last trip copy: the trip used last, as the bike preselection', () => {
  it('a trip planned far ahead does not give its list', () => {
    const trips = [
      { id: 'old', bikeId: 'b', startDate: '2026-10-05', createdAt: '2026-10-01T08:00:00Z' },
      { id: 'ahead', bikeId: 'b', startDate: '2026-12-20', createdAt: '2026-09-01T08:00:00Z' },
    ];
    expect(lastTripOn('b', trips, '2026-10-14').id).toBe('old');
  });
});
