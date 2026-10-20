// Verpflegungsstrategie (Noah 19.10.2026 «1a 2a 3a und b 4a 5a»): values, water per hour, sections between
// food stops, warnings, products. Fictional places only; times in local time (TZ Europe/Zurich in CI).
import { describe, it, expect } from 'vitest';
import {
  STANDARD, STANDARD_PRODUCTS, valuesOf, withValue, withStandardValues, waterLh, climbAlong, hoursAlong, etaAlong,
  tempFromTrip, dayStartMs, fuelPlan, packOf, moveProduct, RACE_KINDS, ROUTE_KINDS, BREAKS,
} from '../src/lib/fuel.js';

const flat = { kmh: 20, climbMh: 600 }; // 20 km = 1 h on the flat

describe('values', () => {
  it('starts with 60 g per hour, 1–2 l per hour and the standard products', () => {
    const v = valuesOf(null);
    expect(v.carbsGh).toBe(60);
    expect([v.coolLh, v.hotLh]).toEqual([1, 2]);
    expect(v.products.map((p) => p.id)).toEqual(STANDARD_PRODUCTS.map((p) => p.id));
    expect(v.view).toBe('grams');
  });
  it('keeps your values in their limits and your products', () => {
    const v = valuesOf({ carbsGh: 90, bottles: 99, products: [{ id: 'p-x', name: 'test_data_ Riegel', carbs: 30 }], view: 'products' });
    expect(v.carbsGh).toBe(90);
    expect(v.bottles).toBe(10);
    expect(v.products).toEqual([{ id: 'p-x', name: 'test_data_ Riegel', carbs: 30 }]);
    expect(v.view).toBe('products');
  });
  it('changes one value and goes back to the standard without losing the products', () => {
    const s = withValue({ products: [] }, 'carbsGh', 80);
    expect(s.carbsGh).toBe(80);
    expect(withValue(s, 'carbsGh', Number.NaN).carbsGh).toBe(80);
    expect(withStandardValues(s)).toEqual({ products: [], view: undefined });
    expect(valuesOf(withStandardValues(s)).carbsGh).toBe(STANDARD.carbsGh);
  });
});

describe('water per hour', () => {
  const v = valuesOf(null);
  it('is 1 l when cool and flat, 2 l when hot', () => {
    expect(waterLh(v, 10, 0)).toBe(1);
    expect(waterLh(v, 35, 0)).toBe(2);
  });
  it('grows with the temperature and with climbing, never above the hot value', () => {
    expect(waterLh(v, 22.5, 0)).toBe(1.5);
    expect(waterLh(v, 10, 600)).toBe(1.5);
    expect(waterLh(v, 30, 600)).toBe(2);
  });
  it('guesses 20 °C when the temperature is unknown', () => {
    expect(waterLh(v, null, 0)).toBe(waterLh(v, 20, 0));
  });
});

describe('time along the route', () => {
  it('spreads the climbing of the profile and scales it to the route', () => {
    const climbTo = climbAlong([[0, 400], [10, 900], [20, 400], [30, 900]], 30, 1000);
    expect(Math.round(climbTo(10))).toBe(500);
    expect(Math.round(climbTo(30))).toBe(1000);
    expect(climbAlong([], 100, 1000)(50)).toBe(500);
  });
  it('rides the day hours from the start time, the night is off', () => {
    const start = dayStartMs('2026-07-04');
    const eta = etaAlong({ startMs: start, startHour: 8, rideH: 5, hoursTo: hoursAlong(flat, () => 0) });
    const at = (km) => new Date(eta(km));
    expect(at(0).getHours()).toBe(8);
    expect(at(100).getDate()).toBe(4); // 5 h: still the first day
    expect(at(100).getHours()).toBe(8 + Math.floor(5 * (1 + BREAKS)));
    expect(at(120).getDate()).toBe(5); // 6 h: the second day
    expect(etaAlong({ startMs: null, hoursTo: () => 1 })(10)).toBe(null);
  });
  it('takes the temperature from the hourly forecast, else the day, else the packing weather', () => {
    const trip = { forecast: { days: [{ date: '2026-07-04', max: 28, hourly: { t: Array.from({ length: 24 }, (_, h) => h) } }] }, wx: { max: 18 } };
    expect(tempFromTrip(trip, new Date(2026, 6, 4, 14).getTime())).toBe(14);
    expect(tempFromTrip({ ...trip, forecast: { days: [{ date: '2026-07-04', max: 28 }] } }, new Date(2026, 6, 4, 14).getTime())).toBe(28);
    expect(tempFromTrip(trip, new Date(2026, 6, 9, 14).getTime())).toBe(18);
    expect(tempFromTrip({}, null)).toBe(null);
  });
});

