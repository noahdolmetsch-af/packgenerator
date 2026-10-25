// Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»): the pure parts of Ich › Ruhig und persönlich.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, move, tripEnd } from '../src/lib/ruhig/base.js';
import { kindsOf, addKind, renameKind, dropKind, kindName } from '../src/lib/ruhig/kinds.js';
import { spaceOf, spaceActive, spaceAdd, SPACE_MAX, budgetOf, groupOfKey, applyBudget, notForMeOf, setNotForMe, unsetNotForMe, lastIfNotForMe } from '../src/lib/ruhig/weniger.js';
import { newExp, expEnd, expState, expTick, expProgress, expStop, expReview, expAgain } from '../src/lib/ruhig/versuche.js';
import { newLetter, lettersOf, momentOf, dueLetters, openLetter, replyLetter, storyOf, setLater, ratedDays, DAY_QUESTION } from '../src/lib/ruhig/spaeter.js';
import { meaningsOf, flipMeaning, tripsWith, dropMeaning, bingoOf, addFind, bingoCard, dropBingoKind, rewardsOf, takeReward, decisionList, newDecision } from '../src/lib/ruhig/bedeutung.js';
import { newSkill, addExample, setLevel, skillMap } from '../src/lib/ruhig/koennen.js';
import { flipDay, specialDaysOf, recentDays, dropDayKind, counterDays, originOf, sleepByOrigin, weightSure } from '../src/lib/ruhig/herkunft.js';
import { rolesOf, rolesOfAct, flipRole, roleSums, dropRole, scalesOf, setScale, meaningOn } from '../src/lib/ruhig/zahlen.js';
import { scoped, scopeLines, arriveOf, addPerson, regionOf } from '../src/lib/ruhig/teilen.js';
import { bansOf, newBan, banHits, citedIn, openAssumptions, nextTrip, questionWords } from '../src/lib/ruhig/belege.js';
import { SUBS, subKeyOf, subHash } from '../src/lib/ruhig/subs.js';
import { FEATURES } from '../src/lib/features.js';
import { HOME } from '../src/lib/know/heimat.js';
import DE from '../src/lib/i18n/de/index.js';

const TODAY = '2026-10-25';

describe('base and kinds', () => {
  it('counts calendar days, moves entries and finds the end of a trip', () => {
    expect(addDays('2026-10-25', 7)).toBe('2026-11-01');
    expect(daysBetween('2026-10-20', '2026-10-25')).toBe(5);
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(tripEnd({ startDate: '2026-11-01', days: 3 })).toBe('2026-11-03');
  });
  it('kinds: the standard ones until the person changes them; renamed names are their own text', () => {
    const std = [{ id: 'a', std: 'With friends' }];
    let k = kindsOf(undefined, std);
    expect(k).toEqual(std);
    k = addKind(k, '  Mit Bruder ', 'b');
    expect(k.map((x) => x.id)).toEqual(['a', 'b']);
    k = renameKind(k, 'a', 'Mit der Gruppe');
    expect(kindName(k[0], (s) => `DE:${s}`)).toBe('Mit der Gruppe');
    expect(kindName({ id: 'x', std: 'With friends' }, (s) => `DE:${s}`)).toBe('DE:With friends');
    expect(dropKind(k, 'a').map((x) => x.id)).toEqual(['b']);
  });
});

describe('Less app for the moment', () => {
  it('a workspace holds at most 8 functions and ends after its day', () => {
    let s = spaceOf({ on: true, ids: ['f.x'], until: '2026-10-26' });
    for (let i = 0; i < 10; i++) s = spaceAdd(s, `f.${i}`);
    expect(s.ids.length).toBe(SPACE_MAX);
    expect(spaceActive(s, TODAY)).toBe(true);
    expect(spaceActive(s, '2026-10-27')).toBe(false);
  });
  it('the budget lets safety through and keeps the order of the groups', () => {
    const at = (h) => new Date(2026, 9, 25, h).getTime();
    const items = [
      { key: 'bday-1', at: at(8), title: 'Birthday' },
      { key: 'eve-trip', at: at(9), title: 'Evening before' },
      { key: 'ice-1', at: at(7), title: 'Ice' },
      { key: 'backup', at: at(10), title: 'Backup' },
    ];
    expect(groupOfKey('ice-1')).toBe('safety');
    expect(groupOfKey('eve-trip')).toBe('trip');
    expect(applyBudget(items, { on: false }).items).toBe(items);
    const { items: out, held } = applyBudget(items, budgetOf({ on: true, perDay: 1, order: ['trip', 'home'] }));
    expect(out.map((x) => x.key)).toEqual(['eve-trip', 'ice-1']);
    expect(held.map((x) => x.key)).toEqual(['bday-1', 'backup']);
  });
  it('«Not for me» moves a function to the end, never away', () => {
    const map = setNotForMe(notForMeOf(null), 'f.race', 'Not my kind of trip', TODAY);
    const rows = [{ id: 'f.race' }, { id: 'f.plan' }];
    expect(lastIfNotForMe(rows, map).map((r) => r.id)).toEqual(['f.plan', 'f.race']);
    expect(unsetNotForMe(map, 'f.race')).toEqual({});
  });
});

