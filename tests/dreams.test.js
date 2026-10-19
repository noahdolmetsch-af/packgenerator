// Paket N: Touren › Träume — dream tours, the year band with season windows (suggested by kind, 2b),
// kinds as groups (add, rename, delete), races from Inspiration and the calendar as event trips. Fictional data.
import { describe, it, expect } from 'vitest';
import { KINDS, seasonText, storeOf, guessKind, monthsOf, toggleMonth, resetMonths, suggested, newDream, yearBand, nextWindow, suggestStart, daysUntil, moveDream, dreamList, plannableRaces, raceDays, raceEvent, deadlines, addKind, renameKind, deleteKind, kindName } from '../src/lib/dreams.js';

const P = 'test_data_gtp_';
const today = '2026-10-19';

describe('dreams and seasons', () => {
  it('guesses the kind from the title and suggests its months', () => {
    expect(guessKind(`${P} Furka und Grimsel`)).toBe('alps');
    expect(guessKind(`${P} Sardinien Rundtour`)).toBe('south');
    expect(guessKind(`${P} irgendwas`)).toBe('other');
    const d = newDream({ title: `${P} Furka Pass` }, { id: 'd1', now: 'x' });
    expect(d).toMatchObject({ id: 'd1', kind: 'alps', days: 2 });
    expect(monthsOf(d)).toEqual([7, 8, 9]);
    expect(suggested(d)).toBe(true);
  });

  it('changes months per dream, never to none, and goes back to the suggestion', () => {
    const d = newDream({ title: `${P} Jura` }, { id: 'd' });
    const own = toggleMonth(d, 10);
    expect(monthsOf(own)).toEqual([5, 6, 7, 8, 9]);
    expect(suggested(own)).toBe(false);
    const one = { ...d, months: [6] };
    expect(monthsOf(toggleMonth(one, 6))).toEqual([6]);
    expect(monthsOf(resetMonths(own))).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it('the year band puts each open dream in its months', () => {
    const band = yearBand([{ id: 'a', kind: 'alps' }, { id: 'b', kind: 'south' }, { id: 'c', kind: 'alps', tripId: 't' }]);
    expect(band.map((m) => m.dreams.map((d) => d.id).join(''))).toEqual(['b', 'b', 'b', 'b', '', '', 'a', 'a', 'a', 'b', 'b', 'b']);
  });

  it('the next window and a start date: the first Saturday after today', () => {
    expect(nextWindow({ kind: 'alps' }, today)).toEqual({ ym: '2027-07', now: false });
    expect(nextWindow({ kind: 'south' }, today)).toEqual({ ym: '2026-10', now: true });
    expect(suggestStart({ kind: 'alps' }, today)).toBe('2027-07-03');
    expect(suggestStart({ kind: 'south' }, today)).toBe('2026-10-24');
    expect(suggestStart({ raceDate: '2026-11-07' }, today)).toBe('2026-11-07');
    expect(daysUntil('2026-10-26', today)).toBe(7);
  });

  it('orders dreams; a dream that became a trip goes to the end', () => {
    const ds = [{ id: 'a', tripId: 't' }, { id: 'b' }, { id: 'c' }];
    expect(dreamList(ds).map((d) => d.id)).toEqual(['b', 'c', 'a']);
    expect(moveDream(ds, 1, 0).map((d) => d.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('kinds of tour are groups', () => {
  it('Standard kinds when nothing is stored; own kinds kept as typed', () => {
    const s = storeOf(null);
    expect(s.kinds.map((k) => k.key)).toEqual(KINDS.map((k) => k.key));
    const k = addKind(s.kinds, `${P} Velo-Ferien`, { id: 'own1', months: [7] });
    expect(kindName(k, 'own1', (x) => `T:${x}`)).toBe(`${P} Velo-Ferien`);
    expect(kindName(k, 'alps', (x) => `T:${x}`)).toBe('T:Alpine passes');
    expect(kindName(k, '', (x) => x)).toBe('No kind of tour');
  });
  it('rename and back to the Standard name', () => {
    const k = renameKind(storeOf(null).kinds, 'alps', `${P} Pässe`);
    expect(k.find((x) => x.key === 'alps')).toMatchObject({ name: `${P} Pässe`, raw: true });
    expect(renameKind(k, 'alps', '').find((x) => x.key === 'alps').raw).toBeUndefined();
  });
  it('delete: dreams keep the months and go to «No kind» or another kind', () => {
    const s = { ...storeOf(null), dreams: [{ id: 'a', kind: 'alps' }, { id: 'b', kind: 'south', months: [1] }] };
    const out = deleteKind(s, 'alps');
    expect(out.kinds.some((k) => k.key === 'alps')).toBe(false);
    expect(out.dreams[0]).toMatchObject({ kind: '', months: [7, 8, 9] });
    expect(deleteKind(s, 'alps', 'hills').dreams[0].kind).toBe('hills');
    expect(guessKind('Furka', out.kinds)).toBe('other');
  });
});

describe('races as event trips', () => {
  const links = [
    { id: 'r1', kind: 'race', title: `${P} Gravel Race`, url: 'https://example.org/race', raceDate: '2026-11-07', raceEnd: '2026-11-08' },
    { id: 'r2', kind: 'race', title: `${P} Old Race`, raceDate: '2026-05-01' },
    { id: 'x', kind: 'rig', title: `${P} Rig` },
  ];
  const events = [
    { id: 'c|e1', gid: 'e1', title: `${P} Velomarathon`, day: '2026-12-01' },
    { id: 'c|e2', gid: 'e2', title: `${P} Zahnarzt`, day: '2026-11-01' },
    { id: 'c|e3', gid: 'e3', title: `${P} Gran Fondo`, day: '2026-11-20' },
  ];
  it('lists upcoming races from Inspiration and the calendar, earliest first, without planned ones', () => {
    const r = plannableRaces({ links, events, trips: [{ id: 't', event: { source: 'calendar', ref: 'e3' } }] }, today);
    expect(r.map((x) => x.key)).toEqual(['inspo:r1']);
    const all = plannableRaces({ links, events: [{ ...events[0], title: `${P} Radrennen` }, events[2]] }, today);
    expect(all.map((x) => x.key)).toEqual(['inspo:r1', 'calendar:e3', 'calendar:e1']);
    expect(raceDays(all[0])).toBe(2);
    expect(raceEvent(all[0], { signupBy: '2026-10-30' })).toEqual({ name: `${P} Gravel Race`, source: 'inspo', ref: 'r1', signupBy: '2026-10-30', url: 'https://example.org/race' });
  });
  it('registration deadlines: upcoming, not signed up, earliest first', () => {
    const trips = [
      { id: 'a', title: 'A', event: { signupBy: '2026-10-30' } },
      { id: 'b', title: 'B', event: { signupBy: '2026-10-21' } },
      { id: 'c', title: 'C', event: { signupBy: '2026-10-01' } },
      { id: 'd', title: 'D', event: { signupBy: '2026-10-25', signedUp: true } },
    ];
    expect(deadlines(trips, today)).toEqual([{ tripId: 'b', title: 'B', signupBy: '2026-10-21', days: 2 }, { tripId: 'a', title: 'A', signupBy: '2026-10-30', days: 11 }]);
  });
});

describe('seasonText', () => {
  it('writes months as short ranges, also over the new year', () => {
    const n = (m) => String(m);
    expect(seasonText([7, 8, 9], n)).toBe('7–9');
    expect(seasonText([10, 11, 12, 1, 2], n)).toBe('10–2');
    expect(seasonText([5, 7], n)).toBe('5, 7');
    expect(seasonText([], n)).toBe('');
    expect(seasonText([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], n)).toBe('1–12');
  });
});
