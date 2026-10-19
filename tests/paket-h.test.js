// Paket H «Packen leichter» (Noah 19.10.2026 «1b und a 2b 3a und b … 4a und b 5 a und b"): start lists per
// sport, supplies with expiry, the shared table, read aloud, lending. Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { historyTrip, itemCounts, starterRows, STARTERS, HISTORY_MIN_TRIPS } from '../src/lib/startlists.js';
import { isSupply, expiryState, rebuyList, bought, usedOne, remindDay, buyQty, expiringSoon } from '../src/lib/supplies.js';
import { parseCell, applyToAll, sortRows, filterRows, bulkCols, TABLE_PLACES } from '../src/lib/listtable.js';
import { commandOf, readQueue, sayLine, nextIndex } from '../src/lib/readaloud.js';
import { newLend, markBack, markOut, isOpen, lentOut, dueState, lendPayload, sortLends } from '../src/lib/lend.js';
import { TRIP_DOMAINS } from '../src/lib/domains.js';

const items = [
  { id: 'A', name: 'Helmet', ownership: 'owned', category: 'onbike' },
  { id: 'B', name: 'Pump', ownership: 'owned', category: 'tools' },
  { id: 'C', name: 'Energy bar', ownership: 'owned', category: 'food' },
  { id: 'D', name: 'Old lamp', ownership: 'gone', category: 'light' },
  { id: 'E', name: 'Shovel', ownership: 'wishlist', category: 'tools' },
];
const trip = (id, startDate, ids, domain = 'hiking') => ({ id, domain, startDate, entries: ids.map((itemId) => ({ itemId, slot: 'pack', qty: 1, packed: true })) });

describe('1b start list from earlier trips of the same sport', () => {
  const trips = [trip('t1', '2026-05-01', ['A', 'B', 'C']), trip('t2', '2026-06-01', ['A', 'C', 'D']), trip('t3', '2026-07-01', ['A']), trip('t4', '2026-07-02', ['B'], 'ski')];
  it('needs at least two trips', () => {
    expect(historyTrip({ domain: 'ski', trips, items, today: '2026-10-19' })).toBeNull();
    expect(HISTORY_MIN_TRIPS).toBe(2);
  });
  it('takes what was along on at least half of them, never archived items, nothing packed', () => {
    const h = historyTrip({ domain: 'hiking', trips, items, today: '2026-10-19' });
    expect(h.from).toBe(3);
    expect(h.entries.map((e) => e.itemId).sort()).toEqual(['A', 'C']);
    expect(h.entries.every((e) => e.packed === false)).toBe(true);
  });
  it('counts each item once per trip', () => {
    const c = itemCounts([{ entries: [{ itemId: 'A' }, { itemId: 'A' }] }], items);
    expect(c[0]).toMatchObject({ itemId: 'A', n: 1, share: 1 });
  });
  it('ignores trips planned for later', () => {
    expect(historyTrip({ domain: 'hiking', trips: [trip('a', '2026-11-01', ['A']), trip('b', '2026-12-01', ['A'])], items, today: '2026-10-19' })).toBeNull();
  });
});

describe('1a ready suggestion list per sport', () => {
  it('every sport you can start a trip with has a list', () => {
    for (const d of TRIP_DOMAINS) expect(STARTERS[d.key]?.length, d.key).toBeGreaterThan(5);
  });
  it('finds your own item and marks what is on the trip', () => {
    const rows = starterRows('bikepacking', items, [{ itemId: 'A' }]);
    const helmet = rows.find((r) => r.line.name === 'Helmet');
    expect(helmet.item.id).toBe('A');
    expect(helmet.onTrip).toBe(true);
    expect(rows.find((r) => r.line.name === 'Pump').onTrip).toBe(false);
    // a wishlist shovel is not «yours» yet
    expect(starterRows('ski', items, []).find((r) => r.line.name === 'Shovel').item).toBeNull();
  });
});

