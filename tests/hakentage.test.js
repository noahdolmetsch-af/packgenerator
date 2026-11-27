// «Nach harten Tagen» (Noah 27.11.2026, Fragen 13, 14 und 17): src/lib/flow/hakentage.js
import { describe, it, expect } from 'vitest';
import { afterHard, hardGap, hardDays } from '../src/lib/flow/hakentage.js';

const add = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TODAY = '2026-11-19';

/** Every third day hard (load 150), others easy (70) on even days, rest on the others; after a hard day the pulse is 58, sleep 380, else 54 and 430. */
function sample() {
  const loads = new Map();
  const table = new Map();
  for (let i = 1; i <= 120; i++) {
    const day = add(TODAY, -i);
    const k = i % 3;
    if (k === 0) loads.set(day, 150);
    else if (k === 1) loads.set(day, 70);
  }
  for (let i = 0; i <= 120; i++) {
    const day = add(TODAY, -i);
    const before = loads.get(add(day, -1)) ?? 0;
    table.set(day, { rhr: before >= 150 ? 58 : 54, sleep: before >= 150 ? 380 : 430 });
  }
  return { loads, table };
}

describe('Nach harten Tagen', () => {
  it('compares the next morning after hard days with the days after rest', () => {
    const { loads, table } = sample();
    const r = afterHard({ table, loads, today: TODAY });
    expect(r.hard.rhr).toBe(58);
    expect(r.rest.rhr).toBe(54);
    expect(r.verdict).toEqual({ rhr: 'higher', sleep: 'lower' });
  });
  it('says nothing without enough days', () => {
    expect(afterHard({ table: new Map(), loads: new Map(), today: TODAY })).toBe(null);
  });
  it('says none when the difference is tiny', () => {
    const { loads } = sample();
    const table = new Map([...Array(120).keys()].map((i) => [add(TODAY, -i), { rhr: 54, sleep: 430 }]));
    expect(afterHard({ table, loads, today: TODAY }).verdict).toEqual({ rhr: 'none', sleep: 'none' });
  });
  it('finds the usual distance between two hard days and the days since the last one', () => {
    const { loads } = sample();
    const g = hardGap(loads, TODAY);
    expect(g.usual).toBe(3);
    expect(g.since).toBeGreaterThanOrEqual(1);
    expect(hardDays(loads, TODAY, 10).length).toBeGreaterThan(0);
    expect(hardGap(new Map(), TODAY)).toBe(null);
  });
});

import { afterFeel } from '../src/lib/flow/hakentage.js';
describe('Gefuehl gegen Folgetag', () => {
  it('compares hard and easy feeling days by the next day, and says how many days are missing', () => {
    const log = [];
    const table = new Map();
    for (let i = 2; i < 30; i++) {
      const day = add(TODAY, -i);
      const hard = i % 2 === 0;
      log.push({ id: `f${i}`, day, feel: hard ? 'hard' : 'good' });
      table.set(add(day, 1), { rhr: hard ? 57 : 53, hrv: hard ? 40 : 55, sleep: 400 });
    }
    const r = afterFeel({ log, table, today: TODAY });
    expect(r.enough).toBe(true);
    expect(r.hard.rhr).toBe(57);
    expect(r.easy.hrv).toBe(55);
    const few = afterFeel({ log: log.slice(0, 3), table, today: TODAY });
    expect(few.enough).toBe(false);
    expect(few.missing.hard + few.missing.easy).toBeGreaterThan(0);
    expect(afterFeel({ log: [{ day: add(TODAY, -3) }], table, today: TODAY })).toBe(null);
  });
});