describe('the plan', () => {
  const v = valuesOf({ stopH: 3 });
  it('without shops is one section: hours × 60 g and a note that no shop is known', () => {
    const plan = fuelPlan({ totalKm: 100, values: v, pace: flat, kinds: ROUTE_KINDS, tempAt: () => 10 });
    expect(plan.sections).toHaveLength(1);
    expect(plan.sections[0]).toMatchObject({ hours: 5, carbs: 300, waterL: 5, carryL: 5 });
    expect(plan.sections[0].warn).toEqual(expect.arrayContaining(['noshop', 'bottles']));
    expect(plan.totals).toEqual({ hours: 5, carbs: 300, waterL: 5 });
  });
  it('takes the farthest shop within the stop rhythm and refills water at fountains', () => {
    const pois = [
      { kind: 'shop', km: 20, name: 'test_data_ Laden A' },
      { kind: 'shop', km: 55, name: 'test_data_ Laden B' },
      { kind: 'water', km: 80, name: '' },
      { kind: 'shop', km: 110, name: 'test_data_ Laden C' },
    ];
    const plan = fuelPlan({ totalKm: 120, pois, values: v, pace: flat, kinds: RACE_KINDS, tempAt: () => 10 });
    expect(plan.sections.map((s) => [s.fromKm, s.toKm])).toEqual([[0, 55], [55, 110], [110, 120]]);
    const second = plan.sections[1];
    expect(second.waterStops).toBe(1);
    expect(second.carryL).toBe(1.3); // 25 km = 1.25 h to the fountain at 1 l/h, to 0.1 l
    expect(second.carbs).toBe(165); // 2.75 h × 60 g, to 5 g
    expect(second.warn).toEqual([]);
  });
  it('a shop closed when you get there does not count: buy for the way to the next open one', () => {
    const pois = [
      { kind: 'shop', km: 40, name: 'test_data_ Laden zu', hours: 'closed' },
      { kind: 'shop', km: 100, name: 'test_data_ Laden offen', hours: 'open' },
    ];
    const openAt = (h) => (h === 'open' ? { open: true } : { open: false, opens: '07:00' });
    const plan = fuelPlan({ totalKm: 110, pois, values: valuesOf({ stopH: 6 }), pace: flat, kinds: RACE_KINDS, eta: (km) => dayStartMs('2026-07-04') + km * 36e5, openAt, tempAt: () => 10 });
    expect(plan.sections[0].toKm).toBe(100);
    expect(plan.sections[0].warn).toContain('closed');
    expect(plan.sections[0].closed[0]).toMatchObject({ name: 'test_data_ Laden zu', opens: '07:00' });
    expect(plan.sections[0].carbs).toBe(300);
  });
  it('warns when the water of the longest dry stretch does not fit in the bottles', () => {
    const plan = fuelPlan({ totalKm: 60, pois: [{ kind: 'water', km: 50 }], values: valuesOf({ bottles: 1, bottleL: 0.5 }), pace: flat, tempAt: () => 35 });
    expect(plan.sections[0].maxDry).toMatchObject({ fromKm: 0, toKm: 50, l: 5 });
    expect(plan.sections[0].warn).toContain('bottles');
  });
});

describe('products', () => {
  it('takes your products in turn until the amount is there', () => {
    const products = [{ id: 'a', name: 'test_data_ Riegel', carbs: 40 }, { id: 'b', name: 'test_data_ Gel', carbs: 25 }, { id: 'c', name: 'off', carbs: 50, on: false }];
    const p = packOf(150, products);
    expect(p.items.map((x) => [x.product.id, x.n])).toEqual([['a', 3], ['b', 2]]);
    expect(p.carbs).toBe(170);
    expect(packOf(100, []).items).toEqual([]);
  });
  it('moves a product with arrows or drag', () => {
    expect(moveProduct([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveProduct([1, 2, 3], 2, -1)).toEqual([3, 1, 2]);
  });
});