describe('2 supplies: expiry and stock', () => {
  const today = '2026-10-19';
  it('food is always a supply, other things once a field is set', () => {
    expect(isSupply(items[2])).toBe(true);
    expect(isSupply(items[0])).toBe(false);
    expect(isSupply({ ...items[0], expires: '2027-01-01' })).toBe(true);
  });
  it('expiry: soon within 14 days, expired before today', () => {
    expect(expiryState({ expires: '2026-11-02' }, today)).toBe('soon');
    expect(expiryState({ expires: '2026-11-03' }, today)).toBe('ok');
    expect(expiryState({ expires: '2026-10-18' }, today)).toBe('expired');
    expect(remindDay({ expires: '2026-12-01' }, today)).toBe('2026-11-17');
    expect(remindDay({ expires: '2026-10-25' }, today)).toBe(today);
  });
  it('the shopping list: empty, expired, low, by hand', () => {
    const list = rebuyList(
      [
        { id: 'a', name: 'Gel', stock: 0, ownership: 'owned' },
        { id: 'b', name: 'Bar', stock: 2, minStock: 4, ownership: 'owned' },
        { id: 'c', name: 'Gas', expires: '2026-01-01', ownership: 'owned' },
        { id: 'd', name: 'Tape', rebuy: true, ownership: 'owned' },
        { id: 'e', name: 'Salt', stock: 3, ownership: 'owned' },
      ],
      today,
    );
    expect(list.map((r) => [r.item.id, r.reason])).toEqual([['a', 'empty'], ['c', 'expired'], ['b', 'low'], ['d', 'hand']]);
    expect(buyQty({ stock: 2, minStock: 4 })).toBe(2);
  });
  it('bought raises the stock and clears an expired date; used one never goes below 0', () => {
    expect(bought({ stock: 1, expires: '2026-01-01', rebuy: true }, 3, today)).toEqual({ stock: 4, expires: null });
    expect(usedOne({ stock: 0 }).stock).toBe(0);
    expect(expiringSoon([{ id: 'x', expires: '2026-10-20', ownership: 'owned' }], today)[0].days).toBe(1);
  });
});

describe('3 the shared table: change in the cell and for all', () => {
  const cols = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'weightG', label: 'Weight', type: 'number' },
    { key: 'expires', label: 'Expiry', type: 'date' },
    { key: 'id', label: 'ID', type: 'text', readOnly: true },
  ];
  it('parses typed values, with a comma too', () => {
    expect(parseCell(cols[1], '12,5')).toBe(12.5);
    expect(parseCell(cols[1], '')).toBeNull();
    expect(parseCell(cols[1], 'abc')).toBeUndefined();
    expect(parseCell(cols[2], '2026-13')).toBeUndefined();
  });
  it('«change for all» only touches rows that change', () => {
    const rows = [{ id: 1, weightG: 5 }, { id: 2, weightG: 7 }, { id: 3, weightG: 9 }];
    const pairs = applyToAll(rows, [1, 2], cols[1], 7);
    expect(pairs).toEqual([{ before: rows[0], after: { id: 1, weightG: 7 } }]);
    expect(bulkCols(cols).map((c) => c.key)).toEqual(['name', 'weightG', 'expires']);
  });
  it('sorts with empty cells last and searches all columns', () => {
    const rows = [{ id: 1, name: 'b', weightG: null }, { id: 2, name: 'a', weightG: 3 }, { id: 3, name: 'C', weightG: 1 }];
    expect(sortRows(rows, cols[1]).map((r) => r.id)).toEqual([3, 2, 1]);
    expect(sortRows(rows, cols[0]).map((r) => r.id)).toEqual([2, 1, 3]);
    expect(filterRows(rows, cols, 'c').map((r) => r.id)).toEqual([3]);
  });
  it('every page in the guard list uses the shared table', () => {
    for (const p of TABLE_PLACES) expect(/ListTable/.test(readFileSync(p.file, 'utf8')), p.file).toBe(true);
  });
});

