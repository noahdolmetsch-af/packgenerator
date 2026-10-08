// v0.30.0 (Noah 1a, 2a, 3a): Good to know is 6 tiles: at most 3 important data cards, at most 1
// further one, at least 3 tips; which tips, the same all day, "I know it", the 30-day rest, used.
import { describe, it, expect } from 'vitest';
import {
  TIPS, TIP, GROUPS, TILES, usedTips, fittingTips, pickTips, markShown, tapTip, knowTip, isPaused, todayTiles, phoneSplit, overview, tipState, isImportant, seed,
} from '../src/lib/tips.js';
import { knowCards } from '../src/lib/know.js';
import DE from '../src/lib/i18n/de/index.js';

const TODAY = '2026-10-08';
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const card = (key, prio, data = {}) => ({ key, prio, data });
const kinds = (tiles) => tiles.map((x) => (x.kind === 'tip' ? 'tip' : x.card.key));
const tipsFor = (state = null, used = new Set(), fit = new Set(), today = TODAY) => (n) => pickTips({ state, used, fit, today, n });

describe('the tips', () => {
  it('28 tips in 6 areas, each with a German title, sentence and button', () => {
    expect(TIPS.length).toBe(28);
    expect(new Set(TIPS.map((x) => x.id)).size).toBe(TIPS.length);
    for (const g of GROUPS) expect(TIPS.some((x) => x.group === g.key)).toBe(true);
    expect(TIPS.every((x) => GROUPS.some((g) => g.key === x.group))).toBe(true);
    const missing = TIPS.flatMap((x) => [x.title, x.text, x.button].filter((k) => !DE[k])).concat(GROUPS.map((g) => g.label).filter((k) => !DE[k]));
    expect(missing).toEqual([]);
    expect(TIPS.every((x) => x.go.href?.startsWith('#/') || x.go.run)).toBe(true);
  });
});

describe('the 6 tiles', () => {
  it('nothing in the data: 6 tips (the home place card is the weather tip now)', () => {
    const tiles = todayTiles(knowCards({ today: TODAY }), tipsFor(), TODAY);
    expect(kinds(tiles)).toEqual(Array(TILES).fill('tip'));
  });

  it('at most 3 important cards, then no further card: 3 tips stay', () => {
    const cards = [card('backup', 1), card('todo', 1), card('wear', 1), card('weather', 2), card('inbox', 3), card('season', 5)];
    const tiles = todayTiles(cards, tipsFor(), TODAY);
    expect(kinds(tiles)).toEqual(['backup', 'todo', 'wear', 'tip', 'tip', 'tip']);
  });

  it('2 important cards, 1 further card, 3 tips', () => {
    const cards = [card('backup', 1), card('weather', 2), card('inbox', 3), card('templates', 3), card('season', 5)];
    expect(kinds(todayTiles(cards, tipsFor(), TODAY))).toEqual(['backup', 'weather', 'inbox', 'tip', 'tip', 'tip']);
  });

  it('only the listed kinds are important: wear soon, a todo without a late row, far weather are not', () => {
    expect(isImportant(card('wear', 2))).toBe(false);
    expect(isImportant(card('todo', 3))).toBe(false);
    expect(isImportant(card('weather', 5))).toBe(false);
    expect(isImportant(card('wear', 1))).toBe(true);
    const tiles = todayTiles([card('wear', 2), card('todo', 3), card('weather', 5)], tipsFor(), TODAY);
    expect(kinds(tiles)).toEqual(['wear', 'tip', 'tip', 'tip', 'tip', 'tip']);
  });

  it('the further card among the insights is the day’s pick, the same all day', () => {
    const cards = [card('season', 5), card('trend', 5), card('upgrade', 5), card('unused', 5)];
    const a = todayTiles(cards, tipsFor(), TODAY)[0].card.key;
    expect(todayTiles(cards, tipsFor(), TODAY)[0].card.key).toBe(a);
    const days = new Set([...Array(20).keys()].map((n) => todayTiles(cards, tipsFor(null, new Set(), new Set(), addDays(TODAY, n)), addDays(TODAY, n))[0].card.key));
    expect(days.size).toBeGreaterThan(1);
  });

  it('"Still open" without a late row takes turns with the insights', () => {
    expect(kinds(todayTiles([card('todo', 3), card('templates', 3)], tipsFor(), TODAY))[0]).toBe('templates');
    const days = new Set([...Array(20).keys()].map((n) => todayTiles([card('todo', 3), card('season', 5)], tipsFor(null, new Set(), new Set(), addDays(TODAY, n)), addDays(TODAY, n))[0].card.key));
    expect([...days].sort()).toEqual(['season', 'todo']);
  });

  it('too few tips left: more data cards fill up to 6', () => {
    const known = Object.fromEntries(TIPS.slice(2).map((x) => [x.id, TODAY]));
    const cards = [card('backup', 1), card('inbox', 3), card('season', 5), card('trend', 5), card('upgrade', 5)];
    const tiles = todayTiles(cards, tipsFor({ known }), TODAY);
    expect(tiles.length).toBe(6);
    expect(kinds(tiles).filter((k) => k === 'tip').length).toBe(2);
    expect(kinds(tiles).slice(0, 2)).toEqual(['backup', 'inbox']);
  });
});

