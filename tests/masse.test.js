// v0.65.0 «Velo-Masse»: the fit and setup block (bikespecs.js FIT), the move of the old
// geometry.seatHeight, the import with fit, the comparison rows and the target pressure.
// Fictional bikes only (test_data_gtp_).
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { fitMove2026, UPDATES, blocks2026 } from '../src/lib/updates.js';
import { FIT, FIT_FIRST, fitValue, setFit, fitRows, fitKey, moveSeatHeight, targetPressure, pressureText, specEntries, planSpecs, applySpecs, compareRows, readValue, setSpec, specValue, hasSpecs, GEOMETRY } from '../src/lib/bikespecs.js';
import DE from '../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';
const hardtail = () => ({ id: `${P}ht`, name: `${P} Bergziege`, type: 'hardtail', parts: [] });
const gravel = () => ({ id: `${P}gr`, name: `${P} Schotterfloh`, type: 'gravel', parts: [] });
const fully = () => ({ id: `${P}fs`, name: `${P} Sofa`, type: 'full', parts: [] });

describe('the fit block', () => {
  it('has Noah\'s three first, every name in German, saddle height no longer in the geometry', () => {
    expect(FIT.slice(0, 4).map((f) => f.key)).toEqual(FIT_FIRST);
    expect(FIT_FIRST).toEqual(['seatHeight', 'pressureF', 'pressureR', 'barWidth']);
    for (const f of FIT) expect(DE[f.name], f.name).toBeTruthy();
    expect(DE['Fit and setup']).toBe('Masse');
    expect(DE['Saddle height']).toBe('Sitzhöhe');
    expect(GEOMETRY.some((g) => g.key === 'seatHeight')).toBe(false);
  });

  it('reads an old geometry.seatHeight, writes to fit and drops the old field', () => {
    const b = { ...hardtail(), geometry: { seatHeight: 735, stack: 610 } };
    expect(fitValue(b, 'seatHeight')).toBe(735);
    const ch = setFit(b, 'seatHeight', 740);
    expect(ch).toEqual({ fit: { seatHeight: 740 }, geometry: { stack: 610 } });
    expect(setFit({ ...b, ...ch }, 'seatHeight', null).fit).toEqual({});
    expect(setFit(b, 'pressureF', 1.6)).toEqual({ fit: { pressureF: 1.6 } });
  });

  it('crank length and tyre widths live on their part (one value, one place)', () => {
    const b = { ...hardtail(), parts: [{ key: 'crank', model: '', attrs: { length: 170 }, history: [] }] };
    expect(fitValue(b, 'crankLength')).toBe(170);
    const ch = setFit(b, 'tyreWidthF', '2.4"');
    expect(ch.parts.find((p) => p.key === 'tyres').attrs.widthF).toBe('2.4"');
    expect(fitValue({ ...b, ...ch }, 'tyreWidthF')).toBe('2.4"');
  });

  it('suspension rows only where the bike has that suspension or a value', () => {
    const keys = (b) => fitRows(b).map((r) => r.key);
    expect(keys(fully())).toEqual(expect.arrayContaining(['forkPressure', 'forkSag', 'shockPressure', 'shockSag']));
    expect(keys(hardtail())).toEqual(expect.arrayContaining(['forkPressure', 'forkSag']));
    expect(keys(hardtail())).not.toContain('shockPressure');
    expect(keys(gravel())).not.toContain('forkPressure');
    expect(keys(gravel())).not.toContain('shockSag');
    // A gravel bike with a suspension fork (a model or travel) shows the fork rows.
    expect(keys({ ...gravel(), parts: [{ key: 'fork', model: 'Federling 40', attrs: { travel: 40 }, history: [] }] })).toContain('forkPressure');
    // A value typed once is never hidden.
    expect(keys({ ...gravel(), fit: { shockSag: 25 } })).toContain('shockSag');
  });

  it('target pressure and its text', () => {
    expect(targetPressure(hardtail())).toBeNull();
    expect(targetPressure({ ...hardtail(), fit: { pressureF: 1.6, pressureR: 1.7 } })).toEqual({ f: 1.6, r: 1.7 });
    expect(targetPressure({ ...hardtail(), fit: { pressureR: 1.7 } })).toEqual({ f: null, r: 1.7 });
    expect(pressureText({ f: 1.6, r: 1.7 })).toBe('1.6 / 1.7 bar');
    expect(pressureText({ f: null, r: 1.7 })).toBe('– / 1.7 bar');
    expect(pressureText(null)).toBe('');
    expect(readValue('1,6 bar', true)).toBe(1.6);
    expect(readValue('85 psi', true)).toBe(85);
    expect(readValue('25 %', true)).toBe(25);
  });

  it('the fit keys of the import: English keys, English and German names', () => {
    expect(fitKey('seatHeight')).toBe('seatHeight');
    expect(fitKey('Sitzhöhe')).toBe('seatHeight');
    expect(fitKey('Lenkerbreite')).toBe('barWidth');
    expect(fitKey('Bar width')).toBe('barWidth');
    expect(fitKey('Solldruck vorne')).toBe('pressureF');
    expect(fitKey('Dämpfer-Sag')).toBe('shockSag');
    expect(fitKey('Kurbellänge')).toBe('crankLength');
    expect(fitKey('Lieblingsfarbe')).toBeNull();
  });
});

