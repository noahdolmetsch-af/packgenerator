// «Eigene Werte und alle Daten anpassbar» (Noah 21.10.2026 «1 a und b 2 a 3a 4a»).
import { describe, it, expect, afterEach } from 'vitest';
import { OWN_FIELDS, normOwn, setOwn, ownName, renameOwn, removeOwn, restoreOwn, goneFields, fieldsIn, moveOwn, moveOwnTo, addMine, updateMine, deleteMine, doneMine, mineFor, mineOf, metaOf } from '../src/lib/ownvalues.js';
import { ownBodyKeys, bodyGroupsWith, ownBodyDays, bodyStats, groupOf, BODY_GROUPS } from '../src/lib/uebersicht.js';
import { APP_LISTS, appLists, setAppList, hasId, offered } from '../src/lib/applists.js';
import { STANDARD_LIST, listFor } from '../src/lib/standard.js';
import { applyLists, addOwn, remove } from '../src/lib/lists.js';
import { kindOf, kindName, kindSpeed, partOn, normTemplates, KINDS } from '../src/lib/bikekind.js';
import { OWN_KINDS, isPointKind, pointKindName } from '../src/lib/map/ownkinds.js';
import { listOf as pointsOf } from '../src/lib/map/ownpoints.js';
import { AWAY_TYPES, isAwayType, awayName } from '../src/lib/woche/away.js';
import { QUESTIONS, questionOf, questionRef, questionText } from '../src/lib/tagebuch/fragen.js';
import { MOODS as J_MOODS, moodName } from '../src/lib/tagebuch/insights.js';
import { MOODS as MED_MOODS, medMoodsOffered } from '../src/lib/flowmed.js';

const tr = (s) => `T:${s}`;
afterEach(() => applyLists({}));

describe('own values: rename, delete, order (Noah «1a»)', () => {
  it('renames a built-in value and an empty name brings the Standard name back', () => {
    const f = OWN_FIELDS[0];
    const r = renameOwn(null, f.key, '  Packen ab ');
    expect(ownName(r, f, tr)).toBe('Packen ab');
    expect(ownName(renameOwn(r, f.key, ''), f, tr)).toBe(`T:${f.name}`);
  });
  it('a deleted value goes from its section, counts with the Standard and comes back', () => {
    const r = removeOwn(setOwn(null, 'packDays', 4), 'packDays');
    expect(normOwn(r).packDays).toBe(2);
    expect(fieldsIn(r, 'pack').map((f) => f.key)).not.toContain('packDays');
    expect(goneFields(r).map((f) => f.key)).toEqual(['packDays']);
    const back = restoreOwn(r, 'packDays');
    expect(fieldsIn(back, 'pack')[0].key).toBe('packDays');
    expect(back).toEqual({});
  });
  it('keeps names, deleted values and order when a number changes (old records stay valid)', () => {
    let r = renameOwn(null, 'coldC', 'Kalt');
    r = moveOwn(r, 'pack', 'coldC', -1);
    r = setOwn(r, 'hotC', 33);
    expect(r.hotC).toBe(33);
    expect(r.names).toEqual({ coldC: 'Kalt' });
    expect(fieldsIn(r, 'pack').map((f) => f.key).slice(0, 2)).toEqual(['coldC', 'packDays']);
    expect(setOwn(null, 'packDays', 3)).toEqual({ packDays: 3 });
  });
  it('drags a value to another place', () => {
    const r = moveOwnTo(null, 'bike', 'backupDays', 0);
    expect(fieldsIn(r, 'bike')[0].key).toBe('checkKm'); // backupDays is in «data», not «bike»
    const r2 = moveOwnTo(null, 'bike', 'forkDays', 0);
    expect(fieldsIn(r2, 'bike')[0].key).toBe('forkDays');
  });
});

