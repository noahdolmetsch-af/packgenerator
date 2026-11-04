// «Velo-Geburtstag» (Paket C idea 21): which bikes have their birthday today. Fictional data.
import { describe, it, expect } from 'vitest';
import { bikeBirthdays } from '../src/lib/home/geburtstag.js';

const bike = (bought, extra = {}) => ({ id: 'b1', name: 'test_data_gtp_ Gravel', bought, km: 6428, ...extra });

describe('bikeBirthdays', () => {
  it('finds a bike on the day of its purchase, years later, with its km', () => {
    expect(bikeBirthdays([bike('2024-11-03')], '2026-11-03')).toEqual([{ bike: bike('2024-11-03'), years: 2, km: 6428 }]);
  });
  it('says nothing on the day of the purchase itself (0 years) or on other days', () => {
    expect(bikeBirthdays([bike('2026-11-03')], '2026-11-03')).toEqual([]);
    expect(bikeBirthdays([bike('2024-11-02')], '2026-11-03')).toEqual([]);
    expect(bikeBirthdays([bike('2024-10-03')], '2026-11-03')).toEqual([]);
  });
  it('needs a date; a bike without one or with a wrong one has no birthday', () => {
    expect(bikeBirthdays([bike(undefined), bike(''), bike('03.11.2024')], '2026-11-03')).toEqual([]);
    expect(bikeBirthdays([bike('2024-11-03')], 'x')).toEqual([]);
  });
  it('gives km null when the bike has none', () => {
    expect(bikeBirthdays([bike('2024-11-03', { km: undefined })], '2026-11-03')[0].km).toBeNull();
    expect(bikeBirthdays([bike('2024-11-03', { km: 0 })], '2026-11-03')[0].km).toBeNull();
  });
  it('moves a 29 February birthday to 28 February in a year without one', () => {
    expect(bikeBirthdays([bike('2024-02-29')], '2026-02-28')).toHaveLength(1);
    expect(bikeBirthdays([bike('2024-02-29')], '2028-02-29')).toHaveLength(1);
    expect(bikeBirthdays([bike('2024-02-29')], '2028-02-28')).toEqual([]);
  });
  it('lists several bikes', () => {
    expect(bikeBirthdays([bike('2023-11-03'), bike('2025-11-03', { id: 'b2' })], '2026-11-03').map((x) => x.years)).toEqual([3, 1]);
  });
});
