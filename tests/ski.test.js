// v0.97.0 «Skitouren» (mockups A–E): the pure rules of the ski pages (src/lib/ski.js). Fictional data
// only (Piz Beispiel, Muster-Gipfel, Sam, Alex); dates are fixed calendar days.
import { describe, it, expect } from 'vitest';
import {
  SKI_GROUPS, skiGroupOf, GROUP_BY_CATEGORY, nextSkiTrip, lastWithoutNotes, inSeason, seasonId, seasonStats, checkGroups, checkCount, togglePacked,
  START_CHECKS, withStartChecks, turnTime, turnDue, parseDuration, durationText, companions, afterLearnings, learningsByGroup, groupOfText,
  CARE_TASKS, CARE_PHASES, careTasks, careState, careDue, careEntry, seasonHm, stravaFor, mergeStrava, WAX_EVERY,
} from '../src/lib/ski.js';
import { READY_BY_DOMAIN, newPackTrip } from '../src/lib/domains.js';
import { parseStravaCsv } from '../src/lib/kmbook.js';
import { learningsFor } from '../src/lib/debrief.js';
import DE from '../src/lib/i18n/de/index.js';

const item = (id, category, name, extra = {}) => ({ id, name, category, domains: ['ski'], ownership: 'owned', ...extra });
const ski = (id, startDate, extra = {}) => ({ id, domain: 'ski', title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [], ready: [], status: 'planned', ...extra });

describe('the five ski groups', () => {
  it('are in Noah\'s order, each with a German name', () => {
    expect(SKI_GROUPS.map((g) => g.key)).toEqual(['hardware', 'safety', 'clothing', 'protect', 'food']);
    expect(SKI_GROUPS.map((g) => DE[g.name])).toEqual(['Hardware & Aufstieg', 'Sicherheitsausrüstung', 'Bekleidung', 'Orientierung & Schutz', 'Verpflegung']);
  });

  it('an item\'s own group first, then LVS/Schaufel/Sonde by name, then its category', () => {
    expect(skiGroupOf(item('a', 'tools', 'Tourenski', { skiGroup: 'safety' }))).toBe('safety');
    expect(skiGroupOf(item('b', 'elec', 'LVS-Gerät'))).toBe('safety');
    expect(skiGroupOf(item('c', 'tools', 'Lawinenschaufel'))).toBe('safety');
    expect(skiGroupOf(item('d', 'tools', 'Probe', { nameDe: 'Lawinensonde 240 cm' }))).toBe('safety');
    for (const [cat, group] of [['tools', 'hardware'], ['shoes', 'hardware'], ['rain', 'clothing'], ['onbike', 'clothing'], ['offbike', 'clothing'], ['elec', 'protect'], ['hyg', 'protect'], ['sleep', 'protect'], ['food', 'food']]) {
      expect(skiGroupOf(item('x', cat, 'Muster-Teil')), cat).toBe(group);
      expect(GROUP_BY_CATEGORY[cat]).toBe(group);
    }
    expect(skiGroupOf(item('y', 'unknown', 'Muster-Teil'))).toBe('protect');
    expect(skiGroupOf(item('z', 'food', 'Tee', { skiGroup: 'nonsense' }))).toBe('food');
  });

  it('groups a trip\'s entries in that order and counts n of m; a tap toggles packed', () => {
    const items = [item('s1', 'tools', 'Tourenski'), item('s2', 'elec', 'LVS-Gerät'), item('s3', 'food', 'Thermosflasche'), item('s4', 'rain', 'Hardshell-Jacke')];
    const trip = ski('t', '2026-12-12', { entries: [{ itemId: 's3', slot: 'pack', qty: 1, packed: true }, { itemId: 's2', slot: 'body', qty: 1, packed: false }, { itemId: 's1', slot: 'pack', qty: 1, packed: true }, { itemId: 's4', slot: 'pack', qty: 1, packed: false }, { itemId: 'gone', slot: 'pack', qty: 1, packed: true }] });
    const groups = checkGroups(trip, items);
    expect(groups.map((g) => [g.key, g.packed, g.total])).toEqual([['hardware', 1, 1], ['safety', 0, 1], ['clothing', 0, 1], ['food', 1, 1]]);
    expect(checkCount(groups)).toEqual({ packed: 2, total: 4 });
    const next = togglePacked(trip.entries, 's2', 'body');
    expect(next.find((e) => e.itemId === 's2').packed).toBe(true);
    expect(next.filter((e) => e.packed).length).toBe(4);
    expect(togglePacked(next, 's2', 'body').find((e) => e.itemId === 's2').packed).toBe(false);
  });
});

