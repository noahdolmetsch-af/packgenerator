import { describe, it, expect } from 'vitest';
import {
  prefsOf, PREFS_STD, wetRides, wetChainEntry, chainCaredOn, shotsOf, shotDue, ownShot, saleText,
  PACK_STD, packOf, addPackItem, renamePackItem, removePackItem, movePackItem, tickPack, ticksOf, clearPack,
  stockOf, usedSince, stockRow, addStock, changeStock, removeStock,
  brandOf, brandStats, bestFor, springDay, springText, syncSpring, SPRING_SRC,
  rotationOf, addChain, renameChain, removeChain, swapChain, rotationSet, ROTATE_STD,
} from '../src/lib/griff.js';

// Paket VG «Das Velo im Griff» (Noah 20.10.2026): fictional bikes, fictional km, plain calendar days.
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', ...extra });

describe('the settings', () => {
  it('fills what is missing with the suggestions; null switches off', () => {
    expect(prefsOf(undefined)).toEqual(PREFS_STD);
    expect(prefsOf({ wetChain: false, shotEveryKm: null, springMonth: null })).toEqual({ wetChain: false, shotEveryKm: null, springMonth: null });
    expect(prefsOf({ shotEveryKm: 1499.6, springMonth: 13 })).toMatchObject({ shotEveryKm: 1500, springMonth: null });
  });
});

describe('1128 chain after rain', () => {
  const day = '2026-10-20';
  const e = (bikeId, km, wet, extra = {}) => ({ bikeId, km, wet, kind: 'ride', state: 'counted', date: day, ...extra });
  it('sums the wet rides of the day per bike, most km first', () => {
    const list = [e('a', 20, true), e('b', 50, true), e('a', 15, true), e('c', 90, false), e('a', 5, true, { date: '2026-10-19' }), e('b', 10, true, { state: 'open' })];
    expect(wetRides(list, day, (x) => x.wet)).toEqual([{ bikeId: 'b', km: 50 }, { bikeId: 'a', km: 35 }]);
    expect(wetRides(list, day, null)).toEqual([]);
  });
  it('the hint goes once the chain was cared for that day (service or a new chain)', () => {
    const bike = (h) => ({ parts: [{ key: 'chain', history: h }, { key: 'tyres', history: [{ date: day, action: 'service' }] }] });
    expect(chainCaredOn(bike([]), day)).toBe(false);
    expect(chainCaredOn(bike([{ date: '2026-10-19', action: 'service' }]), day)).toBe(false);
    expect(chainCaredOn(bike([{ date: day, action: 'check' }]), day)).toBe(false);
    expect(chainCaredOn(bike([wetChainEntry(day, 10)]), day)).toBe(true);
    expect(chainCaredOn(bike([{ date: day, action: 'replace' }]), day)).toBe(true);
    expect(chainCaredOn(null, day)).toBe(false);
  });
  it('writes a care entry of the chain by yourself', () => {
    expect(wetChainEntry(day, 1234, 'n')).toMatchObject({ date: day, km: 1234, action: 'service', by: 'self', note: 'n' });
    expect(wetChainEntry(day, undefined).km).toBe(null);
  });
});

describe('1129 wear photos', () => {
  const photos = [
    { id: 'p2', bikeId: 'b1', wear: 'chain', date: '2026-09-01', km: 1800 },
    { id: 'p1', bikeId: 'b1', wear: 'chain', date: '2026-05-01', km: 600 },
    { id: 'p3', bikeId: 'b1', wear: 'tyres', date: '2026-06-01', km: 900 },
    { id: 'p4', bikeId: 'b2', wear: 'chain', date: '2026-06-01', km: 100 },
    { id: 'p5', bikeId: 'b1', date: '2026-06-01' },
  ];
  it('keeps the photos per bike and part, oldest first', () => {
    expect(shotsOf(photos, 'b1', 'chain').map((p) => p.id)).toEqual(['p1', 'p2']);
  });
  it('a new photo is due after the set km; none yet → due; off → nothing', () => {
    const bike = { id: 'b1', km: 2900 };
    expect(shotDue(bike, photos, 'chain', 1000)).toEqual({ since: 1100, due: true });
    expect(shotDue(bike, photos, 'tyres', 2500)).toEqual({ since: 2000, due: false });
    expect(shotDue(bike, photos, 'chainring', 1000)).toEqual({ since: null, due: true });
    expect(shotDue(bike, photos, 'chain', null)).toBe(null);
  });
  it('wear and packing photos are not setup photos', () => {
    expect(ownShot(photos[0])).toBe(true);
    expect(ownShot({ pack: 'b1' })).toBe(true);
    expect(ownShot(photos[4])).toBe(false);
  });
});

