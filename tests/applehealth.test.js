import { describe, it, expect } from 'vitest';
import { appleCollector, appleTime, summaryOf, feedStream, isExportXml } from '../src/lib/applehealth.js';
import { cleanDay } from '../src/lib/health.js';
import { appleXml } from './fixtures/applehealth.js';

const read = async (text, chunk = 37) => {
  const c = appleCollector();
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream({
    start(ctl) {
      for (let i = 0; i < bytes.length; i += chunk) ctl.enqueue(bytes.slice(i, i + chunk));
      ctl.close();
    },
  });
  await feedStream(stream, c);
  return c;
};

describe('Apple-Health-Export einlesen', () => {
  it('reads the local day and time', () => {
    expect(appleTime('2026-06-14 07:05:00 +0200')).toMatchObject({ day: '2026-06-14', hm: '07:05', h: 7, ms: Date.parse('2026-06-14T05:05:00Z') });
    expect(appleTime('bad')).toBeNull();
  });

  it('turns the export into days, in small chunks too', async () => {
    const c = await read(appleXml());
    const [d14, d15] = c.days();
    expect(d14).toEqual({ date: '2026-06-14', restingHr: 53, hrvMs: 49, steps: 7200, kcalActive: 250, vo2max: 47.3 });
    expect(d15.weightKg).toBe(72.4);
    expect(d15.sleep).toEqual({ asleepMin: 420, awakeMin: 15, start: '23:10', end: '06:25', deepMin: 90, remMin: 150, lightMin: 180, efficiency: 97 });
    expect(c.counts.workouts).toBe(1);
    expect(c.range()).toEqual({ from: '2026-06-14', to: '2026-06-15' });
  });

  it('steps: the source with most, not iPhone plus Watch', async () => {
    const c = await read(appleXml());
    expect(c.days()[0].steps).toBe(7200);
  });

  it('the rows pass the table check and the preview counts them', async () => {
    const rows = (await read(appleXml())).days();
    for (const r of rows) expect(cleanDay(r)).toEqual(r);
    expect(summaryOf(rows)).toMatchObject({ days: 2, restingHr: 1, sleep: 1, steps: 1, vo2max: 1, weightKg: 1 });
  });

  it('finds export.xml in the zip, not the other files', () => {
    expect(isExportXml('apple_health_export/export.xml')).toBe(true);
    expect(isExportXml('apple_health_export/export_cda.xml')).toBe(false);
    expect(isExportXml('apple_health_export/workout-routes/route_1.gpx')).toBe(false);
  });
});
