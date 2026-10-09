// v0.52.0 «Tauschen» (OP2a): alternatives of the same zone and layer, ordered by the trip's weather,
// then by the last picks; the memory, the swap of an entry, the card «On me». Fictional data only.
import { describe, it, expect } from 'vitest';
import { swapChoices, fitOf, rememberSwap, swapEntries, wornClothes, tripRange, unfitDuplicates } from '../src/lib/swap.js';

const P = 'test_data_gtp_';
const c = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', ownership: 'owned', weightG: 100, ...f });
const KURZ = c('A1', 'Trikot kurzarm', { layer: 'base', zone: 'torso', tempMin: 15, tempMax: 30 });
const LANG = c('A2', 'Trikot langarm', { layer: 'base', zone: 'torso', tempMin: 8, tempMax: 18 });
const UNTER = c('A3', 'Unterhemd langarm', { layer: 'base', zone: 'torso', tempMin: 0, tempMax: 15 });
const MERINO = c('A4', 'Merino kurzarm', { layer: 'base', zone: 'torso', tempMin: 12, tempMax: 24 });
const SOMMER = c('A5', 'Trikot sommer', { layer: 'base', zone: 'torso', tempMin: 18, tempMax: 32 });
const KLASSE = c('A6', 'Shirt mittel', { layer: 'base', zone: 'torso', tempClass: 'mittel' });
const WESTE = c('A7', 'Windweste', { layer: 'outer', zone: 'torso', tempMin: 4, tempMax: 18 });
const REGEN = c('A8', 'Regenjacke', { layer: 'outer', zone: 'torso', tempMin: -5, tempMax: 18, rain: 'yes' });
const HOSE = c('A9', 'Traegerhose kurz', { layer: 'base', zone: 'legs', tempMin: 12, tempMax: 30 });
const KAPPE = c('A10', 'Velokappe', { layer: 'accessory', zone: 'head', tempMin: 8, tempMax: 24 });
const WISH = c('A11', 'Wunschtrikot', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 18, ownership: 'wishlist' });
const ITEMS = [KURZ, LANG, UNTER, MERINO, SOMMER, KLASSE, WESTE, REGEN, HOSE, KAPPE, WISH];
const trip = (f = {}) => ({ id: `${P}t`, wx: { min: 10, max: 16, rain: 'none' }, entries: [{ itemId: 'A1', slot: 'body', qty: 1, packed: true }, { itemId: 'A9', slot: 'body', qty: 1 }, { itemId: 'A10', slot: 'body', qty: 1 }, { itemId: 'A7', slot: 'body', qty: 1 }], ...f });

describe('swapChoices', () => {
  it('offers only owned pieces of the same zone and layer, fitting ones first', () => {
    const r = swapChoices(KURZ, ITEMS, trip());
    const ids = (l) => l.map((x) => x.item.id);
    expect(ids(r.fits).sort()).toEqual(['A2', 'A3', 'A4', 'A6']);
    expect(ids(r.less)).toEqual(['A5']);
    expect(r.less[0].fit.why).toEqual({ key: 'cool', n: 18 });
    expect([...ids(r.fits), ...ids(r.less)]).not.toContain('A11'); // a wish is not owned
    expect([...ids(r.fits), ...ids(r.less)]).not.toContain('A7'); // outer layer, other layer
  });
  it('orders fitting pieces by the closest range when nothing was picked yet', () => {
    // trip middle 13: langarm 13, merino 18, unterhemd 7.5, mittel (5–15) 10
    expect(swapChoices(KURZ, ITEMS, trip()).fits.map((x) => x.item.id)).toEqual(['A2', 'A6', 'A4', 'A3']);
  });
  it('puts the piece picked more often and more recently first', () => {
    const mem = rememberSwap(rememberSwap({}, 'A3', 9, '2026-10-01T08:00:00Z'), 'A3', 9, '2026-10-02T08:00:00Z');
    const r = swapChoices(KURZ, ITEMS, trip(), mem);
    expect(r.fits[0].item.id).toBe('A3');
    expect(r.fits[0].mem).toEqual({ n: 2, at: '2026-10-02T08:00:00Z', c: 9 });
  });
  it('a different weather changes the order: warm day, short sleeves only', () => {
    const r = swapChoices(LANG, ITEMS, trip({ wx: { min: 20, max: 28, rain: 'none' }, entries: [{ itemId: 'A2', slot: 'body' }] }));
    expect(r.fits.map((x) => x.item.id)).toEqual(['A5', 'A1']); // merino (to 24 °C) is too warm for 28 °C
    expect(r.less.map((x) => x.item.id)).toContain('A3');
  });
  it('leaves out pieces already on the trip', () => {
    const t = trip();
    t.entries.push({ itemId: 'A2', slot: 'seat', qty: 1 });
    expect(swapChoices(KURZ, ITEMS, t).fits.map((x) => x.item.id)).not.toContain('A2');
  });
});

describe('fitOf', () => {
  it('a piece without a range takes its class (mittel 5–15 °C)', () => {
    expect(fitOf(KLASSE, { min: 10, max: 16 }).ok).toBe(true);
    expect(fitOf(KLASSE, { min: 22, max: 28 }).why).toEqual({ key: 'warm', n: 15 });
  });
  it('rain gear is less fitting on a dry trip, a windvest on a wet one', () => {
    expect(fitOf(REGEN, { min: 10, max: 16 }, 'dry').why).toEqual({ key: 'rain' });
    expect(fitOf(REGEN, { min: 10, max: 16 }, 'wet').ok).toBe(true);
    expect(fitOf(WESTE, { min: 10, max: 16 }, 'wet').why).toEqual({ key: 'dry' });
    expect(fitOf(WESTE, { min: 10, max: 16 }, null).ok).toBe(true);
  });
  it('without weather everything fits', () => {
    expect(fitOf(SOMMER, null).ok).toBe(true);
    expect(tripRange({ entries: [] })).toBeNull();
  });
});

describe('swapEntries', () => {
  it('puts the new piece in the same place, not packed, and remembers what it stands for', () => {
    const es = swapEntries(trip().entries, 'A1', 'A2');
    expect(es[0]).toEqual({ itemId: 'A2', slot: 'body', qty: 1, packed: false, swappedFrom: 'A1' });
    const back = swapEntries(es, 'A2', 'A1');
    expect(back[0]).toEqual({ itemId: 'A1', slot: 'body', qty: 1, packed: false });
    expect(swapEntries(swapEntries(es, 'A2', 'A3'), 'A3', 'A4')[0].swappedFrom).toBe('A1');
  });
});

describe('wornClothes', () => {
  it('head to feet, inside a zone base before outer', () => {
    const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
    const w = wornClothes(trip(), byId);
    expect(w.zones.map((z) => z.zone)).toEqual(['head', 'upper', 'legs']);
    expect(w.zones[1].rows.map((r) => r.item.id)).toEqual(['A1', 'A7']);
    expect(w.n).toBe(4);
  });
});

describe('unfitDuplicates', () => {
  it('hides a misfit only when its place has a fitting piece', () => {
    const hide = unfitDuplicates([KURZ, LANG, SOMMER, HOSE], { min: 10, max: 16 }, 'dry');
    expect([...hide].sort()).toEqual(['A1', 'A5']);
    // 2–6 °C: no torso base piece fits, so none is hidden (the place never goes empty)
    expect(unfitDuplicates([KURZ, LANG, SOMMER, HOSE], { min: 2, max: 6 }, 'dry').size).toBe(0);
  });
});
