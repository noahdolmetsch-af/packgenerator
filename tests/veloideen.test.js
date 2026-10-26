// Velo-Ideen 71–76 (996 Ideen, Noah 25.10.2026), the small ones: 72 fehlende km nachtragen,
// 73 Setup zurückbauen, 74 Sturz oder Geräusch → Teil «prüfen». Fictional data only.
import { describe, it, expect } from 'vitest';
import { kmGap, GAP_KM } from '../src/lib/kmgap.js';
import { makeEntry } from '../src/lib/kmbook.js';
import { fitSnapshot, makeSaved, savedCount, savedDiff, restoreChanges, MAX_PHOTOS } from '../src/lib/bikes/rueckbau.js';
import { newLogEntry } from '../src/lib/rig.js';
import { wearRows, flagChange, flagOf, FLAG_KINDS } from '../src/lib/wear.js';
import de from '../src/lib/i18n/de/veloideen.js';
import DE from '../src/lib/i18n/de/index.js';

const ride = (km, date) => makeEntry({ bikeId: 'b1', date, km, kind: 'ride', source: 'hand', by: 'user', sure: 'user' });

describe('72 Fehlende Kilometer nachtragen', () => {
  const entries = [makeEntry({ bikeId: 'b1', date: '2026-01-10', km: 1000, kind: 'start', source: 'hand' }), ride(42, '2026-03-01')];

  it('a small step asks nothing', () => {
    expect(kmGap(entries, 'b1', 1042)).toBeNull();
    expect(kmGap(entries, 'b1', 1042 + GAP_KM - 1)).toBeNull();
  });
  it('many km more: asks where they come from, with the day of the last entry', () => {
    expect(kmGap(entries, 'b1', 1242)).toEqual({ kind: 'more', diff: 200, exact: 1042, since: '2026-03-01' });
  });
  it('fewer km: most often a typo', () => {
    expect(kmGap(entries, 'b1', 942)).toMatchObject({ kind: 'less', diff: -100 });
  });
  it('a bike without ledger and a bad number ask nothing', () => {
    expect(kmGap(entries, 'b2', 5000)).toBeNull();
    expect(kmGap(entries, 'b1', Number.NaN)).toBeNull();
  });
});

describe('73 Setup zurückbauen', () => {
  const bike = { id: 'b1', fit: { seatHeight: 742, pressureF: 2.4 }, parts: [{ key: 'crank', attrs: { length: 172.5 } }] };

  it('keeps every measure, also the empty ones', () => {
    const snap = fitSnapshot(bike);
    expect(snap.seatHeight).toBe(742);
    expect(snap.crankLength).toBe(172.5);
    expect(snap.barWidth).toBeNull();
    expect(savedCount(snap)).toBe(3);
  });
  it('keeps at most three photos, nothing when there is nothing', () => {
    const s = makeSaved(bike, ['a', 'b', 'c', 'd'], '2026-04-02');
    expect(s.photos).toHaveLength(MAX_PHOTOS);
    expect(s.at).toBe('2026-04-02');
    expect(makeSaved({ id: 'x' }, [])).toBeNull();
  });
  it('the log entry carries it', () => {
    const saved = makeSaved(bike, []);
    expect(newLogEntry({ date: '2026-04-02', title: 'Saddle up', saved }, { id: 'l1' }).saved).toBe(saved);
    expect('saved' in newLogEntry({ date: '2026-04-02', title: 'x' }, { id: 'l2' })).toBe(false);
  });
  it('shows what differs and brings it back, also on a part and a value set later', () => {
    const snap = fitSnapshot(bike);
    const later = { ...bike, fit: { seatHeight: 750, pressureF: 2.4, barWidth: 440 }, parts: [{ key: 'crank', attrs: { length: 170 } }] };
    expect(savedDiff(later, snap).map((r) => r.key).sort()).toEqual(['barWidth', 'crankLength', 'seatHeight']);
    const patch = restoreChanges(later, snap);
    const back = { ...later, ...patch };
    expect(back.fit).toEqual({ seatHeight: 742, pressureF: 2.4 });
    expect(back.parts.find((p) => p.key === 'crank').attrs.length).toBe(172.5);
    expect(savedDiff(back, snap)).toEqual([]);
  });
});

describe('74 Sturz oder Geräusch', () => {
  const chain = { key: 'chain', model: 'Fictional 11', history: [{ date: '2026-01-01', action: 'replace', km: 0, start: true }] };
  const bike = { id: 'b1', km: 300, parts: [chain] };

  it('a flag makes a fine part «soon» with why «flag», and goes again', () => {
    const before = wearRows(bike, { today: '2026-03-01' }).find((r) => r.key === 'chain');
    const { parts } = flagChange(bike.parts, 'chain', { why: 'crash', date: '2026-02-20', note: ' left side ' });
    expect(flagOf(parts[0])).toEqual({ why: 'crash', date: '2026-02-20', note: 'left side' });
    const row = wearRows({ ...bike, parts }, { today: '2026-03-01' }).find((r) => r.key === 'chain');
    expect(row.state).toBe(before.state === 'due' ? 'due' : 'soon');
    expect(row.why).toBe(before.state === 'due' ? before.why : 'flag');
    expect(row.flag.why).toBe('crash');
    const off = flagChange(parts, 'chain', null).parts[0];
    expect('flag' in off).toBe(false);
  });
  it('an unknown kind counts as «something else»', () => {
    expect(flagChange([chain], 'chain', { why: 'zzz' }).parts[0].flag.why).toBe('other');
    expect(FLAG_KINDS.map((k) => k.key)).toEqual(['crash', 'noise', 'other']);
  });
});

describe('German texts', () => {
  it('every text of the package has a German entry in the app', () => {
    for (const k of Object.keys(de)) expect(DE[k], k).toBeTruthy();
    for (const k of FLAG_KINDS) expect(DE[k.name], k.name).toBeTruthy();
  });
});
