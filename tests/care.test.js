import { describe, it, expect } from 'vitest';
import { defaultParts, wear, checkState, serviceDue, logPart, replaceHint, prepFor, prepParts, prepSummary, toReview, taskBike, wishFor } from '../src/lib/care.js';

const entry = (km, extra) => ({ date: '2026-10-01', km, value: null, action: 'check', result: 'ok', by: 'self', ...extra });

describe('bike care', () => {
  it('gives suspension parts only to bikes with suspension', () => {
    const keys = (type) => defaultParts({ type }).map((p) => p.key);
    expect(keys('Hardtail')).toContain('fork');
    expect(keys('Hardtail')).not.toContain('shock');
    expect(keys('Full suspension')).toContain('shock');
    expect(keys('Road / gravel')).not.toContain('fork');
  });

  it('reads chain wear and pad wear the right way round', () => {
    const chain = (v) => ({ key: 'chain', history: [entry(0, { value: v })] });
    expect(wear(chain(0.3))).toBe('ok');
    expect(wear(chain(0.4))).toBe('warn');
    expect(wear(chain(0.5))).toBe('worn');
    expect(wear({ key: 'padsF', history: [entry(0, { value: 45 })] })).toBe('worn');
    expect(wear({ key: 'padsF', history: [] })).toBe(null);
    expect(replaceHint(chain(0.8))).toMatch(/cassette/);
  });

  it('makes the 1000 km check due per part and the chain wax every 150 km', () => {
    let parts = defaultParts({ type: 'Hardtail' });
    parts = logPart(parts, 'chain', entry(1000, { action: 'service', result: 'done' }));
    parts = logPart(parts, 'padsF', entry(1900));
    const bike = { km: 2100, parts };
    const c = checkState(bike);
    expect(c.rows.find((r) => r.key === 'chain')).toMatchObject({ since: 1100, due: true });
    expect(c.rows.find((r) => r.key === 'padsF')).toMatchObject({ since: 200, due: false });
    expect(c.rows.find((r) => r.key === 'tyres').unknown).toBe(true);
    expect(serviceDue(bike).map((s) => s.key)).toEqual(['chain']);
    expect(checkState({ parts }).due).toBe(0); // no km: nothing can be due
  });

  it('dates preparation tasks before a trip and links them to parts', () => {
    const tasks = [
      { id: 23, area: 'Preparation', leadWeeks: 2, task: 'Check brake pads are above 50 %, replace if not, take spares' },
      { id: 29, area: 'Preparation', leadWeeks: 0.4, task: 'Clean or wax the chain, wash the bike, lube the chain' },
      { id: 1, area: 'Bike', subject: 'Hardtail', status: 'check', task: 'Shifting' },
    ];
    const rows = prepFor({ startDate: '2026-10-15', prep: { 29: { result: 'done' } } }, tasks, '2026-10-04');
    expect(rows.map((r) => [r.task.id, r.due, r.overdue, r.finished])).toEqual([
      [23, '2026-10-01', true, false],
      [29, '2026-10-12', false, true],
    ]);
    expect(prepParts(tasks[0])).toEqual(['padsF', 'padsR']);
    expect(toReview(tasks).map((t) => t.id)).toEqual([1]);
    expect(taskBike(tasks[2])).toBe('scott-hardtail');
  });

  it('puts a part that needs replacing on the wishlist once', () => {
    const bike = { name: 'Scott Scale' };
    const part = { key: 'chain', model: 'SRAM GX Eagle' };
    const wish = wishFor(part, bike, [], 'BK20');
    expect(wish).toMatchObject({ id: 'BK20', name: 'Chain (Scott Scale)', model: 'SRAM GX Eagle', ownership: 'wishlist' });
    expect(wishFor(part, bike, [wish], 'BK21')).toBe(null);
  });
});

describe('bike care log', () => {
  it('lists parts and finished repairs of one bike, newest first, with tyre values', async () => {
    const { bikeLog, logPart, defaultParts } = await import('../src/lib/care.js');
    let parts = defaultParts({ type: 'Hardtail' });
    parts = logPart(parts, 'tyres', { date: '2026-09-01', km: 100, action: 'service', result: 'done', pressureF: 1.6, sealantMl: 30 });
    parts = logPart(parts, 'rotorF', { date: '2026-10-02', km: 200, action: 'check', result: 'ok', value: 1.7, limit: 1.55 });
    expect(parts.find((p) => p.key === 'rotorF').limit).toBe(1.55);
    const tasks = [{ id: 1, area: 'Bike', subject: 'Hardtail', status: 'done', statusDate: '2026-10-03', task: 'Inner bar ends' }];
    const log = bikeLog({ id: 'scott-hardtail', parts }, tasks);
    expect(log.map((h) => h.what)).toEqual(['Inner bar ends', 'Brake rotor front', 'Tyres + sealant']);
    expect(log[2]).toMatchObject({ pressureF: 1.6, sealantMl: 30 });
    expect('limit' in log[1]).toBe(false);
  });
});