describe('4 read aloud', () => {
  it('understands ok, weiter, zurück, stopp', () => {
    expect(commandOf('OK.')).toBe('tick');
    expect(commandOf('ja eingepackt')).toBe('tick');
    expect(commandOf('später')).toBe('skip');
    expect(commandOf('zurück bitte')).toBe('back');
    expect(commandOf('stopp')).toBe('stop');
    expect(commandOf('Helm')).toBeNull();
    // «nein … ok»: the last word wins
    expect(commandOf('nein doch ok')).toBe('tick');
  });
  it('reads only what is not packed, says the bag when it changes', () => {
    const q = readQueue([{ key: 'seat', name: 'Seat pack', entries: [{ itemId: 'A', packed: true }, { itemId: 'B', qty: 2 }] }, { key: 'frame', name: 'Frame bag', entries: [{ itemId: 'C' }] }]);
    expect(q.map((r) => r.itemId)).toEqual(['B', 'C']);
    const texts = { many: '{qty} × {name}', bag: 'Into {bag}' };
    expect(sayLine(q[0], null, 'Pump', texts)).toBe('Into Seat pack. 2 × Pump');
    expect(sayLine(q[1], q[0], 'Bar', texts)).toBe('Into Frame bag. Bar');
    expect(nextIndex(q, 0, new Set(['C']))).toBe(-1);
  });
});

describe('5 lending to guests', () => {
  it('remembers who has what until it is back', () => {
    const l = newLend({ person: 'Gast Eins', itemIds: ['A', 'B'] }, '2026-10-19', 'l1');
    expect(l.due).toBe('2026-11-02');
    expect(lentOut([l]).A).toMatchObject({ person: 'Gast Eins' });
    const half = markBack(l, 'A', '2026-10-20');
    expect(isOpen(half)).toBe(true);
    expect(lentOut([half]).A).toBeUndefined();
    const all = markBack(half, null, '2026-10-21');
    expect(all.doneAt).toBe('2026-10-21');
    expect(isOpen(markOut(all, 'B'))).toBe(true);
  });
  it('return day states and the link payload', () => {
    const l = { id: 'x', person: 'P', due: '2026-10-19', items: [{ itemId: 'A', qty: 1 }] };
    expect(dueState(l, '2026-10-19')).toBe('today');
    expect(dueState(l, '2026-10-20')).toBe('late');
    const p = lendPayload(l, { A: { name: 'Helmet', weightG: 300 } });
    expect(p.v).toBe(1);
    expect(p.g[0][1][0]).toEqual(['Helmet', 1, 300]);
    expect(sortLends([{ ...l, doneAt: '2026-10-01' }, { ...l, id: 'y' }])[0].id).toBe('y');
  });
});

describe('reminders on the phone for Paket H', async () => {
  const { buildList, KINDS, atMs } = await import('../src/lib/push/schedule.js');
  const allOn = { on: true, kinds: Object.fromEntries(KINDS.map((k) => [k.key, true])) };
  const now = new Date(2026, 9, 19, 10, 0);
  it('supply 2 weeks before, lend on the return day, shopping 2 days before a trip', () => {
    const l = buildList({
      now,
      settings: { push: allOn },
      items: [{ id: 'g', name: 'Gel', expires: '2026-11-01', ownership: 'owned' }, { id: 'k', name: 'Gas', expires: '2026-12-31', ownership: 'owned' }, { id: 'h', name: 'Old', expires: '2026-10-01', ownership: 'owned' }],
      lends: [{ id: 'l', person: 'Gast', due: '2026-10-25', items: [{ itemId: 'A' }] }, { id: 'm', person: 'X', due: '2026-10-25', items: [{ itemId: 'A', back: true }], doneAt: '2026-10-20' }],
      trips: [{ id: 't', title: 'Tour', status: 'planned', startDate: '2026-10-24' }],
    });
    const by = Object.fromEntries(l.items.map((i) => [i.key, i.at]));
    expect(by['supply:g:2026-11-01']).toBe(atMs('2026-10-20', '08:00')); // 2 weeks before was yesterday: the next morning
    expect(Object.keys(by).some((k) => k.startsWith('supply:k'))).toBe(false); // more than 14 days ahead
    expect(Object.keys(by).some((k) => k.startsWith('supply:h'))).toBe(false);
    expect(by['lend:l:2026-10-25']).toBe(atMs('2026-10-25', '08:00'));
    expect(Object.keys(by).some((k) => k.startsWith('lend:m'))).toBe(false);
    expect(by['shop:t:2026-10-24']).toBe(atMs('2026-10-22', '08:00'));
  });
});
