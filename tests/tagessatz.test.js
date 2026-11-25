// «Heute erholen» / «Welcher Berg ruft?» (Noah 24.11.2026 «1-5»): the rules of the sentence under the greeting on Today.
import { describe, it, expect } from 'vitest';
import { tagesSatz, putAway } from '../src/lib/home/tagessatz.js';

const busy = { kind: 'load', recent: 200, base: 120, pct: 67, dir: 1 };
const quiet = { kind: 'load', recent: 60, base: 120, pct: 50, dir: -1 };

describe('tagesSatz', () => {
  it('says nothing without an answer of the day', () => {
    expect(tagesSatz({})).toBeNull();
    expect(tagesSatz({ level: null, dry: true })).toBeNull();
  });
  it('rest and easy lead to the page Form, whatever the weather or the week', () => {
    for (const x of [{}, { dry: true }, { dry: false }, { azm: busy }]) {
      expect(tagesSatz({ level: 'rest', ...x })).toMatchObject({ kind: 'rest', href: '#/flow/form' });
      expect(tagesSatz({ level: 'easy', ...x })).toMatchObject({ kind: 'easy', href: '#/flow/form' });
    }
  });
  it('a normal day is quiet, unless the week was busy', () => {
    expect(tagesSatz({ level: 'normal', dry: true })).toBeNull();
    expect(tagesSatz({ level: 'normal', azm: quiet })).toBeNull();
    expect(tagesSatz({ level: 'normal', azm: busy })).toMatchObject({ kind: 'calm', href: '#/flow/stats/azm' });
  });
  it('a good day asks which mountain calls; rain and a busy week change it', () => {
    expect(tagesSatz({ level: 'hard', dry: true })).toMatchObject({ kind: 'berg', href: '#/flow/gipfelbuch' });
    expect(tagesSatz({ level: 'hard', dry: null })).toMatchObject({ kind: 'berg' });
    expect(tagesSatz({ level: 'hard', dry: true, azm: quiet })).toMatchObject({ kind: 'berg' });
    expect(tagesSatz({ level: 'hard', dry: false })).toMatchObject({ kind: 'wet', href: '#/wetter' });
    expect(tagesSatz({ level: 'hard', dry: true, azm: busy })).toMatchObject({ kind: 'calm' });
  });
  it('a mountain that calls replaces the question on a dry day, not in rain or after a busy week', () => {
    const ruf = { kind: 'hard', text: 'Heute geht viel. Welcher Berg ruft? Säntis', href: '#/flow/gipfelbuch/karte' };
    expect(tagesSatz({ level: 'hard', dry: true, ruf })).toMatchObject({ kind: 'berg', raw: true, text: ruf.text, href: ruf.href });
    expect(tagesSatz({ level: 'normal', dry: true, ruf })).toMatchObject({ kind: 'berg', raw: true });
    expect(tagesSatz({ level: 'hard', dry: false, ruf })).toMatchObject({ kind: 'wet' });
    expect(tagesSatz({ level: 'normal', dry: false, ruf })).toBeNull();
    expect(tagesSatz({ level: 'hard', dry: true, ruf, azm: busy })).toMatchObject({ kind: 'calm' });
    expect(tagesSatz({ level: 'normal', dry: true, ruf, azm: busy })).toMatchObject({ kind: 'calm' });
    expect(tagesSatz({ level: 'rest', dry: true, ruf })).toMatchObject({ kind: 'rest' });
  });
  it('every text is an English key with a German entry', async () => {
    const de = (await import('../src/lib/i18n/de/tagessatz.js')).default;
    for (const level of ['rest', 'easy', 'normal', 'hard']) {
      for (const x of [{}, { dry: false }, { azm: busy }]) {
        const r = tagesSatz({ level, ...x });
        if (r) expect(de[r.text], r.text).toBeTruthy();
      }
    }
  });
});

describe('putAway', () => {
  it('only for the same day', () => {
    expect(putAway('2026-11-24', '2026-11-24')).toBe(true);
    expect(putAway('2026-11-23', '2026-11-24')).toBe(false);
    expect(putAway(null, '2026-11-24')).toBe(false);
  });
});
