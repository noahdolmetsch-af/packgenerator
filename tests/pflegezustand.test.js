// «Das Velo zeigt seine Pflege» (Paket C idea 22): when the drawn bike gleams, gets dusty or shows a cobweb. Fictional data.
import { describe, it, expect } from 'vitest';
import { careDay, careLook, GLEAM_DAYS, DUST_DAYS, WEB_DAYS } from '../src/lib/bikes/pflegezustand.js';

const TODAY = '2026-11-03';
// calendar-day arithmetic, never Date.now() + n * 864e5
const ago = (n) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
const bike = (extra = {}) => ({ id: 'b1', name: 'test_data_gtp_ Gravel', parts: [], ...extra });
const chain = (history) => [{ key: 'chain', history }];

describe('careDay', () => {
  it('is null when nothing is recorded', () => {
    expect(careDay(bike())).toBeNull();
  });
  it('counts a wash, a service and the service of the whole bike; takes the newest', () => {
    expect(careDay(bike({ washes: [{ date: ago(30) }] }))).toBe(ago(30));
    expect(careDay(bike({ parts: chain([{ date: ago(20), action: 'service', result: 'done' }]) }))).toBe(ago(20));
    expect(careDay(bike({ service: { last: { day: ago(5) } }, washes: [{ date: ago(30) }] }))).toBe(ago(5));
  });
  it('ignores a plain check and a «work needed» entry', () => {
    const parts = chain([
      { date: ago(2), action: 'check', result: 'ok' },
      { date: ago(1), action: 'replace', result: 'needed' },
    ]);
    expect(careDay(bike({ parts }))).toBeNull();
  });
  it('counts a repair that is finished', () => {
    const tasks = [{ bikeId: 'b1', status: 'done', statusDate: ago(3), task: 'Fix' }];
    expect(careDay(bike(), tasks)).toBe(ago(3));
  });
});

describe('careLook', () => {
  const look = (n) => careLook(bike({ washes: [{ date: ago(n) }] }), [], TODAY);
  it('looks normal without any record (never dusty out of ignorance)', () => {
    expect(careLook(bike(), [], TODAY)).toEqual({ look: 'normal', days: null });
  });
  it('gleams for a week after the care', () => {
    expect(look(0).look).toBe('clean');
    expect(look(GLEAM_DAYS).look).toBe('clean');
    expect(look(GLEAM_DAYS + 1).look).toBe('normal');
  });
  it('gets dusty, then a cobweb', () => {
    expect(look(DUST_DAYS - 1).look).toBe('normal');
    expect(look(DUST_DAYS).look).toBe('dusty');
    expect(look(WEB_DAYS - 1).look).toBe('dusty');
    expect(look(WEB_DAYS).look).toBe('web');
    expect(look(74)).toEqual({ look: 'dusty', days: 74 });
  });
  it('treats a day in the future as today', () => {
    expect(careLook(bike({ washes: [{ date: ago(-3) }] }), [], TODAY)).toEqual({ look: 'clean', days: 0 });
  });
});
