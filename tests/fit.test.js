import { describe, it, expect } from 'vitest';
import { analyseFit, fitMessages, deviceValues, isFit } from '../src/lib/fit.js';
import { parseFit } from '../src/lib/kmbook.js';
import { fitActivity, fitRide } from './fixtures/fit.js';

describe('FIT-Dateien ganz lesen', () => {
  it('reads a recorded ride like a GPX: km, time, climbing, sensors', () => {
    const r = analyseFit(fitActivity(), 'Morgenrunde.fit');
    expect(r.source).toBe('fit');
    expect(r.name).toBe('Morgenrunde');
    expect(r.date).toBe('2026-06-14');
    expect(r.km).toBeGreaterThan(3.5);
    expect(r.km).toBeLessThan(4.5);
    expect(r.gainM).toBeGreaterThan(40);
    expect(r.movingH).toBeGreaterThan(0.15);
    expect(r.sensors.hrAvg).toBeGreaterThan(130);
    expect(r.sensors.hrMax).toBe(149);
    expect(r.sensors.cad).toBe(85);
    expect(r.sensors.wMax).toBe(219);
    expect(r.sensors.tempMin).toBe(14);
    expect(r.sensors.tempMax).toBe(15);
  });

  it('keeps what only the unit knows', () => {
    const d = analyseFit(fitActivity()).device;
    expect(d.np).toBe(205);
    expect(d.ifac).toBe(0.804);
    expect(d.tss).toBe(56.3);
    expect(d.lr).toEqual({ left: 49, right: 51 });
    expect(d.te).toBe(3.1);
    expect(d.teAn).toBe(1.2);
    expect(d.laps).toBe(2);
    expect(d.gears).toBe(3);
    expect(d.battery).toEqual([{ kind: 'unit', status: 'ok' }, { kind: 'power', status: 'low', volt: 2.9 }]);
  });

  it('without a session: the balance from the points, nothing guessed', () => {
    const d = analyseFit(fitActivity({ session: false, laps: 0, gears: 0 })).device;
    expect(d.lr).toEqual({ left: 48, right: 52 });
    expect(d.np).toBeUndefined();
    expect(d.te).toBeUndefined();
    expect(d.laps).toBeUndefined();
    expect(d.gears).toBeUndefined();
  });

  it('says why it cannot read a file', () => {
    expect(() => analyseFit(new TextEncoder().encode('<gpx></gpx>'))).toThrow();
    expect(() => analyseFit(fitActivity({ noPos: true }))).toThrow(/indoor|drinnen/i);
    expect(() => analyseFit(fitRide({ start: '2026-06-14T06:00:00Z', km: 40 }))).toThrow();
  });

  it('the km ledger still reads the same file', () => {
    const r = parseFit(fitActivity());
    expect(r.device).toBe('Edge 850');
    expect(r.date).toBe('2026-06-14');
  });

  it('knows a FIT file by its first bytes and reads compressed timestamps', () => {
    expect(isFit(fitActivity())).toBe(true);
    expect(isFit(new TextEncoder().encode('<gpx version="1.1"></gpx>'))).toBe(false);
    // a record with a compressed timestamp header (local 0, offset 7) after a full timestamp
    const def = [0x40, 0, 0, 20, 0, 1, 3, 1, 0x02];
    const full = [0x41, 0, 0, 20, 0, 2, 253, 4, 0x86, 3, 1, 0x02];
    const body = [...full, 0x01, 0x00, 0x01, 0x00, 0x00, 120, ...def, 0x80 | 7, 125];
    const header = [14, 0x20, 0x08, 0x08, body.length, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54, 0, 0];
    const msgs = fitMessages(new Uint8Array([...header, ...body, 0, 0]));
    expect(msgs.map((m) => m.f[253])).toEqual([256, 263]);
    expect(deviceValues(msgs)).toBeNull();
  });
});
