// v0.46.0 «Startseite neu»: the rules of the new Today page, the 16 functions and the command line.
import { describe, it, expect, afterEach } from 'vitest';
import { lang } from '../src/lib/i18n.svelte.js';
import { isTestTrip, homeTrips, testTrips, archiveChanges, greeting, dayPart, weatherLine, dayDry, countdown, soonTrips, weekOf, streakWeeks, monthBars, stepOf, milestoneLevels, milestoneStep, milestonesNow, milestoneText, layoutOf, moveSection, toggleSection, SECTIONS } from '../src/lib/home/heute.js';
import { FUNCTIONS, FIXED, orderFunctions, shownFunctions, bumpUsage, usageOf, dataUsed, usedFunctions, levelOf, untried, tryPick } from '../src/lib/home/functions.js';
import { commandActions, fold } from '../src/lib/search.js';
import { paletteOf, modeOf, resolveMode, DEFAULT_PALETTE } from '../src/lib/theme.svelte.js';

afterEach(() => (lang.v = 'en'));

const trip = (id, title, startDate, extra = {}) => ({ id, title, startDate, days: 1, bikeId: 'b1', bike: 'Factor LS', entries: [], ...extra });

describe('test trips (Noah 10a)', () => {
  it('"test" anywhere in the name, any case; the fixture marker does not count', () => {
    expect(isTestTrip({ title: 'TEST-Runde' })).toBe(true);
    expect(isTestTrip({ title: 'Testtour Jura' })).toBe(true);
    expect(isTestTrip({ title: 'Mein kleiner test' })).toBe(true);
    expect(isTestTrip({ title: 'Herbstrunde Jura' })).toBe(false);
    expect(isTestTrip({ title: 'test_data_gtp_ Jura' })).toBe(false);
    expect(isTestTrip({ title: 'test_data_gtp_ TEST-Runde' })).toBe(true);
  });
  it('never lead on Today; archived ones neither; archiving keeps the trip and skips it', () => {
    const list = [trip('a', 'TEST-1', '2026-10-10'), trip('b', 'Jura', '2026-10-12'), trip('c', 'Emmental', '2026-10-11', { archivedAt: '2026-10-09T08:00:00Z' })];
    expect(homeTrips(list).map((x) => x.id)).toEqual(['b']);
    expect(testTrips(list).map((x) => x.id)).toEqual(['a']);
    expect(soonTrips(list, '2026-10-09').map((x) => x.id)).toEqual(['b']);
    expect(archiveChanges('2026-10-09T10:00:00Z')).toEqual({ archivedAt: '2026-10-09T10:00:00Z', skipped: true, updatedAt: '2026-10-09T10:00:00Z' });
  });
  it('soon trips: soonest first, over and finished ones left out', () => {
    const list = [trip('late', 'Late', '2026-10-20'), trip('over', 'Over', '2026-10-01'), trip('now', 'Now', '2026-10-08', { days: 3 }), trip('fin', 'Fin', '2026-10-09', { finished: '2026-10-09' })];
    expect(soonTrips(list, '2026-10-09').map((x) => x.id)).toEqual(['now', 'late']);
  });
});

