// UI-Prüfung 07.11.2026 T3: the card «Für deine Tour» on the weather page. Fictional data, calendar days.
import { describe, it, expect } from 'vitest';
import { upcomingTrip, tourWeather, rainGear, tourDay, comingUp } from '../src/lib/wetter/zurtour.js';
import { atLocal } from '../src/lib/wetter/kern.js';

const TODAY = '2026-11-18';
const trip = (id, startDate, extra = {}) => ({ id, title: id, startDate, days: 1, ...extra });
const hours = (date, rainAt = null) =>
  Array.from({ length: 24 }, (_, h) => ({ ms: atLocal(date, h, 3600), temp: 8 + h / 4, rainP: rainAt === h ? 80 : 5, rainMm: rainAt === h ? 1.2 : 0, wind: 12 }));

describe('Für deine Tour', () => {
  it('the next tour is the first planned one that is not over; skipped and finished ones are left out', () => {
    const trips = [trip('alt', '2026-11-10'), trip('weg', '2026-11-19', { skipped: true }), trip('fertig', '2026-11-19', { status: 'done' }), trip('b', '2026-11-25'), trip('a', '2026-11-21')];
    expect(upcomingTrip(trips, TODAY).id).toBe('a');
    expect(upcomingTrip([trip('x', '2026-11-17', { days: 3 })], TODAY).id).toBe('x'); // day 2 of 3 is on the way
    expect(upcomingTrip([trip('alt', '2026-11-10')], TODAY)).toBeNull();
    expect(comingUp(trip('nodate', ''), TODAY)).toBe(false);
  });

  it('the tour day is the start day, or today for a trip on the way', () => {
    expect(tourDay(trip('a', '2026-11-21'), TODAY)).toBe('2026-11-21');
    expect(tourDay(trip('a', '2026-11-17', { days: 3 }), TODAY)).toBe(TODAY);
  });

  it('the weather of the tour day: temperatures and the hour the rain starts', () => {
    const core = { offset: 3600, hours: [...hours('2026-11-21', 15), ...hours('2026-11-22')] };
    const w = tourWeather(core, trip('a', '2026-11-21'), TODAY);
    expect(w.date).toBe('2026-11-21');
    expect(w.rainFrom).toBe(atLocal('2026-11-21', 15, 3600));
    expect(w.tmin).toBeLessThan(w.tmax);
    expect(tourWeather({ offset: 3600, hours: hours('2026-11-22') }, trip('a', '2026-11-21'), TODAY)).toBeNull(); // only the next day saved: nothing for the tour day
  });

  it('a dry day has no rain hour; a day beyond the forecast and no forecast give null', () => {
    const core = { offset: 3600, hours: hours('2026-11-21') };
    expect(tourWeather(core, trip('a', '2026-11-21'), TODAY).rainFrom).toBeNull();
    expect(tourWeather(core, trip('far', '2026-12-30'), TODAY)).toBeNull();
    expect(tourWeather(null, trip('a', '2026-11-21'), TODAY)).toBeNull();
  });

  it('rain things on the list: by their own setting or category, packed counted', () => {
    const items = [{ id: 'j', name: 'Jacke', rain: 'yes' }, { id: 'h', name: 'Hose', category: 'rain' }, { id: 's', name: 'Schloss' }];
    const t = trip('a', '2026-11-21', { entries: [{ itemId: 'j', packed: true }, { itemId: 'h', packed: false }, { itemId: 's', packed: true }, { itemId: 'gone', packed: true }] });
    expect(rainGear(t, items)).toEqual({ n: 2, packed: 1 });
    expect(rainGear(trip('b', '2026-11-21'), items)).toEqual({ n: 0, packed: 0 });
  });
});
