// Paket X «Energie»: the one rule for used kcal, kcal to eat and water (energie.js).
import { describe, it, expect } from 'vitest';
import { metAt, burnKcalH, eatKcalH, energyFor, riderKg, roundBig, KG_STD, drunkOn } from '../src/lib/energie.js';

describe('energie.js', () => {
  it('MET grows with the speed, between the points', () => {
    expect(metAt(8)).toBe(3.5);
    expect(metAt(16)).toBe(5);
    expect(metAt(18)).toBeCloseTo(5.9, 5);
    expect(metAt(50)).toBe(14);
    expect(metAt(null)).toBeCloseTo(5.9, 5);
  });
  it('used per hour: the flat by weight, plus the climbing, a little more in heat and cold', () => {
    expect(burnKcalH({ kg: 75, kmh: 18 })).toBe(440);
    expect(burnKcalH({ kg: 75, kmh: 18, climbMh: 250 })).toBe(650);
    expect(burnKcalH({ kg: 60, kmh: 18 })).toBe(350);
    expect(burnKcalH({ kg: 75, kmh: 18, tempC: 33 })).toBe(460);
    expect(burnKcalH({ kg: 75, kmh: 18, tempC: 0 })).toBe(460);
  });
  it('to eat: the carbohydrates per hour of Verpflegung, about 5 kcal a gram', () => {
    expect(eatKcalH()).toBe(300);
    expect(eatKcalH({ carbsGh: 90 })).toBe(450);
  });
  it('a ride: used, eaten and water from the hours, km, climbing and temperature', () => {
    const e = energyFor({ hours: 4, km: 72, gainM: 1000, tempC: 30, kg: 75, fuel: { coolLh: 0.5, hotLh: 1.5 } });
    expect(e.kmh).toBe(18);
    expect(e.burnH).toBe(650);
    expect(e.burn).toBe(2600);
    expect(e.eat).toBe(1200);
    expect(e.carbsG).toBe(240);
    expect(e.waterLh).toBe(1.5);
    expect(e.waterL).toBe(6);
    expect(energyFor({ hours: 0 }).burn).toBe(0);
  });
  it('weight from the setting in grams; big numbers rounded', () => {
    expect(riderKg(72400)).toBe(72.4);
    expect(riderKg(null)).toBeNull();
    expect(riderKg(5)).toBeNull();
    expect(KG_STD).toBe(75);
    expect(roundBig(2649)).toBe(2600);
    expect(roundBig(23456)).toBe(23000);
  });
});

describe('Soll gegen Ist', () => {
  it('reads what was entered as drunk on a day, else null', () => {
    const v = { entries: [{ day: '2026-07-04', l: 2.25 }, { day: '2026-07-05', l: 'x' }] };
    expect(drunkOn(v, '2026-07-04')).toBe(2.3);
    expect(drunkOn(v, '2026-07-05')).toBeNull();
    expect(drunkOn(null, '2026-07-04')).toBeNull();
  });
});
