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

// «Suche als Alleskönner» (Noah 21.10.2026 «1-8 alle»)
import { valueOf, remindOf, dayOf, planOf, planHref, planFromHash, jumpOf, partsOf } from '../src/lib/suche/say.js';
import { actionOf, actionsOf } from '../src/lib/suche/act.js';

const TODAY = '2026-10-21'; // a Wednesday

describe('say → value (idea 1)', () => {
  it('weight, resting heart rate and sleep', () => {
    expect(valueOf('Gewicht 72,5')).toMatchObject({ qid: 'koerper.waage', value: 72.5 });
    expect(valueOf('ich wiege 71 kg')).toMatchObject({ qid: 'koerper.waage', value: 71 });
    expect(valueOf('Puls 48')).toMatchObject({ qid: 'koerper.ruhepuls', value: 48 });
    expect(valueOf('schlecht geschlafen')).toMatchObject({ qid: 'erholung.schlaf', value: 3 });
    expect(valueOf('sehr gut geschlafen')).toMatchObject({ qid: 'erholung.schlaf', value: 9 });
    expect(valueOf('Schlaf 6')).toMatchObject({ qid: 'erholung.schlaf', value: 6 });
  });
  it('nonsense stays a search', () => {
    expect(valueOf('Gewicht der Jacke')).toBeNull();
    expect(valueOf('Gewicht 7')).toBeNull();
    expect(valueOf('Puls 900')).toBeNull();
    expect(valueOf('Schlafsack')).toBeNull();
  });
});

describe('remind (idea 8)', () => {
  it('days in words', () => {
    expect(dayOf('morgen X', TODAY).due).toBe('2026-10-22');
    expect(dayOf('übermorgen X', TODAY).due).toBe('2026-10-23');
    expect(dayOf('Freitag X', TODAY).due).toBe('2026-10-23');
    expect(dayOf('am Mittwoch X', TODAY).due).toBe('2026-10-28'); // today is Wednesday: next week
    expect(dayOf('in 3 Tagen X', TODAY)).toEqual({ due: '2026-10-24', rest: 'X' });
    expect(dayOf('in zwei Wochen X', TODAY).due).toBe('2026-11-04');
  });
  it('«Erinnere mich Freitag ans Reifen pumpen» → a reminder on Friday', () => {
    expect(remindOf('Erinnere mich Freitag ans Reifen pumpen', TODAY)).toEqual({ kind: 'remind', text: 'Reifen pumpen', due: '2026-10-23' });
    expect(remindOf('remind me tomorrow to call the shop', TODAY)).toEqual({ kind: 'remind', text: 'Call the shop', due: '2026-10-22' });
    expect(remindOf('Erinnere mich an Kettenöl', TODAY)).toEqual({ kind: 'remind', text: 'Kettenöl', due: '2026-10-22' }); // no day: tomorrow
    expect(remindOf('Erinnere mich', TODAY)).toBeNull();
  });
});

describe('plan in a dialog (idea 4)', () => {
  it('days, name and start', () => {
    expect(planOf('Plane mir 3 Tage Jura', TODAY)).toEqual({ kind: 'plan', days: 3, title: 'Jura', start: null });
    expect(planOf('plane eine Tour ins Tessin ab Samstag', TODAY)).toEqual({ kind: 'plan', days: null, title: 'Tessin', start: '2026-10-24' });
    expect(planOf('Planen', TODAY)).toEqual({ kind: 'plan', days: null, title: '', start: null });
    expect(planOf('Planung Jura', TODAY)).toBeNull();
  });
  it('the address carries it to «Help me plan» and back', () => {
    const href = planHref({ days: 3, title: 'Jura', start: '2026-10-24' });
    expect(href).toBe('#/assistent/plan?days=3&title=Jura&start=2026-10-24');
    expect(planFromHash(href)).toEqual({ days: 3, title: 'Jura', startDate: '2026-10-24' });
    expect(planFromHash('#/assistent/plan')).toEqual({});
  });
});

describe('jump (idea 3) and several in one sentence (idea 7)', () => {
  const groups = [
    { kind: 'page', rows: [{ id: 'p1', title: 'Tagebuch', href: '#/tagebuch' }, { id: 'p2', title: 'Tagesplan', href: '#/x' }] },
    { kind: 'trip', rows: [{ id: 't1', title: 'Alpen Woche', tripId: 'T1' }] },
  ];
  it('a page or trip by its name', () => {
    expect(jumpOf('öffne Tagebuch', groups)?.id).toBe('p1');
    expect(jumpOf('Tagebuch', groups)?.id).toBe('p1');
    expect(jumpOf('Packliste Alpen', groups)?.id).toBe('t1');
    expect(jumpOf('öffne Tage', groups)).toBeNull(); // two fit
    expect(jumpOf('Alpen', groups)).toBeNull(); // without «öffne» only the whole name
  });
  it('splits on «und», commas and sentences', () => {
    expect(partsOf('Gewicht 72 und Puls 48, schlecht geschlafen')).toEqual(['Gewicht 72', 'Puls 48', 'schlecht geschlafen']);
    expect(partsOf('Notiz Bremse quietscht')).toEqual(['Notiz Bremse quietscht']);
  });
  it('several run together only when every part writes', () => {
    const c = { today: TODAY, bikes };
    expect(actionsOf('', partsOf('Gewicht 72 und Kette geölt Gravel'), c).map((a) => a.kind)).toEqual(['value', 'cmd']);
    expect(actionsOf('', partsOf('Gewicht 72 und Jacke'), c)).toBeNull();
    expect(actionOf('Kette geölt', c)).toBeNull(); // two bikes: you choose in the list
    expect(actionOf('Plane mir 2 Tage Jura', c)).toMatchObject({ kind: 'plan', writes: false });
  });
});
