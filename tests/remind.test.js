import { describe, it, expect } from 'vitest';
import { shouldAsk, answer, forget, neverAsked, suggestRhythm, weekdayOf, nextWeekday, hourBefore, activityReminder, tripSteps, tripReminders, careReminder, remindIcs, AGAIN_DAYS } from '../src/lib/remind.js';
import { icsCalendar } from '../src/lib/flowmed.js';
import { addDays } from '../src/lib/merken.js';

const TODAY = '2026-10-14'; // a Wednesday

describe('when the app asks (ER1–ER3, 2a)', () => {
  it('asks once, then again 30 days after «Nein danke», never after «Nie fragen»', () => {
    expect(shouldAsk('act:yoga', { today: TODAY })).toBe(true);
    const no = answer({}, 'act:yoga', 'no', TODAY);
    expect(shouldAsk('act:yoga', { answers: no, today: addDays(TODAY, AGAIN_DAYS - 1) })).toBe(false);
    expect(shouldAsk('act:yoga', { answers: no, today: addDays(TODAY, AGAIN_DAYS) })).toBe(true);
    const never = answer({}, 'act:yoga', 'never', TODAY);
    expect(shouldAsk('act:yoga', { answers: never, today: '2027-10-14' })).toBe(false);
    expect(neverAsked(never)).toEqual(['act:yoga']);
    expect(shouldAsk('act:yoga', { answers: forget(never, 'act:yoga'), today: TODAY })).toBe(true);
  });
  it('does not ask when a reminder exists, or when asking is switched off', () => {
    expect(shouldAsk('act:yoga', { todos: [{ src: 'act:yoga', doneAt: null }], today: TODAY })).toBe(false);
    expect(shouldAsk('trip:t1', { todos: [{ src: 'trip:t1:pack', doneAt: null }], today: TODAY })).toBe(false);
    expect(shouldAsk('act:yoga', { offer: false, today: TODAY })).toBe(false);
  });
});

describe('the time from the history (3a)', () => {
  const at = (day, hm) => ({ day, at: new Date(`${day}T${hm}:00`).toISOString() });
  it('three Tuesdays at 17:30 → every Tuesday 17:30', () => {
    const r = suggestRhythm([at('2026-09-29', '17:30'), at('2026-10-06', '17:35'), at('2026-10-13', '17:25')], TODAY);
    expect(r).toMatchObject({ every: 'week', weekday: 1, at: '17:30', seen: 3 });
  });
  it('5 of the last 7 days → every day', () => {
    const days = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];
    expect(suggestRhythm(days.map((d) => at(d, '07:00')), TODAY)).toMatchObject({ every: 'day', at: '07:00' });
  });
  it('nothing clear → today’s weekday and the fallback time', () => {
    expect(suggestRhythm([], TODAY)).toMatchObject({ every: 'week', weekday: 2, at: '18:00', seen: 0 });
  });
  it('weekdays and the hour before', () => {
    expect(weekdayOf(TODAY)).toBe(2);
    expect(nextWeekday(TODAY, 1)).toBe('2026-10-20');
    expect(nextWeekday(TODAY, 2)).toBe(TODAY);
    expect(hourBefore('17:30')).toBe('16:30');
    expect(hourBefore('00:15')).toBe('23:15');
  });
  it('the reminder starts at the next matching day', () => {
    const r = activityReminder({ id: 'yoga', name: 'Yoga' }, { every: 'week', weekday: 1, at: '17:30' }, { today: TODAY, earlier: true });
    expect(r).toEqual({ text: 'Yoga', due: '2026-10-20', remind: { at: '16:30', before: 0 }, repeat: { every: 'week' }, area: 'active', src: 'act:yoga' });
    const d = activityReminder({ id: 'med', name: 'Meditation' }, { every: 'day', at: '07:00' }, { today: TODAY, nowClock: '08:10' });
    expect(d.due).toBe('2026-10-15');
  });
});

describe('before a tour and in bike care (ER2)', () => {
  it('packing 2 days before, charging and weather the evening before; past steps are left out', () => {
    expect(tripSteps('2026-10-18', TODAY).map((s) => [s.key, s.day, s.at])).toEqual([['pack', '2026-10-16', '18:00'], ['charge', '2026-10-17', '20:00'], ['weather', '2026-10-17', '18:00']]);
    expect(tripSteps('2026-10-15', TODAY).map((s) => s.key)).toEqual(['charge', 'weather']);
    const r = tripReminders({ id: 't1', title: 'Jura-Runde' }, tripSteps('2026-10-18', TODAY).slice(0, 1), { pack: (n) => `${n}: packen` });
    expect(r).toEqual([{ text: 'Jura-Runde: packen', due: '2026-10-16', remind: { at: '18:00', before: 0 }, area: 'trips', src: 'trip:t1:pack' }]);
  });
  it('after the chain: by km from the counter, monthly, or after rain', () => {
    const bike = { id: 'g', km: 2410 };
    expect(careReminder({ bike, kind: 'chain', text: 'Kette ölen', today: TODAY, way: 'km' }).repeat).toEqual({ every: 'km', km: 300, bikeId: 'g', fromKm: 2410 });
    expect(careReminder({ bike, kind: 'chain', text: 'x', today: TODAY, way: 'month' })).toMatchObject({ due: '2026-11-13', repeat: { every: 'month' } });
    expect(careReminder({ bike, kind: 'chain', text: 'x', today: TODAY, way: 'rain' }).repeat).toEqual({ every: 'rain', bikeId: 'g' });
  });
});

describe('the calendar file', () => {
  it('has an alarm and a repeat, and leaves out reminders without a time or switched off', () => {
    const text = remindIcs([
      { id: 'a', text: 'Yoga', due: '2026-10-20', remind: { at: '16:30', before: 0 }, repeat: { every: 'week' } },
      { id: 'b', text: 'Kette', repeat: { every: 'km' } },
      { id: 'c', text: 'Aus', due: '2026-10-20', remind: { at: '08:00' }, off: true },
    ], icsCalendar, Date.UTC(2026, 9, 14));
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(text).toContain('RRULE:FREQ=WEEKLY');
    expect(text).toContain('BEGIN:VALARM');
    expect(text).toContain('DTSTART;TZID=Europe/Zurich:20261020T163000');
  });
});
