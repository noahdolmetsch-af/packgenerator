// «Genaue Werte» (Noah 27.10.2026): the labels of a chart axis are round, evenly spaced steps
// (1, 2, 2.5 or 5 times a power of ten, as src/lib/charts/axis.js makes them). texts: the labels as shown.
import { expect } from '@playwright/test';

const toNum = (s) => Number(String(s).replace(/[’'\s]/g, '').replace(/[^\d.,-]/g, '').replace(',', '.'));

export function expectRound(texts, { zero = false } = {}) {
  const v = texts.map(toNum);
  expect(v.length, `labels ${texts.join(' | ')}`).toBeGreaterThanOrEqual(2);
  v.forEach((x) => expect(Number.isFinite(x), `label «${texts.join(' | ')}»`).toBe(true));
  const step = v[1] - v[0];
  expect(step).toBeGreaterThan(0);
  for (let i = 1; i < v.length; i++) expect(Math.abs(v[i] - v[i - 1] - step)).toBeLessThan(1e-6);
  const p = 10 ** Math.floor(Math.log10(step));
  expect([1, 2, 2.5, 5, 10].some((m) => Math.abs(m * p - step) < 1e-6), `step ${step}`).toBe(true);
  expect(Math.abs(v[0] / step - Math.round(v[0] / step))).toBeLessThan(1e-6);
  if (zero) expect(v[0]).toBe(0);
}
