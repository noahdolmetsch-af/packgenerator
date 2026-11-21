// «Sammlungen mit Charakter» (Entdecken und Sammeln, Noah 04.11.2026 «1a 2a 3a 4b 5a»): the look of a collection.
// Pure functions; no network, fictional names.
import { describe, it, expect } from 'vitest';
import { ICONS, TINTS, DEFAULT_LOOKS, OWN_LOOK, TEMPLATES, cleanLook, lookOf, setLook, resetLook, hasOwnLook } from '../src/lib/neuland/look.js';
import { stateOf, addCustom, deleteCustom, collectionsOf } from '../src/lib/neuland/neuland.js';
import de from '../src/lib/i18n/de/neulandlook.js';

describe('the look', () => {
  it('every built-in collection has a default look made of known parts', () => {
    for (const c of collectionsOf(null).filter((x) => x.builtIn)) {
      const l = lookOf(null, c.id);
      expect(ICONS).toContain(l.icon);
      expect(TINTS).toContain(l.tint);
    }
    for (const l of [...Object.values(DEFAULT_LOOKS), OWN_LOOK, ...TEMPLATES]) {
      expect(ICONS).toContain(l.icon);
      expect(TINTS).toContain(l.tint);
    }
  });

  it('choosing keeps the other part, resetting goes back to the default', () => {
    let s = setLook(null, 'passes', { icon: 'bike' });
    expect(lookOf(s, 'passes')).toEqual({ icon: 'bike', tint: DEFAULT_LOOKS.passes.tint });
    s = setLook(s, 'passes', { tint: 'ok' });
    expect(lookOf(s, 'passes')).toEqual({ icon: 'bike', tint: 'ok' });
    expect(hasOwnLook(s, 'passes')).toBe(true);
    s = resetLook(s, 'passes');
    expect(lookOf(s, 'passes')).toEqual(DEFAULT_LOOKS.passes);
    expect(hasOwnLook(s, 'passes')).toBe(false);
  });

  it('unknown pictures and tints are ignored', () => {
    expect(cleanLook({ icon: 'rocket', tint: 'pink' })).toBe(null);
    expect(cleanLook({ icon: 'tree', tint: 'pink' })).toEqual({ icon: 'tree' });
    const s = setLook(null, 'lakes', { icon: 'rocket' });
    expect(hasOwnLook(s, 'lakes')).toBe(false);
    expect(lookOf({ look: { lakes: { icon: 'rocket', tint: 7 } } }, 'lakes')).toEqual(DEFAULT_LOOKS.lakes);
  });

  it('an own collection that has none chosen gets the plain default', () => {
    const r = addCustom(null, 'Fictional Cafés');
    expect(lookOf(r.state, r.id)).toEqual(OWN_LOOK);
  });
});

describe('kept with the rest of Neuland', () => {
  it('survives the state round trip (backup and restore) and an old state without a look', () => {
    const s = setLook(null, 'peaks', { icon: 'sun', tint: 'warn' });
    const back = stateOf(JSON.parse(JSON.stringify(s)));
    expect(lookOf(back, 'peaks')).toEqual({ icon: 'sun', tint: 'warn' });
    expect(stateOf({ ticks: {} }).look).toEqual({});
    expect(stateOf(null).look).toEqual({});
  });

  it('a template becomes an own collection with its look; deleting the collection takes the look along', () => {
    const tp = TEMPLATES[0];
    const r = addCustom(null, 'Fictional viewpoints');
    const s = setLook(r.state, r.id, { icon: tp.icon, tint: tp.tint });
    expect(lookOf(s, r.id)).toEqual({ icon: tp.icon, tint: tp.tint });
    const gone = deleteCustom(s, r.id, null, 'Without collection');
    expect(gone.look[r.id]).toBeUndefined();
  });

  it('every template, picture and tint name has a German text', () => {
    for (const tp of TEMPLATES) expect(de[tp.name]).toBeTruthy();
  });
});