describe('Small experiments', () => {
  it('a try has a clear end and asks for a look back', () => {
    const e = newExp({ q: 'Sleep better without a screen?', from: '2026-10-20', days: 7 }, 'e1');
    expect(expEnd(e)).toBe('2026-10-26');
    expect(expState(e, '2026-10-19')).toBe('soon');
    expect(expState(e, TODAY)).toBe('running');
    expect(expState(e, '2026-10-27')).toBe('review');
    let t = expTick(expTick(e, '2026-10-21', 'yes'), '2026-10-22', 'no');
    expect(expTick(t, '2026-11-01', 'yes')).toBe(t); // outside the try
    expect(expProgress(t, TODAY)).toEqual({ day: 6, yes: 1, no: 1, open: 4 });
    expect(expState(expStop(t, '2026-10-23'), TODAY)).toBe('stopped');
    expect(expState(expReview(t, { learned: 'Yes', keep: 'keep' }, TODAY), TODAY)).toBe('done');
    expect(expAgain(t, TODAY, 'e2')).toMatchObject({ id: 'e2', from: TODAY, days: 7, ticks: {} });
  });
});

describe('Your later self', () => {
  const trips = [
    { id: 't1', startDate: '2026-11-07', days: 3 },
    { id: 't0', startDate: '2026-10-01', days: 2 },
  ];
  it('a letter waits for its moment', () => {
    expect(newLetter({ text: 'x', kind: 'date', day: '2026-10-20' }, TODAY)).toBeNull(); // a date in the past
    const l = lettersOf([newLetter({ text: 'For the first night', kind: 'firstnight' }, TODAY, 'b1')])[0];
    expect(momentOf(l, { trips, today: TODAY })).toBe('2026-11-07');
    const home = { ...l, when: { kind: 'home' } };
    expect(momentOf(home, { trips, today: TODAY })).toBe('2026-11-10');
    const pause = { ...l, when: { kind: 'pause' } };
    expect(momentOf(pause, { rideDays: ['2026-10-30', '2026-11-20'], today: TODAY })).toBe('2026-11-20');
    expect(dueLetters([l], { trips, today: TODAY })).toEqual([]);
    expect(dueLetters([l], { trips, today: '2026-11-07' }).map((x) => x.id)).toEqual(['b1']);
  });
  it('answers make one story; a later view leaves the old answer', () => {
    const a = newLetter({ text: 'One', kind: 'date', day: '2026-10-26' }, TODAY, 'a');
    const b = newLetter({ text: 'Two', kind: 'date', day: '2026-12-01', prev: 'a' }, '2026-10-26', 'b');
    let list = openLetter([a, b], 'a', '2026-10-26');
    list = replyLetter(list, 'a', 'It was fine', '2026-10-26');
    expect(list[0]).toMatchObject({ opened: '2026-10-26', reply: { text: 'It was fine' } });
    expect(storyOf(list, 'b').map((x) => x.id)).toEqual(['a', 'b']);
    const later = setLater({}, '2026-10-20', { text: 'A good start', v: 7 }, TODAY);
    const rows = [{ qid: DAY_QUESTION, day: '2026-10-20', value: 4, at: '1' }, { qid: DAY_QUESTION, day: TODAY, value: 8 }];
    expect(ratedDays(rows, later, TODAY)).toEqual([{ day: '2026-10-20', then: 4, note: '', later: { text: 'A good start', v: 7, at: TODAY } }]);
  });
});

