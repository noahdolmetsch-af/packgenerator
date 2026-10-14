// TR5/TR5b «Leistung» on one activity: the pure maths of src/lib/training/act/power.js. Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { POWER_ZONE_NAMES, CURVE_SPANS, hasMeter, powerRange, intensity, variability, pzShares, bestCurve, cadenceShares, cadenceMean, cadenceMain, ifBand, viBand, IF_WORDS, VI_WORDS } from '../src/lib/training/act/power.js';
import { powerBounds, wkg, ftpEstimate, powerZoneSecs } from '../src/lib/training.js';
import DE from '../src/lib/i18n/de/leistung-aktivitaet.js';

describe('power on one activity', () => {
  it('knows a power meter only with watts', () => {
    expect(hasMeter({ wDevice: true, wAvg: 188 })).toBe(true);
    expect(hasMeter({ wDevice: false, wAvg: 150 })).toBe(false);
    expect(hasMeter({ wDevice: true })).toBe(false);
    expect(hasMeter(null)).toBe(false);
  });

  it('gives the watt range of the 7 zones from the FTP (236 W as in the mockup)', () => {
    const b = powerBounds(236);
    expect(powerRange(0, 236)).toEqual({ from: null, to: 130 });
    expect(powerRange(1, 236)).toEqual({ from: 131, to: 177 });
    expect(powerRange(6, 236)).toEqual({ from: b[5] + 1, to: null });
    expect(powerRange(6, 236).from - 1).toBe(354);
    expect(powerRange(3, null)).toBe(null);
    expect(POWER_ZONE_NAMES).toHaveLength(7);
  });

  it('rounds W/kg, IF and VI', () => {
    expect(wkg(188, 72)).toBe(2.6);
    expect(wkg(211, 72)).toBe(2.9);
    expect(wkg(248, 72)).toBe(3.4);
    expect(wkg(188, null)).toBe(null);
    expect(intensity(211, 236)).toBe(0.89);
    expect(variability(211, 188)).toBe(1.12);
    expect(intensity(null, 236)).toBe(null);
    expect(variability(211, 0)).toBe(null);
  });

  it('shares base (Z1–Z2) and over threshold (Z5–Z7)', () => {
    expect(pzShares([14, 31, 24, 19, 8, 3, 1])).toEqual({ base: 45, over: 12 });
    expect(pzShares([0, 0, 0, 0, 0, 0, 0])).toBe(null);
    expect(pzShares(null)).toBe(null);
    const secs = powerZoneSecs({ 100: 600, 200: 600 }, ftpEstimate([{ day: '2026-10-01', w20: 248 }], '2026-10-10'));
    expect(pzShares(secs)).toEqual({ base: 50, over: 0 });
  });

  it('takes the best curve of the 90 days up to the ride (the ride too, nothing later)', () => {
    const acts = [
      { day: '2026-10-10', pCurve: [[5, 584], [60, 402], [300, 296], [1200, 248], [3600, 214]] },
      { day: '2026-09-01', pCurve: [[5, 610], [60, 390], [300, 300], [1200, 0], [3600, null]] },
      { day: '2026-06-01', pCurve: [[5, 900], [60, 900], [300, 900], [1200, 900], [3600, 900]] }, // older than 90 days
      { day: '2026-10-12', pCurve: [[5, 999], [60, 999], [300, 999], [1200, 999], [3600, 999]] }, // after the ride
      { day: '2026-10-05', pCurve: null },
    ];
    expect(bestCurve(acts, '2026-10-10')).toEqual([[5, 610], [60, 402], [300, 300], [1200, 248], [3600, 214]]);
    expect(bestCurve([], '2026-10-10').map((x) => x[1])).toEqual([null, null, null, null, null]);
    expect(CURVE_SPANS.map((s) => s[0])).toEqual([5, 60, 300, 1200, 3600]);
  });

  it('spreads the cadence in % per 10 rpm, with Ø and the main range', () => {
    const c = { 50: 115, 60: 230, 70: 520, 80: 1270, 90: 1730, 100: 1040, 110: 520, 120: 230, 130: 115 };
    const rows = cadenceShares(c);
    expect(rows.map((r) => r.bin)).toEqual([50, 60, 70, 80, 90, 100, 110, 120, 130]);
    expect(rows.map((r) => r.pct)).toEqual([2, 4, 9, 22, 30, 18, 9, 4, 2]);
    expect(cadenceMean(c)).toBe(95);
    expect(cadenceMain(c)).toEqual({ from: 80, to: 90 });
    expect(cadenceMain({ 90: 100 })).toEqual({ from: 90, to: 90 });
    expect(cadenceMain({ 60: 100, 90: 300 })).toEqual({ from: 90, to: 90 });
    expect(cadenceShares({})).toBe(null);
    expect(cadenceShares(null)).toBe(null);
  });

  it('picks a calm sentence by ranges', () => {
    expect([0.6, 0.8, 0.89, 1, 1.1].map(ifBand)).toEqual([0, 1, 2, 3, 4]);
    expect(IF_WORDS[ifBand(0.89)]).toBe('just under your threshold');
    expect([1.0, 1.05, 1.12, 1.3].map(viBand)).toEqual([0, 0, 1, 2]);
    expect(VI_WORDS[viBand(1.12)]).toBe('a changing pace');
    expect(ifBand(null)).toBe(null);
    expect(viBand(0)).toBe(null);
    // every word has its German, and no word rates
    for (const w of [...IF_WORDS, ...VI_WORDS, ...POWER_ZONE_NAMES]) expect(DE[w]).toBeTruthy();
    for (const w of Object.values(DE)) expect(w).not.toMatch(/\b(gut|schlecht|zu viel|zu wenig)\b/i);
  });
});