describe('greeting and weather', () => {
  it('by time of day, with the name only when there is one', () => {
    expect(dayPart(7)).toBe('morning');
    expect(dayPart(13)).toBe('day');
    expect(dayPart(19)).toBe('evening');
    expect(greeting(7, 'Noah')).toBe('Good morning, Noah.');
    expect(greeting(20, '')).toBe('Good evening.');
    lang.v = 'de';
    expect(greeting(8, 'Noah')).toBe('Guten Morgen, Noah.');
  });
  const hourly = (p, t = 14) => ({ t: Array(24).fill(t), p });
  const fc = (days) => ({ days });
  it('dry until the first wet hour, from this hour on', () => {
    const p = Array(24).fill(10);
    p[17] = 70;
    const f = fc([{ date: '2026-10-09', min: 8, max: 16, hourly: hourly(p) }]);
    lang.v = 'de';
    expect(weatherLine(f, new Date(2026, 9, 9, 9)).text).toBe('14° und trocken bis 17 Uhr.');
    expect(weatherLine(f, new Date(2026, 9, 9, 9)).dry).toBe(true);
    expect(weatherLine(f, new Date(2026, 9, 9, 17)).text).toBe('14° und Regen wahrscheinlich.');
  });
  it('without hours the day word; from 18:00 tomorrow; no day: null', () => {
    const f = fc([{ date: '2026-10-09', max: 12, rain: 'showers' }, { date: '2026-10-10', max: 15, rain: 'none' }]);
    expect(weatherLine(f, new Date(2026, 9, 9, 10)).text).toBe('12°, showers possible.');
    expect(weatherLine(f, new Date(2026, 9, 9, 19))).toMatchObject({ text: 'Tomorrow 15° and dry.', when: 'tomorrow', dry: true });
    expect(weatherLine(f, new Date(2026, 9, 11, 10))).toBe(null);
  });
  it('a dry day for the suggestion: no wet hour from 9 to 18', () => {
    const p = Array(24).fill(10);
    p[20] = 90;
    expect(dayDry(fc([{ date: '2026-10-09', hourly: hourly(p) }]), '2026-10-09')).toBe(true);
    p[15] = 60;
    expect(dayDry(fc([{ date: '2026-10-09', hourly: hourly(p) }]), '2026-10-09')).toBe(false);
    expect(dayDry(fc([{ date: '2026-10-09', rain: 'rain' }]), '2026-10-09')).toBe(false);
    expect(dayDry(fc([]), '2026-10-09')).toBe(false);
  });
});

describe('the countdown (Noah 8a, G010)', () => {
  const now = new Date(2026, 9, 9, 10, 0);
  it('tomorrow in hours, later in days, today, under way with the day', () => {
    expect(countdown(trip('a', 'A', '2026-10-10'), now).text).toBe('Tomorrow · 22 h to go');
    expect(countdown(trip('a', 'A', '2026-10-14'), now)).toMatchObject({ text: 'In 5 days', near: false });
    expect(countdown(trip('a', 'A', '2026-10-09'), now)).toMatchObject({ text: 'Today', near: true });
    expect(countdown(trip('a', 'A', '2026-10-08', { days: 3 }), now)).toMatchObject({ text: 'On the way · day 2 of 3', under: true });
    expect(countdown({ title: 'x' }, now).text).toBe('No date set');
    lang.v = 'de';
    expect(countdown(trip('a', 'A', '2026-10-10'), now).text).toBe('Morgen · noch 22 h');
    expect(countdown(trip('a', 'A', '2026-10-08', { days: 3 }), now).text).toBe('Unterwegs · Tag 2 von 3');
  });
});

describe('the series (Noah 22a)', () => {
  it('weeks start on Monday', () => {
    expect(weekOf('2026-10-09')).toBe('2026-10-05');
    expect(weekOf('2026-10-05')).toBe('2026-10-05');
    expect(weekOf('2026-10-11')).toBe('2026-10-05');
  });
  it('weeks in a row; this week without a ride yet does not break it', () => {
    expect(streakWeeks(['2026-10-06', '2026-09-30', '2026-09-22'], '2026-10-09')).toBe(3);
    expect(streakWeeks(['2026-09-30', '2026-09-22'], '2026-10-09')).toBe(2);
    expect(streakWeeks(['2026-09-30', '2026-09-15'], '2026-10-09')).toBe(1);
    expect(streakWeeks(['2026-09-15'], '2026-10-09')).toBe(0);
    expect(streakWeeks([], '2026-10-09')).toBe(0);
    expect(streakWeeks(['2026-10-20'], '2026-10-09')).toBe(0); // a planned trip is no ride
  });
  it('12 mini bars, this month marked', () => {
    const months = Array.from({ length: 13 }, (_, i) => ({ month: `2025-${String(i + 1).padStart(2, '0')}`, km: i * 10 }));
    months[12] = { month: '2026-10', km: 0 };
    const b = monthBars(months, '2026-10-09');
    expect(b).toHaveLength(12);
    expect(b.at(-1)).toMatchObject({ month: '2026-10', now: true, pct: 0 });
    expect(b.at(-2).pct).toBe(100);
  });
});