describe('1130 sale listing', () => {
  const view = { id: 'b1', name: 'Test-Gravel', km: 4200, bought: '2024-04-01', service: { last: { day: '2026-05-02' } }, parts: [{ key: 'chain', name: 'Chain', model: 'Brand X 12' }, { key: 'tyres', name: 'Tyres', model: null }] };
  it('builds the text from km, services, parts and photos; the price only when typed', () => {
    const txt = saleText(view, { rows: [{ key: 'chain', name: 'Chain', km: 300, start: true }], visits: [{ bikeId: 'b1' }, { bikeId: 'b2' }], photos: 3 });
    expect(txt).toContain('Test-Gravel');
    expect(txt).toContain('Ridden: 4200 km');
    expect(txt).toContain('Last service: 2026-05-02');
    expect(txt).toContain('Serviced in a bike shop 1 times');
    expect(txt).toContain('- Chain: Brand X 12 · 300 km on it');
    expect(txt).toContain('New recently: Chain');
    expect(txt).toContain('3 photos');
    expect(txt).not.toContain('Price');
    expect(saleText(view, { price: ' 900 ' })).toContain('Price: CHF 900');
    expect(saleText(null)).toBe('');
  });
});

describe('1131 bike box checklist', () => {
  it('starts with the standard points; own points can be added, renamed, moved and removed', () => {
    let rec = packOf(undefined);
    expect(rec.items.map((x) => x.text)).toEqual(PACK_STD);
    rec = addPackItem(rec, '  Helmet  ', 'x1');
    expect(rec.items.at(-1)).toEqual({ id: 'x1', text: 'Helmet' });
    expect(addPackItem(rec, '   ', 'x2')).toBe(rec);
    rec = renamePackItem(rec, 'std-0', 'Photos');
    expect(rec.items[0]).toEqual({ id: 'std-0', text: 'Photos' });
    rec = movePackItem(rec, rec.items.length - 1, 0);
    expect(rec.items[0].id).toBe('x1');
    expect(movePackItem(rec, 0, 99)).toBe(rec);
    rec = removePackItem(rec, 'x1');
    expect(rec.items.some((x) => x.id === 'x1')).toBe(false);
  });
  it('ticks per bike and day; a new day starts empty; clear takes them away', () => {
    let rec = packOf({ items: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] });
    rec = tickPack(rec, 'b1', 'a', '2026-10-20');
    rec = tickPack(rec, 'b1', 'b', '2026-10-20');
    rec = tickPack(rec, 'b1', 'a', '2026-10-20');
    expect(ticksOf(rec, 'b1', '2026-10-20')).toEqual(['b']);
    expect(ticksOf(rec, 'b1', '2026-10-21')).toEqual([]);
    expect(ticksOf(rec, 'b2', '2026-10-20')).toEqual([]);
    expect(ticksOf(clearPack(rec, 'b1'), 'b1', '2026-10-20')).toEqual([]);
  });
});

describe('1132 spare parts stock', () => {
  const bikes = [
    { id: 'b1', parts: [{ key: 'chain', history: [rep('2026-01-01', 0, { start: true }), rep('2026-06-01', 2000), rep('2026-09-01', 3000, { by: 'shop' })] }, { key: 'padsR', history: [rep('2026-07-01', 2500)] }] },
    { id: 'b2', parts: [{ key: 'chain', history: [rep('2026-08-01', 900), rep('2026-08-02', 950, { result: 'needed' })] }, { key: 'padsF', history: [rep('2026-03-01', 100)] }] },
  ];
  it('counts own changes since the day the number was set (shop, start and «needed» do not count)', () => {
    expect(usedSince(bikes, 'chain', '2026-01-01')).toBe(2);
    expect(usedSince(bikes, 'chain', '2026-07-01')).toBe(1);
    expect(usedSince(bikes, 'padsF', '2026-01-01')).toBe(2);
    expect(usedSince(bikes, null, '2026-01-01')).toBe(0);
  });
  it('a row knows what is left and when it is empty; a new number starts from today', () => {
    let list = addStock([], { name: 'Chain', part: 'chain', qty: 2 }, 's1', '2026-05-01');
    list = addStock(list, { name: 'Inner tube', part: 'nope', qty: 3 }, 's2', '2026-05-01');
    expect(addStock(list, { name: ' ' }, 's3', '2026-05-01')).toBe(list);
    expect(list[1].part).toBe(null);
    expect(stockRow(list[0], bikes)).toMatchObject({ used: 2, left: 0, empty: true });
    list = changeStock(list, 's1', { qty: 3 }, '2026-10-20');
    expect(stockRow(list[0], bikes)).toMatchObject({ used: 0, left: 3, empty: false });
    list = changeStock(list, 's2', { name: 'Tube 28' }, '2026-10-20');
    expect(list[1]).toMatchObject({ name: 'Tube 28', since: '2026-05-01' });
    expect(stockOf(removeStock(list, 's1')).map((x) => x.id)).toEqual(['s2']);
    expect(stockOf('x')).toEqual([]);
  });
});