describe('own reminders (Noah «2a»)', () => {
  const bikes = [{ id: 'b1', km: 1000 }, { id: 'b2', km: 50 }];
  it('every N km counts from the km of each bike when it was made', () => {
    const { record, id } = addMine(null, { name: 'Bremsbeläge ansehen', every: 500, unit: 'km' }, bikes, '2026-10-01');
    expect(id).toBe('o1');
    const [r] = mineFor(record, { id: 'b1', km: 1600 }, '2026-10-21');
    expect(r).toMatchObject({ since: 600, left: -100, due: true, never: false });
    const [r2] = mineFor(record, { id: 'b2', km: 100 }, '2026-10-21');
    expect(r2).toMatchObject({ since: 50, due: false });
    // a bike added later has no start: «Done» starts it
    const [r3] = mineFor(record, { id: 'b3', km: 7000 }, '2026-10-21');
    expect(r3.never).toBe(true);
    const done = doneMine(record, id, { id: 'b3', km: 7000 }, '2026-10-21');
    expect(mineFor(done, { id: 'b3', km: 7100 }, '2026-10-22')[0]).toMatchObject({ since: 100, due: false });
  });
  it('every N days counts calendar days, «Done» starts again', () => {
    const { record, id } = addMine(null, { name: 'Reifendruck', every: 14, unit: 'days', bike: 'b1' }, bikes, '2026-10-01');
    expect(mineFor(record, { id: 'b2', km: 0 }, '2026-10-21')).toEqual([]); // only for b1
    expect(mineFor(record, { id: 'b1', km: 0 }, '2026-10-15')[0]).toMatchObject({ since: 14, due: true });
    const d = doneMine(record, id, { id: 'b1', km: 0 }, '2026-10-15');
    expect(mineFor(d, { id: 'b1', km: 0 }, '2026-10-20')[0]).toMatchObject({ since: 5, left: 9, due: false });
  });
  it('changes, orders and deletes; broken rows are dropped; numbers stay in range', () => {
    let { record } = addMine(null, { name: 'A', every: 3, unit: 'days' }, [], '2026-10-01');
    ({ record } = addMine(record, { name: 'B', every: 999999, unit: 'km' }, [], '2026-10-01'));
    expect(mineOf(record).map((x) => x.every)).toEqual([3, 100000]);
    record = updateMine(record, 'o1', { name: 'A2', every: 0 });
    expect(mineOf(record)[0]).toMatchObject({ name: 'A2', every: 1 });
    record = moveOwn(record, 'mine', 'o2', -1);
    expect(mineOf(record).map((x) => x.id)).toEqual(['o2', 'o1']);
    record = deleteMine(record, 'o2');
    expect(mineOf(record).map((x) => x.id)).toEqual(['o1']);
    expect(metaOf({ mine: [{ id: 'x' }, null, { id: 'y', name: 'Y', every: 'abc' }] }).mine).toEqual([]);
    expect(addMine(null, { name: ' ', every: 5, unit: 'days' }).id).toBeNull();
  });
});

describe('own body values from own questions (Noah «3a»)', () => {
  const own = [
    { id: 'own-1', text: 'Rücken', form: { kind: 'number', unit: 'Punkte' } },
    { id: 'own-2', text: 'Laune', form: { kind: 'scale' } },
    { id: 'own-3', text: 'Notiz', form: { kind: 'text' } },
  ];
  it('a number or scale question is a value of the group «Eigene»', () => {
    const keys = ownBodyKeys(own);
    expect(keys.map((k) => [k.key, k.name, k.unit])).toEqual([['ab:own-1', 'Rücken', 'Punkte'], ['ab:own-2', 'Laune', '']]);
    expect(keys[1].fixed).toEqual([0, 10]);
    const groups = bodyGroupsWith(keys);
    expect(groups.at(-1)).toMatchObject({ key: 'mine', tabs: ['ab:own-1', 'ab:own-2'] });
    expect(bodyGroupsWith([])).toBe(BODY_GROUPS);
    expect(groupOf('ab:own-1')).toBe('mine');
  });
  it('the day value is the mean of the answers of that day', () => {
    const keys = ownBodyKeys(own);
    const ab = ownBodyDays([{ qid: 'own-1', day: '2026-10-20', value: 2 }, { qid: 'own-1', day: '2026-10-20', value: 5 }, { qid: 'own-1', day: '2026-10-21', value: 'x' }, { qid: 'other', day: '2026-10-21', value: 9 }], keys);
    expect(ab.get('own-1').get('2026-10-20')).toBe(3.5);
    expect(ab.has('other')).toBe(false);
    const s = bodyStats(new Map(), '2026-10-21', 'ab:own-1', 'd7', 0, new Map(), { ab });
    expect(s.mean).toBe(3.5);
    expect(s.n).toBe(1);
  });
});

