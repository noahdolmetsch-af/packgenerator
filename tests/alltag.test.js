// Paket V «Alltag»: shopping list groups, contracts and their deadline, «Not seen for a while», the
// to-dos in Merken, abroad (emergency numbers, currency) and the flight window. Fictional data only.
import { describe, it, expect } from 'vitest';
import { shopSections, addShopGroup, renameShopGroup, deleteShopGroup, moveShopGroup, moveShopItem, clearDone, shopListText, tripForShopping, newContract, nextEnd, deadlineOf, remindDayOf, perMonth, totals, newPerson, dueOf, isDue, wantedTodos, syncTodos, sosOf, sosOwn, telOf, currencyOf, travelCover, flightOf, alltagPart, SRC_PERSON } from '../src/lib/alltag.js';
import { windowNow, flightBefore } from '../src/lib/home/windows.js';
import { AREAS } from '../src/lib/remind.js';
import { GROUP_PLACES } from '../src/lib/groups.js';

const list = (items, groups = []) => ({ id: 'frei-shopping', name: 'Shopping list', check: true, items, groups });
const it_ = (id, text, group = null, done = null) => ({ id, text, group, done, at: '2026-10-19T08:00:00Z' });

describe('Einkauf: groups and points', () => {
  const l = list([it_('a', 'Milk', 'g1'), it_('b', 'Soap', 'g2'), it_('c', 'Bread', 'g1', '2026-10-19T09:00:00Z'), it_('d', 'Batteries'), it_('e', 'Tea', 'gone')], [{ id: 'g1', name: 'Dairy' }, { id: 'g2', name: 'Household' }]);
  it('sections: groups in order, open first, then without a group (also a deleted group)', () => {
    const s = shopSections(l);
    expect(s.map((x) => x.id)).toEqual(['g1', 'g2', '']);
    expect(s[0].items.map((x) => x.text)).toEqual(['Milk', 'Bread']);
    expect(s[2].items.map((x) => x.text)).toEqual(['Batteries', 'Tea']);
  });
  it('rename, add, move and delete a group; deleting keeps the points', () => {
    expect(renameShopGroup(l, 'g1', '  Milk things ').groups[0].name).toBe('Milk things');
    expect(renameShopGroup(l, 'g1', '  ').groups[0].name).toBe('Dairy');
    expect(addShopGroup(l, 'Bakery', 'g3').groups.map((g) => g.name)).toEqual(['Dairy', 'Household', 'Bakery']);
    expect(moveShopGroup(l, 'g2', 0).groups.map((g) => g.id)).toEqual(['g2', 'g1']);
    const gone = deleteShopGroup(l, 'g1');
    expect(gone.groups.map((g) => g.id)).toEqual(['g2']);
    expect(gone.items).toHaveLength(5);
    expect(gone.items.find((x) => x.id === 'a').group).toBe(null);
    expect(deleteShopGroup(l, 'g1', 'g2').items.find((x) => x.id === 'a').group).toBe('g2');
  });
  it('moves an open point within its section only', () => {
    const m = list([it_('a', 'A'), it_('x', 'X', 'g1'), it_('b', 'B'), it_('c', 'C')], [{ id: 'g1', name: 'G' }]);
    const moved = moveShopItem(m, 'c', 0);
    expect(shopSections(moved).at(-1).items.map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(moved.items[1].id).toBe('x');
  });
  it('clears the ticked points and writes the list as text', () => {
    expect(clearDone(l).items.map((x) => x.id)).toEqual(['a', 'b', 'd', 'e']);
    const txt = shopListText(l, { title: 'Shopping list', without: 'Without a group', trip: { title: 'For the trip «Test»', rows: [{ name: 'Gel', qty: 3, done: false }] } });
    expect(txt).toContain('Dairy\n☐ Milk');
    expect(txt).not.toContain('Bread');
    expect(txt).toContain('Without a group\n☐ Batteries');
    expect(txt).toContain('☐ 3 × Gel');
  });
  it('the trip of the shopping list: the next one that has not ended', () => {
    const trips = [{ id: 'old', startDate: '2026-10-01', days: 2 }, { id: 'on', startDate: '2026-10-18', days: 3 }, { id: 'later', startDate: '2026-11-01' }, { id: 'idea', startDate: '2026-10-20', idea: true }];
    expect(tripForShopping(trips, '2026-10-19').id).toBe('on');
    expect(tripForShopping(trips, '2026-10-21').id).toBe('later');
    expect(tripForShopping([], '2026-10-19')).toBe(null);
  });
  it('the shopping groups are a group place (rename and delete)', () => {
    expect(GROUP_PLACES.some((p) => p.file === 'src/lib/alltag/Einkauf.svelte')).toBe(true);
  });
});

describe('Verträge und Abos', () => {
  const today = '2026-10-19';
  it('a clean contract; no name, no contract', () => {
    expect(newContract({ name: ' ' })).toBe(null);
    const c = newContract({ name: 'Test phone', cost: '29,90', period: 'month', end: '2027-03-31', notice: 2, renew: 12 }, 'c1');
    expect(c).toMatchObject({ id: 'c1', cost: 29.9, notice: 2, renew: 12, remind: 14, travel: false });
  });
  it('deadline: end minus notice, rolled on to the next term', () => {
    const c = newContract({ name: 'X', end: '2027-03-31', notice: 2, renew: 12 }, 'c');
    expect(deadlineOf(c, today)).toBe('2027-01-31');
    expect(remindDayOf(c, today)).toBe('2027-01-17');
    const past = newContract({ name: 'Y', end: '2025-06-30', notice: 1, renew: 12 }, 'p');
    expect(nextEnd(past, today)).toBe('2027-06-30');
    expect(deadlineOf(past, today)).toBe('2027-05-30');
    const ends = newContract({ name: 'Z', end: '2026-01-31', notice: 0, renew: 0 }, 'z');
    expect(deadlineOf(ends, today)).toBe('2026-01-31');
    expect(deadlineOf(newContract({ name: 'no end' }, 'n'), today)).toBe(null);
  });
  it('no reminder when off or stopped', () => {
    expect(remindDayOf(newContract({ name: 'X', end: '2027-03-31', remind: 0 }, 'c'), today)).toBe(null);
    expect(remindDayOf(newContract({ name: 'X', end: '2027-03-31', stopped: true }, 'c'), today)).toBe(null);
  });
  it('the sum per month and year (a stopped one does not count)', () => {
    const l = [newContract({ name: 'A', cost: 30, period: 'month' }, 'a'), newContract({ name: 'B', cost: 120, period: 'year' }, 'b'), newContract({ name: 'C', cost: 50, stopped: true }, 'c')];
    expect(perMonth(l[1])).toBe(10);
    expect(totals(l)).toEqual({ month: 40, year: 480 });
  });
  it('travel insurance shows at trips abroad', () => {
    const l = [newContract({ name: 'Trip cover', travel: true }, 'a'), newContract({ name: 'Old', travel: true, stopped: true }, 'b'), newContract({ name: 'Phone' }, 'c')];
    expect(travelCover(l).map((c) => c.id)).toEqual(['a']);
  });
});

describe('Lange nicht gesehen', () => {
  const today = '2026-10-19';
  it('a clean person and the day it is time again', () => {
    expect(newPerson({ name: '' })).toBe(null);
    const p = newPerson({ name: 'Alex Test', n: 6, unit: 'week', seen: '2026-09-01' }, 'p1');
    expect(dueOf(p, today)).toBe('2026-10-13');
    expect(isDue(p, today)).toBe(true);
    const q = newPerson({ name: 'Kim Test', n: 2, unit: 'month', seen: '2026-09-30' }, 'p2');
    expect(dueOf(q, today)).toBe('2026-11-30');
    expect(isDue(q, today)).toBe(false);
    expect(dueOf(newPerson({ name: 'New' }, 'p3'), today)).toBe(today);
  });
});

describe('the to-dos in Kalender › Merken', () => {
  const today = '2026-10-19';
  const texts = { contract: (c, d) => `Cancel ${c.name} by ${d}`, person: (p) => `Call ${p.name}` };
  const contracts = [newContract({ name: 'Phone', end: '2027-03-31', notice: 2 }, 'c1')];
  const people = [newPerson({ name: 'Alex', n: 1, unit: 'month', seen: '2026-10-01' }, 'p1'), newPerson({ name: 'Off', off: true }, 'p2')];
  it('wanted: one per contract with a reminder (with a time) and one per person (quiet)', () => {
    const w = wantedTodos({ contracts, people, today, texts });
    expect(w).toEqual([
      { src: 'contract:c1', text: 'Cancel Phone by 2027-01-31', due: '2027-01-17', remind: { at: '09:00', before: 0 }, area: 'contract' },
      { src: 'person:p1', text: 'Call Alex', due: '2026-11-01', remind: null, area: 'people' },
    ]);
    expect(wantedTodos({ contracts, people, peopleOn: false, today, texts }).map((x) => x.src)).toEqual(['contract:c1']);
  });
  it('sync adds, changes, keeps a ticked one on the same day, opens it on a new day, removes the rest', () => {
    const own = { id: 'own', text: 'Mine', src: null };
    const w = wantedTodos({ contracts, people, today, texts });
    const first = syncTodos([own], w, { now: '2026-10-19T10:00:00Z' });
    expect(first.changed).toBe(true);
    expect(first.todos.map((x) => x.src)).toEqual([null, 'contract:c1', 'person:p1']);
    expect(syncTodos(first.todos, w).changed).toBe(false);
    const ticked = first.todos.map((x) => (x.src === 'person:p1' ? { ...x, doneAt: '2026-11-01T08:00:00Z' } : x));
    expect(syncTodos(ticked, w).changed).toBe(false);
    const seen = wantedTodos({ contracts, people: [{ ...people[0], seen: '2026-11-02' }], today, texts });
    const again = syncTodos(ticked, seen).todos.find((x) => x.src === SRC_PERSON + 'p1');
    expect(again).toMatchObject({ due: '2026-12-02', doneAt: null });
    const none = syncTodos(first.todos, []);
    expect(none.todos).toEqual([own]);
  });
  it('the areas of Ich › Erinnerungen know contracts and people', () => {
    expect(AREAS.map((a) => a.key)).toEqual(expect.arrayContaining(['contract', 'people']));
  });
});

describe('Abroad: emergency numbers and currency', () => {
  it('start numbers per country, 112 for others, own ones win', () => {
    expect(sosOf('FR').map((x) => x.no)).toEqual(['112', '15', '17']);
    expect(sosOf('SE')).toEqual([{ label: 'Emergency (Europe)', no: '112' }]);
    const own = { FR: [{ label: 'Test line', no: '0000', own: true }] };
    expect(sosOf('fr', own)).toEqual(own.FR);
    expect(sosOwn('FR', own)).toBe(true);
    expect(sosOwn('DE', own)).toBe(false);
    expect(telOf('+41 00 000 00 00')).toBe('tel:+41000000000');
  });
  it('currency of the trip country', () => {
    expect(currencyOf('FR')).toBe('EUR');
    expect(currencyOf('gb')).toBe('GBP');
    expect(currencyOf('CH')).toBe('CHF');
    expect(currencyOf('XX')).toBe(null);
  });
});

describe('Flug morgen (evening window)', () => {
  const trips = [{ id: 't1', title: 'Test island', startDate: '2026-10-20', days: 4, flight: 'xy 123', entries: [] }];
  it('flight number cleaned; the window the evening before, not before 17:00', () => {
    expect(flightOf(trips[0])).toBe('XY123');
    expect(flightBefore(trips, '2026-10-19T16:30')).toBe(null);
    expect(flightBefore(trips, '2026-10-19T18:00')).toMatchObject({ flight: 'XY123' });
    expect(flightBefore(trips, '2026-10-18T18:00')).toBe(null);
  });
  it('not packed yet: the packing window carries the flight; «Later» there does not open a second window', () => {
    const w = windowNow({ rec: {}, now: '2026-10-19T18:00', trips, itemsById: {} });
    expect(w).toMatchObject({ id: 'eve', flight: 'XY123' });
    const later = windowNow({ rec: { eve: { later: '2026-10-19T19:00' } }, now: '2026-10-19T18:10', trips, itemsById: {} });
    expect(later).toBe(null);
  });
  it('without a flight number nothing changes', () => {
    const w = windowNow({ rec: {}, now: '2026-10-19T18:00', trips: [{ ...trips[0], flight: null }], itemsById: {} });
    expect(w.flight).toBe(null);
  });
});

describe('addresses', () => {
  it('parts of Ich › Alltag', () => {
    expect(alltagPart('#/me/alltag/abos')).toBe('abos');
    expect(alltagPart('#/me/alltag')).toBe('');
    expect(alltagPart('#/me/alltag/nope')).toBe('');
  });
});

describe('people: things to do together (UC-260-I1)', () => {
  it('keeps up to 8 ideas and moves on after each meeting', async () => {
    const { ideasOf, ideaFor, seenNext } = await import('../src/lib/alltag.js');
    expect(ideasOf('Coffee\n\n  Walk  \n')).toEqual(['Coffee', 'Walk']);
    expect(ideasOf(Array.from({ length: 12 }, (_, i) => `I${i}`))).toHaveLength(8);
    const p = newPerson({ name: 'Alex Test', ideas: 'Coffee\nWalk' }, 'p1');
    expect(p.ideas).toEqual(['Coffee', 'Walk']);
    expect(ideaFor(p)).toBe('Coffee');
    const q = seenNext(p, '2026-10-25');
    expect(q.seen).toBe('2026-10-25');
    expect(ideaFor(q)).toBe('Walk');
    expect(ideaFor(seenNext(q, '2026-11-25'))).toBe('Coffee');
    expect(newPerson({ name: 'No ideas' }, 'p2').ideas).toBeUndefined();
    expect(newPerson({ ...q }, 'p1').met).toBe(1);
  });
});
