// «Eishockey aus Spielerplus» (Noah 23.11.2026 «1a», Thread «Wochenplan-Vorschläge verlässlich machen»): sind die Termine des
// Teamkalenders verbunden, sind sie das Eishockey der Woche; der Plan setzt keins dazu. Made-up data only. Pure functions.
import { describe, it, expect } from 'vitest';
import { planOf, planWeek, teamWeek } from '../src/lib/training/wochenplan.js';
import { teamSessions, prefsOf } from '../src/lib/spielerplus.js';
import { plannerSessions } from '../src/lib/training.js';

const MON = '2026-11-23'; // winter
const cfg = planOf(null).winter;
const LINK = 'https://www.spielerplus.de/events/ics?t=abc123&u=def456';
const cal = (events, o = {}) => ({ cals: [{ id: 'c1', name: 'Testteam', url: LINK, on: true, act: 'hockey', fetchedAt: '2026-11-23T08:00:00.000Z', error: '', events, ...o }] });
const ev = (id, day, from, to, title = 'Training') => ({ id, title, day, lastDay: day, allDay: !from, from, to, where: '', link: '' });
const hockeyUnits = (r) => r.units.filter((u) => u.type === 'hockey');

describe('teamSessions: wann der Teamkalender zählt', () => {
  it('ohne Kalender, ausgeschaltet oder nie geholt: nichts (der Plan behält sein Eishockey)', () => {
    expect(teamSessions(prefsOf(null))).toEqual([]);
    expect(teamSessions(prefsOf(cal([ev('a', '2026-11-24', '20:30', '22:00')], { on: false })))).toEqual([]);
    expect(teamSessions(prefsOf(cal([ev('a', '2026-11-24', '20:30', '22:00')], { fetchedAt: null })))).toEqual([]);
  });
  it('ein Kalender einer anderen Sportart zählt nicht', () => {
    expect(teamSessions(prefsOf(cal([ev('a', '2026-11-24', '20:30', '22:00')], { act: 'tennis' })))).toEqual([]);
  });
  it('verbunden: ein Marker und jeder Termin mit Tag, Zeit und Dauer', () => {
    const s = teamSessions(prefsOf(cal([ev('a', '2026-11-24', '20:30', '22:00'), ev('b', '2026-11-28', '18:00', null, 'Spiel')])));
    expect(s[0]).toMatchObject({ team: 'on' });
    expect(s.slice(1)).toMatchObject([{ team: 'date', day: '2026-11-24', time: '20:30', mins: 90 }, { team: 'date', day: '2026-11-28', time: '18:00', mins: 0 }]);
  });
});

describe('Wochenplan: das Eishockey der Woche', () => {
  it('ohne Teamkalender bleibt es beim Standard: genau 1× Eishockey, Sonntag', () => {
    const r = planWeek(cfg, { monday: MON });
    expect(hockeyUnits(r)).toHaveLength(1);
    expect(hockeyUnits(r)[0]).toMatchObject({ d: 6, t: '08:00' });
  });
  it('mit Teamkalender: keine eigene Einheit, die Termine stehen fest in der Woche', () => {
    const sp = teamSessions(prefsOf(cal([ev('a', '2026-11-24', '20:30', '22:00'), ev('b', '2026-11-28', '18:00', '19:30', 'Spiel')])));
    const r = planWeek(cfg, { monday: MON, sessions: plannerSessions(null, sp) });
    expect(hockeyUnits(r)).toHaveLength(0);
    expect(r.team.map((x) => [x.d, x.t, x.mins])).toEqual([[1, '20:30', 90], [5, '18:00', 90]]);
    expect(r.notes).toContainEqual({ key: 'team-in', n: 2 });
  });
  it('eine Woche ohne Termin hat kein Eishockey', () => {
    const sp = teamSessions(prefsOf(cal([ev('a', '2026-12-01', '20:30', '22:00')])));
    const r = planWeek(cfg, { monday: MON, sessions: plannerSessions(null, sp) });
    expect(hockeyUnits(r)).toHaveLength(0);
    expect(r.team).toEqual([]);
    expect(r.notes).toContainEqual({ key: 'team-none' });
  });
  it('die Termine zählen für Härte und Überschneidung: nichts Freies liegt auf dem Spiel', () => {
    const sp = teamSessions(prefsOf(cal([ev('b', '2026-11-28', '10:00', '11:30', 'Spiel')])));
    const r = planWeek(cfg, { monday: MON, sessions: plannerSessions(null, sp) });
    const sat = r.units.filter((u) => u.d === 5 && u.start < 11 * 60 + 30 && u.end > 10 * 60 && u.type !== 'tennis'); // Tennis am Samstag 10:00 ist fest und wird gemeldet
    expect(sat).toEqual([]);
    expect(r.warnings.some((w) => w.key === 'overlap' && w.d === 5)).toBe(true);
  });
  it('Skitour-Woche: ein Spiel am Samstag schiebt die Tour auf den Sonntag', () => {
    const sp = teamSessions(prefsOf(cal([ev('b', '2026-11-28', '18:00', '19:30', 'Spiel')])));
    const r = planWeek(cfg, { monday: MON, ski: true, sessions: plannerSessions(null, sp) });
    expect(r.units.find((u) => u.type === 'ski').d).toBe(6);
  });
  it('teamWeek: Termine ausserhalb der Woche und ohne Tag fallen weg', () => {
    const w = teamWeek([{ team: 'on' }, { team: 'date', id: 'x', day: '2026-12-08', time: '10:00', mins: 60 }, { team: 'date', id: 'y', day: 'kaputt' }], MON);
    expect(w).toEqual({ on: true, dates: [] });
  });
});
