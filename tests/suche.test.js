// «Suche mit Sprache und Antworten» (Noah 21.10.2026 «1a 2a 3a+b 4b+a 5b»)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SUCHE_DEFAULTS, READ_MODES, sucheOf, spokenCommand, searchText } from '../src/lib/suche/logic.js';
import { commandActions } from '../src/lib/search.js';
import { FEATURE } from '../src/lib/features.js';
import { pageOf } from '../src/lib/nav.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const bikes = [
  { id: 'b1', name: 'Gravel Grau' },
  { id: 'b2', name: 'Renner Rot' },
];

describe('search settings', () => {
  it('defaults follow Noah: mic always, commands at once, read aloud at once, every source on', () => {
    expect(SUCHE_DEFAULTS).toEqual({ mic: true, run: true, read: 'auto', app: true, gemini: true, geminiAuto: true, links: true, chrome: true, local: true });
    expect(READ_MODES.map((m) => m.key)).toEqual(['auto', 'tap']);
  });
  it('a stored value wins, unknown values fall back', () => {
    expect(sucheOf('mic', '0')).toBe(false);
    expect(sucheOf('gemini', '1')).toBe(true);
    expect(sucheOf('links', null)).toBe(true);
    expect(sucheOf('read', 'tap')).toBe('tap');
    expect(sucheOf('read', 'loud')).toBe('auto');
  });
});

describe('spoken commands', () => {
  it('runs only when exactly one command fits', () => {
    const one = commandActions('Kette geölt Gravel', { bikes });
    expect(one).toHaveLength(1);
    expect(spokenCommand(one)?.cmd).toEqual({ kind: 'chain', bikeId: 'b1' });
    const two = commandActions('Kette geölt', { bikes });
    expect(two.length).toBeGreaterThan(1);
    expect(spokenCommand(two)).toBeNull();
  });
  it('the setting «Run spoken commands at once» off: nothing runs', () => {
    expect(spokenCommand(commandActions('Kette geölt Gravel', { bikes }), { run: false })).toBeNull();
  });
  it('a note needs words after «Notiz»', () => {
    expect(spokenCommand(commandActions('Notiz Bremse quietscht', { bikes }))?.cmd).toEqual({ kind: 'note', text: 'Bremse quietscht' });
    expect(spokenCommand([{ cmd: { kind: 'note', text: '' } }])).toBeNull();
  });
  it('spoken words become one clean line', () => {
    expect(searchText('  Notiz   Bremse quietscht. ')).toBe('Notiz Bremse quietscht');
    expect(searchText('Wie viele km diese Woche?')).toBe('Wie viele km diese Woche?');
    expect(searchText('x'.repeat(300))).toHaveLength(200);
  });
});

describe('where it lives', () => {
  it('Ich › Suche is its own page, loaded later', () => {
    expect(pageOf('#/me/suche')).toBe('suchesettings');
    expect(src('src/App.svelte')).toContain("SucheSettings: () => import('./pages/SucheSettings.svelte')");
    expect(src('src/pages/Me.svelte')).toContain('href="#/me/suche"');
    expect(FEATURE['f.searchvoice']?.href).toBe('#/me/suche');
  });
  it('the search has the microphone, Gemini and «Ask further at», each behind its setting', () => {
    const s = src('src/lib/nav/Search.svelte');
    expect(s).toContain('<SearchMic onsaid={said}');
    expect(s).toMatch(/\{#if asking && \(suche\.gemini \|\| suche\.links\)\}<AskElsewhere/);
    expect(s).toContain('{#if suche.app}<AskAnswer');
    expect(s).toContain('chrome={suche.chrome} links={suche.links}');
  });
});