describe('the next ski trip', () => {
  const today = '2026-12-10';
  it('the soonest from today on, not finished or skipped; else the last one; else none', () => {
    const trips = [
      ski('later', '2026-12-20'),
      ski('soon', '2026-12-13'),
      ski('skipped', '2026-12-11', { skipped: true }),
      ski('finished', '2026-12-10', { finished: '2026-12-10' }),
      ski('past', '2026-12-01'),
      { ...ski('bike', '2026-12-11'), domain: 'bikepacking' },
    ];
    expect(nextSkiTrip(trips, today)).toEqual({ trip: trips[1], upcoming: true });
    expect(nextSkiTrip([ski('a', '2026-11-20'), ski('b', '2026-12-01')], today)).toMatchObject({ trip: { id: 'b' }, upcoming: false });
    expect(nextSkiTrip([], today)).toBe(null);
    expect(nextSkiTrip([ski('today', today)], today)?.trip.id).toBe('today');
  });

  it('the last tour without notes for «Nach der Tour»', () => {
    const trips = [ski('a', '2026-12-01', { ski: { savedAt: '2026-12-01T18:00:00Z' } }), ski('b', '2026-12-05'), ski('c', '2026-12-20')];
    expect(lastWithoutNotes(trips, today)?.id).toBe('b');
    expect(lastWithoutNotes([trips[0]], today)).toBe(null);
  });
});

describe('the season', () => {
  it('runs from 1 November to 31 May', () => {
    for (const d of ['2026-11-01', '2026-12-24', '2027-01-15', '2027-05-31']) expect(inSeason(d), d).toBe(true);
    for (const d of ['2026-10-31', '2026-06-01', '2026-08-15']) expect(inSeason(d), d).toBe(false);
  });

  it('has an id like «2026/27»; October counts to the coming season', () => {
    expect(seasonId('2026-11-01')).toBe('2026/27');
    expect(seasonId('2027-03-01')).toBe('2026/27');
    expect(seasonId('2027-08-01')).toBe('2026/27');
    expect(seasonId('2026-10-11')).toBe('2026/27');
    expect(seasonId('2026-09-30')).toBe('2025/26');
    expect(seasonId('2099-12-01')).toBe('2099/00');
  });

  it('sums tours and metres climbed of the season from trip.ski', () => {
    const trips = [
      ski('a', '2026-12-05', { ski: { peak: 'Piz Beispiel', hm: 1350, savedAt: 'x' } }),
      ski('b', '2027-01-09', { ski: { peak: 'Muster-Gipfel', hm: '1180', savedAt: 'x' } }),
      ski('c', '2027-01-20'), // over, without notes: a tour, no metres
      ski('d', '2027-02-20'), // still to come
      ski('e', '2026-03-01', { ski: { hm: 900, savedAt: 'x' } }), // the season before
      ski('f', '2027-01-10', { skipped: true, ski: { hm: 500 } }),
    ];
    const s = seasonStats(trips, '2027-02-01');
    expect(s).toMatchObject({ id: '2026/27', tours: 3, hm: 2530 });
    expect(s.peaks.map((p) => p.name)).toEqual(['Muster-Gipfel', 'Piz Beispiel']);
    expect(seasonHm(trips, '2026/27', '2027-02-01')).toBe(2530);
  });
});

describe('the start check', () => {
  it('new ski trips get the five checks; an older trip keeps its own and gets the missing ones', () => {
    expect(READY_BY_DOMAIN.ski.map((r) => r.id)).toEqual(['lvs', 'battery', 'group', 'bulletin', 'turn']);
    expect(START_CHECKS.map((r) => r.id)).toEqual(['lvs', 'battery', 'group', 'bulletin', 'turn']);
    const t = newPackTrip({ title: 'test_data_gtp_ Piz Beispiel', startDate: '2026-12-12', days: 1, domain: 'ski' }, [], []);
    expect(t.ready.map((r) => r.id)).toEqual(['lvs', 'battery', 'group', 'bulletin', 'turn']);
    const old = [{ id: 'lvs', label: 'Avalanche transceiver on and tested', done: true }, { id: 'skins', label: 'Skins, crampons, poles', done: false }];
    const next = withStartChecks(old);
    expect(next.map((r) => r.id)).toEqual(['lvs', 'skins', 'battery', 'group', 'bulletin', 'turn']);
    expect(next[0]).toEqual(old[0]);
    expect(withStartChecks(next)).toBe(null);
    for (const c of START_CHECKS) expect(DE[c.label], c.id).toBeTruthy();
  });

  it('reads a turnaround time and says when it has come (only on the tour\'s day)', () => {
    expect(turnTime('13:00')).toBe('13:00');
    expect(turnTime('9.30')).toBe('09:30');
    expect(turnTime('25:00')).toBe('');
    expect(turnTime('')).toBe('');
    const trip = ski('t', '2026-12-12', { ski: { turnAt: '13:00' } });
    const at = (h, m) => new Date(2026, 11, 12, h, m);
    expect(turnDue(trip, '2026-12-12', at(12, 59))).toBe(false);
    expect(turnDue(trip, '2026-12-12', at(13, 0))).toBe(true);
    expect(turnDue(trip, '2026-12-13', at(13, 30))).toBe(false);
    expect(turnDue({ ...trip, finished: '2026-12-12' }, '2026-12-12', at(14, 0))).toBe(false);
    expect(turnDue(ski('u', '2026-12-12'), '2026-12-12', at(14, 0))).toBe(false);
  });
});

