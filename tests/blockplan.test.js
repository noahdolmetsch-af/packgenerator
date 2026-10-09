import { describe, it, expect } from 'vitest';
import { sunTimes, darkTimes, blockPlan } from '../src/lib/blockplan.js';
import { blocks } from '../src/lib/ride.js';

const LUCERNE = { lat: 47.05, lon: 8.31 };
const hhmm = (t) => new Date(t + 120 * 6e4).toISOString().slice(11, 16); // CEST

describe('sun', () => {
  it('rises and sets in Lucerne in mid October about when the almanac says', () => {
    const s = sunTimes('2026-10-15', LUCERNE.lat, LUCERNE.lon);
    // Almanac: about 07:43 and 18:39.
    expect(hhmm(s.rise)).toMatch(/^07:4[2-6]$/);
    expect(hhmm(s.set)).toMatch(/^18:(3[7-9]|4[0-2])$/);
  });

  it('gives the nights between the start and the end', () => {
    const n = darkTimes('2026-10-15T07:00', '2026-10-16T09:00', LUCERNE, () => 120);
    expect(n.map((x) => x.from.slice(0, 10))).toEqual(['2026-10-14', '2026-10-15', '2026-10-16']);
  });
});

describe('ride day per block', () => {
  const item = (id, fields) => ({ item: { id, name: id, category: 'onbike', ...fields }, qty: fields.qty ?? 1, place: fields.place ?? 'Seat pack' });
  const items = [
    item('gilet', { coldBelow: 15, place: 'Top tube bag' }),
    item('gloves', { coldBelow: 8 }),
    item('rainjacket', { rain: 'yes' }),
    item('gel', { category: 'food', perHours: 2, qty: 3 }),
    item('bottle', { category: 'food', waterL: 0.75, qty: 2, perHours: 3, place: 'On the bike' }),
    item('front', { category: 'light', place: 'On the bike' }),
  ];
  // 06:00 to 24:00 at 20 km/h: six blocks of 3 hours.
  const st = { startAt: '2026-10-15T06:00', km: 360, hours: 18 };
  const rows = blocks({}, st);
  const temps = { 0: 6, 1: 12, 2: 17, 3: 17, 4: 11, 5: 7 };
  const wxOf = (b) => {
    const n = rows.indexOf(rows.find((r) => r.startAt === b.startAt));
    return [{ t: b.startAt, temp: temps[n], rainMm: n === 3 ? 2 : 0 }];
  };
  const plan = blockPlan(rows, items, { wxOf, place: LUCERNE, offsetOf: () => 120 });

  it('puts layers on and takes them off as the weather changes', () => {
    const p = plan.rows;
    expect(p[0].on.map((w) => w.id)).toEqual(['gilet', 'gloves']);
    expect(p[1].off.map((w) => w.id)).toEqual(['gloves']);
    expect(p[2].off.map((w) => w.id)).toEqual(['gilet']);
    expect(p[3].on.map((w) => w.id)).toEqual(['rainjacket']);
    expect(p[4].on.map((w) => w.id)).toEqual(['gilet']);
    expect(p[4].off.map((w) => w.id)).toEqual(['rainjacket']);
    expect(p[0].on[0].place).toBe('Top tube bag');
  });

  it('shares the food out over the riding hours and says when it runs out', () => {
    expect(plan.rows.map((r) => r.food.find((f) => f.id === 'gel')?.n ?? 0)).toEqual([1, 2, 1, 2, 1, 2]);
    // 3 gels for 9 pieces: said once, where they run out, for the whole ride.
    expect(plan.rows.map((r) => r.food[0].short)).toEqual([0, 0, 6, 0, 0, 0]);
  });

  it('counts the water against the bottles and says where to refill', () => {
    expect(plan.capL).toBe(1.5);
    expect(plan.rows[0].drinkL).toBe(1.5);
    // The bottles last exactly one block: refill where the next one starts.
    expect(plan.rows.map((r) => r.refillKm)).toEqual([[], [60], [120], [180], [240], [300]]);
  });

  it('says from where the light goes on', () => {
    expect(plan.rows[0].light).toEqual({ kind: 'off', at: '07:44', km: 35 });
    expect(plan.rows[1].light).toBeNull();
    expect(plan.rows[4].light).toMatchObject({ kind: 'on', at: '18:40' });
    expect(plan.rows[5].light).toEqual({ kind: 'dark', at: null, km: null });
    expect(plan.lights).toEqual([{ name: 'front', place: 'On the bike' }]);
  });

  it('uses the trip weather when there are no hours', () => {
    const p = blockPlan(rows.slice(0, 1), items, { tripWx: { min: 5, max: 12, rain: 'none' } });
    expect(p.rows[0].wxFrom).toBe('trip');
    expect(p.rows[0].wear.map((w) => w.id)).toEqual(['gilet', 'gloves']);
    expect(p.rows[0].light).toBeNull();
  });
});

// v0.46.1 (Noah): a cold, dry day ride in daylight: no rain gear, no night glasses; the dark brings the glasses.
describe('rain gear and night glasses on the ride page (v0.46.1)', () => {
  const item = (id, fields) => ({ item: { id, name: id, category: 'onbike', ...fields }, qty: 1, place: 'Seat pack' });
  const items = [
    item('socks', { name: 'Regensocken wasserdicht', rain: 'yes', coldBelow: 5 }),
    item('latex', { name: 'Latex-Handschuhe', rain: 'yes', coldBelow: 5 }),
    item('night', { name: 'Nachtbrille gelb', coldBelow: 5 }),
    item('tights', { name: 'Tights', coldBelow: 5 }),
  ];
  const wear = (startAt, hours, rainMm = 0) => {
    const rows = blocks({}, { startAt, km: hours * 20, hours });
    const plan = blockPlan(rows, items, { wxOf: (b) => [{ t: b.startAt, temp: 2, rainMm }], place: LUCERNE, offsetOf: () => 120 });
    return [...new Set(plan.rows.flatMap((b) => b.wear.map((w) => w.id)))].sort();
  };
  it('dry, cold, in daylight: only the tights', () => expect(wear('2026-10-15T10:00', 3)).toEqual(['tights']));
  it('wet: the rain gear too', () => expect(wear('2026-10-15T10:00', 3, 2)).toEqual(['latex', 'socks', 'tights']));
  it('into the dark: the night glasses', () => expect(wear('2026-10-15T16:00', 5)).toEqual(['night', 'tights']));
});