describe('milestones (Noah 21a)', () => {
  it('steps of trips', () => {
    expect(stepOf(9)).toBe(0);
    expect(stepOf(10)).toBe(10);
    expect(stepOf(27)).toBe(25);
  });
  it('the first time only stores; a new step is celebrated for its day and the day after', () => {
    const l0 = milestoneLevels({ tripsDone: 9, bikes: [{ id: 'f', name: 'Factor', km: 1980 }], nights: 0 });
    const s0 = milestoneStep(null, l0, '2026-10-08');
    expect(s0.state.events).toEqual([]);
    const l1 = milestoneLevels({ tripsDone: 10, bikes: [{ id: 'f', name: 'Factor', km: 2010 }], nights: 1 });
    const s1 = milestoneStep(s0.state, l1, '2026-10-09');
    expect(s1.changed).toBe(true);
    expect(s1.state.events.map((e) => e.key)).toEqual(['trips', 'bikeKm', 'firstNight']);
    expect(milestonesNow(s1.state, '2026-10-10')).toHaveLength(3);
    expect(milestonesNow(s1.state, '2026-10-11')).toHaveLength(0);
    expect(milestoneText(s1.state.events[1])).toBe('Factor: 2,000 km on the counter.');
    // nothing new: no event, nothing to write
    expect(milestoneStep(s1.state, l1, '2026-10-09')).toMatchObject({ changed: false });
    // a new bike is not a milestone the first time it is seen
    const s2 = milestoneStep(s1.state, milestoneLevels({ tripsDone: 10, bikes: [{ id: 'f', name: 'Factor', km: 2010 }, { id: 'n', name: 'New', km: 5000 }], nights: 1 }), '2026-10-09');
    expect(s2.state.events).toHaveLength(3);
  });
});

describe('layout (Noah 33a)', () => {
  it('made whole, moved and switched', () => {
    expect(layoutOf(null)).toEqual({ order: SECTIONS, off: [] });
    expect(layoutOf({ order: ['year', 'bogus', 'year'], off: ['bikes', 'x'] })).toEqual({ order: ['year', 'greeting', 'trip', 'actions', 'today', 'bikes'], off: ['bikes'] });
    expect(moveSection(null, 'trip', -1).order.slice(0, 2)).toEqual(['trip', 'greeting']);
    expect(moveSection(null, 'greeting', -1).order[0]).toBe('greeting');
    expect(toggleSection(toggleSection(null, 'year'), 'year').off).toEqual([]);
  });
});

describe('the 16 functions (Noah 12a, 13a, 16a, 17a)', () => {
  it('16 with unique ids; the first four fixed, the rest by taps', () => {
    expect(FUNCTIONS).toHaveLength(16);
    expect(new Set(FUNCTIONS.map((f) => f.id)).size).toBe(16);
    expect(orderFunctions({}).slice(0, 4).map((f) => f.id)).toEqual(FIXED);
    const u = bumpUsage(bumpUsage(bumpUsage({ dayride: 9 }, 'debriefs'), 'debriefs'), 'review');
    const order = orderFunctions(u).map((f) => f.id);
    expect(order.slice(0, 6)).toEqual(['dayride', 'trip', 'wear', 'weigh', 'debriefs', 'review']);
    expect(shownFunctions(u, 8)).toHaveLength(7);
    expect(shownFunctions(u, 12)).toHaveLength(11);
    expect(usageOf({ x: 3, wear: '2', km: -1 })).toEqual({ wear: 2 });
  });
  it('used from taps or data; levels; "Tried it yet?" goes round the untried ones', () => {
    const data = dataUsed({ trips: [{ id: 't', startDate: '2026-10-01', days: 1, bikeId: 'b', domain: 'bikepacking' }], items: [{ id: 'i', ownership: 'owned', category: 'tools', favorite: true }], notesN: 1 });
    expect([...data].sort()).toEqual(['dayride', 'favorites', 'gear', 'note']);
    const used = usedFunctions({ wear: 1 }, data);
    expect(used.size).toBe(5);
    expect(levelOf(0)).toBe(1);
    expect(levelOf(9)).toBe(2);
    expect(levelOf(11)).toBe(3);
    expect(levelOf(16)).toBe(4);
    const list = untried(used);
    expect(list).toHaveLength(11);
    expect(tryPick(list, 0).id).toBe('trip');
    expect(tryPick(list, 11).id).toBe('trip');
    expect(tryPick([], 3)).toBe(null);
  });
});

