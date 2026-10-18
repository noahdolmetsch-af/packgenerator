// Merken: Geburtstage und Pflanzen (Noah 15.10.2026). Fictional names only.
import { describe, it, expect } from 'vitest';
import { isLeap, validMd, birthdayIn, nextBirthday, daysBetween, ageOn, birthdayReminders, toggleRemind, remindAt, newBirthday, newPlant, plantNext, watered, birthdayRows, plantRows, plantReminder, yearlyRule, birthdayEvents, BDAY_REMINDS, isKind } from '../src/lib/merken/kinds.js';
import { addDays, groupTodos } from '../src/lib/merken.js';
import { AREAS, areaOf, remindIcs } from '../src/lib/remind.js';
import { icsCalendar } from '../src/lib/flowmed.js';

const TODAY = '2026-10-15';

describe('birthdays', () => {
  it('knows leap years and real days', () => {
    expect([2024, 2026, 1900, 2000].map(isLeap)).toEqual([true, false, false, true]);
    expect(validMd('02-29')).toBe(true);
    expect(validMd('02-30')).toBe(false);
    expect(validMd('13-01')).toBe(false);
    expect(validMd('4-1')).toBe(false);
  });
  it('the next birthday: today counts, a past one moves to next year', () => {
    expect(nextBirthday({ md: '10-15' }, TODAY)).toBe(TODAY);
    expect(nextBirthday({ md: '10-18' }, TODAY)).toBe('2026-10-18');
    expect(nextBirthday({ md: '01-03' }, TODAY)).toBe('2027-01-03');
    expect(daysBetween(TODAY, nextBirthday({ md: '10-18' }, TODAY))).toBe(3);
  });
  it('29 Feb becomes 28 Feb in a year without 29 Feb', () => {
    expect(birthdayIn('02-29', 2027)).toBe('2027-02-28');
    expect(birthdayIn('02-29', 2028)).toBe('2028-02-29');
    expect(nextBirthday({ md: '02-29' }, TODAY)).toBe('2027-02-28');
    expect(nextBirthday({ md: '02-29' }, '2027-03-01')).toBe('2028-02-29');
  });
  it('the age on the birthday, none without a year', () => {
    expect(ageOn({ md: '10-18', year: 1986 }, '2026-10-18')).toBe(40);
    expect(ageOn({ md: '10-18', year: null }, '2026-10-18')).toBeNull();
    expect(ageOn({ md: '10-18', year: 2030 }, '2026-10-18')).toBeNull();
  });
  it('a new birthday: the day before 18:00 and on the day 08:00, name and day needed', () => {
    const b = newBirthday({ name: ' Mia ', md: '10-18', year: '1986' }, { id: 'b1', now: 'x' });
    expect(b).toMatchObject({ kind: 'birthday', area: 'birthday', text: 'Mia', bday: { md: '10-18', year: 1986 }, doneAt: null });
    expect(b.reminds).toEqual(BDAY_REMINDS);
    expect(newBirthday({ name: 'Opa', md: '' }, { id: 'b2' })).toBeNull();
    expect(newBirthday({ name: '', md: '01-01' }, { id: 'b3' })).toBeNull();
    expect(newBirthday({ name: 'Opa', md: '01-01', year: '' }, { id: 'b4' }).bday.year).toBeNull();
  });
  it('reminders switch off and on, keep their time and change it', () => {
    let r = toggleRemind(BDAY_REMINDS, 1);
    expect(r).toEqual([{ before: 0, at: '08:00' }]);
    r = toggleRemind(r, 1);
    expect(r).toEqual(BDAY_REMINDS);
    expect(remindAt(r, 0, '07:30')).toEqual([{ before: 1, at: '18:00' }, { before: 0, at: '07:30' }]);
    expect(toggleRemind([], 0)).toEqual([{ before: 0, at: '08:00' }]);
  });
  it('the reminder days of the next birthday; the past and switched-off left out', () => {
    const b = newBirthday({ name: 'Mia', md: '10-18' }, { id: 'b1' });
    expect(birthdayReminders(b, TODAY)).toEqual([{ before: 1, at: '18:00', day: '2026-10-17' }, { before: 0, at: '08:00', day: '2026-10-18' }]);
    expect(birthdayReminders({ ...b, bday: { md: '10-15' } }, TODAY).map((r) => r.day)).toEqual([TODAY]);
    expect(birthdayReminders({ ...b, off: true }, TODAY)).toEqual([]);
  });
  it('rows for Merken: next ones first, with «in n days» and the age', () => {
    const list = [newBirthday({ name: 'Opa', md: '01-03', year: 1950 }, { id: 'a' }), newBirthday({ name: 'Mia', md: '10-18' }, { id: 'b' })];
    const rows = birthdayRows(list, TODAY);
    expect(rows.map((r) => [r.td.text, r.day, r.in, r.age])).toEqual([['Mia', '2026-10-18', 3, null], ['Opa', '2027-01-03', 80, 77]]);
  });
  it('a yearly calendar event per reminder; 29 Feb follows the end of February', () => {
    expect(yearlyRule('10-18', 1)).toBe('FREQ=YEARLY');
    expect(yearlyRule('02-29', 0)).toBe('FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1');
    expect(yearlyRule('02-29', 1)).toBe('FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-2');
    const b = newBirthday({ name: 'Mia', md: '10-18' }, { id: 'b1' });
    expect(birthdayEvents([b, { ...b, id: 'b2', off: true }], TODAY).map((e) => [e.day, e.time, e.rrule])).toEqual([['2026-10-17', '18:00', 'FREQ=YEARLY'], ['2026-10-18', '08:00', 'FREQ=YEARLY']]);
    const ics = remindIcs([b], icsCalendar, Date.parse('2026-10-15T08:00:00Z'));
    expect(ics.match(/RRULE:FREQ=YEARLY\r\n/g)).toHaveLength(2); // the time zone has two yearly rules of its own
    expect(ics).toContain('SUMMARY:Mia');
    expect(ics).toContain('BEGIN:VALARM');
  });
});