describe('after the tour', () => {
  it('reads durations as h:mm', () => {
    expect(parseDuration('3:40')).toBe(220);
    expect(parseDuration('3 h 40')).toBe(220);
    expect(parseDuration('5h')).toBe(300);
    expect(parseDuration('95')).toBe(95);
    expect(parseDuration('')).toBe(null);
    expect(parseDuration('abc')).toBe(null);
    expect(durationText(220)).toBe('3:40');
    expect(durationText(null)).toBe('');
  });

  it('offers the names of everyone who came along before, most often first', () => {
    const trips = [ski('a', '2026-12-01', { ski: { with: ['Sam', 'Alex'] } }), ski('b', '2026-12-08', { ski: { with: ['Sam'] } }), ski('c', '2026-12-09')];
    expect(companions(trips)).toEqual(['Sam', 'Alex']);
  });

  it('makes learnings of area ski: clothing answers in group clothing, the learning by its words; saving again replaces them', () => {
    const trip = ski('t', '2026-12-06', { title: 'test_data_gtp_ Muster-Gipfel' });
    const answers = { changeTags: ['too warm on the way up', 'Mütze dünner'], change: 'Isolationsjacke erst am Gipfel', learning: 'Harscheisen ab 2 200 m nötig' };
    const before = [{ id: 7, topic: 'Debrief', rule: 'old' }];
    const { add, drop } = afterLearnings(trip, answers, before, { now: '2026-12-06T18:00:00.000Z', tr: (s) => DE[s] ?? s });
    expect(drop).toEqual([]);
    expect(add.map((l) => [l.id, l.rule, l.skiGroup])).toEqual([
      [8, 'zu warm im Aufstieg', 'clothing'],
      [9, 'Mütze dünner', 'clothing'],
      [10, 'Isolationsjacke erst am Gipfel', 'clothing'],
      [11, 'Harscheisen ab 2 200 m nötig', 'hardware'],
    ]);
    expect(add[0]).toMatchObject({ area: 'ski', appliesTo: ['ski'], topic: 'Ski tour', tripId: 't', from: 'ski-after', source: trip.title });
    const again = afterLearnings(trip, { learning: 'Früh los' }, [...before, ...add]);
    expect(again.drop).toEqual([8, 9, 10, 11]);
    expect(again.add.map((l) => [l.id, l.skiGroup])).toEqual([[8, null]]);
    expect(groupOfText('LVS-Batterie war fast leer')).toBe('safety');
    expect(groupOfText('Thermos voll')).toBe('food');
  });

  it('shows ski learnings under their group in the check, and only on ski trips', () => {
    const ls = [
      { id: 1, area: 'ski', skiGroup: 'clothing', rule: 'Handschuhe warm', createdAt: '2026-12-06T18:00:00Z', topic: 'Ski tour', priority: 'medium' },
      { id: 2, area: 'ski', skiGroup: null, rule: 'Früh los', createdAt: '2026-12-07T18:00:00Z', topic: 'Ski tour', priority: 'medium' },
      { id: 3, rule: 'Bike rule', topic: 'Debrief', priority: 'medium', createdAt: '2026-12-01T18:00:00Z' },
    ];
    const g = learningsByGroup(ls);
    expect(g.clothing.map((l) => l.id)).toEqual([1]);
    expect(g.general.map((l) => l.id)).toEqual([2]);
    expect(g.hardware).toEqual([]);
    const now = new Date('2026-12-08T12:00:00Z');
    expect(learningsFor(ski('t', '2026-12-12'), ls, 5, now).map((l) => l.id).sort()).toEqual([1, 2, 3]);
    expect(learningsFor({ domain: 'bikepacking', startDate: '2026-12-12', entries: [] }, ls, 5, now).map((l) => l.id)).toEqual([3]);
  });
});