describe('the command line (Noah 14a)', () => {
  const bikes = [{ id: 'f', name: 'Factor LS' }, { id: 's', name: 'Scott Spark' }, { id: 'c', name: 'Scott Scale' }];
  const kinds = (q) => commandActions(q, { bikes }).map((c) => c.cmd);
  it('wiegen, also its start; not with more words', () => {
    expect(kinds('wiegen')).toEqual([{ kind: 'weigh' }]);
    expect(kinds('Wieg')).toEqual([{ kind: 'weigh' }]);
    expect(kinds('weigh')).toEqual([{ kind: 'weigh' }]);
    expect(kinds('wiegen jacke')).toEqual([]);
    expect(kinds('wi')).toEqual([]);
  });
  it('a day ride with a bike named by a word, or without', () => {
    expect(kinds('tagestour factor')).toEqual([{ kind: 'dayride', bikeId: 'f' }]);
    expect(kinds('tagestour')).toEqual([{ kind: 'dayride' }]);
    expect(kinds('tagestour xyz')).toEqual([]);
  });
  it('chain lubed on a bike; without a bike one row per bike; umlauts any way', () => {
    expect(kinds('kette geölt spark')).toEqual([{ kind: 'chain', bikeId: 's' }]);
    expect(kinds('Kette geoelt Spark')).toEqual([{ kind: 'chain', bikeId: 's' }]);
    expect(kinds('chain lubed factor')).toEqual([{ kind: 'chain', bikeId: 'f' }]);
    expect(kinds('kette geölt scott').map((c) => c.bikeId)).toEqual(['s', 'c']);
    expect(kinds('geölt').map((c) => c.bikeId)).toEqual(['f', 's', 'c']);
    expect(kinds('dichtmilch scale')).toEqual([{ kind: 'sealant', bikeId: 'c' }]);
  });
  it('a note with its text as typed', () => {
    expect(kinds('notiz Sattel knarzt')).toEqual([{ kind: 'note', text: 'Sattel knarzt' }]);
    expect(kinds('notiz')).toEqual([{ kind: 'note', text: '' }]);
    lang.v = 'de';
    expect(commandActions('notiz Sattel knarzt', { bikes })[0].title).toBe('Notiz: «Sattel knarzt»');
    expect(commandActions('kette geölt spark', { bikes })[0].title).toBe('Scott Spark: Kette geölt');
  });
  it('a plain search is no command', () => {
    expect(kinds('regenjacke')).toEqual([]);
    expect(kinds('jura')).toEqual([]);
    expect(fold('Geölt Straße')).toBe('geoelt strasse');
  });
});

describe('colour worlds (Noah 4b, 5a)', () => {
  it('a stored choice or the default; System follows the device', () => {
    expect(DEFAULT_PALETTE).toBe('gletscher');
    expect(paletteOf('sandstein')).toBe('sandstein');
    expect(paletteOf('pink')).toBe('gletscher');
    expect(modeOf(null)).toBe('system');
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
    expect(resolveMode('light', true)).toBe('light');
  });
});
