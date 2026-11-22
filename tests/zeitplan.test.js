// «Zeitplan» (Noah 21.11.2026 «V4 ok»): Zeiten, freier Slot, Reihenfolge, Zeit an der Einheit und bei TrainingPeaks.
import { describe, it, expect } from 'vitest';
import { toMin, fmtMin, cleanTime, freeSlot, sortRows, busyOf } from '../src/lib/training/zeitplan.js';
import { cleanSession } from '../src/lib/training.js';
import { sessionsFrom } from '../src/lib/trainingpeaks.js';

describe('Zeitplan', () => {
  it('liest und schreibt Uhrzeiten', () => {
    expect(toMin('07:30')).toBe(450);
    expect(toMin('24:00')).toBeNull();
    expect(toMin('7:30')).toBeNull();
    expect(fmtMin(450)).toBe('07:30');
    expect(cleanTime('18:05')).toBe('18:05');
    expect(cleanTime('abc')).toBe('');
  });
  it('findet die längste freie Lücke zwischen 07:00 und 21:00', () => {
    expect(freeSlot([])).toEqual({ from: 420, to: 600 }); // at most three hours shown
    expect(freeSlot([], { max: 2000 })).toEqual({ from: 420, to: 1260 });
    // 07:00 Yoga 60 min, 09:30 Kraft 45 min → 10:15–21:00 ist am längsten
    expect(freeSlot([{ from: 420, to: 480 }, { from: 570, to: 615 }])).toEqual({ from: 615, to: 795 });
    // ein Termin mitten am Tag: die längere Seite gewinnt, bei Gleichstand die erste
    expect(freeSlot([{ from: 840, to: 900 }])).toEqual({ from: 420, to: 600 });
    expect(freeSlot([{ from: 600, to: 660 }])).toEqual({ from: 660, to: 840 });
    expect(freeSlot([{ from: 420, to: 1260 }])).toBeNull();
    // Lücken unter einer Stunde zählen nicht
    expect(freeSlot([{ from: 420, to: 1230 }])).toBeNull();
  });
  it('sortiert nach Zeit, ohne Zeit zuletzt', () => {
    const rows = [{ id: 'a', time: '' }, { id: 'b', time: '18:00' }, { id: 'c', time: '07:00' }];
    expect(sortRows(rows).map((r) => r.id)).toEqual(['c', 'b', 'a']);
  });
  it('zählt nur Zeilen mit Zeit und Dauer als belegt', () => {
    expect(busyOf([{ time: '10:00', mins: 60 }, { time: '', mins: 30 }, { time: '12:00', mins: 0 }])).toEqual([{ from: 600, to: 660 }]);
  });
  it('die Einheit behält ihre Zeit, eine ungültige fällt weg', () => {
    expect(cleanSession({ day: '2026-11-23', kind: 'bike', mins: 60, time: '07:00' }).time).toBe('07:00');
    expect(cleanSession({ day: '2026-11-23', kind: 'bike', mins: 60, time: '7 Uhr' }).time).toBeUndefined();
    expect(cleanSession({ day: '2026-11-23', kind: 'bike', mins: 60 }).time).toBeUndefined();
  });
  it('TrainingPeaks bringt die Startzeit mit, ein ganztägiger Eintrag keine', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:a1', 'SUMMARY:Intervalle Z4', 'DTSTART:20261123T180000', 'DTEND:20261123T190000', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:a2', 'SUMMARY:Rest day 1h', 'DTSTART;VALUE=DATE:20261124', 'DESCRIPTION:Duration: 1:00', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const { sessions } = sessionsFrom(ics, '2026-11-21');
    expect(sessions.find((s) => s.day === '2026-11-23').time).toBe('18:00');
    expect(sessions.find((s) => s.day === '2026-11-24')?.time).toBeUndefined();
  });
});