describe('Meaning next to numbers', () => {
  it('marks find trips; a deleted mark can move to another', () => {
    let m = flipMeaning(meaningsOf(null), 't1', 'friends');
    m = flipMeaning(m, 't2', 'first');
    expect(tripsWith(m, [{ id: 't1', startDate: '2026-09-01' }, { id: 't2', startDate: '2026-10-01' }], 'friends').map((x) => x.id)).toEqual(['t1']);
    const moved = dropMeaning(m, 'first', 'friends');
    expect(moved.trips.t2).toEqual(['friends']);
  });
  it('the bingo card counts lines of the year', () => {
    let b = bingoOf(null);
    expect(b.kinds.length).toBe(9);
    for (const k of b.kinds.slice(0, 3)) b = addFind(b, k.id, '2026-06-01', 'Somewhere');
    const card = bingoCard(b, 2026);
    expect(card.marked).toBe(3);
    expect(card.lines).toEqual([[0, 1, 2]]);
    expect(bingoCard(b, 2025).marked).toBe(0);
    expect(dropBingoKind(b, b.kinds[0].id).finds.length).toBe(3); // finds stay, out of sight
  });
  it('rewards and good decisions are kept with their day', () => {
    const r = takeReward(rewardsOf(null), rewardsOf(null).kinds[0].id, TODAY, 'First 100 km', 'r1');
    expect(r.taken[0]).toMatchObject({ id: 'r1', day: TODAY });
    const d = newDecision({ text: 'Turned back', day: TODAY }, 'd1');
    expect(decisionList([d]).map((x) => x.id)).toContain('d1');
  });
});

describe('What you can do', () => {
  it('a skill with a level and an example, grouped by sport', () => {
    let s = newSkill({ name: 'Change a tube', sport: 'velo' }, 's1');
    s = addExample(setLevel(s, 'sure'), '2026-09-12', 'On the road');
    expect(s).toMatchObject({ level: 'sure', examples: [{ day: '2026-09-12', text: 'On the road' }] });
    expect(setLevel(s, 'nope').level).toBe('learn');
    const map = skillMap([s], [{ id: 'velo', name: 'Velo' }]);
    expect(JSON.stringify(map)).toContain('s1');
  });
});

describe('Where a value comes from', () => {
  it('special days explain a day without sport', () => {
    const s = flipDay(specialDaysOf(null), '2026-10-24', 'work');
    const days = recentDays(s, ['2026-10-25'], TODAY, 3);
    expect(days.map((d) => [d.day, d.sport, d.marks])).toEqual([['2026-10-25', true, []], ['2026-10-24', false, ['work']], ['2026-10-23', false, []]]);
    expect(dropDayKind(s, 'work', 'travel').marks).toEqual({ '2026-10-24': ['travel'] });
    expect(dropDayKind(s, 'work').marks).toEqual({});
  });
  it('counter-examples: the days against an insight', () => {
    const series = { a: { d1: 9, d2: 8, d3: 5, d4: 9 }, b: { d1: 80, d2: 70, d3: 40, d4: 30 } };
    const { fit, counter } = counterDays({ x: 'a', y: 'b', cut: 7, rho: 0.5 }, series, ['d1', 'd2', 'd3', 'd4']);
    expect(fit.map((r) => r.day).sort()).toEqual(['d1', 'd2', 'd3']);
    expect(counter.map((r) => r.day)).toEqual(['d4']);
  });
  it('places to sleep and the weight say how sure they are', () => {
    expect(originOf({ origin: 'described' })).toBe('described');
    expect(originOf({ src: 'file.gpx' })).toBe('imported');
    const by = sleepByOrigin([{ kind: 'sleep', origin: 'visited' }, { kind: 'sleep' }, { kind: 'water' }]);
    expect([by.visited.length, by[''].length, by.imported.length]).toEqual([1, 1, 0]);
    const items = { a: { id: 'a', weightG: 1000, weightStatus: 'measured' }, b: { id: 'b', weightG: 500, weightStatus: 'online' }, c: { id: 'c', weightG: null } };
    const w = weightSure([{ itemId: 'a', qty: 1 }, { itemId: 'b', qty: 2 }, { itemId: 'c' }], items);
    expect(w).toMatchObject({ total: 2000, measured: { g: 1000, n: 1 }, estimated: { g: 1000, n: 1 }, unknown: { n: 1 }, share: 50 });
    expect(w.toWeigh).toEqual([{ id: 'b', g: 1000 }]);
  });
});

