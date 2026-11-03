import { describe, it, expect } from 'vitest';
import { lastShopBeforeNight, minutesTo } from '../src/lib/live/lastshop.js';

// 20 km/h on the flat, no profile. 2026-06-10 is a Wednesday (local time of the test machine).
const at = (h, m = 0) => new Date(2026, 5, 10, h, m).getTime();
const shop = (id, km, hours, kind = 'shop') => ({ id, kind, km, hours, name: id });
const light = (setH) => ({ set: at(setH), rise: at(5), dark: false, minLeft: 0 });

describe('lastShopBeforeNight', () => {
  it('picks the last shop reached before sunset that is open then', () => {
    const pois = [shop('a', 10, 'Mo-Su 07:00-20:00'), shop('b', 40, 'Mo-Su 07:00-19:00'), shop('c', 90, 'Mo-Su 07:00-20:00')];
    const r = lastShopBeforeNight({ pois, km: 0, now: at(14), light: light(21) });
    // a at 14:30, b at 16:00, c at 18:30: all before 21:00 and open → c
    expect(r.state).toBe('ok');
    expect(r.last.poi.id).toBe('c');
    expect(r.last.closes).toBe('20:00');
    expect(r.last.minToClose).toBe(90);
    expect(r.sure).toBe(true);
  });

  it('skips a shop that is closed when you get there and one after sunset', () => {
    const pois = [shop('a', 20, 'Mo-Su 07:00-20:00'), shop('b', 60, 'Mo-Su 07:00-16:00'), shop('c', 200, 'Mo-Su 07:00-23:00')];
    const r = lastShopBeforeNight({ pois, km: 0, now: at(14), light: light(18), rangeKm: 300 });
    // b at 17:00 is closed (16:00), c at 24:00 is after sunset → a
    expect(r.last.poi.id).toBe('a');
  });

  it('a shop with known hours wins over one without; without any hours it says not sure', () => {
    const r = lastShopBeforeNight({ pois: [shop('a', 20, 'Mo-Su 07:00-20:00'), shop('b', 50, '')], km: 0, now: at(14), light: light(21) });
    expect(r.last.poi.id).toBe('a');
    const u = lastShopBeforeNight({ pois: [shop('b', 50, '')], km: 0, now: at(14), light: light(21) });
    expect(u.last.poi.id).toBe('b');
    expect(u.sure).toBe(false);
    expect(u.last.open).toBe(null);
  });

  it('none left before the night, or already dark: the nearest open one is next', () => {
    const none = lastShopBeforeNight({ pois: [shop('a', 150, 'Mo-Su 07:00-23:00')], km: 0, now: at(14), light: light(16) });
    expect(none.state).toBe('none');
    expect(none.next.poi.id).toBe('a');
    const dark = lastShopBeforeNight({ pois: [shop('a', 5, 'Mo-Su 00:00-23:59')], km: 0, now: at(22), light: { set: at(21), rise: at(5), dark: true } });
    expect(dark.state).toBe('dark');
    expect(dark.next.poi.id).toBe('a');
  });

  it('ignores places behind you, other kinds, and gives null without a position or light', () => {
    const pois = [shop('behind', 5, 'Mo-Su 07:00-20:00'), shop('water', 30, '', 'water'), shop('fuel', 30, '', 'fuel')];
    const r = lastShopBeforeNight({ pois, km: 10, now: at(14), light: light(21) });
    expect(r.last.poi.id).toBe('fuel');
    expect(lastShopBeforeNight({ pois, km: null, light: light(21) })).toBe(null);
    expect(lastShopBeforeNight({ pois, km: 10 })).toBe(null);
  });
});

describe('minutesTo', () => {
  it('counts to the next clock time, over midnight too', () => {
    expect(minutesTo('20:00', at(18, 30))).toBe(90);
    expect(minutesTo('01:00', at(23, 30))).toBe(90);
    expect(minutesTo('x', at(12))).toBe(null);
  });
});
