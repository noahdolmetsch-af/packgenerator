// v0.72.0 «Feinschliff» (Material-Detail und Bausteine, Noah «1-5 a»): the one summary line, the
// row «Weight» with the lighter alternative, first aid on every trip (small or full). Fictional data only.
import { describe, it, expect, afterEach } from 'vitest';
import { summaryParts, summaryLine, weightLine } from '../src/lib/gear/detail.js';
import { alternatives, lighterAlts, dismissValue, linkPatch, suggestWhy } from '../src/lib/gear/material.js';
import { inSmallAid, aidLevel, aidAuto, aidChosen, aidFits, aidCounts, isAid } from '../src/lib/firstaid.js';
import { toggleSet } from '../src/lib/trips.js';
import { contextEntries } from '../src/lib/context.js';
import { aidReason } from '../src/lib/reasons.js';
import { setUse } from '../src/lib/sets.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const P = 'test_data_gtp_';
const blocks = [{ key: 'u-rain', name: 'Rain', builtIn: false }];

describe('1a: one summary line under the name', () => {
  const jacket = { id: 'KL098', name: `${P} Rain jacket red 3`, sets: ['u-rain'], weightG: 245, defaultBag: 'seat' };
  it('weight, how it comes along, place and how often it was along and used', () => {
    expect(summaryParts(jacket, blocks, { taken: 6, used: 4 })).toEqual(['245 g', 'comes with Rain', 'Seat pack / Tailfin', '6× along, 4× used']);
    lang.v = 'de';
    expect(summaryLine(jacket, blocks, { taken: 6, used: 4 })).toBe('245 g · kommt mit Rain · Satteltasche / Tailfin · 6× dabei, 4× gebraucht'); // an own block keeps its name
  });
  it('without a reviewed trip no usage; without a block «by hand»; unweighed says so', () => {
    expect(summaryLine({ id: 'x', sets: [], weightG: null, defaultBag: 'seat' }, blocks, { taken: 0, used: 0 })).toBe('not weighed · comes along by hand · Seat pack / Tailfin');
    lang.v = 'de';
    expect(summaryLine({ id: 'x', sets: [], weightG: null, defaultBag: 'seat' }, blocks)).toBe('nicht gewogen · von Hand · Satteltasche / Tailfin');
  });
  it('rules count as how it comes; On me as the place; «stays at home» before it', () => {
    expect(summaryParts({ id: 'y', role: 'worn', coldBelow: 10, weightG: 1200 }, blocks)).toEqual(['1.2 kg', 'comes with Standard, below 10 °C', 'On me']);
    expect(summaryParts({ id: 'z', leaveHome: true, role: 'optional', sets: [], weightG: 50, defaultBag: 'seat' }, blocks)[1]).toBe('Stays at home');
  });
  it('the row «Weight»: grams and status', () => {
    expect(weightLine({ weightG: 245, weightStatus: 'measured' })).toBe('245 g · weighed');
    expect(weightLine({ weightG: null })).toBe('not weighed');
  });
});

const it2 = (id, extra = {}) => ({ id, name: `${P}${id}`, category: 'rain', weightG: 245, qty: 1, ownership: 'owned', ...extra });

describe('2a: «Remember as alternative» and «Doesn\'t fit»', () => {
  it('dismissValue adds and removes one id; an item with none left drops out; the old value stays', () => {
    const old = { A: ['B'] };
    const on = dismissValue(old, 'A', 'C', true);
    expect(on).toEqual({ A: ['B', 'C'] });
    expect(old).toEqual({ A: ['B'] });
    expect(dismissValue(on, 'A', 'C', true)).toEqual({ A: ['B', 'C'] }); // never twice
    expect(dismissValue({ A: ['B'] }, 'A', 'B', false)).toEqual({});
    expect(dismissValue(undefined, 'X', 'Y', true)).toEqual({ X: ['Y'] });
  });
  it('linkPatch: the suggestion stands in for the item, so alternatives(item) lists it as linked', () => {
    const jacket = it2('JACKET');
    const light = it2('LIGHT', { weightG: 168 });
    const patch = linkPatch(jacket, light);
    expect(patch).toEqual({ id: 'LIGHT', altFor: 'JACKET' });
    const linked = { ...light, altFor: patch.altFor };
    expect(alternatives(jacket, [jacket, linked]).map((a) => a.item.id)).toEqual(['LIGHT']);
    expect(lighterAlts(jacket, [jacket, linked])[0]).toMatchObject({ manual: true, diffG: -77 });
    expect(linkPatch(jacket, linked)).toBe(null); // linked already
  });
  it('linkPatch: a suggestion that stands in for something else keeps its link; the item links to it', () => {
    const jacket = it2('JACKET');
    const light = it2('LIGHT', { weightG: 168, altFor: 'OTHER' });
    const patch = linkPatch(jacket, light);
    expect(patch).toEqual({ id: 'JACKET', altFor: 'LIGHT' });
    expect(alternatives({ ...jacket, altFor: 'LIGHT' }, [jacket, light]).map((a) => a.item.id)).toContain('LIGHT');
  });
  it('why: clothing by its zone and layer, everything else by its category', () => {
    expect(suggestWhy({ category: 'onbike', zone: 'torso', layer: 'shell' })).toBe('zone');
    expect(suggestWhy({ category: 'cook' })).toBe('category');
  });
});