describe('Numbers that stay clear', () => {
  it('one ride with two roles counts once in the total', () => {
    let r = rolesOf(null);
    const acts = [{ id: 'x', day: '2026-10-20', km: 10, movingS: 1800, commute: true }, { id: 'y', day: '2026-10-21', km: 40, movingS: 5400 }];
    expect(rolesOfAct(r, acts[0])).toEqual(['commute']);
    r = flipRole(r, acts[0], 'training');
    const s = roleSums(r, acts);
    expect(s.total).toEqual({ n: 2, km: 50, min: 120 });
    expect(s.per.find((p) => p.id === 'training')).toMatchObject({ n: 2, km: 50 });
    expect(s.both).toBe(1);
    expect(dropRole(r, 'training', 'outing').acts.x).toEqual(['commute', 'outing']);
  });
  it('a scale keeps the meaning of its day', () => {
    let m = setScale(scalesOf(null), 'q1', { lo: 'tired', hi: 'great' }, '2026-10-01');
    m = setScale(m, 'q1', { lo: 'ill', hi: 'best day' }, TODAY);
    expect(meaningOn(m, 'q1', '2026-10-10')).toMatchObject({ lo: 'tired', hi: 'great' });
    expect(meaningOn(m, 'q1', TODAY)).toMatchObject({ lo: 'ill', hi: 'best day' });
  });
});

describe('Share with a preview', () => {
  const payload = { v: 1, t: 'Jura', d: '2026-11-07', n: 3, b: 'Gravel', w: 8400, g: [['Seat pack', [['Tent', 1, 1200]]]] };
  it('the preview shows only what goes along', () => {
    const p = scoped(payload, { title: 'Weekend', date: false, bike: false, weights: false });
    expect(p).toMatchObject({ t: 'Weekend', d: null, n: 1, b: null, w: null, g: [['Seat pack', [['Tent', 1, null]]]] });
    expect(scopeLines(payload, { weights: false }).find((l) => l.key === 'Weights').v).toBeNull();
  });
  it('arrival names as much place as fits the person', () => {
    const a = addPerson(arriveOf(null), 'Club', 'region', 'p1');
    expect(a.people).toEqual([{ id: 'p1', name: 'Club', level: 'region' }]);
    expect(regionOf({ county: 'Seeland', country: 'Schweiz' })).toBe('Seeland');
  });
});

describe('Assistant with sources', () => {
  it('no-gos show up on a list; citations are found', () => {
    const bans = bansOf([newBan('single-use batteries', 'buy', 'b1'), newBan('Gas', 'take', 'b2')]);
    const items = [{ id: 'i1', name: 'Single-use batteries AA', ownership: 'wishlist' }, { id: 'i2', name: 'Gas cartridge' }];
    const hits = banHits(bans, { trip: { entries: [{ itemId: 'i2' }] }, items });
    expect(hits.map((h) => [h.ban.id, h.where])).toEqual([['b1', 'wish'], ['b2', 'trip']]);
    expect(citedIn('As [1] and [3] say', 3)).toEqual([1, 3]);
    expect(questionWords('What did I learn about the Jura?')).toContain('jura');
  });
  it('questions the next trip kindly', () => {
    const t = nextTrip([{ id: 'a', startDate: '2026-11-07', days: 2 }, { id: 'b', startDate: '2026-10-01', days: 1 }], TODAY);
    expect(t.id).toBe('a');
    expect(openAssumptions(t, {}).length).toBeGreaterThan(0);
  });
});

describe('the page and its catalogue', () => {
  it('nine sub-pages with their hash', () => {
    expect(SUBS.length).toBe(9);
    expect(subKeyOf('#/me/ruhig/versuche?open=exp')).toBe('versuche');
    expect(subKeyOf('#/me/ruhig/nope')).toBe('');
    expect(subHash('teilen')).toBe('#/me/ruhig/teilen');
  });
  it('every function of the package lives on its sub-page and speaks German', () => {
    const mine = FEATURES.filter((f) => String(f.href ?? '').startsWith('#/me/ruhig/'));
    expect(mine.length).toBe(28);
    for (const f of mine) {
      expect(HOME[f.id], f.id).toBe(f.href.split('?')[0]);
      expect(SUBS.some((s) => subHash(s.key) === HOME[f.id]), f.id).toBe(true);
      expect(DE[f.title], f.title).toBeTruthy();
      expect(DE[f.text], f.id).toBeTruthy();
    }
    for (const s of SUBS) for (const k of [s.title, s.sub]) expect(DE[k], k).toBeTruthy();
  });
});
