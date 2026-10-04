import { describe, it, expect } from 'vitest';
import { stageCount, blocks, blockHours, addHours, dayIndex, onTripDay, pointAt, stage, addTime, dayGain, dayProfile, placeName, fetchHourly, rideHours, wxSummary, addRideNote } from '../src/lib/ride.js';
import { parseGpx, routeStats, profileOf } from '../src/lib/route.js';
import { beforeTrip, REMIND_DAYS } from '../src/lib/workshop.js';

const trip = { id: 't1', title: '303', startDate: '2026-10-15', days: 3, entries: [] };

describe('ride days', () => {
  it('finds the day of the trip', () => {
    expect(dayIndex(trip, '2026-10-10')).toBe(0);
    expect(dayIndex(trip, '2026-10-16')).toBe(1);
    expect(dayIndex(trip, '2026-10-20')).toBe(2);
    expect(onTripDay(trip, '2026-10-17')).toBe(true);
    expect(onTripDay(trip, '2026-10-18')).toBe(false);
    expect(onTripDay(trip, '2026-10-14')).toBe(false);
  });
  it('adds riding hours to the start time', () => {
    expect(addTime('08:00', 6.5)).toBe('14:30');
    expect(addTime('20:00', 5)).toBe('01:00 (+1 day)');
    expect(addTime('', 3)).toBe(null);
  });
});

describe('stage', () => {
  const line = [[47, 8], [47, 8.5], [47, 9]];
  it('shares the route over the days', () => {
    const t = { ...trip, route: { km: 303, gainM: 3000, start: { lat: 47, lon: 8 }, end: { lat: 47, lon: 9 }, line }, rideStart: { 1: '07:00' } };
    const s0 = stage(t, 0);
    expect(s0.km).toBe(101);
    expect(s0.gainM).toBe(1000);
    expect(s0.from).toEqual({ lat: 47, lon: 8 });
    expect(s0.start).toBe('08:00');
    const s1 = stage(t, 1);
    expect(s1.start).toBe('07:00');
    expect(s1.from.lon).toBeCloseTo(8.333, 2);
    expect(s1.to.lon).toBeCloseTo(8.667, 2);
    expect(stage(t, 2).to).toEqual({ lat: 47, lon: 9 });
    expect(s1.arrive).toBe(addTime('07:00', s1.hours));
  });
  it('works without a route', () => {
    const s = stage({ ...trip, place: { name: 'Aarau', lat: 47.39, lon: 8.04 } }, 0);
    expect(s.km).toBe(null);
    expect(s.from.name).toBe('Aarau');
  });
  it('point along the line', () => {
    expect(pointAt(line, 0.5)).toEqual({ lat: 47, lon: 8.5 });
    expect(pointAt([], 0.5)).toBe(null);
  });
});

describe('nonstop', () => {
  const plan = { schedule: [
    { block: 'Block 1', from: '09:00', to: '12:00' },
    { block: 'Block 2', from: '12:00', to: '15:00' },
    { block: 'Break', from: '21:00', to: '22:30' },
    { block: 'Block 3', from: '22:30', to: '01:30' },
    { block: 'Power nap', from: '07:30', to: '08:30' },
    { block: 'Block 4', from: '08:30', to: '11:30' },
    { block: 'Note only', from: null, to: null },
  ] };
  const t = { ...trip, nonstop: true, plan, route: { km: 160, gainM: 0, start: { lat: 47, lon: 8 }, end: { lat: 47, lon: 9 }, line: [[47, 8], [47, 9]] } };
  it('is one stage through the night, starting with the plan', () => {
    expect(stageCount(t)).toBe(1);
    expect(stageCount(trip)).toBe(3);
    const st = stage(t, 2);
    expect(st.day).toBe(0);
    expect(st.km).toBe(160);
    expect(st.hours).toBe(10);
    expect(st.start).toBe('09:00');
    expect(st.startAt).toBe('2026-10-15T09:00');
    expect(st.endAt).toBe('2026-10-15T19:00');
    expect(addHours('2026-10-15T20:00', 6.5)).toBe('2026-10-16T02:30');
  });
  it('blocks from the time plan: breaks add no km, next day after midnight', () => {
    const b = blocks(t, stage(t, 0));
    expect(b.map((x) => [x.name, x.startAt, x.kmFrom, x.kmTo])).toEqual([
      ['Block 1', '2026-10-15T09:00', 0, 48],
      ['Block 2', '2026-10-15T12:00', 48, 96],
      ['Break', '2026-10-15T21:00', 96, 96],
      ['Block 3', '2026-10-15T22:30', 96, 144],
      ['Power nap', '2026-10-16T07:30', 144, 144],
      ['Block 4', '2026-10-16T08:30', 144, 160],
    ]);
    expect(b[3].endAt).toBe('2026-10-16T01:30');
  });
  it('blocks of 3 hours without a plan', () => {
    const b = blocks({ ...t, plan: null }, stage({ ...t, plan: null }, 0));
    expect(b.map((x) => x.kmTo)).toEqual([48, 96, 144, 160]);
    expect(b[0].startAt).toBe('2026-10-15T08:00');
  });
  it('hours over midnight', () => {
    const hrs = [['2026-10-15T22:00', 22], ['2026-10-15T23:00', 23], ['2026-10-16T00:00', 0], ['2026-10-16T01:00', 1]].map(([t, h]) => ({ t, h, temp: 5 }));
    expect(rideHours(hrs, '2026-10-15T23:30', '2026-10-16T00:10').map((x) => x.h)).toEqual([22, 23, 0, 1]);
    expect(blockHours(hrs, { startAt: '2026-10-15T23:00', endAt: '2026-10-16T01:00' }).map((x) => x.h)).toEqual([23, 0]);
  });
});

