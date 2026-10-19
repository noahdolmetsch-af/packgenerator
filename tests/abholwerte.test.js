import { describe, it, expect, afterEach } from 'vitest';
import { pickupChecked, againValues, replacements, lastReplacement, changeLines, newChain } from '../src/lib/abholwerte.js';
import { orderSheetText } from '../src/lib/sheets.js';
import { warranty, theftSheet, repairKit } from '../src/lib/sheets2.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

// «Werte messen» Teil 1 (Noah 15.10.2026, W1–W3). Fictional bike only (test_data_gtp_).
afterEach(() => (lang.v = 'en'));
const bike = (over = {}) => ({
  id: 'test_data_gtp_wm',
  name: 'Demo Gravel',
  type: 'rigid',
  km: 5200,
  bought: '2025-04-01',
  fit: { seatHeight: 742, pressureF: 3.1, pressureR: 3.3 },
  parts: [
    {
      key: 'chain',
      model: 'Demo Kette',
      history: [
        { date: '2025-09-01', km: 2100, action: 'replace' },
        { date: '2026-10-14', km: 5120, action: 'replace', by: 'shop' },
      ],
    },
    { key: 'tyres', model: 'Demo Pneu', history: [{ date: '2026-03-02', km: 3000, action: 'check' }] },
  ],
  ...over,
});
const picked = (ticks, extra = {}) => bike({ sheets: { pickup: { date: '2026-10-14', jobs: [], ticks, applied: '2026-10-14', ...extra } } });

describe('W1 / W2: the values of the last Pick-up check', () => {
  it('knows the saved values and the day', () => {
    const b = picked({ 'val:seatHeight': true, 'val:pressureF': true, 'safe:brakes': true, 'val:nope': true }, { checked: '2026-10-15' });
    expect(pickupChecked(b)).toEqual({ date: '2026-10-15', keys: ['seatHeight', 'pressureF'] });
  });
  it('falls back to the day it was taken into care, and is empty without a check', () => {
    expect(pickupChecked(picked({ 'val:seatHeight': true })).date).toBe('2026-10-14');
    expect(pickupChecked(bike())).toEqual({ date: null, keys: [] });
    expect(pickupChecked(picked({ 'safe:brakes': true }))).toEqual({ date: null, keys: [] });
  });
  it('lists the values as they are now, with the German name, and drops a cleared one', () => {
    const b = picked({ 'val:seatHeight': true, 'val:forkPressure': true });
    const rows = againValues(b);
    expect(rows.map((r) => r.key)).toEqual(['seatHeight']);
    expect(rows[0].de).toBe('Sattelhöhe');
    expect(rows[0].value).toMatch(/742/);
  });
  it('the text to the bike shop says «So soll es wieder sein» instead of «Bitte so lassen»', () => {
    const b = picked({ 'val:seatHeight': true });
    const again = againValues(b);
    const txt = orderSheetText([], { bike: b, again, againDate: '2026-10-14', keep: [{ label: 'x', de: 'Gabeldruck', value: '80 psi' }] });
    expect(txt).toContain('So soll es wieder sein (Abholen 14.10.2026): Sattelhöhe');
    expect(txt).not.toContain('Bitte so lassen');
    expect(orderSheetText([], { bike: b, keep: [{ de: 'Gabeldruck', value: '80 psi' }] })).toContain('Bitte so lassen: Gabeldruck 80 psi');
  });
});

describe('W3: the replaced parts', () => {
  it('lists every replacement since the purchase, newest first, with the km of the one before', () => {
    const r = replacements(bike());
    expect(r.map((x) => [x.key, x.date, x.before])).toEqual([
      ['chain', '2026-10-14', 3020],
      ['chain', '2025-09-01', 2100],
    ]);
    expect(lastReplacement(bike(), 'chain').by).toBe('shop');
    expect(lastReplacement(bike(), 'tyres')).toBeNull();
  });
  it('without a purchase day the first one has no km before', () => {
    expect(replacements(bike({ bought: null })).at(-1).before).toBeNull();
  });
  it('the Theft sheet adds one line per replaced part under «Different from the factory»', () => {
    expect(changeLines(bike())).toEqual(['Chain replaced, 2026-10-14']);
    const ch = theftSheet(bike({ sheets: { theft: { changes: 'Demo Lenker' } } })).marks.find((r) => r.id === 'changes');
    expect(ch.value.split('\n')[0]).toBe('Demo Lenker');
    expect(ch.auto).toBe(1);
  });
  it('the new chain has warranty for 2 years from its day', () => {
    const w = warranty(bike(), { visits: [], today: '2026-10-15' });
    expect(w.replaced.map((r) => r.label)).toEqual(['Chain (replaced)']);
    expect([w.replaced[0].from, w.replaced[0].end]).toEqual(['2026-10-14', '2028-10-14']);
  });
  it('the Repair kit asks about the quick link for 60 days after a new chain', () => {
    expect(newChain(bike(), '2026-10-20')).toBe('2026-10-14');
    expect(newChain(bike(), '2026-12-20')).toBeNull();
    const link = (today) => repairKit(bike(), { today }).sections.flatMap((x) => x.rows).find((r) => r.key === 'link');
    expect(link('2026-10-20').hint).toMatch(/quick link still fit/);
    expect(link('2026-12-20').hint).not.toMatch(/quick link/);
  });
  it('every new text has a German entry', () => {
    for (const k of ['checked at the pick-up {date}', 'new since {date}', 'new since {date} · the one before rode {km} km', 'As it should be again', 'The values of the last pick-up on {date} · please set them like this again after the work', '{part} replaced, {date}', 'New chain since {date}: does the quick link still fit?'])
      expect(DE[k], k).toBeTruthy();
  });
});
