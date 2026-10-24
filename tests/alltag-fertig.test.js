// «Alltag fertig bauen» (Klick-Rundgang 22.10.2026): the repairs of Mein Tag, Meine Woche and Velo pflegen
// as pure rules. Fictional data only.
import { describe, it, expect } from 'vitest';
import { answerFor, wearKeys, wearAnswer } from '../src/lib/assistent/answers.js';
import { buildWeek, reviewOf } from '../src/lib/woche.js';
import { fitNow } from '../src/lib/abfragen.js';
import { t } from '../src/lib/i18n.svelte.js';

const row = (key, name, extra = {}) => ({ key, name, state: 'ok', left: 1200, due: '2026-12-01', why: null, ...extra });
const wear = [{ bikeId: 'b1', bikeName: 'Test gravel', rows: [row('chain', 'Chain', { left: 800 }), row('tyres', 'Tyres', { left: 2000 })] }];

describe('Assistent: wear questions answered from the own data (H25)', () => {
  it('finds the part a question is about', () => {
    expect(wearKeys('wann muss ich die kette wechseln?')).toEqual(['chain']);
    expect(wearKeys('wie lange haelt das kettenblatt noch')).toEqual(['chainring']);
    expect(wearKeys('when do i change the brake pads')).toEqual(['padsF', 'padsR']);
    expect(wearKeys('wie ist der verschleiss')).toEqual(['*']);
    expect(wearKeys('wie viele km diesen monat')).toEqual([]);
  });
  it('answers with the km left and the day, the most urgent first', () => {
    const a = answerFor('Wann muss ich die Kette wechseln?', { today: '2026-10-22', wear });
    expect(a.kind).toBe('wear');
    expect(a.title).toBe(t('Next change: {part} on {bike}, in about {km} km.', { part: 'Chain', bike: 'Test gravel', km: '800' }));
    expect(a.lines).toHaveLength(1);
    expect(a.link.href).toContain('view=wear');
  });
  it('says a part is due now, and when the km are missing', () => {
    const due = wearAnswer(['chain'], [{ bikeId: 'b1', bikeName: 'Test gravel', rows: [row('chain', 'Chain', { state: 'due', why: 'km', left: -50 })] }]);
    expect(due.title).toBe(t('Change now: {part} on {bike}.', { part: 'Chain', bike: 'Test gravel' }));
    expect(wearAnswer(['cassette'], wear).title).toBe(t('No km recorded for this part yet.'));
  });
});

describe('Woche: what was ticked in Aktiv shows (H22)', () => {
  const base = { monday: '2026-10-19', today: '2026-10-22', actName: (id) => `act ${id}` };
  it('one done entry per activity and day, counted in the sessions', () => {
    const w = buildWeek({ ...base, flowLog: [{ id: 'l1', actId: 'tennis', day: '2026-10-19', n: 1, min: 60 }, { id: 'l2', actId: 'tennis', day: '2026-10-19', n: 1 }, { id: 'l3', actId: 'run', day: '2026-10-30', n: 1 }] });
    const mon = w.days[0].entries.filter((e) => e.kind === 'sport');
    expect(mon).toHaveLength(1);
    expect(mon[0]).toMatchObject({ title: 'act tennis', done: true });
    expect(w.sums.sessions).toBe(1);
    expect(w.sums.mins).toBe(60);
  });
  it('a planned Aktiv date of the same activity counts as done, not twice', () => {
    const w = buildWeek({ ...base, plans: [{ day: '2026-10-20', actId: 'yoga' }], flowLog: [{ id: 'l1', actId: 'yoga', day: '2026-10-20', n: 1 }] });
    const tue = w.days[1].entries.filter((e) => e.kind === 'sport');
    expect(tue).toHaveLength(1);
    expect(tue[0].done).toBe(true);
  });
  it('last week counts rides by hand or from a file too', () => {
    const r = reviewOf({ monday: '2026-10-19', book: [{ kind: 'ride', state: 'counted', source: 'hand', date: '2026-10-14', km: 46 }, { kind: 'ride', state: 'counted', source: 'strava', date: '2026-10-15', km: 30 }] });
    expect(r).toMatchObject({ rides: 1, km: 46 });
  });
});

describe('Morgen-Check fits the time of day (H15)', () => {
  const eve = { q: { id: 'raeuber' }, slot: '2026-10-17T20:30', last: '2026-10-21T20:30' };
  const morning = { q: { id: 'schlaf' }, slot: '2026-10-22T07:00', last: '2026-10-22T07:00' };
  it('a missed evening question stays at night and in the morning, with its own time (Noah 2a)', () => {
    expect(fitNow([eve, morning], '2026-10-22T02:41').map((d) => [d.q.id, d.slot])).toEqual([['raeuber', '2026-10-17T20:30'], ['schlaf', '2026-10-22T07:00']]);
  });
  it('in the evening it asks about today, not about a missed day', () => {
    const today = { ...eve, last: '2026-10-22T20:30' };
    expect(fitNow([today], '2026-10-22T20:45')[0].slot).toBe('2026-10-22T20:30');
  });
});

describe('texts: one dot, not two (H14)', () => {
  it('a value ending with a dot before the sentence dot', () => {
    expect(t('«{name}» planned for {day}.', { name: 'X', day: 'Sa 24.' })).toBe('«X» planned for Sa 24.');
    expect(t('{n} km.', { n: 5 })).toBe('5 km.');
  });
});
