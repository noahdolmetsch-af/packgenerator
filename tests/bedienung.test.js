// Bedienung (Noah 13.10.2026 23:52 and 23:56, without mockups): the pure parts of the small helps.
// FE8 night quiet, FE10 speak instead of type, FE7 short vibration, FE11/FE18 start place, FE17 search
// can act, the switches and their defaults, German texts for every new English text.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { quietNow, QUIET_FROM, QUIET_TO } from '../src/lib/quiet.js';
import { speechApi, speechLang, heard, appendSpoken } from '../src/lib/speak.js';
import { OPS, opOf, buzzNow, START_PLACES, DEFAULT_START, startOf, lastOf, startHash, AWAY_MS } from '../src/lib/bedienung.js';
import { commandActions, COMMAND_HREF } from '../src/lib/search.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => {
  lang.v = 'en';
});

// a local time on a calendar day (the device's own clock)
const at = (h, m = 0) => new Date(2026, 9, 13, h, m);

describe('FE8 night quiet', () => {
  it('from 22:00 to 05:59 quiet, from 06:00 to 21:59 not', () => {
    expect([QUIET_FROM, QUIET_TO]).toEqual([22, 6]);
    expect(quietNow(at(22, 0))).toBe(true);
    expect(quietNow(at(23, 59))).toBe(true);
    expect(quietNow(at(0, 0))).toBe(true);
    expect(quietNow(at(5, 59))).toBe(true);
    expect(quietNow(at(6, 0))).toBe(false);
    expect(quietNow(at(12, 0))).toBe(false);
    expect(quietNow(at(21, 59))).toBe(false);
  });
  it('switched off: never quiet', () => {
    expect(quietNow(at(23), false)).toBe(false);
    expect(quietNow(at(3), false)).toBe(false);
  });
});

describe('FE10 speak instead of type', () => {
  it('the API only where the browser has it, the prefixed one too', () => {
    const W = class {};
    expect(speechApi({})).toBe(null);
    expect(speechApi(null)).toBe(null);
    expect(speechApi({ webkitSpeechRecognition: W })).toBe(W);
    expect(speechApi({ SpeechRecognition: W })).toBe(W);
  });
  it('listens in Swiss German for the German app', () => {
    expect(speechLang('de')).toBe('de-CH');
    expect(speechLang('en')).toBe('en-GB');
  });
  it('joins the recognised words and appends them to the text', () => {
    expect(heard([[{ transcript: ' Bremse ' }], [{ transcript: 'quietscht  hinten' }]])).toBe('Bremse quietscht hinten');
    expect(heard([])).toBe('');
    expect(appendSpoken('', 'Sattel knarzt')).toBe('Sattel knarzt');
    expect(appendSpoken('Notiz:', 'Sattel knarzt')).toBe('Notiz: Sattel knarzt');
    // «Diktat» 19.10.2026 (changed on purpose): after a new line a sentence starts with a capital
    expect(appendSpoken('Erste Zeile\n', 'zweite')).toBe('Erste Zeile\nZweite');
    expect(appendSpoken('Text', '  ')).toBe('Text');
  });
});

