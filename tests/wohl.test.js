// Paket P «Was mir gut tut»: good days, combinations, comfort range, recipes, surprises, the wished
// mix and the short versions. Fictional data only; days are calendar days counted with addDays.
import { describe, it, expect } from 'vitest';
import { dayData, lifts, helps, drains, combos, comfort, recipe, goodRecipes, surprises, wishOf, wishGap, wishArcs, SHORT, MINUTES, shortOf, rideNumbers, FACTS, scoredDays } from '../src/lib/wohl.js';
import { CATS } from '../src/lib/balance.js';
import { lastDays, addDays } from '../src/lib/flow.js';

const T = '2026-10-15';
const days = lastDays(T, 30);
const row = (day, qid, value, kind = 'scale') => ({ id: `${day}-${qid}`, day, qid, value, kind, area: qid.split('.')[0], src: 'hand' });

/** 30 days: every second day outside and with friends (score 8), the others not (score 5). */
function sample() {
  const rows = [];
  days.forEach((d, i) => {
    const on = i % 2 === 0;
    rows.push(row(d, 'erreicht.zufrieden', on ? 8 : 5));
    rows.push(row(d, 'natur.draussen', on ? 'm90' : 'm0', 'chips'));
    rows.push(row(d, 'freunde.zeit', on ? 'much' : i % 4 === 1 ? 'short' : 'no', 'chips'));
    rows.push(row(d, 'koerper.bildschirm', on ? 2 : 6, 'number'));
  });
  return rows;
}

describe('dayData', () => {
  it('without any data every day is empty: nothing is invented', () => {
    const data = dayData({ days });
    expect(data).toHaveLength(30);
    expect(scoredDays(data)).toBe(0);
    expect(data.every((d) => FACTS.every((f) => d.facts[f.key] === null))).toBe(true);
  });
  it('reads the day score, the facts and a ride from the ledger', () => {
    const km = [{ date: T, km: 42.4, hm: 610, hrAvg: 131, kind: 'ride' }, { date: T, km: 1000, kind: 'start' }];
    const data = dayData({ rows: [row(T, 'spass.stimmung', 9), row(T, 'natur.draussen', 'm0', 'chips')], km, days: [T] });
    expect(data[0].score).toBe(9);
    expect(data[0].facts.ride).toBe(true);
    expect(data[0].facts.outside).toBe(true); // the ride says it was outside
    expect(data[0].values).toMatchObject({ km: 42, hm: 610, hrAvg: 131 });
  });
  it('takes sleep from Fitbit when it was not answered by hand', () => {
    const data = dayData({ health: [{ date: T, sleep: { asleepMin: 450 } }], days: [T] });
    expect(data[0].values.sleepH).toBe(7.5);
    expect(data[0].facts.sleep).toBe(true);
  });
});

describe('what helps and what drains', () => {
  const data = dayData({ rows: sample(), days });
  it('a fact with a better day score helps, with both groups counted', () => {
    const h = helps(data);
    expect(h[0]).toMatchObject({ key: 'outside', with: 8, without: 5, nWith: 15, nWithout: 15 });
  });
  it('a long screen day shows as an energy drain', () => {
    expect(drains(data).map((d) => d.key)).toContain('screen');
  });
  it('needs at least 5 days in each group', () => {
    expect(lifts(data.slice(0, 6))).toEqual([]);
  });
});

describe('good combinations', () => {
  it('two facts that are better together than alone', () => {
    const rows = [];
    days.forEach((d, i) => {
      const a = i % 2 === 0;
      const b = i % 3 === 0;
      rows.push(row(d, 'erreicht.zufrieden', a && b ? 9 : a || b ? 6 : 5));
      rows.push(row(d, 'natur.draussen', a ? 'm90' : 'm0', 'chips'));
      rows.push(row(d, 'achtsamkeit.moment', b ? 'yes' : 'no', 'yesno'));
    });
    const c = combos(dayData({ rows, days }));
    expect(c[0].keys).toEqual(['outside', 'moment']);
    expect(c[0].both).toBe(9);
    expect(c[0].nBoth).toBe(5);
  });
  it('nothing without enough days with both', () => {
    expect(combos(dayData({ rows: sample().filter((r) => r.day >= addDays(T, -4)), days }))).toEqual([]);
  });
});

