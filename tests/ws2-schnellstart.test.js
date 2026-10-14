// WS2 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben»): «Schnellstart» in Neu, the
// search and «More» says the rule of Today (today, 2.5 h, the bike ridden last); German for every new text.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { commandActions } from '../src/lib/search.js';
import { ACTIONS } from '../src/lib/nav/menu.js';
import { HANDBOOK } from '../src/lib/handbook.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => {
  lang.v = 'en';
});

const BIKES = [{ id: 'b1', name: 'test_data_gtp_ Gravel' }];

describe('WS2 Schnellstart everywhere', () => {
  it('the search finds «Schnellstart» and the old word «Tagestour», both as Quick start', () => {
    for (const q of ['schnellstart', 'tagestour']) {
      const row = commandActions(q, { bikes: BIKES }).find((r) => r.cmd.kind === 'dayride');
      expect(row?.title).toBe('Quick start');
      expect(row?.sub).toBe('today, 2.5 h, the bike ridden last');
    }
    lang.v = 'de';
    const row = commandActions('schnellstart', { bikes: BIKES }).find((r) => r.cmd.kind === 'dayride');
    expect(row?.title).toBe('Schnellstart');
    expect(row?.sub).toBe('heute, 2,5 Std., zuletzt gefahrenes Velo');
  });

  it('with a bike word: Quick start with that bike', () => {
    const row = commandActions('tagestour gravel', { bikes: BIKES }).find((r) => r.cmd.kind === 'dayride');
    expect(row?.cmd.bikeId).toBe('b1');
    expect(row?.title).toBe('Quick start with the test_data_gtp_ Gravel');
  });

  it('«More» and the handbook say Quick start, no «Day ride now» left', () => {
    expect(ACTIONS.find((a) => a.id === 'dayride')?.title).toBe('Quick start');
    expect(HANDBOOK.dayride.steps[0]).toContain('«Quick start»');
    const sheet = readFileSync(new URL('../src/lib/nav/NewSheet.svelte', import.meta.url), 'utf8');
    expect(sheet).toContain("t('Quick start')");
    expect(sheet).not.toContain('Day ride now');
  });

  it('every new text has a German entry', () => {
    for (const en of ['Quick start', 'today, 2.5 h, the bike ridden last', 'Quick start with the {bike}', 'Quick start created', 'Tap «New» › «Quick start», or «Quick start» on Today.']) expect(DE[en], en).toBeTruthy();
  });
});
