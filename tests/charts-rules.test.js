// «Genaue Werte» + «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the guard of the chart rules
// (src/lib/charts/rules.js). Every chart marked done uses the shared pieces: the axis, the exact numbers,
// the window behind a tap and «Als Tabelle». The list of open charts only shrinks.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { DONE, OPEN } from '../src/lib/charts/rules.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('chart rules', () => {
  it('lists every chart once, and every file exists', () => {
    const all = [...DONE, ...OPEN];
    expect(new Set(all).size).toBe(all.length);
    for (const p of all) expect(existsSync(new URL(`../${p}`, import.meta.url)), p).toBe(true);
  });

  it('the bar chart brings the axis, the exact numbers, the keyboard and the table', () => {
    const s = src('src/lib/charts/BarChart.svelte');
    for (const part of ['YTicks', 'GridLines', 'niceScale', 'Readout', 'DataTable', 'indexAt', 'stepKey', 'onopen']) expect(s, part).toContain(part);
  });

  it('every chart marked done uses the shared pieces', () => {
    for (const p of DONE) {
      const s = src(p);
      const bars = s.includes('charts/BarChart.svelte');
      const own = ['YTicks', 'Readout', 'DataTable'].every((x) => s.includes(x));
      expect(bars || own, `${p}: BarChart or YTicks + Readout + DataTable`).toBe(true);
      expect(s.includes('ChartSheet') || s.includes('Href('), `${p}: a tap opens something`).toBe(true);
      expect(s.includes('table'), `${p}: «Als Tabelle»`).toBe(true);
    }
  });

  it('only shrinks: at most the open charts of 27.10.2026', () => {
    expect(OPEN.length).toBeLessThanOrEqual(39);
  });
});
