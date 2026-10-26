// Velo-Ideen 71–76 (996 Ideen, Noah 25.10.2026), the small ones: 72 fehlende km nachtragen,
// 73 Setup zurückbauen, 74 Sturz oder Geräusch → Teil «prüfen». Fictional data only.
import { describe, it, expect } from 'vitest';
import { kmGap, GAP_KM } from '../src/lib/kmgap.js';
import { makeEntry } from '../src/lib/kmbook.js';
import { fitSnapshot, makeSaved, savedCount, savedDiff, restoreChanges, MAX_PHOTOS } from '../src/lib/bikes/rueckbau.js';
import { newLogEntry } from '../src/lib/rig.js';
import { wearRows, flagChange, flagOf, FLAG_KINDS } from '../src/lib/wear.js';
import { guessPart, linesOf, splitLine, storeLines, splitSummary, assigned, JOBS } from '../src/lib/werkstatt/split.js';
import { roundsOf, roundsFor, fromIdea, fromVisit, addRow, editRow, dropRow, moveRow, moveRound, runEntries, materialState, ROUND_IDEAS } from '../src/lib/werkstatt/rounds.js';
import de from '../src/lib/i18n/de/veloideen.js';
import DE from '../src/lib/i18n/de/index.js';

const ride = (km, date) => makeEntry({ bikeId: 'b1', date, km, kind: 'ride', source: 'hand', by: 'user', sure: 'user' });

describe('72 Fehlende Kilometer nachtragen', () => {
  const entries = [makeEntry({ bikeId: 'b1', date: '2026-01-10', km: 1000, kind: 'start', source: 'hand' }), ride(42, '2026-03-01')];

  it('a small step asks nothing', () => {
    expect(kmGap(entries, 'b1', 1042)).toBeNull();
    expect(kmGap(entries, 'b1', 1042 + GAP_KM - 1)).toBeNull();
  });
  it('many km more: asks where they come from, with the day of the last entry', () => {
    expect(kmGap(entries, 'b1', 1242)).toEqual({ kind: 'more', diff: 200, exact: 1042, since: '2026-03-01' });
  });
  it('fewer km: most often a typo', () => {
    expect(kmGap(entries, 'b1', 942)).toMatchObject({ kind: 'less', diff: -100 });
  });
  it('a bike without ledger and a bad number ask nothing', () => {
    expect(kmGap(entries, 'b2', 5000)).toBeNull();
    expect(kmGap(entries, 'b1', Number.NaN)).toBeNull();
  });
});

describe('73 Setup zurückbauen', () => {
  const bike = { id: 'b1', fit: { seatHeight: 742, pressureF: 2.4 }, parts: [{ key: 'crank', attrs: { length: 172.5 } }] };

  it('keeps every measure, also the empty ones', () => {
    const snap = fitSnapshot(bike);
    expect(snap.seatHeight).toBe(742);
    expect(snap.crankLength).toBe(172.5);
    expect(snap.barWidth).toBeNull();
    expect(savedCount(snap)).toBe(3);
  });
  it('keeps at most three photos, nothing when there is nothing', () => {
    const s = makeSaved(bike, ['a', 'b', 'c', 'd'], '2026-04-02');
    expect(s.photos).toHaveLength(MAX_PHOTOS);
    expect(s.at).toBe('2026-04-02');
    expect(makeSaved({ id: 'x' }, [])).toBeNull();
  });
  it('the log entry carries it', () => {
    const saved = makeSaved(bike, []);
    expect(newLogEntry({ date: '2026-04-02', title: 'Saddle up', saved }, { id: 'l1' }).saved).toBe(saved);
    expect('saved' in newLogEntry({ date: '2026-04-02', title: 'x' }, { id: 'l2' })).toBe(false);
  });
  it('shows what differs and brings it back, also on a part and a value set later', () => {
    const snap = fitSnapshot(bike);
    const later = { ...bike, fit: { seatHeight: 750, pressureF: 2.4, barWidth: 440 }, parts: [{ key: 'crank', attrs: { length: 170 } }] };
    expect(savedDiff(later, snap).map((r) => r.key).sort()).toEqual(['barWidth', 'crankLength', 'seatHeight']);
    const patch = restoreChanges(later, snap);
    const back = { ...later, ...patch };
    expect(back.fit).toEqual({ seatHeight: 742, pressureF: 2.4 });
    expect(back.parts.find((p) => p.key === 'crank').attrs.length).toBe(172.5);
    expect(savedDiff(back, snap)).toEqual([]);
  });
});