describe('comfort range, recipes', () => {
  const data = dayData({ rows: sample(), days });
  it('the range of time outside with the best days', () => {
    const c = comfort(data).find((x) => x.key === 'outsideMin');
    expect(c.best).toMatchObject({ label: '30–90 min', mean: 8, n: 15 });
  });
  it('the recipe of a good day names what helped', () => {
    const r = recipe(data, days[0]);
    expect(r.good).toBe(true);
    expect(r.parts).toContain('outside');
    expect(recipe(data, '2020-01-01')).toBe(null);
  });
  it('the recipes of good days: what comes up most', () => {
    expect(goodRecipes(data)[0]).toMatchObject({ key: 'outside', n: 15, of: 15 });
  });
});

describe('surprises of the week', () => {
  it('a week far from the normal is a surprise', () => {
    const week = lastDays(T, 7);
    const rows = lastDays(T, 37).map((d) => row(d, 'erholung.schlaf', week.includes(d) ? 9 : 5));
    expect(surprises(rows, week)).toEqual([{ qid: 'erholung.schlaf', week: 9, normal: 5, dir: 'up', n: 7 }]);
  });
  it('a usual week is no surprise', () => {
    const rows = lastDays(T, 37).map((d, i) => row(d, 'erholung.schlaf', 5 + (i % 3)));
    expect(surprises(rows, lastDays(T, 7))).toEqual([]);
  });
});

describe('the wished mix of the ring', () => {
  const keys = CATS.map((c) => c.key);
  it('cleans the wish to steps of 10 within 0–100', () => {
    expect(wishOf({ fun: 73, rest: 140, x: 50, sport: 'a' }, keys)).toEqual({ fun: 70, rest: 100 });
  });
  it('names the categories furthest below the wish', () => {
    const cats = [{ key: 'fun', value: 30 }, { key: 'rest', value: 70 }, { key: 'nature', value: 10 }, { key: 'mind', value: null }];
    expect(wishGap(cats, { fun: 60, rest: 70, nature: 80, mind: 90 }).map((g) => g.key)).toEqual(['nature', 'fun']);
  });
  it('draws one arc per wished category', () => {
    expect(wishArcs(keys, { fun: 50 }).map((a) => a.key)).toEqual(['fun']);
  });
});

describe('short versions and the ride of a day', () => {
  it('every balance category has a 5, 20 and 60 minute version', () => {
    expect(MINUTES).toEqual([5, 20, 60]);
    for (const c of CATS) expect(SHORT[c.key]).toHaveLength(3);
    expect(shortOf('nature', 20)).toBe('A round around the block');
  });
  it('km, metres climbed and pulse of a day; null without a ride', () => {
    const km = [{ date: T, km: 20, hm: 300, hrAvg: 120, kind: 'ride' }, { date: T, km: 10.5, hm: 100, hrAvg: 140, kind: 'ride' }, { date: T, km: 5, kind: 'ride', state: 'removed' }];
    expect(rideNumbers(km, T)).toEqual({ km: 30.5, hm: 400, hrAvg: 130 });
    expect(rideNumbers(km, addDays(T, -1))).toBe(null);
  });
});

import { neulandYear, addNeuland, renameNeuland, dropNeuland, neulandOf, seasonOf, nextSeason, seasonListOf, tickSeason, addSeasonItem, renameSeasonItem, dropSeasonItem, moveSeasonItem, SEASON_STD, wohlOf } from '../src/lib/wohl.js';

describe('Neuland of the year', () => {
  it('your own entries and the «New» evenings with a note, newest first', () => {
    let own = addNeuland([], 'Lake path to the old mill', '2026-05-02', 'a');
    own = addNeuland(own, 'Old year', '2025-08-01', 'b');
    const rows = [row('2026-07-10', 'spass.coolstes', ['new', 'fun'], 'chips'), { ...row('2026-07-11', 'spass.coolstes', ['new'], 'chips'), note: 'First time on the pass' }];
    const list = neulandYear(own, rows, 2026);
    expect(list.map((x) => x.name)).toEqual(['First time on the pass', 'Lake path to the old mill']);
    expect(list[0].auto).toBe(true);
  });
  it('rename and delete your own entries', () => {
    const own = addNeuland([], 'X', '2026-05-02', 'a');
    expect(renameNeuland(own, 'a', 'Y')[0].name).toBe('Y');
    expect(dropNeuland(own, 'a')).toEqual([]);
    expect(neulandOf([{ id: 'x', name: '', day: '2026-01-01' }, null])).toEqual([]);
  });
});

