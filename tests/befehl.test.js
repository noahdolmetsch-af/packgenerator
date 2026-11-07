// «Mit der App sprechen», Etappe 2 (Noah 07.11.2026 «1b 2a 3a 4a 5a»): what the app does with Gemini's actions.
// Fictional bikes only.
import { describe, it, expect, vi } from 'vitest';
import { looksLikeCommand, contextOf, fromAi, askCommand } from '../src/lib/suche/befehl.js';

const bikes = [
  { id: 'b1', name: 'Gravel Grau' },
  { id: 'b2', name: 'Renner Rot' },
];
const today = '2026-11-07';

describe('looksLikeCommand', () => {
  it('an instruction of three words or more, not a question', () => {
    expect(looksLikeCommand('Trag mir das Pumpen auf Freitag ein')).toBe(true);
    expect(looksLikeCommand('Wie viele km diese Woche')).toBe(false);
    expect(looksLikeCommand('Was ist am Velo fällig?')).toBe(false);
    expect(looksLikeCommand('Kette')).toBe(false);
    expect(looksLikeCommand('x '.repeat(150))).toBe(false);
  });
});

describe('the context for Gemini (4a)', () => {
  it('holds today and only the names of bikes and trips', () => {
    const c = contextOf({ today, bikes: [{ id: 'b1', name: 'Gravel Grau', model: 'Geheim', notes: 'privat' }], trips: [{ id: 't1', name: 'Jura', startDate: '2026-12-01', notes: 'privat' }] });
    expect(c).toBe('today: 2026-11-07\nbikes: Gravel Grau\ntrips: Jura');
    expect(c).not.toContain('privat');
  });
});

describe('fromAi', () => {
  it('a list, a to-do with a day, a note, a value', () => {
    const steps = fromAi(
      [
        { kind: 'list', name: 'To-do', points: ['aufräumen', 'Kette wachsen'] },
        { kind: 'todo', text: 'reifen pumpen', due: '2026-11-13' },
        { kind: 'note', text: 'Bremse quietscht' },
        { kind: 'value', valueKind: 'weight', value: 72.5 },
      ],
      { today, bikes },
    );
    expect(steps.map((s) => s.act)).toEqual([
      { kind: 'list', name: 'To-do', points: ['Aufräumen', 'Kette wachsen'], writes: true },
      { kind: 'remind', text: 'Reifen pumpen', due: '2026-11-13', writes: true },
      { kind: 'cmd', cmd: { kind: 'note', text: 'Bremse quietscht' }, writes: true },
      { kind: 'value', qid: 'koerper.waage', value: 72.5, unit: 'kg', writes: true },
    ]);
  });
  it('checks every value again: a past day is no reminder day, a weight of 7 kg is dropped, unknown kinds too', () => {
    const steps = fromAi([{ kind: 'todo', text: 'Pumpen', due: '2026-01-01' }, { kind: 'value', valueKind: 'weight', value: 7 }, { kind: 'delete', text: 'alles' }, { kind: 'todo', text: '' }], { today, bikes });
    expect(steps.map((s) => s.act)).toEqual([{ kind: 'remind', text: 'Pumpen', due: null, writes: true }]);
  });
  it('bike care: one bike by name runs, two ask «Which bike?», none is dropped', () => {
    const one = fromAi([{ kind: 'care', careKind: 'chain', bike: 'Gravel' }], { today, bikes });
    expect(one).toHaveLength(1);
    expect(one[0].choices).toBeUndefined();
    expect(one[0].act.cmd).toEqual({ kind: 'chain', bikeId: 'b1' });
    const two = fromAi([{ kind: 'care', careKind: 'wash', bike: '' }], { today, bikes });
    expect(two[0].choices.map((c) => c.cmd.bikeId)).toEqual(['b1', 'b2']);
    expect(fromAi([{ kind: 'care', careKind: 'chain', bike: 'Tandem' }], { today, bikes })).toEqual([]);
    expect(fromAi([{ kind: 'care', careKind: 'chain', bike: '' }], { today, bikes: [] })).toEqual([]);
  });
  it('a plan and the weather only open their page (they write nothing)', () => {
    const s = fromAi([{ kind: 'plan', title: 'jura', days: 99, start: '2026-11-14' }, { kind: 'weather', place: 'Chur' }], { today, bikes });
    expect(s[0].act).toEqual({ kind: 'plan', days: 30, title: 'Jura', start: '2026-11-14', writes: false });
    expect(s[1].act).toEqual({ kind: 'weather', place: 'Chur', writes: false });
  });
  it('not a list at all gives no steps', () => {
    expect(fromAi(undefined, { today, bikes })).toEqual([]);
    expect(fromAi('x', { today, bikes })).toEqual([]);
  });
});

describe('askCommand', () => {
  it('sends mode command and turns the answer into steps; an error comes back as it is', async () => {
    const calls = [];
    const fetchFn = vi.fn(async (url, init) => {
      calls.push(JSON.parse(init.body));
      return Response.json({ ok: true, task: 'gemini', result: { text: JSON.stringify({ actions: [{ kind: 'list', name: 'To-do', points: ['A'] }] }) } });
    });
    // no helper code on this device: askGemini says «off» before any request
    const r = await askCommand('Erstelle eine Liste mit A', { today, bikes }, { fetchFn });
    expect(r).toEqual({ ok: false, error: 'off' });
    expect(calls).toHaveLength(0);
  });
});