describe('elevation profile', () => {
  const gpx = `<gpx><trk><name>Test</name><trkseg>${Array.from({ length: 31 }, (_, i) => `<trkpt lat="47" lon="${8 + i * 0.01}"><ele>${i <= 10 ? 400 + i * 30 : i <= 20 ? 700 : 700 - (i - 20) * 10}</ele></trkpt>`).join('')}</trkseg></trk></gpx>`;
  const route = routeStats(parseGpx(gpx), 'test.gpx');
  it('stores km and metres', () => {
    expect(route.profile.length).toBe(31);
    expect(route.profile[0]).toEqual([0, 400]);
    expect(route.profile.at(-1)[1]).toBe(600);
    expect(profileOf([{ lat: 1, lon: 1, ele: null }, { lat: 1, lon: 2, ele: null }])).toEqual([]);
  });
  it('gives each day its own climbing', () => {
    expect(route.gainM).toBe(300);
    expect(dayGain(route, 0, 3)).toBe(300); // all the climbing is on the first third
    expect(dayGain(route, 1, 3)).toBe(0);
    expect(dayGain({ gainM: 900 }, 1, 3)).toBe(300); // no profile: even share
    const p = dayProfile(route, 1, 3);
    expect(p.from).toBeCloseTo(route.profile.at(-1)[0] / 3, 5);
  });
});

describe('what is where', () => {
  it('names the place', () => {
    expect(placeName(trip, { key: 'body' })).toBe('On you');
    expect(placeName({ purpose: { seat: 'Sleep' } }, { key: 'seat', zone: { name: 'Seat' }, bag: { name: 'Seat pack' } })).toBe('Sleep');
  });
});

describe('weather hour by hour', () => {
  const fake = async (url) => ({
    ok: true,
    json: async () => ({ hourly: { time: ['2026-10-15T07:00', '2026-10-15T08:00', '2026-10-15T14:00', '2026-10-15T22:00'], temperature_2m: [6.12, 8, 14, 9], precipitation: [0, 0, 1.2, 0], precipitation_probability: [10, 10, 70, 20], wind_speed_10m: [5, 10, 20, 10], wind_gusts_10m: [10, 20, 42, 15] }, url }),
  });
  it('fetches and sums up', async () => {
    const wx = await fetchHourly([{ name: 'Start', lat: 47, lon: 8 }], '2026-10-15', fake, new Date('2026-10-14T06:00:00Z'));
    expect(wx.fetchedAt).toBe('2026-10-14T06:00:00.000Z');
    const h = wx.places[0].hours;
    expect(h[0]).toEqual({ t: '2026-10-15T07:00', h: 7, temp: 6.1, rainMm: 0, rainPct: 10, wind: 5, gust: 10 });
    const ride = rideHours(h, '2026-10-15T08:00', '2026-10-15T15:30');
    expect(ride.map((x) => x.h)).toEqual([7, 8, 14]);
    expect(wxSummary(ride)).toBe('6–14 °C · rain likely from 14 h · gusts up to 42 km/h');
  });
});

describe('notes for the debrief', () => {
  it('starts a draft and adds notes', () => {
    const d1 = addRideNote(null, trip, '  Puncture at km 80 ', 0, '2026-10-15T10:00:00Z');
    expect(d1.status).toBe('draft');
    expect(d1.rideNotes).toEqual([{ at: '2026-10-15T10:00:00Z', day: 0, text: 'Puncture at km 80' }]);
    const d2 = addRideNote(d1, trip, 'Cold hands', 1, '2026-10-16T09:00:00Z');
    expect(d2.rideNotes.length).toBe(2);
    expect(d1.rideNotes.length).toBe(1);
  });
});

describe('workshop before a trip', () => {
  const bike = {
    id: 'b',
    km: 2000,
    parts: [
      { key: 'tyres', model: '', history: [{ date: '2026-07-18', km: 1500, action: 'service', result: 'done' }] },
      { key: 'chain', model: '', history: [{ date: '2026-10-01', km: 1950, action: 'service', result: 'done' }] },
      { key: 'fork', model: '', history: [{ date: '2025-10-20', km: 1900, action: 'service', result: 'done' }] },
      { key: 'padsF', model: '', history: [{ date: '2026-09-01', km: 1200, action: 'check', result: 'ok' }] },
    ],
  };
  const t = { ...trip, route: { km: 303 } };
  it('only from 14 days before until the end', () => {
    expect(REMIND_DAYS).toBe(14);
    expect(beforeTrip(bike, t, undefined, '2026-09-30')).toBe(null);
    expect(beforeTrip(bike, t, undefined, '2026-10-18')).toBe(null);
    expect(beforeTrip(bike, t, undefined, '2026-10-01')).not.toBe(null);
  });
  it('lists what is due now and on the way', () => {
    const r = beforeTrip(bike, t, { front: 'tubeless', rear: 'tubeless' }, '2026-10-04');
    expect(r.days).toBe(11);
    const by = Object.fromEntries(r.rows.map((x) => [x.key, x]));
    expect(by.tyres.when).toBe('during'); // sealant every 90 days: due 16.10, on the trip
    expect(by.fork).toBeUndefined(); // once a year: due 20.10, after the trip
    expect(by.chain).toMatchObject({ when: 'during', detail: 'due after 100 km of the route' });
    expect(by.check).toMatchObject({ when: 'during' }); // pads: 800 km + 303 km
    expect(r.rows.some((x) => x.late)).toBe(false);
    const late = beforeTrip({ ...bike, km: 2700 }, t, undefined, '2026-10-04');
    expect(late.rows.filter((x) => x.when === 'now').map((x) => x.key).sort()).toEqual(['chain', 'check']);
    expect(late.rows[0].late).toBe(true);
  });
});