describe('season switch', () => {
  it('spring March–May, autumn September–November', () => {
    expect(seasonOf('2026-04-10')).toBe('spring');
    expect(seasonOf('2026-10-19')).toBe('autumn');
    expect(seasonOf('2026-07-01')).toBe(null);
    expect(nextSeason('2026-07-01')).toBe('autumn');
    expect(nextSeason('2026-12-24')).toBe('spring');
  });
  it('starts with the start lists; tick, add, rename, move and delete', () => {
    let v = seasonListOf(null);
    expect(v.autumn.items).toHaveLength(SEASON_STD.autumn.length);
    v = tickSeason(v, 'autumn', '2026', 'autumn-1');
    expect(v.autumn.done['2026']).toEqual(['autumn-1']);
    v = addSeasonItem(v, 'autumn', 'Winter tyres on the car', 'own-1');
    v = renameSeasonItem(v, 'autumn', 'autumn-2', 'Lights: the new ones');
    expect(v.autumn.items.find((i) => i.id === 'autumn-2')).toEqual({ id: 'autumn-2', name: 'Lights: the new ones' });
    v = moveSeasonItem(v, 'autumn', 'own-1', -1);
    expect(v.autumn.items.at(-2).id).toBe('own-1');
    v = dropSeasonItem(v, 'autumn', 'autumn-1');
    expect(v.autumn.done['2026']).toEqual([]);
    expect(v.autumn.items.some((i) => i.id === 'autumn-1')).toBe(false);
  });
  it('the energy drains are off until you switch them on', () => {
    expect(wohlOf(null).drains).toBe(false);
    expect(wohlOf({ drains: true }).drains).toBe(true);
  });
});

import { EXP_IDEAS, expSuggestion, experimentsOf, startExperiment, tickExperiment, stopExperiment, dropExperiment, renameExperiment, experimentState, phasesOf, suggestedPhases, addPhase, renamePhase, dropPhase, phaseRows } from '../src/lib/wohl.js';

describe('small experiments', () => {
  it('the app suggests one for the lowest area', () => {
    expect(expSuggestion('mind').fact).toBe('moment');
    expect(expSuggestion('nope')).toBe(EXP_IDEAS[0]);
  });
  it('start, tick, rename, stop and delete; own length 3, 7 or 14 days', () => {
    let l = startExperiment([], { what: 'Cold shower', days: 3 }, T, 'e1');
    expect(experimentsOf(l)[0]).toMatchObject({ what: 'Cold shower', days: 3, ticks: [] });
    l = tickExperiment(l, 'e1', T);
    expect(experimentsOf(l)[0].ticks).toEqual([T]);
    l = renameExperiment(l, 'e1', 'Cold shower, 1 minute');
    expect(experimentsOf(l)[0].what).toBe('Cold shower, 1 minute');
    expect(experimentsOf(stopExperiment(l, 'e1'))[0].stopped).toBe(true);
    expect(dropExperiment(l, 'e1')).toEqual([]);
    expect(experimentsOf([{ id: 'x', what: 'a', from: T, days: 5 }])[0].days).toBe(7);
  });
  it('compares the days of the experiment with the same days before; a fact counts as a tick', () => {
    const from = addDays(T, -6);
    const rows = lastDays(T, 14).map((d) => row(d, 'erreicht.zufrieden', d >= from ? 8 : 6));
    const out = lastDays(T, 14).filter((d) => d >= from).map((d) => row(d, 'natur.draussen', 'm90', 'chips'));
    const data = dayData({ rows: [...rows, ...out], days: lastDays(T, 14) });
    const [x] = experimentsOf(startExperiment([], { what: '10 minutes outside every day', std: true, fact: 'outside', days: 7 }, from, 'e'));
    const s = experimentState(x, data, T);
    expect(s).toMatchObject({ day: 7, end: T, done: false, ticks: 7, diff: 2 });
    expect(experimentState(x, data, addDays(T, 1)).done).toBe(true);
  });
});