const aid = (id, extra = {}) => ({ id, name: `${P}${id}`, category: 'hyg', ownership: 'owned', sets: ['firstaid'], defaultBag: 'top', domains: ['bikepacking'], ...extra });

describe('5a: first aid on every trip, small or full', () => {
  const kit = aid('KIT');
  const plaster = aid('Plaster');
  const blanket = aid('Rettungsdecke');
  const tape = aid('Tape', { aidSmall: true });
  const notSmall = aid('Blister big', { aidSmall: false });
  it('the small set: its own mark first, else plaster, blister or rescue blanket by name', () => {
    expect([kit, plaster, blanket, tape, notSmall].map(inSmallAid)).toEqual([false, true, true, true, false]);
    expect(aidCounts([kit, plaster, blanket, tape, notSmall, { id: 'x', sets: [] }])).toEqual({ small: 3, full: 5 });
    expect(isAid(kit)).toBe(true);
  });
  it('the app picks small on a day trip, full with a night; the trip can choose; off is off', () => {
    expect(aidAuto({ overnight: 'none' })).toBe('small');
    expect(aidAuto({ overnight: 'lodging' })).toBe('full');
    expect(aidLevel({ overnight: 'none' })).toBe('small');
    expect(aidLevel({ overnight: 'outdoor', aid: 'small' })).toBe('small');
    expect(aidChosen({ aid: 'small' })).toBe(true);
    expect(aidChosen({ aid: 'weird' })).toBe(false);
    expect(aidLevel({ overnight: 'none', sets: { firstaid: false } })).toBe(null);
    expect([aidFits(kit, 'small'), aidFits(kit, 'full'), aidFits(plaster, 'small'), aidFits(plaster, null)]).toEqual([false, true, true, false]);
  });
  it('contextEntries brings the small set on a day trip and all of it with a night', () => {
    const items = [kit, plaster, blanket];
    const ids = (t) => contextEntries({ entries: [], ...t }, items, { slotOf: () => 'top' }).map((e) => e.itemId).sort();
    expect(ids({ overnight: 'none' })).toEqual([plaster.id, blanket.id].sort());
    expect(ids({ overnight: 'lodging' })).toEqual([kit.id, plaster.id, blanket.id].sort());
    expect(ids({ overnight: 'none', aid: 'full' })).toEqual([kit.id, plaster.id, blanket.id].sort());
    expect(ids({ overnight: 'none', sets: { firstaid: false } })).toEqual([]);
  });
  it('switching first aid on in Pack brings only the set of the trip', () => {
    const trip = { overnight: 'none', sets: { firstaid: false }, entries: [] };
    const on = toggleSet(trip, [kit, plaster], 'firstaid', true);
    expect(on.entries.map((e) => e.itemId)).toEqual([plaster.id]);
    const full = toggleSet({ ...trip, aid: 'full' }, [kit, plaster], 'firstaid', true);
    expect(full.entries.map((e) => e.itemId)).toEqual([kit.id, plaster.id]);
  });
  it('the reason line and the block text say it, in German too', () => {
    expect(aidReason({ overnight: 'none' })).toBe('First aid: small (day trip)');
    expect(aidReason({ overnight: 'none', aid: 'full' })).toBe('First aid: full (chosen)');
    lang.v = 'de';
    expect(aidReason({ overnight: 'lodging' })).toBe('Erste Hilfe: voll (mit Nacht)');
    expect(aidReason({ overnight: 'lodging', aid: 'small' })).toBe('Erste Hilfe: klein (gewählt)');
    expect(setUse('firstaid')).toBe('Kommt auf jede Tour: das kleine Set bei einer Tagestour, das volle ab einer Nacht; pro Tour änderbar');
  });
});
