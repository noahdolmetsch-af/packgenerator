// «Heute als Begleiter» PR 13, der Wächter (Noah 28.10.2026 «1a 2a 3a»): every function of the catalogue is complete in ALL places
// that describe it, and no place lists a function the catalogue does not have. One test, one readable message per gap.
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../src/lib/features.js';
import { HANDBOOK } from '../src/lib/handbook.js';
import { HOWTO } from '../src/lib/know/howto.js';
import { HOME, GAPS } from '../src/lib/know/heimat.js';
import { momentOfFeature, FEATURE_MOMENTS } from '../src/lib/moment.js';
import { TRICKS } from '../src/lib/know/gesten.js';
import DE from '../src/lib/i18n/de/index.js';

const IDS = FEATURES.map((f) => f.id);
const missing = (list, what) => list.length === 0 || expect.fail(`${what}: ${list.join(', ')}`);

describe('every function is complete in every place', () => {
  it('has a catalogue line with title and text, both in German', () => {
    missing(FEATURES.filter((f) => !f.title || !f.text || !DE[f.title] || !DE[f.text]).map((f) => f.id), 'title or text missing or not in German');
  });

  it('has a handbook entry and a «How it works» of 3 short steps, all in German', () => {
    missing(IDS.filter((id) => !HANDBOOK[id]), 'no handbook entry');
    missing(IDS.filter((id) => (HOWTO[id] ?? []).length !== 3), 'no «How it works» of exactly 3 steps');
    missing(IDS.filter((id) => (HOWTO[id] ?? []).some((s) => s.length > 90 || !DE[s])), 'a step is longer than 90 characters or not in German');
  });

  it('belongs to exactly one moment', () => {
    missing(IDS.filter((id) => !momentOfFeature(id)), 'no moment');
    const all = Object.values(FEATURE_MOMENTS).flat();
    expect(new Set(all).size, 'a function sits in two moments').toBe(all.length);
  });

  it('has a home page that shows it, or a reason why not', () => {
    missing(IDS.filter((id) => !HOME[id] && !GAPS[id]), 'neither HOME nor GAPS');
  });

  it('is not listed in a place the catalogue does not know', () => {
    const known = new Set(IDS);
    for (const [name, ids] of [
      ['HANDBOOK', Object.keys(HANDBOOK)],
      ['HOWTO', Object.keys(HOWTO)],
      ['FEATURE_MOMENTS', Object.values(FEATURE_MOMENTS).flat()],
      ['HOME', Object.keys(HOME)],
      ['GAPS', Object.keys(GAPS)],
    ]) missing(ids.filter((id) => !known.has(id)), `${name} lists an unknown function`);
  });

  it('explains every gesture, key, search command and «⋯» action in German', () => {
    const items = TRICKS.flatMap((g) => g.items);
    missing(items.filter((x) => !DE[x.title] || !DE[x.text]).map((x) => x.id), 'a «Gestures and tricks» entry is not in German');
    expect(new Set(items.map((x) => x.id)).size).toBe(items.length);
  });
});