describe('life phases', () => {
  it('the app suggests the last 4 seasons, the one now first', () => {
    const s = suggestedPhases('2026-10-19');
    expect(s.map((p) => p.id)).toEqual(['season-2026-autumn', 'season-2026-summer', 'season-2026-spring', 'season-2025-winter']);
    expect(s[0]).toMatchObject({ from: '2026-09-01', until: '2026-10-19' });
    expect(s[3]).toMatchObject({ from: '2025-12-01', until: '2026-02-28', year: '2025/26' });
  });
  it('own phases; suggestions can be renamed and removed', () => {
    let v = addPhase(null, { name: 'New job', from: '2026-03-01', until: '2026-06-30' }, 'p1');
    v = renamePhase(v, 'p1', 'New job, first months');
    v = renamePhase(v, 'season-2026-summer', 'Summer of the long tour');
    v = dropPhase(v, 'season-2026-spring');
    expect(phasesOf(v)).toEqual({ own: [{ id: 'p1', name: 'New job, first months', from: '2026-03-01', until: '2026-06-30' }], names: { 'season-2026-summer': 'Summer of the long tour' }, hidden: ['season-2026-spring'] });
    expect(phasesOf(dropPhase(v, 'p1')).own).toEqual([]);
  });
  it('compares the phases by their days', () => {
    const data = dayData({ rows: sample(), days });
    const [r] = phaseRows([{ id: 'a', from: days[0], until: T }], data);
    expect(r).toMatchObject({ n: 30, goodShare: 50, top: 'outside' });
  });
});

import { widgetValues, albumOf, greetPhoto, albumCfgOf } from '../src/lib/wohl.js';

describe('the data widget', () => {
  it('km of today and the week, the weather, sleep and HRV with your normal', () => {
    const km = [{ date: T, km: 12.5, kind: 'ride' }, { date: addDays(T, -3), km: 30, kind: 'ride' }, { date: addDays(T, -9), km: 50, kind: 'ride' }];
    const health = lastDays(addDays(T, -1), 20).map((d, i) => ({ date: d, hrvMs: 40 + (i % 2) * 10, restingHr: 52, sleep: { asleepMin: 420 } }));
    health.push({ date: T, hrvMs: 61, restingHr: 50, sleep: { asleepMin: 390 } });
    const w = widgetValues({ km, health, forecast: { days: [{ date: T, min: 6.4, max: 14.6, rain: 'showers' }] }, today: T });
    expect(w).toMatchObject({ kmToday: 12.5, kmWeek: 42.5, weather: { min: 6, max: 15, rain: 'showers' }, sleepH: 6.5, sleepNormal: 7, hrv: 61, restingHr: 50, restingNormal: 52, day: T });
    expect(w.hrvNormal).toBeCloseTo(45, 0);
  });
  it('without data: zeros and nulls, nothing invented', () => {
    expect(widgetValues({ today: T })).toMatchObject({ kmToday: 0, kmWeek: 0, weather: null, sleepH: null, hrv: null, day: null });
  });
  it('today has only steps (Fitbit sends the night later): each value shows its last day within 7 days', () => {
    // Noah 26.10.2026 «1a»: a row of today without sleep, HRV and resting pulse used to blank all three
    const health = [
      { date: addDays(T, -2), sleep: { asleepMin: 300 }, hrvMs: 40, restingHr: 49 },
      { date: addDays(T, -1), sleep: { asleepMin: 282 }, restingHr: 48 },
      { date: T, steps: 4000 },
    ];
    expect(widgetValues({ health, today: T })).toMatchObject({ sleepH: 4.7, sleepDay: addDays(T, -1), hrv: 40, hrvDay: addDays(T, -2), restingHr: 48, restingDay: addDays(T, -1), day: T });
    // older than 7 days counts as no value
    expect(widgetValues({ health: [{ date: addDays(T, -7), restingHr: 50 }], today: T })).toMatchObject({ restingHr: null, restingDay: null });
  });
});

describe('the photo album', () => {
  it('only album photos, one per visit; the greeting can be switched off', () => {
    const photos = [{ id: 'a', album: true, data: 'x', addedAt: '2' }, { id: 'b', bikeId: 'v', data: 'y' }, { id: 'c', album: true, data: 'z', addedAt: '1' }];
    expect(albumOf(photos).map((p) => p.id)).toEqual(['c', 'a']);
    expect(greetPhoto(albumOf(photos), 0.9).id).toBe('a');
    expect(greetPhoto([], 0.5)).toBe(null);
    expect(albumCfgOf(null).greet).toBe(true);
    expect(albumCfgOf({ greet: false }).greet).toBe(false);
  });
});

import { jarNotes, jarPick, lowToday, weatherDays, morningTip, fetchPastWeather } from '../src/lib/wohl.js';

