import { describe, it, expect } from 'vitest';
import { widthMm, suggestPressure, pressureStart, logPressure, pressures, pressureLoss, chainValues, chainState, GROUNDS, WHEN } from '../src/lib/messen.js';
import DE from '../src/lib/i18n/de/index.js';

// «Werte messen» Teil 2 (Noah 15.10.2026, W4–W6). Fictional bike only (test_data_gtp_).
const bike = (over = {}) => ({
  id: 'test_data_gtp_ms',
  name: 'Demo Gravel',
  km: 4000,
  weightG: 9800,
  fit: { pressureF: 2.4, pressureR: 2.6 },
  parts: [{ key: 'tyres', model: 'Demo Pneu', attrs: { widthF: '40', widthR: '40' }, history: [] }, { key: 'chain', history: [] }],
  ...over,
});

describe('W4: the pressure suggestion', () => {
  it('reads the width in mm or inch', () => {
    expect([widthMm('40'), widthMm('40 mm'), widthMm('700x40c'), widthMm('2.4'), widthMm('2,25"'), widthMm(''), widthMm('Demo')]).toEqual([40, 40, 40, 61, 57, null, null]);
  });
  it('gives more pressure to a heavier rider, a narrower tyre and the rear', () => {
    const base = suggestPressure({ weightKg: 85, widthF: 40 });
    expect(base.r).toBeGreaterThan(base.f);
    expect(suggestPressure({ weightKg: 100, widthF: 40 }).r).toBeGreaterThan(base.r);
    expect(suggestPressure({ weightKg: 85, widthF: 28 }).r).toBeGreaterThan(base.r);
    expect(suggestPressure({ weightKg: 85, widthF: 40, tubeless: true }).r).toBeLessThan(base.r);
    expect(suggestPressure({ weightKg: 85, widthF: 40, ground: 'trail' }).r).toBeLessThan(base.r);
  });
  it('stays in a sensible range: road about 5–6 bar, MTB 2.4" under 2 bar', () => {
    const road = suggestPressure({ weightKg: 85, widthF: 28 });
    expect(road.r).toBeGreaterThan(4.5);
    expect(road.r).toBeLessThan(6.5);
    expect(suggestPressure({ weightKg: 90, widthF: 61, tubeless: true, ground: 'trail' }).r).toBeLessThan(2);
  });
  it('needs a weight and a width', () => {
    expect(suggestPressure({ weightKg: null, widthF: 40 })).toBeNull();
    expect(suggestPressure({ weightKg: 85, widthF: null })).toBeNull();
  });
  it('adds you, the bike and the luggage of the next trip', () => {
    const s = pressureStart(bike(), { riderG: 74000, luggageG: 4200, tyres: { front: 'tubeless', rear: 'tubeless' } });
    expect(s).toMatchObject({ riderKg: 74, bikeKg: 9.8, luggageKg: 4.2, weightKg: 88, widthF: 40, widthR: 40, tubeless: true, ground: 'gravel' });
    expect(pressureStart(bike(), {}).weightKg).toBeNull();
  });
});

describe('W5: the pressure as measured', () => {
  it('is written like Bike care writes it, with when', () => {
    const res = logPressure(bike(), { f: 2.3, r: 2.5, when: 'after', today: '2026-10-15' });
    const h = res.changes.parts.find((p) => p.key === 'tyres').history.at(-1);
    expect(h).toMatchObject({ date: '2026-10-15', km: 4000, action: 'check', pressureF: 2.3, pressureR: 2.5, when: 'after' });
    expect(logPressure(bike(), { f: null, r: 0, today: '2026-10-15' })).toBeNull();
  });
  it('4a: a tyre losing air over two weeks gets a hint; pumping starts anew', () => {
    const hist = (list) => bike({ parts: [{ key: 'tyres', history: list.map(([date, f, r, when]) => ({ date, action: 'check', pressureF: f, pressureR: r, when })) }] });
    const losing = hist([['2026-09-20', 2.4, 2.6, 'pumped'], ['2026-09-27', 2.3, 2.6, 'before'], ['2026-10-04', 2.1, 2.5, 'before']]);
    expect(pressures(losing)).toHaveLength(3);
    expect(pressureLoss(losing)).toEqual({ wheel: 'f', perWeek: 0.2, from: '2026-09-20', to: '2026-10-04' });
    expect(pressureLoss(hist([['2026-09-20', 2.4, 2.6], ['2026-10-01', 2.4, 2.6]]))).toBeNull();
    expect(pressureLoss(hist([['2026-09-01', 2.4, 2.6], ['2026-09-20', 2.0, 2.2], ['2026-09-21', 2.4, 2.6, 'pumped'], ['2026-09-25', 2.3, 2.6]]))).toBeNull();
  });
});

describe('W6: the chain', () => {
  const chain = (list) => bike({ parts: [{ key: 'chain', history: list }] });
  it('counts the values since the last new chain and forecasts the km to the limit', () => {
    const b = chain([
      { date: '2026-01-10', km: 1000, action: 'check', value: 0.6 },
      { date: '2026-02-01', km: 1200, action: 'replace' },
      { date: '2026-05-01', km: 2200, action: 'check', value: 0.1 },
      { date: '2026-08-01', km: 3200, action: 'check', value: 0.25 },
    ]);
    expect(chainValues(b).map((v) => v.value)).toEqual([0.1, 0.25]);
    expect(chainState(b)).toEqual({ value: 0.25, warnAt: 0.4, limit: 0.5, tone: 'ok', left: 1650 });
  });
  it('at the limit it is worn, without a forecast', () => {
    expect(chainState(chain([{ date: '2026-08-01', km: 3200, action: 'check', value: 0.5 }]))).toMatchObject({ tone: 'worn', left: null });
    expect(chainState(chain([]))).toBeNull();
  });
});

it('every name has a German entry', () => {
  for (const x of [...GROUNDS, ...WHEN]) expect(DE[x.name], x.name).toBeTruthy();
});

it('3a: a chain measured at the limit is «Kette ersetzen» on the Workshop order', async () => {
  const { workshopOrder } = await import('../src/lib/workshop.js');
  const b = bike({ parts: [{ key: 'chain', history: [{ date: '2026-10-10', km: 3900, action: 'check', value: 0.5, result: 'needed' }] }] });
  const order = workshopOrder(b, null, [], [], { front: null, rear: null }, '2026-10-15');
  expect(order.rows.find((r) => r.part === 'chain')).toMatchObject({ action: 'replace', de: 'Kette ersetzen (gemessen 0,5 %)' });
});