describe('Strava ski tours', () => {
  const csv = [
    'Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Distance,Activity Gear,Moving Time,Elevation Gain',
    '101,"Dec 6, 2026, 7:12:33 AM",Muster-Gipfel,Backcountry Ski,18900,9.4,,13200,1180',
    '102,"Dec 7, 2026, 9:00:00 AM",Runde,Ride,3600,30.2,test_data_gtp_ Scale,3500,300',
    '103,"Jan 3, 2027, 9:00:00 AM",Loipe,Nordic Ski,5400,20.1,,5200,150',
  ].join('\n');

  it('the import keeps them apart from the rides, with metres climbed and both durations', () => {
    const { rides, other, ski: tours } = parseStravaCsv(csv);
    expect(rides.map((r) => r.name)).toEqual(['Runde']);
    expect(other).toBe(2);
    expect(tours).toEqual([
      { date: '2026-12-06', time: '2026-12-06T07:12:33Z', type: 'Backcountry Ski', name: 'Muster-Gipfel', hm: 1180, activeMin: 220, elapsedMin: 315, stravaId: '101' },
      { date: '2027-01-03', time: '2027-01-03T09:00:00Z', type: 'Nordic Ski', name: 'Loipe', hm: 150, activeMin: 87, elapsedMin: 90, stravaId: '103' },
    ]);
  });

  it('«Nach der Tour» finds the one of the tour\'s day; a second import does not double them', () => {
    const { ski: tours } = parseStravaCsv(csv);
    expect(stravaFor(ski('t', '2026-12-06'), tours)?.stravaId).toBe('101');
    expect(stravaFor(ski('t', '2026-12-08'), tours)).toBe(null);
    expect(mergeStrava(tours, tours).length).toBe(2);
    expect(mergeStrava(tours, [{ ...tours[0], hm: 1200 }]).find((a) => a.stravaId === '101').hm).toBe(1200);
  });
});

describe('the season care', () => {
  const tasks = careTasks(null);
  const T = Object.fromEntries(tasks.map((x) => [x.id, x]));

  it('three phases with the tasks of the mockup, each in German', () => {
    expect(CARE_PHASES.map((p) => p.key)).toEqual(['start', 'during', 'end']);
    expect(CARE_PHASES.map((p) => tasks.filter((x) => x.phase === p.key).length)).toEqual([7, 3, 4]);
    for (const x of CARE_TASKS) expect([DE[x.task], DE[x.hint]].every(Boolean), x.id).toBe(true);
  });

  it('start tasks are due from 1 November until done this season (October: soon)', () => {
    expect(careState(T.skins, [], '2026-11-01', 0).state).toBe('due');
    expect(careState(T.skins, [], '2027-03-01', 0).state).toBe('due');
    expect(careState(T.skins, [], '2026-10-11', 0).state).toBe('soon');
    expect(careState(T.skins, [], '2026-08-01', 0).state).toBe('');
    const done = careEntry(T.skins, '2026-11-03', 0, 1);
    expect(done).toMatchObject({ task: 'skins', day: '2026-11-03', hm: 0, season: '2026/27' });
    expect(careState(T.skins, [done], '2027-01-01', 0)).toMatchObject({ state: 'ok', done });
    expect(careState(T.skins, [{ ...done, season: '2025/26' }], '2026-11-02', 0).state).toBe('due');
    expect(careDue(tasks, [done], '2026-11-04', 0)).toBe(6);
  });

  it('wax is due every 5,000 m climbed since the last wax this season (soon from 4,000)', () => {
    expect(careState(T.wax, [], '2026-12-20', 1200)).toMatchObject({ state: '', left: 3800 });
    expect(careState(T.wax, [], '2027-01-20', 4200)).toMatchObject({ state: 'soon', left: 800 });
    expect(careState(T.wax, [], '2027-02-20', WAX_EVERY)).toMatchObject({ state: 'due', left: 0 });
    const waxed = { id: 'w', task: 'wax', day: '2027-02-21', hm: 5100, season: '2026/27' };
    expect(careState(T.wax, [waxed], '2027-02-22', 5300)).toMatchObject({ state: 'ok', left: 4800 });
    expect(careState(T.wax, [waxed], '2027-04-22', 10100)).toMatchObject({ state: 'due', left: 0 });
  });

  it('end tasks are due from 1 May (April: soon); during tasks have no date', () => {
    expect(careState(T['lvs-out'], [], '2027-05-01', 0).state).toBe('due');
    expect(careState(T['lvs-out'], [], '2027-04-15', 0).state).toBe('soon');
    expect(careState(T['lvs-out'], [], '2027-02-15', 0).state).toBe('');
    expect(careState(T.dry, [], '2027-02-15', 0).state).toBe('');
  });

  it('the list is yours: own tasks join their phase, hidden ones go', () => {
    const list = careTasks({ own: [{ id: 'own-1', phase: 'start', task: 'Stöcke prüfen' }, { id: 'own-2', phase: 'nowhere', task: 'x' }], hidden: ['crampons'] });
    expect(list.filter((x) => x.phase === 'start').map((x) => x.id)).toEqual(['lvs', 'skins', 'service', 'binding', 'boots', 'contact', 'own-1']);
    expect(list.find((x) => x.id === 'own-1').own).toBe(true);
  });
});
