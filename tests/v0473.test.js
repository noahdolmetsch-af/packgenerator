// v0.47.3 (Noah: «Kühl + Regen» in the New trip window showed «Fürs Wetter: nichts zusätzlich»).
// Cause: the weather chips of the window toggled. With the forecast (or a tap before) on «Kühl» and rain,
// the taps on «Kühl» and «+ Regen» took both off again, so nothing came for the weather.
// Fictional items only (test_data_gtp_).
import { describe, it, expect } from 'vitest';
import { pickWxChip } from '../src/lib/dayride.js';
import { contextSummary } from '../src/lib/context.js';
import { layerSuggest } from '../src/lib/layers.js';
import { WX_PRESETS } from '../src/lib/trips.js';
import { shiftX, shiftY, EDGE } from '../src/lib/ui/inview.js';

const it_ = (id, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });
const REGEN = 'u-test-data-gtp-regen';
const items = [
  it_('JERSEY', { role: 'worn', defaultBag: 'body' }),
  it_('ARMS', { coldBelow: 14 }),
  it_('VEST', { coldBelow: 12 }),
  it_('LONG', { coldBelow: 10 }),
  it_('BUFF', { coldBelow: 8, sets: ['warm', REGEN] }), // a cold item that is also in the rain block
  it_('WGLOVES', { coldBelow: 6 }),
  it_('RJACKET', { rain: 'yes', sets: [REGEN] }),
  it_('RTROUSERS', { rain: 'optional', sets: [REGEN] }),
  it_('RGLOVES', { sets: [REGEN] }),
  it_('RSOCKS', { rain: 'yes', coldBelow: 8 }), // rain gear with a cold limit: only with rain
  it_('Clear glasses', { coldBelow: 10, sets: [REGEN] }), // glasses for the dark: never a cold layer
];
const preset = (name) => WX_PRESETS.find((p) => p.name === name);
const trip = (wx) => ({ overnight: 'none', days: 1, hours: null, entries: [], wx });
const extras = (wx) => contextSummary([], trip(wx), items).weather.map((i) => i.id).sort();

describe('«Kühl + Regen» in the New trip window (the bug)', () => {
  it('the forecast chose «Kühl» and rain; tapping «Kühl» and «Regen» keeps both', () => {
    let wx = { min: 6, max: 12, rain: 'rain' }; // forecastPreset of a cool, wet day
    wx = pickWxChip(wx, preset('Chilly'));
    wx = pickWxChip(wx, { rain: 'rain' });
    expect(wx).toEqual({ min: 6, max: 12, rain: 'rain' });
    expect(extras(wx)).toEqual(['ARMS', 'BUFF', 'Clear glasses', 'LONG', 'RGLOVES', 'RJACKET', 'RSOCKS', 'VEST'].sort());
  });
  it('from no weather: «Kühl» then «Regen» sets both', () => {
    const wx = pickWxChip(pickWxChip({ min: null, max: null, rain: 'none' }, preset('Chilly')), { rain: 'rain' });
    expect(wx).toEqual({ min: 6, max: 12, rain: 'rain' });
    expect(extras(wx).length).toBeGreaterThan(0);
  });
  it('a chip never clears: the same preset twice stays, «Trocken» sets dry, showers stay showers on «Regen»', () => {
    const chilly = { min: 6, max: 12, rain: 'none' };
    expect(pickWxChip(chilly, preset('Chilly'))).toEqual(chilly);
    expect(pickWxChip({ ...chilly, rain: 'rain' }, { rain: 'none' })).toEqual(chilly);
    expect(pickWxChip({ ...chilly, rain: 'showers' }, { rain: 'rain' })).toEqual({ ...chilly, rain: 'showers' });
    expect(pickWxChip({ ...chilly, rain: 'showers' }, preset('Cold'))).toEqual({ min: -2, max: 4, rain: 'showers' });
    expect(pickWxChip(null, null)).toEqual({ min: null, max: null, rain: 'none' });
  });
});

// Every preset × dry / showers / rain: what comes for the weather (contextSummary, as the window shows it).
const COLD = {
  Cold: ['ARMS', 'BUFF', 'LONG', 'VEST', 'WGLOVES'],
  Chilly: ['ARMS', 'BUFF', 'LONG', 'VEST'],
  Mild: ['ARMS', 'VEST'],
  Warm: [],
  Hot: [],
};
const RAIN = ['Clear glasses', 'RGLOVES', 'RJACKET', 'RSOCKS']; // RTROUSERS is only offered (optional)

describe('weather table: each preset and dry / showers / rain', () => {
  for (const p of WX_PRESETS) {
    for (const rain of ['none', 'showers', 'rain']) {
      it(`${p.name} ${p.min}–${p.max} °C, ${rain}`, () => {
        const wx = pickWxChip(pickWxChip(null, p), { rain });
        expect(wx).toEqual({ min: p.min, max: p.max, rain });
        const wet = rain !== 'none';
        // the buff is a cold item and in the rain block: it comes with cold or with rain
        const want = [...new Set([...COLD[p.name], ...(wet ? [...RAIN, 'BUFF'] : [])])].sort();
        expect(extras(wx)).toEqual(want);
        // never rain gear on a dry day, never the glasses for the dark as a cold layer
        if (!wet) expect(extras(wx).some((id) => RAIN.includes(id))).toBe(false);
        // the optional rain trousers are offered with rain only
        expect(layerSuggest(trip(wx), items).some((r) => r.id === 'RTROUSERS' && r.optional)).toBe(wet);
        // colder never brings less
        const i = WX_PRESETS.indexOf(p);
        if (i > 0) expect(COLD[WX_PRESETS[i - 1].name]).toEqual(expect.arrayContaining(COLD[p.name]));
      });
    }
  }
  it('rain without a temperature brings the rain items (and the buff of the rain block)', () => {
    expect(extras({ min: null, max: null, rain: 'rain' })).toEqual([...RAIN, 'BUFF'].sort());
  });
  it('a worn cold layer when even the warmest part is colder, packed otherwise', () => {
    const rows = layerSuggest(trip({ min: -2, max: 4, rain: 'none' }), items);
    expect(rows.find((r) => r.id === 'WGLOVES').place).toBe('wear');
    expect(layerSuggest(trip({ min: 6, max: 12, rain: 'none' }), items).find((r) => r.id === 'VEST').place).toBe('pack');
  });
});

describe('a ••• menu stays inside the screen (ui/inview.js shiftX)', () => {
  it('moves a menu that runs over the left edge to the right, and over the right edge to the left', () => {
    expect(shiftX(-20, 320, 390)).toBe(EDGE + 20);
    expect(shiftX(100, 420, 390)).toBe(390 - EDGE - 420);
    expect(shiftX(20, 300, 320)).toBe(0);
  });
  it('a menu wider than the screen keeps its left edge in view', () => {
    expect(shiftX(-50, 400, 320)).toBe(EDGE + 50);
  });
  it('flips a menu above its button when it runs under the floor and there is room above', () => {
    const button = { top: 760, bottom: 804 };
    const box = { top: 808, bottom: 900 }; // 4 px gap, 92 px tall
    expect(shiftY(box, button, 844)).toBe(760 - 4 - 92 - 808);
    expect(shiftY({ top: 100, bottom: 200 }, { top: 52, bottom: 96 }, 844)).toBe(0); // fits: stays
  });
  it('a menu too tall for the room above stays below (the page scrolls; its ••• stays free)', () => {
    expect(shiftY({ top: 448, bottom: 1183 }, { top: 400, bottom: 444 }, 844, 64)).toBe(0);
  });
});
