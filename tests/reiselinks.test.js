// «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»): the links with the trip's place and days filled in.
// Fictional places and trips only.
import { describe, it, expect } from 'vitest';
import { travelLinks, bookingUrl, airbnbUrl, hostelworldUrl, flightNo, flightradarUrl, googleFlightsUrl, carUrl, rome2rioUrl, wikivoyageUrl, abroad, stayDays, plusDays, LINKS } from '../src/lib/sk/links.js';
import { SK_ICON } from '../src/lib/sk/icons.js';
import { pageOf, placeOf } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const lisbon = { name: 'Lisbon', detail: 'Lisbon, Portugal', lat: 38.7223, lon: -9.1393 };
const bern = { name: 'Bern', detail: 'Bern, Switzerland', lat: 46.948, lon: 7.4474 };
const trip = (x) => ({ id: 'test_trip_1', title: 'test_data_trip', startDate: '2026-10-31', days: 2, overnight: 'lodging', place: lisbon, ...x });
const kinds = (list) => list.map((l) => l.kind);

describe('days and places', () => {
  it('counts calendar days and the nights of a trip', () => {
    expect(plusDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(plusDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(stayDays({ startDate: '2026-10-31', days: 3 })).toEqual({ from: '2026-10-31', to: '2026-11-02' });
    expect(stayDays({ startDate: '2026-10-31', days: 1 })).toEqual({ from: '2026-10-31', to: '2026-11-01' });
    expect(stayDays({})).toEqual({ from: '', to: '' });
  });
  it('knows a place abroad by its country, else by its coordinates', () => {
    expect(abroad(lisbon)).toBe(true);
    expect(abroad(bern)).toBe(false);
    expect(abroad({ name: 'Somewhere', lat: 46.5, lon: 8 })).toBe(false);
    expect(abroad({ name: 'Elsewhere', lat: 48.8, lon: 2.3 })).toBe(true);
    expect(abroad(null)).toBe(false);
  });
  it('reads a flight number and refuses anything else', () => {
    expect(flightNo('lx 1234')).toBe('LX1234');
    expect(flightNo('U2-1234')).toBe('U21234');
    expect(flightNo('EZY12')).toBe('EZY12');
    expect(flightNo('hello')).toBe('');
    expect(flightNo('javascript:alert(1)')).toBe('');
    expect(flightradarUrl('LX 1234')).toBe('https://www.flightradar24.com/data/flights/lx1234');
    expect(flightradarUrl('x')).toBe('https://www.flightradar24.com/');
  });
});

describe('the addresses', () => {
  it('fill in only the place and the days', () => {
    expect(bookingUrl(lisbon, '2026-10-31', '2026-11-01')).toBe('https://www.booking.com/searchresults.de.html?ss=Lisbon&checkin=2026-10-31&checkout=2026-11-01&group_adults=1&no_rooms=1');
    expect(bookingUrl(null, '', '', 'en')).toBe('https://www.booking.com/searchresults.en-gb.html?group_adults=1&no_rooms=1');
    expect(airbnbUrl(lisbon, '2026-10-31', '2026-11-01')).toBe('https://www.airbnb.com/s/Lisbon/homes?checkin=2026-10-31&checkout=2026-11-01&adults=1');
    expect(airbnbUrl(null)).toBe('https://www.airbnb.com/');
    expect(hostelworldUrl(lisbon, '2026-10-31', '2026-11-01')).toContain('q=Lisbon&from=2026-10-31&to=2026-11-01');
    expect(carUrl(lisbon)).toBe('https://www.google.com/maps/dir/?api=1&destination=38.722%2C-9.139&travelmode=driving');
    expect(rome2rioUrl(lisbon, { name: 'Bern' })).toBe('https://www.rome2rio.com/s/Bern/Lisbon');
    expect(googleFlightsUrl(lisbon, '2026-10-31', 'en')).toContain('q=Flights%20to%20Lisbon%20on%202026-10-31');
    expect(wikivoyageUrl(lisbon)).toBe('https://de.wikivoyage.org/w/index.php?search=Lisbon');
  });
  it('are all https', () => {
    const list = travelLinks(trip({ flight: 'LX1234', event: true }), { bike: true, mountain: true });
    for (const l of list) if (l.href) expect(l.href.startsWith('https://'), l.kind).toBe(true);
  });
});

describe('the links of a trip', () => {
  it('abroad with a hotel night: stay, flight search, car and the abroad links', () => {
    expect(kinds(travelLinks(trip()))).toEqual(['xbk', 'xab', 'xhw', 'xgf', 'xcar', 'xr2r', 'xeda', 'xwv']);
  });
  it('in Switzerland without a night: only by car', () => {
    expect(kinds(travelLinks(trip({ place: bern, days: 1, overnight: 'none' })))).toEqual(['xcar']);
  });
  it('a flight number, a bike, a hut and a race add their links', () => {
    const list = travelLinks(trip({ place: bern, flight: 'LX1234', event: true }), { bike: true, mountain: true });
    expect(kinds(list)).toEqual(['xbk', 'xab', 'xhw', 'xfr', 'xcar', 'xws', 'xsac', 'xtrk']);
    expect(list.find((l) => l.kind === 'xtrk').slot).toBe('xtrk:test_trip_1');
  });
  it('a night outside: no hotel links', () => {
    expect(kinds(travelLinks(trip({ overnight: 'outdoor' })))).not.toContain('xbk');
  });
  it('no place: nothing but a flight', () => {
    expect(kinds(travelLinks(trip({ place: null, flight: 'LX1234' })))).toEqual(['xfr']);
  });
  it('every link has a known kind, an icon and a German name', () => {
    const list = travelLinks(trip({ flight: 'LX1234', event: true }), { bike: true, mountain: true });
    for (const l of list) {
      expect(LINKS[l.kind], l.kind).toBeTruthy();
      expect(SK_ICON[l.icon], l.icon).toBeTruthy();
      expect(DE[LINKS[l.kind].label], LINKS[l.kind].label).toBeTruthy();
    }
  });
});

describe('the page', () => {
  it('Touren › Reise-Links', () => {
    expect(pageOf('#/travel')).toBe('travel');
    expect(placeOf('travel')).toBe('trips');
  });
});