describe('74 Sturz oder Geräusch', () => {
  const chain = { key: 'chain', model: 'Fictional 11', history: [{ date: '2026-01-01', action: 'replace', km: 0, start: true }] };
  const bike = { id: 'b1', km: 300, parts: [chain] };

  it('a flag makes a fine part «soon» with why «flag», and goes again', () => {
    const before = wearRows(bike, { today: '2026-03-01' }).find((r) => r.key === 'chain');
    const { parts } = flagChange(bike.parts, 'chain', { why: 'crash', date: '2026-02-20', note: ' left side ' });
    expect(flagOf(parts[0])).toEqual({ why: 'crash', date: '2026-02-20', note: 'left side' });
    const row = wearRows({ ...bike, parts }, { today: '2026-03-01' }).find((r) => r.key === 'chain');
    expect(row.state).toBe(before.state === 'due' ? 'due' : 'soon');
    expect(row.why).toBe(before.state === 'due' ? before.why : 'flag');
    expect(row.flag.why).toBe('crash');
    const off = flagChange(parts, 'chain', null).parts[0];
    expect('flag' in off).toBe(false);
  });
  it('an unknown kind counts as «something else»', () => {
    expect(flagChange([chain], 'chain', { why: 'zzz' }).parts[0].flag.why).toBe('other');
    expect(FLAG_KINDS.map((k) => k.key)).toEqual(['crash', 'noise', 'other']);
  });
});

describe('71 Quittung aufteilen', () => {
  const names = [{ key: 'chain', words: ['Chain', 'Kette'] }, { key: 'padsR', words: ['Brake pads rear', 'Bremsbeläge hinten'] }, { key: 'brakes', words: ['Bremse'] }];
  const visit = { id: 'v1', parts: [{ what: 'Kette KMC X11', chf: 42 }, { what: 'Service Antrieb', chf: 89 }, { what: 'Bremsbeläge hinten', chf: 28.5, part: 'padsR', action: 'replace' }, { what: 'Kleinmaterial', chf: 6, part: 'other', action: 'replace' }] };

  it('suggests a part from the words, the longest word wins', () => {
    expect(guessPart('Kette KMC X11', names)).toBe('chain');
    expect(guessPart('Bremsbeläge hinten', names)).toBe('padsR');
    expect(guessPart('Service Antrieb', names)).toBeNull();
    const lines = linesOf(visit, names);
    expect(lines[0]).toMatchObject({ part: 'chain', guess: true });
    expect(assigned(lines[1])).toBe(false);
    expect(lines[2].guess).toBeUndefined();
  });
  it('splits a line in two, the price in half by 5 Rappen', () => {
    const two = splitLine(linesOf(visit, names), 1);
    expect(two).toHaveLength(5);
    expect([two[1].chf, two[2].chf]).toEqual([44.5, 44.5]);
    expect(two[2].part).toBe('');
    expect(splitLine([{ what: 'x', chf: 10.15, part: '' }], 0).map((l) => l.chf)).toEqual([5.1, 5.05]);
  });
  it('stores clean lines and says what happens', () => {
    const lines = linesOf(visit, names);
    lines[1] = { ...lines[1], part: 'chain', action: 'service', chf: '89', order: 'chain:now' };
    const stored = storeLines(lines);
    expect(stored[0]).not.toHaveProperty('guess');
    expect(stored[1].chf).toBe(89);
    expect(stored[2]).not.toHaveProperty('order');
    const sum = splitSummary(stored, [{ key: 'chain:now', name: 'Kette wachsen' }, { key: 'repair:3', name: 'Schaltung einstellen' }]);
    expect(sum).toMatchObject({ assigned: 4, total: 4, starts: ['chain', 'padsR'], order: { done: 1, all: 2, open: ['Schaltung einstellen'] }, sum: 165.5 });
    expect(sum.costs).toEqual([{ part: 'chain', chf: 131 }, { part: 'padsR', chf: 28.5 }]);
    expect(JOBS.map((j) => j.key)).toEqual(['replace', 'service', 'check']);
  });
});

