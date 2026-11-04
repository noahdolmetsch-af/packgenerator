// «Leere Seiten mit Velo-Szenen» (Noah 03.11.2026, Paket D, Idee 19): the page's area picks the drawn scene.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SCENES, sceneFor } from '../src/lib/ui/emptyscene.js';

describe('empty scene', () => {
  it('trips and everything about being out show the tent', () => {
    for (const h of ['#/trips', '#/trips/rides', '#/pack', '#/dreams', '#/ski', '#/debrief/logbook']) expect(sceneFor(h), h).toBe('tent');
  });
  it('bikes and care show the empty rack', () => {
    for (const h of ['#/bikes', '#/bikes?bike=x', '#/care']) expect(sceneFor(h), h).toBe('rack');
  });
  it('everything else, and no hash, shows the bike on the wall', () => {
    for (const h of ['#/gear', '#/me/notes', '#/', '', undefined]) expect(sceneFor(h), String(h)).toBe('wall');
  });
  it('Empty draws every scene', () => {
    const src = readFileSync(new URL('../src/lib/ui/Empty.svelte', import.meta.url), 'utf8');
    for (const s of SCENES.filter((x) => x !== 'wall')) expect(src, s).toContain(`which === '${s}'`);
    expect(src).toContain('data-scene');
  });
});
