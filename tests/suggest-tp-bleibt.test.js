// «Woche vorschlagen › Übernehmen» lässt TrainingPeaks stehen (Noah 23.11.2026 «5a»). Made-up data only. Pure function.
import { describe, it, expect } from 'vitest';
import { planAfterSuggestion } from '../src/lib/training/suggest.js';

const MON = '2026-11-23';
const TODAY = '2026-11-25';
const tp = (id, day) => ({ id, day, kind: 'bike', name: 'Test Endurance', mins: 60, zone: 2, src: 'tp', time: '07:00' });
const own = (id, day) => ({ id, day, kind: 'run', name: 'Eigene Einheit', mins: 30, zone: 2 });
const sug = (id, day) => ({ id, day, kind: 'bike', name: 'Locker', mins: 45, zone: 2, src: 'sug' });

describe('Vorschlag übernehmen: TrainingPeaks bleibt', () => {
  const plan = [tp('tp-1', '2026-11-24'), tp('tp-2', '2026-11-26'), tp('tp-3', '2026-11-28'), own('o-1', '2026-11-26'), sug('s-old', '2026-11-27'), own('o-2', '2026-11-23'), tp('tp-4', '2026-12-01')];
  const list = [sug('s-new-1', '2026-11-25'), sug('s-new-2', '2026-11-29')];
  const out = planAfterSuggestion(plan, list, { monday: MON, today: TODAY });
  const ids = out.map((s) => s.id);

  it('alle TrainingPeaks-Einheiten der Woche bleiben, auch die ab heute', () => {
    expect(ids).toEqual(expect.arrayContaining(['tp-1', 'tp-2', 'tp-3', 'tp-4']));
  });
  it('eigene Einheiten und alte Vorschläge ab heute werden ersetzt', () => {
    expect(ids).not.toContain('o-1');
    expect(ids).not.toContain('s-old');
    expect(ids).toEqual(expect.arrayContaining(['s-new-1', 's-new-2']));
  });
  it('was vor heute liegt, bleibt', () => {
    expect(ids).toContain('o-2');
  });
  it('nichts geht verloren ausser den ersetzten Einheiten (Anzahl)', () => {
    expect(out).toHaveLength(plan.length - 2 + list.length);
  });
  it('ohne TrainingPeaks verhält es sich wie vorher', () => {
    const p = [own('a', '2026-11-26'), sug('b', '2026-11-28'), own('c', '2026-11-23')];
    expect(planAfterSuggestion(p, list, { monday: MON, today: TODAY }).map((s) => s.id).sort()).toEqual(['c', 's-new-1', 's-new-2']);
  });
});
