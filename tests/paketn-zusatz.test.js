// Paket N, Zusätze (Noah 19.10.2026 «1-5 a»): dream with picture and map, push before a registration
// deadline, the next Kompass step on Heute, dreams in «Woche planen». Fictional data only.
import { describe, it, expect } from 'vitest';
import { routeFromGpx, linkKind, weekDreams, ROUTE_POINTS } from '../src/lib/dreams.js';
import { compassOf, todayStep, setStepDone } from '../src/lib/compass.js';
import { buildList } from '../src/lib/push/schedule.js';

const P = 'test_data_gtp_';
const gpx = (n) => `<?xml version="1.0"?><gpx><trk><name>${P}Jura</name><trkseg>${Array.from({ length: n }, (_, i) => `<trkpt lat="${47 + i / 1000}" lon="7.1"><ele>500</ele></trkpt>`).join('')}</trkseg></trk></gpx>`;

describe('idea 1: picture and map of a dream', () => {
  it('reads a GPX route, keeps at most ROUTE_POINTS points, counts the km', () => {
    const r = routeFromGpx(gpx(1001));
    expect(r.name).toBe(`${P}Jura`);
    expect(r.line.length).toBeLessThanOrEqual(ROUTE_POINTS + 1);
    expect(r.line[0]).toEqual([47, 7.1]);
    expect(r.line.at(-1)).toEqual([48, 7.1]);
    expect(r.km).toBe(111);
    expect(routeFromGpx('<gpx></gpx>')).toBe(null);
    expect(routeFromGpx(gpx(3), 'Eigene').name).toBe('Eigene');
  });
  it('names the link', () => {
    expect(linkKind('https://www.komoot.com/de-de/tour/123')).toBe('komoot');
    expect(linkKind('https://example.org/x')).toBe('example.org');
    expect(linkKind('kein link')).toBe('');
  });
});

describe('idea 5: dreams and races in a week', () => {
  const store = { dreams: [{ id: 'd1', title: `${P}Pässe`, kind: 'alps' }, { id: 'd2', title: `${P}Süden`, kind: 'south' }] };
  it('a deadline in the week and the dreams that fit, with the Saturday', () => {
    const trips = [{ id: 't1', title: `${P}Rennen`, startDate: '2026-09-20', days: 1, event: { signupBy: '2026-08-05' } }];
    const w = weekDreams({ store, trips, monday: '2026-08-03', today: '2026-08-03' });
    expect(w.deadlines).toEqual([{ tripId: 't1', title: `${P}Rennen`, day: '2026-08-05' }]);
    expect(w.dreams).toEqual([{ id: 'd1', title: `${P}Pässe`, day: '2026-08-08' }]);
  });
  it('no dreams in a week with a trip; signed-up races leave no deadline', () => {
    const trips = [{ id: 't2', title: 'x', startDate: '2026-08-08', days: 2, event: { signupBy: '2026-08-04', signedUp: true } }];
    expect(weekDreams({ store, trips, monday: '2026-08-03', today: '2026-08-03' })).toEqual({ deadlines: [], dreams: [] });
  });
});

describe('idea 3: the next Kompass step on Heute', () => {
  const c = compassOf({ goals: [
    { id: 'g1', title: `${P}Alpenbrevet`, steps: [{ id: 's1', text: 'Velo prüfen', date: '2026-10-25', done: false }] },
    { id: 'g2', title: `${P}Rumpf`, steps: [{ id: 's2', text: 'Plan schreiben', date: '2026-10-18', done: false }, { id: 's3', text: 'x', date: '2026-10-01', done: true }] },
  ] });
  it('the earliest open dated step; late when before today', () => {
    expect(todayStep(c, '2026-10-19')).toMatchObject({ goal: { id: 'g2' }, step: { id: 's2' }, due: true, late: true });
    const done = setStepDone(c, 'g2', 's2');
    expect(todayStep(done, '2026-10-19')).toMatchObject({ step: { id: 's1' }, due: false, late: false });
  });
  it('switched off: nothing', () => {
    expect(c.onToday).toBe(true);
    expect(todayStep({ ...c, onToday: false }, '2026-10-19')).toBe(null);
    expect(compassOf({ onToday: false }).onToday).toBe(false);
  });
});

describe('idea 2: push before a registration deadline', () => {
  const now = new Date(2026, 9, 19, 9, 0);
  const trips = [
    { id: 'r1', title: `${P}Rennen`, status: 'planned', event: { signupBy: '2026-10-25' } },
    { id: 'r2', title: 'angemeldet', status: 'planned', event: { signupBy: '2026-10-25', signedUp: true } },
  ];
  it('3 days and 1 day before at 08:00, only when switched on and not signed up', () => {
    const on = buildList({ trips, now, settings: { push: { on: true, kinds: { race: true }, morning: false } } });
    expect(on.items.map((x) => x.key)).toEqual(['race:r1:2026-10-25:3', 'race:r1:2026-10-25:1']);
    expect(new Date(on.items[0].at).getHours()).toBe(8);
    expect(on.items[1].body).toContain(`${P}Rennen`);
    expect(buildList({ trips, now, settings: { push: { on: true, kinds: {} } } }).items).toEqual([]);
  });
});