describe('jar of good moments', () => {
  const rows = [
    { ...row('2026-10-10', 'achtsamkeit.dank', 8), note: 'Coffee in the sun' },
    row('2026-10-12', 'erreicht.stolz', 'Fixed the chain myself', 'text'),
    row('2026-10-13', 'achtsamkeit.dank', 6),
    row('2026-10-14', 'erreicht.stolz', '  ', 'text'),
  ];
  it('collects the grateful notes and the proud sentences, newest first', () => {
    expect(jarNotes(rows).map((n) => [n.text, n.kind])).toEqual([['Fixed the chain myself', 'proud'], ['Coffee in the sun', 'thanks']]);
  });
  it('picks 3, another seed another choice', () => {
    const notes = Array.from({ length: 9 }, (_, i) => ({ id: String(i), day: T, text: `n${i}` }));
    expect(jarPick(notes, 0)).toHaveLength(3);
    expect(jarPick(notes, 0).map((n) => n.id)).not.toEqual(jarPick(notes, 0.5).map((n) => n.id));
  });
  it('a low day from the battery', () => {
    expect(lowToday([row(T, 'erholung.akku', 3)], T)).toBe(true);
    expect(lowToday([row(T, 'erholung.akku', 7)], T)).toBe(false);
    expect(lowToday([], T)).toBe(null);
  });
});

describe('weather and good days', () => {
  it('the day score per weather group, the best one', () => {
    const data = dayData({ rows: sample(), days });
    const wx = days.map((d, i) => ({ date: d, max: i % 2 === 0 ? 22 : 8, rainMm: i % 2 === 0 ? 0 : 4 }));
    const w = weatherDays(data, wx);
    expect(w.best).toMatchObject({ key: 'dry', mean: 8, n: 15 });
    expect(w.groups.find((g) => g.key === 'rain').mean).toBe(5);
  });
  it('your answer counts when there is no weather from the service', () => {
    const rows = [...sample(), ...days.map((d, i) => row(d, 'natur.wetter', i % 2 === 0 ? ['sun'] : ['rain'], 'chips'))];
    expect(weatherDays(dayData({ rows, days }), [], rows).best.key).toBe('dry');
  });
  it('reads the past days of Open-Meteo', async () => {
    const fetcher = async (url) => ({ ok: url.includes('past_days=60'), json: async () => ({ daily: { time: [T], temperature_2m_max: [12.5], precipitation_sum: [0.2] } }) });
    expect(await fetchPastWeather({ lat: 47.4, lon: 8.5 }, fetcher)).toEqual([{ date: T, max: 12.5, rainMm: 0.2 }]);
  });
});

describe('recipe as a morning suggestion', () => {
  it('on a low battery: a part of your good days in the chosen minutes', () => {
    const rows = [...sample(), row(T, 'erholung.akku', 3)];
    const data = dayData({ rows, days });
    expect(morningTip(data, rows, T, 5)).toMatchObject({ fact: 'outside', cat: 'nature', text: 'Open the window and look outside' });
    expect(morningTip(data, [...sample(), row(T, 'erholung.akku', 8)], T)).toBe(null);
  });
});

// Noah 19.10.2026 «5a»: which items of «Das tut mir gut» carry your good days
import { routineCarry } from '../src/lib/wohl.js';
describe('routineCarry', () => {
  const data = Array.from({ length: 12 }, (_, i) => ({ day: `2026-10-${String(i + 1).padStart(2, '0')}`, score: i % 2 ? 8 : 5, facts: {} }));
  const items = [{ id: 'walk' }, { id: 'banana' }, { id: 'tea' }];
  const opts = {
    isFor: () => true,
    doneOf: (item, day) => (item.id === 'walk' ? Number(day.slice(-2)) % 2 === 0 : item.id === 'banana' ? Number(day.slice(-2)) <= 6 : false),
    feltOf: (item, day) => (item.id === 'walk' && day <= '2026-10-04' ? 2 : item.id === 'tea' && day === '2026-10-01' ? 0 : null),
  };
  it('the done days against the other days, with the answers; an item with nothing to say is left out', () => {
    const r = routineCarry(items, data, opts);
    expect(r.map((x) => x.id)).toEqual(['walk', 'banana', 'tea']);
    expect(r[0]).toMatchObject({ withScore: 8, without: 5, nWith: 6, nWithout: 6, diff: 3, carries: true, felt: { yes: 4, n: 4 } });
    expect(r[1]).toMatchObject({ diff: 0, carries: false });
    expect(r[2]).toMatchObject({ diff: null, carries: false, felt: { no: 1, n: 1 } });
    expect(routineCarry(items, data, { ...opts, feltOf: () => null, doneOf: () => false })).toEqual([]);
  });
});