describe('76 Werkstatt-Runden', () => {
  let n = 0;
  const newId = () => `id${++n}`;
  it('a suggestion becomes a round with jobs, tools and material', () => {
    const r = fromIdea(ROUND_IDEAS[0], { newId });
    expect(r.name).toBe('After the rain ride');
    expect(r.steps[0]).toMatchObject({ text: 'Clean and oil the chain', part: 'chain', action: 'service' });
    expect(r.tools.map((x) => x.name)).toEqual(['Brush', 'Rag']);
    expect(roundsOf([r, null, { foo: 1 }])).toHaveLength(1);
  });
  it('a round from a workshop visit takes the lines with a part, once each', () => {
    const r = fromVisit({ parts: [{ part: 'chain', action: 'replace', what: 'Kette' }, { part: 'chain', action: 'replace' }, { part: 'other' }, { part: 'padsR', action: 'service' }] }, { name: 'Wie bei X', partName: (k) => k.toUpperCase(), newId });
    expect(r.steps.map((s) => [s.text, s.part, s.action])).toEqual([['Kette', 'chain', 'replace'], ['PADSR', 'padsR', 'service']]);
  });
  it('rows can be added, changed, moved and taken away; rounds moved; bikes chosen', () => {
    let list = [fromIdea(ROUND_IDEAS[1], { newId })];
    const id = list[0].id;
    list = addRow(list, id, 'tools', { id: 'tx', name: '  Inbus  5 ' });
    expect(list[0].tools.at(-1).name).toBe('Inbus 5');
    list = editRow(list, id, 'steps', list[0].steps[0].id, { text: 'Kette wachsen' });
    expect(list[0].steps[0].text).toBe('Kette wachsen');
    list = moveRow(list, id, 'steps', 0, 2);
    expect(list[0].steps[2].text).toBe('Kette wachsen');
    list = dropRow(list, id, 'tools', 'tx');
    expect(list[0].tools.some((x) => x.id === 'tx')).toBe(false);
    const two = [...list, { ...list[0], id: 'r2', bikes: ['b2'] }];
    expect(moveRound(two, 1, 0).map((r) => r.id)).toEqual(['r2', id]);
    expect(roundsFor(roundsOf(two), 'b1').map((r) => r.id)).toEqual([id]);
  });
  it('a finished run gives one part entry per ticked job with a part, as by yourself', () => {
    const r = fromIdea(ROUND_IDEAS[1], { newId });
    const ticked = [r.steps[0].id, r.steps[1].id, r.steps[2].id];
    const out = runEntries(r, ticked, { km: 2600, day: '2026-10-26' });
    expect(out.map((e) => [e.key, e.entry.action, e.entry.result, e.entry.by])).toEqual([
      ['chain', 'service', 'done', 'self'],
      ['chain', 'check', 'ok', 'self'],
      ['padsF', 'check', 'ok', 'self'],
    ]);
    expect(out[0].entry).toMatchObject({ date: '2026-10-26', km: 2600 });
  });
  it('material shows what is at home by the name', () => {
    const r = fromIdea(ROUND_IDEAS[1], { newId });
    expect(materialState(r, [{ name: 'chain oil', left: 1 }, { name: 'Degreaser', left: 0 }]).map((m) => m.left)).toEqual([1, 0, null]);
  });
});

describe('German texts', () => {
  it('every text of the package has a German entry in the app', () => {
    for (const k of Object.keys(de)) expect(DE[k], k).toBeTruthy();
    for (const k of FLAG_KINDS) expect(DE[k.name], k.name).toBeTruthy();
    for (const i of ROUND_IDEAS) for (const w of [i.name, ...i.steps.map((s) => s[0]), ...i.tools, ...i.material]) expect(DE[w], w).toBeTruthy();
    for (const j of JOBS) expect(DE[j.name], j.name).toBeTruthy();
  });
});