describe('the switches', () => {
  it('everything on except high contrast; a stored 1 or 0 wins', () => {
    expect(OPS.filter((o) => o.on).map((o) => o.key)).toEqual(['speak', 'keys', 'buzz', 'quiet', 'search']);
    expect(opOf('contrast', null)).toBe(false);
    expect(opOf('contrast', '1')).toBe(true);
    expect(opOf('keys', null)).toBe(true);
    expect(opOf('keys', '0')).toBe(false);
    expect(opOf('nope', null)).toBe(false);
  });
  it('FE7: vibrates only where the device can, never throws', () => {
    const calls = [];
    expect(buzzNow({ vibrate: (ms) => (calls.push(ms), true) })).toBe(true);
    expect(calls).toEqual([15]);
    expect(buzzNow({})).toBe(false);
    expect(buzzNow(null)).toBe(false);
    expect(
      buzzNow({
        vibrate: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe(false);
  });
});

describe('FE18 start place and FE11 last place', () => {
  it('Today by default; an unknown choice is Today', () => {
    expect(DEFAULT_START).toBe('today');
    expect(START_PLACES.map((p) => p.key)).toEqual(['today', 'pack', 'active', 'last']);
    expect(startOf('mars')).toBe('today');
    expect(startHash({ hash: '' })).toBe(null);
    expect(startHash({ start: 'today', hash: '#/' })).toBe(null);
  });
  it('the chosen place at a plain start, never over a link, a shared text or a Strava return', () => {
    expect(startHash({ start: 'pack', hash: '' })).toBe('#/pack');
    expect(startHash({ start: 'active', hash: '#/' })).toBe('#/flow');
    expect(startHash({ start: 'pack', hash: '#/gear' })).toBe(null);
    expect(startHash({ start: 'pack', hash: '', search: '?text=Hallo' })).toBe(null);
    expect(startHash({ start: 'pack', hash: '#&strava=connected&key=x' })).toBe(null);
  });
  it('«Last place» opens the kept page, without its dialog', () => {
    expect(startHash({ start: 'last', last: '#/bikes', hash: '' })).toBe('#/bikes');
    expect(startHash({ start: 'last', last: null, hash: '' })).toBe(null);
    expect(lastOf('#/gear?add=1')).toBe('#/gear');
    expect(lastOf('#/inbox/new')).toBe(null);
    expect(lastOf('#/flow/edit/x')).toBe(null);
    expect(lastOf('#/share/abc')).toBe(null);
    expect(lastOf('#/trip/t1/packed')).toBe(null);
    expect(lastOf('')).toBe(null);
    expect(lastOf('#/me/look')).toBe('#/me/look');
  });
});

describe('FE17 search can act', () => {
  const bikes = [
    { id: 'b1', name: 'Test Velo Alpha', model: 'Gravel' },
    { id: 'b2', name: 'Test Velo Beta', model: 'Road' },
  ];
  const kinds = (q, more = true) => commandActions(q, { bikes, more }).map((c) => c.kind);
  it('backup, settings, a quick note and a new tour, in German and English', () => {
    expect(kinds('backup')).toEqual(['backup']);
    expect(kinds('Backup')).toEqual(['backup']);
    expect(kinds('daten und backup')).toEqual(['backup']);
    expect(kinds('einstellungen')).toEqual(['settings']);
    expect(kinds('settings')).toEqual(['settings']);
    expect(kinds('quick note')).toEqual(['quicknote']);
    expect(kinds('neue tour')).toEqual(['trip']);
    expect(kinds('new tour')).toEqual(['trip']);
    expect(COMMAND_HREF).toEqual({ backup: '#/me/data', settings: '#/me/look' });
  });
  it('a bike by its name opens that bike', () => {
    const c = commandActions('alpha', { bikes });
    expect(c.map((x) => x.cmd)).toEqual([{ kind: 'bike', bikeId: 'b1' }]);
    expect(c[0].title).toBe('Open the Test Velo Alpha');
    expect(kinds('xyz')).toEqual([]);
  });
  it('switched off: only the commands of before', () => {
    expect(kinds('backup', false)).toEqual([]);
    expect(kinds('alpha', false)).toEqual([]);
    expect(kinds('neue tour', false)).toEqual(['trip']);
  });
  it('German titles', () => {
    lang.v = 'de';
    expect(commandActions('backup', { bikes })[0].title).toBe('Daten und Backup');
    expect(commandActions('alpha', { bikes })[0].title).toBe('Test Velo Alpha öffnen');
  });
});

describe('German texts', () => {
  it('every switch, start place and new search title has its German entry', () => {
    const en = [...OPS.flatMap((o) => [o.name, o.text]), ...START_PLACES.map((p) => p.name), 'Handling', 'Small helps, each one can be switched off', 'Open the app at', 'Settings: appearance and handling', 'Open the {bike}', 'Speak', 'Stop|speak', 'Dictation did not work. Type instead.'];
    for (const k of en) expect(DE[k], k).toBeTruthy();
  });
  it('the high-contrast block only adds an override at the end of app.css', () => {
    const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
    expect(css).toMatch(/html:root\[data-contrast='high'\]\[data-theme='light'\] \{[^}]*--ink: #000000;/);
    expect(css.lastIndexOf("data-contrast='high'")).toBeGreaterThan(css.lastIndexOf("data-palette="));
  });
});

// Regeln App-Start 1b (Noah 14.10.2026): a tab that comes back after a pause starts at the start place
describe('1b: a restored tab after a pause', () => {
  const now = 1_000_000_000_000;
  const long = now - AWAY_MS - 1;
  const short = now - 60_000;
  it('goes to the start place, only a reload or a short break stays', () => {
    expect(startHash({ hash: '#/gear', nav: 'navigate', seen: long, now })).toBe('#/');
    expect(startHash({ hash: '#/gear', nav: 'back_forward', seen: long, now })).toBe('#/');
    expect(startHash({ start: 'pack', hash: '#/gear', nav: 'navigate', seen: long, now })).toBe('#/pack');
    expect(startHash({ hash: '#/gear', nav: 'reload', seen: long, now })).toBe(null);
    expect(startHash({ hash: '#/gear', nav: 'navigate', seen: short, now })).toBe(null);
    expect(startHash({ hash: '#/gear', nav: 'navigate', seen: null, now })).toBe(null);
    expect(startHash({ hash: '#/gear', nav: '', seen: long, now })).toBe(null); // the browser cannot tell
  });
  it('a shared list, a shared text or the start place itself stays', () => {
    expect(startHash({ hash: '#/share/abc', nav: 'navigate', seen: long, now })).toBe(null);
    expect(startHash({ hash: '#/inbox', search: '?text=Hallo', nav: 'navigate', seen: long, now })).toBe(null);
    expect(startHash({ start: 'pack', hash: '#/pack', nav: 'navigate', seen: long, now })).toBe(null);
    expect(startHash({ start: 'last', last: '#/bikes', hash: '#/gear', nav: 'navigate', seen: long, now })).toBe('#/bikes');
  });
});
