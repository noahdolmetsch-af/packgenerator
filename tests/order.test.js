import { describe, it, expect } from 'vitest';
import { withVisits, priceFor, workshopOrder, orderText, orderSum, bikeProfile } from '../src/lib/workshop.js';
import { ensureParts, logPart } from '../src/lib/care.js';
import { bikeChoice, gearLitres } from '../src/lib/choice.js';
import { switchBike } from '../src/lib/trips.js';

const visits = [
  {
    id: 'a', bikeId: 'fully', date: '2025-06-26', shop: 'Bike shop', totalChf: 400, km: 1000,
    parts: [
      { part: 'fork', action: 'service', chf: 217 },
      { part: 'bolts', action: 'check', what: 'Function and safety check', chf: 138 },
      { part: 'tyres', action: 'service', what: 'Converted to tubeless, sealant filled', chf: 95.8, setup: { front: 'tubeless', rear: 'tubeless' } },
    ],
  },
  {
    id: 'b', bikeId: 'scott-hardtail', date: '2026-08-28', shop: 'Bike shop', totalChf: 300, km: 2000,
    parts: [
      { part: 'tyres', action: 'service', what: 'Rear 60 ml sealant refilled', chf: 16 },
      { part: 'chain', action: 'replace', chf: 47.9 },
    ],
  },
];
const spark = (over = {}) => ({ id: 'fully', name: 'Spark', type: 'Full suspension', km: 2500, parts: [], ...over });
const trip = { id: 't1', title: 'Hope 1000', startDate: '2026-10-20', days: 4, bikeId: 'fully', entries: [] };
const TODAY = '2026-10-10';

describe('workshop order', () => {
  it('takes the price from the same bike first, else from another bike', () => {
    expect(priceFor(visits, 'fully', 'fork').chf).toBe(217);
    expect(priceFor(visits, 'fully', 'check', 'check').chf).toBe(138);
    // Sealant: only lines that talk about sealant, so a tubeless conversion is no estimate.
    expect(priceFor(visits, 'fully', 'tyres')).toMatchObject({ chf: 16, bikeId: 'scott-hardtail' });
    expect(priceFor(visits, 'fully', 'shock')).toBeNull();
  });

  it('lists what is due before the trip with prices, and open repairs without', () => {
    const v = withVisits(spark(), visits);
    const tasks = [{ id: 7, area: 'Bike', bikeId: 'fully', task: 'Creak in the bottom bracket', status: 'open' }];
    const o = workshopOrder(v, trip, tasks, visits, { front: 'tubeless', rear: 'tubeless' }, TODAY);
    const names = o.rows.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(['Fork service', 'Top up sealant', '1,000 km check', 'Creak in the bottom bracket']));
    const fork = o.rows.find((r) => r.name === 'Fork service');
    expect(fork.chf).toBe(217);
    expect(o.rows.at(-1)).toMatchObject({ name: 'Creak in the bottom bracket', chf: null });
    expect(o.unknown).toBeGreaterThan(0);
    expect(o.shop).toBe('Bike shop');
  });

  it('without a trip lists only what is due today', () => {
    const v = withVisits(spark(), visits);
    const o = workshopOrder(v, null, [], visits, { front: 'tubeless', rear: 'tubeless' }, TODAY);
    expect(o.rows.every((r) => r.when === 'now')).toBe(true);
    expect(o.rows.length).toBeGreaterThan(0);
  });

  it('writes the message in German with the estimate of the ticked jobs', () => {
    const rows = [
      { de: 'Gabel-Service', chf: 217 },
      { de: 'Dichtmilch nachfüllen', chf: 16 },
      { de: 'Knacken im Tretlager', chf: null },
    ];
    expect(orderSum(rows)).toEqual({ total: 233, unknown: 1 });
    const text = orderText(rows, { bike: { name: 'Spark' }, trip });
    expect(text).toContain('vor dem 20.10.2026 (Hope 1000)');
    expect(text).toContain('- Gabel-Service');
    expect(text).toContain('etwa CHF 233 plus Material');
  });
});

describe('bike profile', () => {
  it('shows km, cost this year, last visit and what is due', () => {
    const parts = logPart(ensureParts(spark()), 'chain', { date: '2026-09-01', km: 2400, action: 'service', result: 'done', by: 'self' });
    const v = withVisits(spark({ parts, kmDate: '2026-10-01' }), visits);
    const p = bikeProfile(v, visits, { front: 'tubeless', rear: 'tubeless' }, TODAY);
    expect(p.km).toBe(2500);
    expect(p.year).toBeNull(); // the Spark's visit was in 2025
    expect(p.last).toMatchObject({ date: '2025-06-26', shop: 'Bike shop', chf: 400 });
    expect(p.per.chf).toBe(267); // CHF 400 over 1500 km
    expect(p.next[0].late).toBe(true); // fork service overdue (more than a year)
  });
});

describe('bike choice', () => {
  const containers = [
    { id: 'seat', itemId: 'seatbag', slot: 'seat', name: 'Seat pack', volumeL: 10 },
    { id: 'frame', itemId: 'framebag', slot: 'frame', name: 'Frame bag', volumeL: 4 },
  ];
  const items = [
    { id: 'jacket', name: 'Jacket', volumeL: 3, weightG: 200 },
    { id: 'seatbag', name: 'Seat pack', weightG: 400 },
    { id: 'framebag', name: 'Frame bag', weightG: 200 },
  ];
  const bikes = [
    { id: 'fully', name: 'Spark', type: 'Full suspension', weightG: 11000, slots: ['seat'], setup: { seat: 'seat' }, parts: [] },
    { id: 'factor-ls', name: 'Factor', type: 'Gravel', weightG: 9500, slots: ['seat', 'frame'], setup: { seat: 'seat', frame: 'frame' }, parts: [] },
  ];

  it('marks the lightest and the roomiest bike and counts the trips before', () => {
    const t = { ...trip, entries: [{ itemId: 'jacket', slot: 'frame', qty: 3 }] };
    const old = [{ id: 'x', bikeId: 'factor-ls', startDate: '2025-09-06' }];
    const rows = bikeChoice(t, bikes, { containers, items, visits: [], trips: old, today: TODAY });
    expect(gearLitres(t, items)).toBe(9);
    const [sparkRow, factorRow] = rows;
    expect(sparkRow).toMatchObject({ current: true, totalG: 11400, volumeL: 10, full: true, trips: 0 });
    expect(factorRow).toMatchObject({ lightest: true, roomiest: true, volumeL: 14, full: false, trips: 1 });
  });

  it('moves the trip to another bike with its bags', () => {
    const t = { ...trip, setup: { seat: 'seat', frame: 'frame' }, entries: [{ itemId: 'jacket', slot: 'frame' }, { itemId: 'cap', slot: 'body' }] };
    const c = switchBike(t, bikes[0]);
    expect(c).toMatchObject({ bikeId: 'fully', bike: 'Spark', setup: { seat: 'seat' } });
    expect(c.entries.map((e) => e.slot)).toEqual(['seat', 'body']);
  });
});