describe('plants', () => {
  const basil = () => newPlant({ name: 'Basilikum', every: 3, place: 'Balkon', last: '2026-10-14' }, { id: 'p1', today: TODAY, now: 'x' });
  it('a new plant: name needed, last watered today by default, a reminder on the due day', () => {
    expect(basil()).toMatchObject({ kind: 'plant', area: 'plant', text: 'Basilikum', plant: { every: 3, place: 'Balkon', last: '2026-10-14' }, remind: { at: '08:00', before: 0 } });
    expect(newPlant({ name: 'Farn' }, { id: 'p2', today: TODAY }).plant).toEqual({ every: 7, place: null, last: TODAY });
    expect(newPlant({ name: 'Farn', every: 0 }, { id: 'p3', today: TODAY }).plant.every).toBe(7);
    expect(newPlant({ name: ' ' }, { id: 'p4', today: TODAY })).toBeNull();
  });
  it('next due, «Gegossen» moves it, rows sort the most urgent first', () => {
    const p = basil();
    expect(plantNext(p)).toBe('2026-10-17');
    const w = watered(p, TODAY);
    expect(plantNext(w)).toBe(addDays(TODAY, 3));
    expect(p.plant.last).toBe('2026-10-14'); // the old entry stays for Undo
    const late = newPlant({ name: 'Farn', every: 2, last: '2026-10-10' }, { id: 'p2', today: TODAY });
    expect(plantRows([p, late], TODAY).map((r) => [r.td.text, r.in])).toEqual([['Farn', -3], ['Basilikum', 2]]);
  });
  it('the reminder day: the due day, today when late; none when off', () => {
    expect(plantReminder(basil(), TODAY)).toEqual({ day: '2026-10-17', at: '08:00' });
    const late = newPlant({ name: 'Farn', every: 2, last: '2026-10-10' }, { id: 'p2', today: TODAY });
    expect(plantReminder(late, TODAY).day).toBe(TODAY);
    expect(plantReminder({ ...late, remind: null }, TODAY)).toBeNull();
    expect(plantReminder({ ...late, off: true }, TODAY)).toBeNull();
  });
});

describe('in the Merken list', () => {
  it('birthdays and plants stay out of the to-do groups and have their own areas', () => {
    const b = newBirthday({ name: 'Mia', md: '10-15' }, { id: 'b1' });
    const p = newPlant({ name: 'Farn', every: 1, last: '2026-10-01' }, { id: 'p1', today: TODAY });
    const g = groupTodos([b, p], TODAY);
    expect(Object.values(g).flat()).toEqual([]);
    expect(isKind(b) && isKind(p) && !isKind({ text: 'x' })).toBe(true);
    expect(AREAS.map((a) => a.key)).toEqual(expect.arrayContaining(['birthday', 'plant']));
    expect([areaOf(b), areaOf(p)]).toEqual(['birthday', 'plant']);
  });
});
