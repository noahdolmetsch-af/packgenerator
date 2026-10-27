// Gruppenfahrt für Events (Noah 26.10.2026 «1-5 alle», «6 auch für Rennen bauen 7 8 9», «1a 2b 3a 4a 5a"):
// the plan, a member's own part, the board (ready, help, gaps, who has what, costs, checkpoints), the
// thunderstorm along the route and the contact card. Fictional data only.
import { describe, it, expect } from 'vitest';
import { planPayload, readPlan, inNight, everyMs, partPayload, readPart, statusCount, helpCalls, helpKey, withGaps, itemsBoard, pointsOf, settle, chf, centsOf, checkpoints, cpNear, lastCp, placeAtKm, kmOfPoint, stormSamples, stormUrl, stormOf, towardStorm, cardLink, readCard } from '../src/lib/live/event.js';

const at = (iso) => new Date(iso).toISOString();
const route = { line: Array.from({ length: 41 }, (_, i) => [46.9 + i * 0.01, 7.4]), km: 44.5 };

describe('Gruppenfahrt für Events', () => {
  it('the plan: own night times, race checkpoints sorted, start time; broken parts are left out', () => {
    const p = readPlan(planPayload({ night: { from: '21:30', to: '05:45' }, race: true, cps: [{ name: 'test_data_gtp_ B', km: 30 }, { name: 'test_data_gtp_ A', km: 12.34 }], start: '07:30' }));
    expect(p).toEqual({ night: { from: '21:30', to: '05:45' }, race: true, cps: [{ name: 'test_data_gtp_ A', km: 12.3 }, { name: 'test_data_gtp_ B', km: 30 }], start: '07:30' });
    expect(readPlan(planPayload({ night: { from: '25:00', to: '6' }, start: 'früh' }))).toEqual({ night: null, race: false, cps: [], start: null });
    expect(readPlan(null).cps).toEqual([]);
  });
  it('the night pause in Swiss time, also over midnight; fewer calls with more members', () => {
    const n = { from: '22:00', to: '06:00' };
    expect(inNight(n, Date.parse('2026-10-09T23:30:00+02:00'))).toBe(true);
    expect(inNight(n, Date.parse('2026-10-09T05:59:00+02:00'))).toBe(true);
    expect(inNight(n, Date.parse('2026-10-09T06:00:00+02:00'))).toBe(false);
    expect(inNight({ from: '13:00', to: '14:00' }, Date.parse('2026-10-09T13:30:00+02:00'))).toBe(true);
    expect(inNight(null)).toBe(false);
    expect(everyMs(2)).toBe(2 * 60_000);
    expect(everyMs(10)).toBe(10 * 60_000);
    expect(everyMs(40)).toBe(20 * 60_000);
    expect(everyMs(3, { night: true })).toBe(15 * 60_000);
  });
  it('a member part goes back and forth; nonsense is dropped', () => {
    const part = {
      status: { kind: 'camp', at: at('2026-10-09T18:00:00Z') },
      help: { kind: 'flat', text: '  test_data_gtp_ kein   Schlauch ', at: at('2026-10-09T10:00:00Z') },
      has: ['Pumpe', 'pumpe', 'Pumpe', ''],
      need: ['Kettenöl'],
      costs: [{ id: 'c1', what: 'Camp', cents: 4800, for: null }, { id: 'c2', what: 'gratis', cents: 0 }],
      paid: [{ to: 'mB', cents: 500 }],
      points: [{ id: 'p1', kind: 'lunch', name: 'Mittag', lat: 46.912345678, lon: 7.4, time: '12:30' }],
      cps: { 0: at('2026-10-09T12:00:00Z'), x: 'no' },
    };
    const back = readPart(JSON.parse(JSON.stringify(partPayload(part))));
    expect(back.status).toEqual(part.status);
    expect(back.help).toEqual({ kind: 'flat', text: 'test_data_gtp_ kein Schlauch', at: part.help.at });
    expect(back.has).toEqual(['Pumpe', 'pumpe']);
    expect(back.costs).toEqual([{ id: 'c1', what: 'Camp', cents: 4800, for: null }]);
    expect(back.paid).toEqual([{ to: 'mB', cents: 500 }]);
    expect(back.points).toEqual([{ id: 'p1', kind: 'lunch', name: 'Mittag', lat: 46.91235, lon: 7.4, time: '12:30' }]);
    expect(back.cps).toEqual({ 0: part.cps[0] });
    expect(readPart({})).toEqual({ status: null, help: null, has: [], need: [], costs: [], paid: [], points: [], cps: {} });
  });
  it('ready and camp count only today; help calls of the others, newest first, gone after hours', () => {
    const now = Date.parse('2026-10-09T09:00:00+02:00');
    const rows = [
      { m: 'a', name: 'A', part: readPart(partPayload({ status: { kind: 'ready', at: at('2026-10-09T06:00:00Z') } })) },
      { m: 'b', name: 'B', km: 12, part: readPart(partPayload({ status: { kind: 'ready', at: at('2026-10-08T06:00:00Z') }, help: { kind: 'flat', text: '', at: at('2026-10-09T06:50:00Z') } })) },
      { m: 'c', name: 'C', part: readPart(partPayload({ help: { kind: 'fall', text: '', at: at('2026-10-09T06:55:00Z') } })) },
      { m: 'd', name: 'D', part: readPart(partPayload({ help: { kind: 'flat', text: '', at: at('2026-10-08T06:55:00Z') } })) },
    ];
    expect(statusCount(rows, now)).toEqual({ ready: 1, camp: 0, total: 4 });
    const calls = helpCalls(rows, { now, me: 'c' });
    expect(calls.map((c) => c.m)).toEqual(['b']);
    expect(calls[0]).toMatchObject({ kind: 'flat', km: 12 });
    expect(helpKey(calls[0])).toBe(`b@${at('2026-10-09T06:50:00Z')}`);
  });
  it('the gaps to the others along the route and the spread of the group', () => {
    const { rows, spread } = withGaps([{ m: 'me', me: true, km: 43 }, { m: 'l', km: 51 }, { m: 't', km: 37 }, { m: 'j', km: null }], 43);
    expect(rows.map((r) => r.gap)).toEqual([null, 8, -6, null]);
    expect(spread).toEqual({ front: 8, back: 6 });
    expect(withGaps([{ m: 'a', km: 3 }], null).spread).toBeNull();
  });
  it('who has what: everyone listed, missing things first, mine marked', () => {
    const rows = [
      { m: 'me', name: 'Du', part: readPart(partPayload({ has: ['Kocher'], need: ['Kettenöl'] })) },
      { m: 'l', name: 'Lea', part: readPart(partPayload({ has: ['Pumpe', 'kocher'] })) },
    ];
    expect(itemsBoard(rows, 'me')).toEqual([
      { name: 'Kettenöl', who: [], mine: false, needed: true, missing: true },
      { name: 'Kocher', who: ['Du', 'Lea'], mine: true, needed: false, missing: false },
      { name: 'Pumpe', who: ['Lea'], mine: false, needed: false, missing: false },
    ]);
    expect(pointsOf([{ m: 'l', name: 'Lea', part: readPart(partPayload({ points: [{ id: 'p', kind: 'camp', name: 'Camp', lat: 47, lon: 7 }] })) }])[0]).toMatchObject({ by: 'Lea', kind: 'camp' });
  });
  it('split costs: the mockup example, fair to the cent, as few payments as possible, payments done count', () => {
    const p = (costs, paid = []) => readPart(partPayload({ costs, paid }));
    const rows = [
      { m: 'me', name: 'Du', part: p([{ id: '1', what: 'Zeltplatz', cents: 4800, for: null }]) },
      { m: 'lea', name: 'Lea', part: p([{ id: '2', what: 'Abendessen', cents: 13250, for: null }]) },
      { m: 'tom', name: 'Tom', part: p([{ id: '3', what: 'Fähre', cents: 2400, for: ['tom', 'mia'] }]) },
      { m: 'mia', name: 'Mia', part: p([]) },
    ];
    const s = settle(rows);
    expect(s.total).toBe(20450);
    expect(Object.values(s.balance).reduce((a, b) => a + b, 0)).toBe(0);
    // each pays 12 for the camp and 33.12 for dinner (the two odd cents go to the first two), Tom and Mia 12 for the ferry
    expect(s.balance).toEqual({ me: 4800 - 1200 - 3313, lea: 13250 - 1200 - 3313, tom: 2400 - 1200 - 3312 - 1200, mia: -1200 - 3312 - 1200 });
    const sum = (m, k) => s.transfers.filter((x) => x[k] === m).reduce((a, x) => a + x.cents, 0);
    expect(sum('mia', 'from')).toBe(5712);
    expect(sum('tom', 'from')).toBe(3312);
    expect(s.transfers.length).toBeLessThanOrEqual(3);
    // Mia paid Lea: settled
    rows[3].part = p([], [{ to: 'lea', cents: 5712 }]);
    expect(settle(rows).transfers.some((x) => x.from === 'mia')).toBe(false);
    expect(chf(5713)).toBe('CHF 57.13');
    expect([centsOf('12'), centsOf('12,5'), centsOf('12.50'), centsOf('x')]).toEqual([1200, 1250, 1250, null]);
  });
  it('checkpoints with the finish, the next one near me, the last one reached', () => {
    const plan = readPlan(planPayload({ race: true, cps: [{ name: 'CP1', km: 10 }, { name: 'CP2', km: 30 }] }));
    const cps = checkpoints(plan, route);
    expect(cps.map((c) => [c.name, c.km, c.finish])).toEqual([['CP1', 10, false], ['CP2', 30, false], ['', 44.5, true]]);
    expect(cpNear(cps, 29.4)?.name).toBe('CP2');
    expect(cpNear(cps, 29.4, { 1: at('2026-10-09T10:00:00Z') })).toBeNull();
    expect(cpNear(cps, 20)).toBeNull();
    expect(lastCp(cps, { 0: 'a', 1: at('2026-10-09T10:00:00Z') }).cp.name).toBe('CP2');
    const p = placeAtKm(route, 10);
    expect(kmOfPoint(route, p)).toBeCloseTo(10, 0);
  });
  it('the thunderstorm: samples ahead of the group, one call, the first storm and who rides toward it', () => {
    const rows = [{ km: 5 }, { km: 12 }, { km: null }];
    const s = stormSamples(route, rows);
    expect(s[0].km).toBe(5);
    expect(s.map((x) => x.km)).toEqual([5, 15, 25, 35]);
    expect(stormUrl(s)).toMatch(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=46\.9\d*%2C/);
    const now = Date.parse('2026-10-09T12:00:00Z');
    const hour = (code) => ({ hourly: { time: [now / 1000, now / 1000 + 3600], weather_code: [1, code], cape: [0, 0], precipitation_probability: [0, 0] } });
    const storm = stormOf([hour(1), hour(1), hour(95), hour(96), hour(1)], s, now);
    expect(storm).toEqual({ fromKm: s[2].km, toKm: s[3].km, at: now + 3600_000 });
    expect(towardStorm(storm, rows)).toHaveLength(2);
    expect(stormOf([hour(1)], s.slice(0, 1), now)).toBeNull();
  });
  it('the contact card travels only in the link after #', () => {
    const link = cardLink({ name: 'test_data_gtp_ Sam', insta: '@test_data_velo', phone: '', note: 'Gravel · Zürich' }, 'https://example.test/app/');
    expect(link).toMatch(/^https:\/\/example\.test\/app\/#\/karte\/[A-Za-z0-9_-]+$/);
    expect(readCard(link.slice(link.indexOf('#')))).toMatchObject({ name: 'test_data_gtp_ Sam', insta: '@test_data_velo', phone: '', bike: '', note: 'Gravel · Zürich', email: '', addr: '' });
    // Kontakt-QR-Code: the new parts travel too
    const more = cardLink({ name: 'test_data_gtp_ Sam', email: 'sam@example.test', strava: '123', komoot: 'sam-k', web: 'example.test', wa: '+41 79 000 00 00', addr: 'Testweg 1, 0000 Testdorf' }, 'https://example.test/app/');
    expect(readCard(more.slice(more.indexOf('#')))).toMatchObject({ email: 'sam@example.test', strava: '123', komoot: 'sam-k', web: 'example.test', wa: '+41 79 000 00 00', addr: 'Testweg 1, 0000 Testdorf' });
    expect(readCard('#/karte/@@')).toBeNull();
    expect(readCard('#/karte/abcdef')).toBeNull();
  });
});
