// Benutzerhandbuch (Noah 14.10.2026): how to switch on and use every function, with one example each.
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../src/lib/features.js';
import { MINI_APPS } from '../src/lib/miniapps.js';
import { HANDBOOK, MINI_APPS_HANDBOOK, handbookOf } from '../src/lib/handbook.js';
import HB from '../src/lib/i18n/de/handbuch.js';

/** Every text of the handbook (English keys for t()). */
const texts = () => [
  ...Object.values(HANDBOOK).flatMap((e) => [e.on, ...e.steps, e.example].filter((s) => s != null)),
  MINI_APPS_HANDBOOK.title,
  ...MINI_APPS_HANDBOOK.intro,
  ...MINI_APPS_HANDBOOK.apps.flatMap((a) => [a.title, ...a.steps, a.example]),
];

describe('the handbook', () => {
  it('has one entry per function of the catalogue, no more', () => {
    const ids = FEATURES.map((f) => f.id);
    expect(Object.keys(HANDBOOK).sort()).toEqual([...ids].sort());
  });

  it('gives every function 1–3 steps, an example and «on» as text or null', () => {
    for (const f of FEATURES) {
      const e = HANDBOOK[f.id];
      expect(e.steps.length, f.id).toBeGreaterThanOrEqual(1);
      expect(e.steps.length, f.id).toBeLessThanOrEqual(3);
      expect(e.example.trim(), f.id).not.toBe('');
      expect(e.on === null || (typeof e.on === 'string' && e.on.trim() !== ''), f.id).toBe(true);
    }
  });

  it('explains every small app with steps and an example', () => {
    expect(MINI_APPS_HANDBOOK.apps.map((a) => a.key)).toEqual(MINI_APPS.map((a) => a.key));
    for (const a of MINI_APPS_HANDBOOK.apps) {
      expect(a.steps.length, a.key).toBeGreaterThanOrEqual(1);
      expect(a.steps.join(' '), a.key).toContain(`apps/${a.key}/`);
      expect(a.example.trim(), a.key).not.toBe('');
    }
  });

  it('has short texts, each with a German entry', () => {
    for (const s of texts()) {
      expect(typeof s, s).toBe('string');
      expect(s.length, s).toBeLessThanOrEqual(140);
      expect(HB[s], s).toBeTruthy();
      expect(HB[s].length, s).toBeLessThanOrEqual(140);
    }
  });

  it('handbookOf gives the entry, or an empty one', () => {
    expect(handbookOf(FEATURES[0].id)).toBe(HANDBOOK[FEATURES[0].id]);
    expect(handbookOf('nope')).toEqual({ on: null, steps: [], example: '' });
  });
});
