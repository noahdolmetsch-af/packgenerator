// Strombudget pro Tour und Powerbank-Rechner (Noah 19.10.2026 «2a»): src/lib/power.js, fictional gear.
import { describe, it, expect } from 'vitest';
import { powerRole, batteryOf, mahFromName, portsOf, deviceDay, powerInputs, stretchOf, usableWh, pickBanks, bankSize, pickCharger, powerBudget, tripDevices, missingOnTrip, whOf } from '../src/lib/power.js';
import { itemDraft, itemRecord } from '../src/lib/gear.js';

const phone = { id: 'EL01', name: 'test_data_sb_ Handy', category: 'elec', weightG: 200 };
const computer = { id: 'EL02', name: 'test_data_sb_ Velocomputer', category: 'elec', mah: 2000, runH: 20 };
const front = { id: 'LI01', name: 'test_data_sb_ Frontlicht', category: 'light' };
const bank10 = { id: 'EL03', name: 'test_data_sb_ Powerbank 10000', category: 'elec', weightG: 150 };
const bank20 = { id: 'EL04', name: 'test_data_sb_ Powerbank 20k', category: 'elec', weightG: 290 };
const plug = { id: 'EL05', name: 'test_data_sb_ Stecker 3-fach', category: 'elec', weightG: 130 };
const mini = { id: 'EL06', name: 'test_data_sb_ Mini-Stecker', category: 'elec', weightG: 50 };
const cable = { id: 'EL07', name: 'test_data_sb_ Ladekabel', category: 'elec', weightG: 20 };
const gear = [phone, computer, front, bank10, bank20, plug, mini, cable];

describe('power roles and values', () => {
  it('tells devices, banks and chargers apart; cables are nothing', () => {
    expect(powerRole(phone)).toBe('device');
    expect(powerRole(front)).toBe('device');
    expect(powerRole(bank10)).toBe('bank');
    expect(powerRole(plug)).toBe('charger');
    expect(powerRole(cable)).toBeNull();
    expect(powerRole({ ...phone, ownership: 'gone' })).toBeNull();
  });
  it('reads the size of a bank from its name and the sockets of a charger', () => {
    expect(mahFromName(bank10)).toBe(10000);
    expect(mahFromName(bank20)).toBe(20000);
    expect(mahFromName({ name: "Akku 20'000 mAh" })).toBe(20000);
    expect(portsOf(plug)).toBe(3);
    expect(portsOf(mini)).toBe(1);
    expect(portsOf({ ...mini, ports: 2 })).toBe(2);
  });
  it('own values beat typical ones, typical ones are marked estimated', () => {
    expect(batteryOf(computer)).toEqual({ mah: 2000, wh: whOf(2000), guessed: false });
    expect(batteryOf(phone)).toMatchObject({ wh: 19, guessed: true });
    const d = deviceDay(front, 1, { rideH: 6, nightH: 2 });
    expect(d).toMatchObject({ use: 'night', hours: 2, wh: 12, runH: 3, daily: 8, guessed: true });
  });
});

describe('trip inputs', () => {
  it('nights in a lodging have a socket, a bivouac not; saved values win', () => {
    expect(powerInputs({ days: 4, overnight: 'lodging' }, { hours: 5 })).toMatchObject({ days: 4, socketNights: 3, rideH: 5, nightH: 1, cold: false });
    expect(powerInputs({ days: 4, overnight: 'outdoor' }, { minC: 2 })).toMatchObject({ socketNights: 0, rideH: 6, cold: true });
    expect(powerInputs({ days: 4, overnight: 'outdoor', power: { socketNights: 1, nightH: 0 } })).toMatchObject({ socketNights: 1, nightH: 0 });
    expect(powerInputs({ days: 2, power: { socketNights: 9 } }).socketNights).toBe(1);
  });
  it('the longest stretch without a socket', () => {
    expect(stretchOf(1, 0)).toBe(1);
    expect(stretchOf(4, 0)).toBe(4);
    expect(stretchOf(4, 3)).toBe(1);
    expect(stretchOf(5, 1)).toBe(3);
  });
});

describe('power banks and chargers', () => {
  it('a bank gives 75 %, 10 % less in the cold', () => {
    expect(usableWh(bank10)).toBe(27.8);
    expect(usableWh(bank10, true)).toBe(25);
  });
  it('the lightest bank that is enough, else a pair, else what to buy', () => {
    expect(pickBanks(0, [bank10])).toMatchObject({ pick: [], enough: true });
    expect(pickBanks(20, [bank20, bank10]).pick).toEqual([bank10]);
    expect(pickBanks(40, [bank20, bank10]).pick).toEqual([bank20]);
    expect(pickBanks(70, [bank20, bank10]).pick).toEqual([bank20, bank10]);
    const short = pickBanks(120, [bank10]);
    expect(short).toMatchObject({ enough: false, pick: [bank10] });
    expect(short.size).toMatchObject({ mah: 20000, count: 2 });
    expect(bankSize(20)).toMatchObject({ mah: 10000, count: 1 });
  });
  it('a charger with sockets for all, and the charging time per night', () => {
    const c = pickCharger([phone, computer, front], [mini, plug], 2);
    expect(c).toMatchObject({ pick: plug, ports: 3, n: 3 });
    expect(c.hours).toBeLessThan(8);
    expect(pickCharger([phone], [mini], 0)).toBeNull();
    const one = pickCharger([phone, computer, front, bank20], [mini], 1);
    expect(one).toMatchObject({ pick: mini, ports: 1, tooLong: true });
  });
});

describe('the whole budget', () => {
  const trip = { id: 't1', days: 4, overnight: 'outdoor', entries: [{ itemId: 'EL01', qty: 1 }, { itemId: 'EL02', qty: 1 }, { itemId: 'LI01', qty: 1 }, { itemId: 'EL07', qty: 1 }, { itemId: 'EL03', qty: 1 }] };
  it('devices of a trip leave out banks and cables', () => {
    expect(tripDevices(trip, gear).map((d) => d.item.id)).toEqual(['EL01', 'EL02', 'LI01']);
  });
  it('four days in a bivouac need a power bank; with a socket every night none', () => {
    const b = powerBudget(tripDevices(trip, gear), gear, powerInputs(trip, { hours: 6 }));
    expect(b.stretch).toBe(4);
    expect(b.needWh).toBeGreaterThan(27.8);
    expect(b.banks.enough).toBe(true);
    expect(b.banks.pick.map((i) => i.id)).toEqual(['EL04']);
    expect(b.charger).toBeNull();
    expect(missingOnTrip(trip, b)).toEqual(['EL04']);
    const hotel = powerBudget(tripDevices(trip, gear), gear, powerInputs({ ...trip, overnight: 'lodging' }, { hours: 6 }));
    expect(hotel.needWh).toBe(0);
    expect(hotel.banks.pick).toEqual([]);
    expect(hotel.charger?.pick?.id).toBe('EL05');
  });
});

describe('item fields', () => {
  it('battery mAh and sockets are kept like the other store fields', () => {
    const rec = itemRecord({ ...itemDraft(null), name: 'test_data_sb_ Akku', category: 'elec', mah: '10000', ports: '2' }, { items: gear });
    expect(rec).toMatchObject({ mah: 10000, ports: 2 });
    const plain = itemRecord({ ...itemDraft(null), name: 'test_data_sb_ Socken', category: 'onbike' }, { items: gear });
    expect('mah' in plain).toBe(false);
  });
});
