// Paket Q Zusatz 3: «Für unterwegs offline speichern» before a trip.
import { describe, it, expect } from 'vitest';
import { offlineSoon, offlinePlace, offlineLine } from '../src/lib/clear/offline.js';

describe('save for the way', () => {
  const trip = { startDate: '2026-10-22', days: 2 };
  it('shows from 3 days before until the last day', () => {
    expect(offlineSoon(trip, '2026-10-18')).toBe(false);
    expect(offlineSoon(trip, '2026-10-19')).toBe(true);
    expect(offlineSoon(trip, '2026-10-23')).toBe(true);
    expect(offlineSoon(trip, '2026-10-24')).toBe(false);
    expect(offlineSoon({}, '2026-10-19')).toBe(false);
  });
  it('takes the trip place, else home', () => {
    const home = { name: 'Testort', lat: 46.9, lon: 7.4 };
    expect(offlinePlace({ place: { name: 'Startort', lat: 46.5, lon: 8 } }, home).name).toBe('Startort');
    expect(offlinePlace({ place: { name: 'ohne Koordinaten' } }, home).name).toBe('Testort');
    expect(offlinePlace({}, null)).toBeNull();
  });
  it('says what is saved', () => {
    expect(offlineLine({ weather: true, alerts: true }).vars.what).toEqual(['the weather', 'the alerts']);
    expect(offlineLine({}).vars).toBeUndefined();
  });
});