describe('which tips', () => {
  it('never used first, then fitting ones, then the day’s random order', () => {
    const used = new Set(TIPS.map((x) => x.id).filter((id) => !['gpx', 'note', 'km', 'care'].includes(id)));
    const ids = pickTips({ used, fit: new Set(['care', 'gpx', 'bags']), today: TODAY, n: 6 });
    expect(ids.slice(0, 2).sort()).toEqual(['care', 'gpx']);
    expect(ids.slice(2, 4).sort()).toEqual(['km', 'note']);
    expect(ids[4]).toBe('bags'); // used, but it fits
  });

  it('the same tips all day, other ones on other days', () => {
    const a = pickTips({ today: TODAY, n: 3 });
    expect(pickTips({ today: TODAY, n: 3 })).toEqual(a);
    const other = [...Array(10).keys()].map((n) => pickTips({ today: addDays(TODAY, n + 1), n: 3 }).join());
    expect(other.some((x) => x !== a.join())).toBe(true);
    expect(seed('a')).toBe(seed('a'));
  });

  it('today’s choice stays, even when a tip got used meanwhile; a free place fills up', () => {
    const first = pickTips({ today: TODAY, n: 3 });
    const { state } = markShown(null, first, TODAY);
    const tapped = tapTip(state, first[0], TODAY);
    expect(pickTips({ state: tapped, used: new Set([first[1]]), today: TODAY, n: 3 })).toEqual(first);
    const four = pickTips({ state: tapped, today: TODAY, n: 4 });
    expect(four.slice(0, 3)).toEqual(first);
    expect(four).toHaveLength(4);
  });

  it('"I know it" hides a tip for good, also on later days; the overview still lists it', () => {
    const first = pickTips({ today: TODAY, n: 3 });
    let s = markShown(null, first, TODAY).state;
    s = knowTip(s, first[0], TODAY);
    const now = pickTips({ state: s, today: TODAY, n: 3 });
    expect(now).not.toContain(first[0]);
    expect(now.slice(0, 2)).toEqual(first.slice(1));
    for (let n = 1; n < 200; n += 7) expect(pickTips({ state: s, today: addDays(TODAY, n), n: TIPS.length })).not.toContain(first[0]);
    const row = overview(s).groups.flatMap((g) => g.tips).find((x) => x.id === first[0]);
    expect(row).toMatchObject({ used: true, known: true });
  });

  it('shown on 3 days without a tap: rests 30 days, then may come back', () => {
    let s = null;
    const id = 'gpx';
    for (let n = 0; n < 3; n++) s = markShown(s, [id], addDays(TODAY, n)).state;
    expect(tipState(s).seen[id]).toEqual({ days: 3, last: addDays(TODAY, 2) });
    expect(isPaused(s, id, addDays(TODAY, 2))).toBe(false); // the third day itself still shows it
    expect(isPaused(s, id, addDays(TODAY, 3))).toBe(true);
    expect(pickTips({ state: s, today: addDays(TODAY, 3), n: TIPS.length })).not.toContain(id);
    // written down on the next showing
    s = markShown(s, [], addDays(TODAY, 3)).state;
    expect(tipState(s).paused[id]).toBe(addDays(TODAY, 33));
    expect(isPaused(s, id, addDays(TODAY, 32))).toBe(true);
    expect(isPaused(s, id, addDays(TODAY, 33))).toBe(false);
    expect(pickTips({ state: s, today: addDays(TODAY, 33), n: TIPS.length })).toContain(id);
  });

  it('the same day counts once; a tap starts the count again', () => {
    let s = markShown(null, ['note'], TODAY).state;
    s = markShown(s, ['note'], TODAY).state;
    expect(tipState(s).seen.note.days).toBe(1);
    expect(markShown(s, ['note'], TODAY).changed).toBe(false);
    s = markShown(s, ['note'], addDays(TODAY, 1)).state;
    s = tapTip(s, 'note', addDays(TODAY, 1));
    expect(tipState(s).seen.note).toBeUndefined();
    expect(tipState(s).tapped.note).toBe(addDays(TODAY, 1));
  });

  it('a broken state starts empty', () => {
    expect(tipState('x')).toEqual({ known: {}, tapped: {}, seen: {}, paused: {}, day: null });
    expect(pickTips({ state: { known: [], day: { date: TODAY } }, today: TODAY, n: 3 })).toHaveLength(3);
  });
});