describe('the move of the old saddle height (updates.js)', () => {
  it('moves it once, keeps a typed fit value, runs before the block updates', async () => {
    expect(moveSeatHeight(hardtail())).toBeNull();
    expect(moveSeatHeight({ ...hardtail(), geometry: { seatHeight: 735 } })).toEqual({ geometry: {}, fit: { seatHeight: 735 } });
    expect(moveSeatHeight({ ...hardtail(), geometry: { seatHeight: 735 }, fit: { seatHeight: 742 } })).toEqual({ geometry: {}, fit: { seatHeight: 742 } });
    const db = createDb('masse-move-test');
    await db.bikes.bulkPut([
      { ...hardtail(), geometry: { seatHeight: 735, stack: 610 } },
      { ...gravel(), geometry: { seatHeight: 720 }, fit: { seatHeight: 728, barWidth: 440 } },
      fully(),
    ]);
    expect(await fitMove2026(db)).toBe(true);
    const by = Object.fromEntries((await db.bikes.toArray()).map((b) => [b.id, b]));
    expect(by[`${P}ht`]).toMatchObject({ geometry: { stack: 610 }, fit: { seatHeight: 735 } });
    expect(by[`${P}gr`]).toMatchObject({ geometry: {}, fit: { seatHeight: 728, barWidth: 440 } });
    expect(by[`${P}fs`].fit).toBeUndefined();
    expect(await fitMove2026(db)).toBe(false); // idempotent
    expect(UPDATES.indexOf(fitMove2026)).toBeLessThan(UPDATES.indexOf(blocks2026));
  });
});

describe('the bikeSpecs import with fit', () => {
  const FILE = {
    kind: 'bikeSpecs',
    bike: `${P} Bergziege`,
    geometry: { Stack: 612, Sitzhöhe: 738 },
    fit: { pressureF: '1,6', 'Solldruck hinten': '1.7 bar', Lenkerbreite: 760, Gabeldruck: '85 psi', Reifenbreite: '2.4', Lieblingsfarbe: 'blau', 'Kurbellänge': 170 },
  };
  it('reads fit (and «masse») from each entry', () => {
    expect(specEntries(FILE)[0].fit).toMatchObject({ pressureF: '1,6' });
    expect(specEntries({ kind: 'bikeSpecs', bike: 'x', masse: { Sitzhöhe: 700 } })[0].fit).toEqual({ Sitzhöhe: 700 });
    expect(specEntries({ kind: 'bikeSpecs', bike: 'x' })[0].fit).toEqual({});
  });
  it('fills empty values, ignores unknown keys, asks before overwriting a typed value', () => {
    const bike = { ...hardtail(), fit: { barWidth: 740 } };
    const plan = planSpecs(bike, specEntries(FILE)[0]);
    expect(plan.unknown).toEqual(['Reifenbreite', 'Lieblingsfarbe']);
    expect(plan.conflicts.map((c) => c.id)).toEqual(['fit:barWidth:value']);
    const out = applySpecs(bike, plan);
    expect(out.fit).toEqual({ barWidth: 740, seatHeight: 738, pressureF: 1.6, pressureR: 1.7, forkPressure: 85 });
    expect(out.geometry).toEqual({ stack: 612 });
    expect(out.parts.find((p) => p.key === 'crank').attrs.length).toBe(170);
    expect(applySpecs(bike, plan, new Set(['fit:barWidth:value'])).fit.barWidth).toBe(760);
  });
  it('the same value counts as same, not as a conflict', () => {
    const bike = { ...hardtail(), fit: { pressureF: 1.6 } };
    const plan = planSpecs(bike, { fit: { 'Solldruck vorne': '1.6' } });
    expect(plan).toMatchObject({ same: 1, conflicts: [], fills: [] });
  });
});

describe('compare bikes with fit', () => {
  it('the fit rows come first, fillable through setSpec', () => {
    const a = { ...fully(), fit: { seatHeight: 740, pressureF: 1.5 } };
    const b = { ...hardtail(), geometry: { seatHeight: 735 } };
    const c = compareRows([a, b]);
    expect(Object.keys(c)[0]).toBe('fit');
    expect(c.fit.name).toBe('Fit and setup');
    expect(c.fit.rows.slice(0, 4).map((r) => r.field)).toEqual(FIT_FIRST);
    expect(c.fit.rows[0]).toMatchObject({ id: 'fit:seatHeight', values: [740, 735], differ: true });
    expect(c.fit.rows.some((r) => r.field === 'shockSag')).toBe(true); // the full suspension bike has one
    expect(compareRows([b]).fit.rows.some((r) => r.field === 'shockSag')).toBe(false);
    const ch = setSpec(b, 'fit', 'pressureR', 1.8);
    expect(specValue({ ...b, ...ch }, 'fit', 'pressureR')).toBe(1.8);
    expect(hasSpecs({ ...hardtail(), fit: { barWidth: 760 } })).toBe(true);
  });
});