describe('1133 km per brand', () => {
  it('averages the own used-up parts per brand (any case, the newest spelling), longest first; pads front and rear together', () => {
    const bikes = [
      { parts: [{ key: 'chain', history: [rep('2025-01-01', 0, { model: 'Alpha 11' }), rep('2025-06-01', 3000, { model: 'Beta 11' }), rep('2026-01-01', 5000, { model: 'ALPHA 12' }), rep('2026-06-01', 8400)] }] },
      { parts: [{ key: 'padsF', history: [rep('2025-01-01', 0, { model: 'Gamma' }), rep('2025-09-01', 1500)] }, { key: 'padsR', history: [rep('2025-01-01', 0, { model: 'Gamma' }), rep('2025-12-01', 2500)] }] },
    ];
    const s = brandStats(bikes);
    expect(s.chain).toEqual([{ brand: 'ALPHA', km: 3200, n: 2 }, { brand: 'Beta', km: 2000, n: 1 }]);
    expect(s.pads).toEqual([{ brand: 'Gamma', km: 2000, n: 2 }]);
    expect(s.tyres).toEqual([]);
    expect(bestFor(s, 'chain').brand).toBe('ALPHA');
    expect(bestFor(s, 'padsR').brand).toBe('Gamma');
    expect(bestFor(s, 'tyres')).toBe(null);
    expect(bestFor(s, 'frame')).toBe(null);
    expect(brandOf('  Shimano Ultegra ')).toBe('Shimano');
  });
});

describe('1134 spring service', () => {
  it('takes the 1st of the month, this year while the month lasts, else next year', () => {
    expect(springDay(2, '2026-10-20')).toBe('2027-02-01');
    expect(springDay(2, '2027-01-15')).toBe('2027-02-01');
    expect(springDay(2, '2027-02-28')).toBe('2027-02-01');
    expect(springDay(12, '2026-12-31')).toBe('2026-12-01');
    expect(springDay(null, '2026-10-20')).toBe(null);
  });
  it('lists what is due per bike', () => {
    expect(springText([{ bike: 'A', due: ['Chain'] }, { bike: 'B', due: [] }])).toBe('Book the spring service early. Due: A: Chain');
    expect(springText([])).toBe('Book the spring service early.');
  });
  it('keeps one to-do in line; month off removes it; a ticked one stays ticked on the same day', () => {
    const other = { id: 'o', text: 'Other' };
    let r = syncSpring([other], { day: '2027-02-01', text: 'T', now: 'N' });
    expect(r.changed).toBe(true);
    const mine = r.todos.find((x) => x.src === SPRING_SRC);
    expect(mine).toMatchObject({ due: '2027-02-01', text: 'T', area: 'bike', remind: { at: '09:00' } });
    expect(syncSpring(r.todos, { day: '2027-02-01', text: 'T' }).changed).toBe(false);
    const ticked = r.todos.map((x) => (x.src === SPRING_SRC ? { ...x, doneAt: 'D' } : x));
    expect(syncSpring(ticked, { day: '2027-02-01', text: 'T2' }).todos.find((x) => x.src === SPRING_SRC).doneAt).toBe('D');
    expect(syncSpring(ticked, { day: '2028-02-01', text: 'T' }).todos.find((x) => x.src === SPRING_SRC).doneAt).toBe(null);
    r = syncSpring(r.todos, { day: null, text: 'T' });
    expect(r).toEqual({ todos: [other], changed: true });
  });
});

describe('1135 chain rotation', () => {
  it('counts km per chain between swaps and says when the next one is due', () => {
    let bike = { id: 'b1', km: 1000 };
    bike = { ...bike, ...addChain(bike, 'A', 'a') };
    bike = { ...bike, ...addChain(bike, 'B', 'b') };
    expect(addChain(bike, '  ', 'c')).toBe(null);
    bike = { ...bike, ...swapChain(bike, 'a', '2026-05-01') };
    bike = { ...bike, km: 1400 };
    bike = { ...bike, ...swapChain(bike, 'b', '2026-07-01') };
    bike = { ...bike, km: 1950 };
    const r = rotationOf(bike);
    expect(r.list.map((x) => [x.id, x.km, x.current])).toEqual([['a', 400, false], ['b', 550, true]]);
    expect(r).toMatchObject({ on: true, every: ROTATE_STD, current: 'b', since: 550, due: true });
    expect(r.next.id).toBe('a');
    expect(rotationOf({ ...bike, ...rotationSet(bike, { on: false }) }).due).toBe(false);
    expect(rotationOf({ ...bike, ...rotationSet(bike, { every: 600 }) }).due).toBe(false);
    const renamed = { ...bike, ...renameChain(bike, 'a', 'Alpha') };
    expect(rotationOf(renamed).list[0].name).toBe('Alpha');
    const gone = { ...bike, ...removeChain(bike, 'b') };
    expect(rotationOf(gone)).toMatchObject({ on: false, current: 'a', due: false });
    expect(rotationOf({ km: 10 })).toMatchObject({ on: false, list: [], current: null, due: false });
  });
});