import { tripPrep } from '../src/lib/workshop.js';
describe('care before a trip', () => {
  it('lists unfinished preparation, due checks and open repairs of the bike, overdue first', () => {
    const tasks = [
      { id: 1, area: 'Preparation', task: 'Check chain wear', leadWeeks: 2 },
      { id: 2, area: 'Preparation', task: 'Pump tyres', leadWeeks: 0 },
      { id: 3, area: 'Bike', subject: 'Hardtail', task: 'Fix shifting', status: 'open' },
      { id: 4, area: 'Bike', subject: 'Factor', task: 'Other bike', status: 'open' },
    ];
    const trip = { id: 't', startDate: '2026-10-15', bikeId: 'scott-hardtail', prep: { 2: { result: 'ok' } } };
    const bike = { id: 'scott-hardtail', parts: [] };
    const rows = tripPrep(bike, trip, tasks, undefined, '2026-10-04').rows;
    expect(rows.map((r) => r.name)).toEqual(['Check chain wear', 'Fix shifting']);
    expect(tripPrep(bike, trip, tasks, undefined, '2026-10-10').rows[0]).toMatchObject({ name: 'Check chain wear', late: true });
  });

  it('counts the Excel preparation tasks for one grouped row (v0.21.0)', () => {
    const tasks = [
      { id: 1, area: 'Preparation', task: 'Check chain wear', leadWeeks: 2 },
      { id: 2, area: 'Preparation', task: 'Pump tyres', leadWeeks: 0 },
      { id: 3, area: 'Vorbereitung', task: 'Pack bags', leadWeeks: 1 },
      { id: 4, area: 'Bike', subject: 'Hardtail', task: 'Fix shifting', status: 'open' },
    ];
    const trip = { startDate: '2026-10-15', prep: { 2: { result: 'ok' }, 3: { result: 'needed' } } };
    expect(prepSummary(prepFor(trip, tasks, '2026-10-05'))).toEqual({ open: 2, overdue: 1, needed: 1, done: 1, total: 3 });
    expect(prepSummary([])).toEqual({ open: 0, overdue: 0, needed: 0, done: 0, total: 0 });
    const list = tripPrep({ id: 'scott-hardtail', parts: [] }, { ...trip, bikeId: 'scott-hardtail' }, tasks, undefined, '2026-10-10');
    expect(list.rows.filter((r) => r.kind === 'prep').map((r) => r.name)).toEqual(['Check chain wear', 'Pack bags']);
  });
});

import { isRule, prepRules, isEvent } from '../src/lib/care.js';
describe('event preparation only for events (Noah 4b, 2026-10-07)', () => {
  const tasks = [
    { id: 19, area: 'Preparation', task: "Do not change saddle height, cleats or shoes any more ('nothing new')", leadWeeks: 5 },
    { id: 20, area: 'Preparation', task: 'Check chain wear', leadWeeks: 4 },
  ];
  it('a trip that is not an event has no tasks and no rules', () => {
    const trip = { startDate: '2026-10-15', event: false };
    expect(isEvent(trip)).toBe(false);
    expect(prepFor(trip, tasks, '2026-10-04')).toEqual([]);
    expect(prepRules(trip, tasks)).toEqual([]);
  });
  it('an older trip without the switch counts as an event once something was ticked', () => {
    expect(isEvent({ startDate: '2026-10-15' })).toBe(false);
    expect(isEvent({ startDate: '2026-10-15', prep: { 20: { result: 'done' } } })).toBe(true);
    expect(isEvent({ startDate: '2026-10-15', prep: { 20: { result: 'done' } }, event: false })).toBe(false);
  });
});

describe('rules among the preparation tasks', () => {
  it('shows rules as hints, not as tasks', () => {
    const tasks = [
      { id: 19, area: 'Preparation', task: "Do not change saddle height, cleats or shoes any more ('nothing new')", leadWeeks: 5 },
      { id: 20, area: 'Preparation', task: 'Check chain wear', leadWeeks: 4 },
    ];
    expect(isRule(tasks[0])).toBe(true);
    expect(isRule(tasks[1])).toBe(false);
    const trip = { startDate: '2026-10-15', event: true };
    expect(prepFor(trip, tasks, '2026-10-04').map((r) => r.task.id)).toEqual([20]);
    expect(prepRules(trip, tasks)).toEqual([{ task: tasks[0], from: '2026-09-10' }]);
  });
});

// v0.30.1 (Noah's phone test, D1): "km kann nicht gespeichert werden". "2.287" used to be 2 km.
describe('parseKm', () => {
  it('reads km typed the Swiss or German way', async () => {
    const { parseKm } = await import('../src/lib/care.js');
    for (const s of ["2'287", '2’287', '2 287', '2 287', '2.287', '2,287', '2287', ' 2287 km', '2287,4', '2287.4']) expect(parseKm(s), s).toBe(2287);
    expect(parseKm('2287,6')).toBe(2288);
    expect(parseKm('1.234.567')).toBeNaN(); // over 500 000
    expect(parseKm("12'400,5")).toBe(12401);
    expect(parseKm('12.400,5')).toBe(12401);
    expect(parseKm('12,400.5')).toBe(12401);
    expect(parseKm('45,3')).toBe(45);
    expect(parseKm('0')).toBe(0);
    expect(parseKm('')).toBeNull();
    expect(parseKm('  ')).toBeNull();
    for (const s of ['abc', '-5', '12a', '600000']) expect(parseKm(s), s).toBeNaN();
  });
});
