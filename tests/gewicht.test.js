// TR6b «Gewicht»: the 7-day mean and watts per kg over the weeks. Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { mean7, wkgWeeks } from '../src/lib/weightcharts.js';

describe('weight over time', () => {
  it('each entry with the mean of its 7 days', () => {
    const m = mean7([{ day: '2026-10-01', kg: 72 }, { day: '2026-10-05', kg: 71 }, { day: '2026-10-09', kg: 70 }]);
    expect(m.map((e) => e.mean)).toEqual([72, 71.5, 70.5]);
  });
  it('watts per kg per week from the estimated FTP and the weight of that day', () => {
    const acts = [{ day: '2026-09-02', w20: 240 }, { day: '2026-09-23', w20: 260 }];
    const entries = [{ day: '2026-08-31', kg: 72 }, { day: '2026-09-21', kg: 71 }];
    const w = wkgWeeks(acts, entries, '2026-10-01');
    expect(w.map((x) => x.monday)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
    expect(w[0]).toMatchObject({ kw: 36, ftp: 228, kg: 72, wkg: 3.17 });
    expect(w.at(-1)).toMatchObject({ ftp: 247, kg: 71, wkg: 3.48 });
    expect(wkgWeeks(acts, [], '2026-10-01')).toEqual([]);
  });
});