describe('used and fitting', () => {
  it('used from the data', () => {
    const used = usedTips({
      trips: [{ id: 'a', startDate: '2026-09-01', days: 1, bikeId: 'b', domain: 'bikepacking', route: { km: 40 }, entries: [{ itemId: 'i', packed: true }], wxFrom: 'Aarau' }],
      items: [{ id: 'i', weightStatus: 'measured', favorite: true }, { id: 'w', ownership: 'wishlist' }],
      bikes: [{ id: 'b', km: 1000, kmDate: '2026-10-01', setup: { seat: 'bag' }, parts: [{ key: 'chain', history: [{ km: 900 }] }] }],
      visits: [{ id: 'v', photos: ['data:'] }],
      debriefs: [{ tripId: 'a', status: 'done' }],
      templates: [{ id: 't', hintLog: [{}] }],
      sets: [{ key: 'u-rain', name: 'Rain' }],
      notesN: 2,
      homePlace: { lat: 1, lon: 1 },
      pace: { mine: true },
      lastBackup: '2026-10-01T10:00:00Z',
      langSet: true,
    });
    for (const id of ['dayride', 'blocks', 'templates', 'gpx', 'homeweather', 'wxsuggest', 'bags', 'note', 'debrief', 'learn', 'pace', 'weigh', 'fav', 'wish', 'setup', 'care', 'receipt', 'km', 'backup', 'lang'])
      expect([id, used.has(id)]).toEqual([id, true]);
    for (const id of ['share', 'ride', 'trend', 'unused', 'order', 'install', 'demo', 'event']) expect([id, used.has(id)]).toEqual([id, false]);
    expect(usedTips().size).toBe(0);
  });

  it('a trip coming up: packing and GPX fit; bikes with km: care', () => {
    const fit = fittingTips({ trips: [{ id: 'n', startDate: addDays(TODAY, 5), days: 2, entries: [{ itemId: 'x' }] }], bikes: [{ id: 'b', km: 500 }] }, TODAY);
    expect([...fit]).toEqual(expect.arrayContaining(['bags', 'share', 'gpx', 'care', 'km']));
    expect(fit.has('ride')).toBe(false);
    expect(fittingTips({}, TODAY).size).toBe(0);
  });

  it('the overview counts used, tapped and known tips', () => {
    let s = tapTip(null, 'share', TODAY);
    s = knowTip(s, 'install', TODAY);
    const o = overview(s, new Set(['note']));
    expect(o).toMatchObject({ used: 3, total: TIPS.length });
    expect(o.groups.map((g) => g.key)).toEqual(GROUPS.map((g) => g.key));
    expect(o.groups.flatMap((g) => g.tips).length).toBe(TIPS.length);
    expect(TIP.share.group).toBe('pack');
  });
});

describe('on a phone', () => {
  it('important cards and tips up to 3, always one tip; the rest behind "more"', () => {
    const t = (id) => ({ kind: 'tip', id });
    const c = (key, prio) => ({ kind: 'card', card: card(key, prio) });
    const tiles = [c('backup', 1), c('todo', 1), c('wear', 1), t('a'), t('b'), t('c')];
    expect(phoneSplit(tiles).shown.map((x) => x.id ?? x.card.key)).toEqual(['backup', 'todo', 'wear', 'a']);
    const two = [c('backup', 1), c('inbox', 3), t('a'), t('b'), t('c'), t('d')];
    const r = phoneSplit(two);
    expect(r.shown.map((x) => x.id ?? x.card.key)).toEqual(['backup', 'a', 'b']);
    expect(r.more.map((x) => x.id ?? x.card.key)).toEqual(['inbox', 'c', 'd']);
    expect(phoneSplit([t('a'), t('b'), t('c'), t('d')]).shown).toHaveLength(3);
  });
});