describe('six more lists in «Listen und Typen» (Noah «4a»)', () => {
  it('every new list is registered and put in place', () => {
    for (const k of APP_LISTS) expect(STANDARD_LIST[k], k).toBeTruthy();
    expect(listFor('pointKinds').map((e) => e.id)).toEqual(OWN_KINDS.map((k) => k.key));
    expect(listFor('bikeKinds').map((e) => e.id)).toEqual(KINDS);
    expect(listFor('awayTypes').map((e) => e.id)).toEqual(AWAY_TYPES);
    expect(listFor('journalQuestions')).toHaveLength(QUESTIONS.length);
    expect(listFor('journalMoods')).toHaveLength(J_MOODS.length);
    expect(listFor('medMoods').map((e) => e.id)).toEqual(MED_MOODS.map((m) => m.id));
    applyLists({});
    for (const k of APP_LISTS) expect(appLists[k]?.length, k).toBeGreaterThan(0);
  });
  it('an own id is kept even before the list has loaded; a typed name never goes through t()', () => {
    setAppList('pointKinds', null);
    expect(hasId('pointKinds', [], 'own-abc')).toBe(true);
    expect(pointsOf({ points: [{ id: 'p', lat: 1, lon: 2, kind: 'own-abc' }, { id: 'q', lat: 1, lon: 2, kind: 'nope' }] }).map((p) => p.kind)).toEqual(['own-abc', 'note']);
    const { value, id } = addOwn({}, { name: 'Brunnen' }, 'own-b');
    applyLists({ pointKinds: value });
    expect(isPointKind(id)).toBe(true);
    expect(pointKindName(id, tr)).toBe('Brunnen');
    expect(pointKindName('water', tr)).toBe('T:Water');
    expect(pointKindName('own-gone', tr)).toBe('T:Note|point');
  });
  it('a deleted Standard kind stays on what has it and is still offered as its current choice', () => {
    const entry = listFor('awayTypes').find((e) => e.id === 'ski');
    applyLists({ awayTypes: remove({}, entry) });
    expect(offered('awayTypes', [], null).map((e) => e.id)).not.toContain('ski');
    expect(isAwayType('ski')).toBe(true);
    expect(awayName('ski', tr)).toBe('T:Ski tour|away');
  });
  it('an own bike kind works like Gravel', () => {
    const { value, id } = addOwn({}, { name: 'Stadtvelo' }, 'own-city');
    applyLists({ bikeKinds: value });
    const bike = { id: 'b', kind: id };
    expect(kindOf(bike)).toBe(id);
    expect(kindName(id, tr)).toBe('Stadtvelo');
    expect(kindSpeed(id)).toBe(20);
    expect(Object.keys(normTemplates({}))).toContain(id);
    expect(partOn({}, id, 'shock')).toBe(partOn({}, 'gravel', 'shock'));
    applyLists({});
    expect(kindOf(bike)).toBe('gravel'); // the own kind is gone: the type decides again
  });
  it('the diary takes its question of the day from your list; old entries keep theirs', () => {
    expect(questionRef('2026-10-21')).toBe(questionOf('2026-10-21'));
    const { value, id } = addOwn({}, { name: 'Was war heute leicht?' }, 'own-q');
    const all = listFor('journalQuestions').filter((e) => !e.own);
    const hideAll = { ...value, hidden: all.map((e) => e.id) };
    applyLists({ journalQuestions: hideAll });
    expect(questionRef('2026-10-21')).toBe(id);
    expect(questionText(id, tr)).toBe('Was war heute leicht?');
    expect(questionText(3, tr)).toBe(`T:${QUESTIONS[3][0]}`);
    applyLists({ journalQuestions: { names: { q3: 'Neu' } } });
    expect(questionText(3, tr)).toBe('Neu');
  });
  it('diary moods are renamed only; meditation moods keep chosen ones that went', () => {
    applyLists({ journalMoods: { names: { m5: 'Mega' } } });
    expect(moodName(5, tr)).toBe('Mega');
    expect(moodName(1, tr)).toBe(`T:${J_MOODS[0].name}`);
    const calm = listFor('medMoods').find((e) => e.id === 'calm');
    applyLists({ medMoods: remove({}, calm) });
    expect(medMoodsOffered([]).map((m) => m.id)).not.toContain('calm');
    expect(medMoodsOffered(['calm']).map((m) => m.id)).toContain('calm');
  });
});
