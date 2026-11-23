// S6 Schritt 2: «Frag die App» beantwortet Nächte draussen und den letzten Werkstattbesuch. Fictional data only.
import './setup/de.js';
import { describe, it, expect, afterEach } from 'vitest';
import { lang } from '../src/lib/i18n.svelte.js';
import { answerFor } from '../src/lib/assistent/answers.js';
import { outdoorNights, asksNights, asksShop } from '../src/lib/assistent/luecken.js';

const P = 'test_data_gtp_';
const today = '2026-10-15';
const trips = [
  { id: 't1', title: `${P} Jura`, startDate: '2026-09-04', days: 3, overnight: 'outdoor' }, // nights 4. and 5.9.
  { id: 't2', title: `${P} Hotel`, startDate: '2026-08-01', days: 4, overnight: 'lodging' },
  { id: 't3', title: `${P} Albula`, startDate: '2026-10-14', days: 3, overnight: 'outdoor' }, // night 14.10. slept, 15.10. not yet
  { id: 't4', title: `${P} Weg`, startDate: '2026-07-01', days: 5, overnight: 'outdoor', skipped: true },
  { id: 't5', title: `${P} Eintag`, startDate: '2026-06-01', days: 1, overnight: 'outdoor' },
];
const visits = [
  { id: 'v1', bikeId: 'b1', date: '2026-08-10', shop: `${P} Werkstatt Nord`, totalChf: 120.4, parts: [{ part: 'chain', action: 'replace' }, { part: 'brake', action: 'service' }] },
  { id: 'v2', bikeId: 'b2', date: '2026-09-20', shop: `${P} Velo Sued`, totalChf: 60, parts: [{ part: 'tyres', action: 'replace' }] },
  { id: 'v3', bikeId: 'b1', date: '2026-03-02', shop: `${P} Werkstatt Nord`, totalChf: null, parts: [] },
];
const bikeList = [{ id: 'b1', name: `${P} Grau` }, { id: 'b2', name: `${P} Blau` }];
const data = { today, trips, visits, bikeList };

afterEach(() => (lang.v = 'en'));

describe('nights outdoors', () => {
  it('counts only slept nights of trips marked outdoors, not skipped, not hotel', () => {
    expect(outdoorNights(trips, { from: '2026-01-01', to: today }, today)).toEqual({ n: 3, trips: 2, marked: 3 });
    expect(outdoorNights(trips, { from: '2026-10-01', to: today }, today).n).toBe(1);
  });
  it('tells «none marked» from «zero»', () => {
    expect(outdoorNights([{ id: 'x', startDate: '2026-09-01', days: 3 }], { from: '2026-01-01', to: today }, today)).toMatchObject({ n: 0, marked: 0 });
    lang.v = 'de';
    expect(answerFor('Wie viele Nächte habe ich draussen geschlafen?', { today, trips: [] }).title).toMatch(/Noch keine Tour mit einer Nacht/);
  });
  it('answers in German with the period', () => {
    lang.v = 'de';
    const a = answerFor('Wie viele Nächte habe ich dieses Jahr draussen geschlafen?', data);
    expect(a.kind).toBe('nights');
    expect(a.title).toBe('dieses Jahr: 3 Nächte draussen auf 2 Touren.');
    expect(answerFor('Nächte draussen im Monat', data).title).toBe('diesen Monat: 1 Nacht draussen auf 1 Tour.');
    expect(answerFor('Nächte im Zelt letzte Woche', data).title).toMatch(/^Keine Nacht draussen/);
  });
  it('does not take sleep or tent questions for it', () => {
    expect(asksNights('wie schwer ist mein zelt')).toBe(false);
    expect(asksNights('wie habe ich geschlafen')).toBe(false);
    expect(asksNights('dauer nachtragen')).toBe(false);
    expect(asksNights('wie viele naechte draussen')).toBe(true);
    expect(asksNights('how many nights outdoors')).toBe(true);
  });
});

describe('last workshop visit', () => {
  it('names the newest visit, its shop, bike, jobs and the other bikes', () => {
    lang.v = 'de';
    const a = answerFor('Wann war ich zuletzt in der Werkstatt?', data);
    expect(a.kind).toBe('shop');
    expect(a.title).toBe('Letzter Werkstattbesuch: 20.9.2026 (vor 25 Tagen).');
    expect(a.lines[0]).toContain('Velo Sued');
    expect(a.lines).toContain('1 Arbeit');
    expect(a.lines).toContain('60 CHF');
    expect(a.lines.some((l) => l.includes('Grau') && l.includes('10.8.2026'))).toBe(true);
    expect(a.link.href).toBe('#/bikes?tab=shop');
  });
  it('reads in English too', () => {
    expect(answerFor('last workshop visit', data).title).toBe('Last workshop visit: 20.9.2026 (25 days ago).');
  });
  it('says so when there is no visit', () => {
    expect(answerFor('last workshop visit', { today, visits: [], bikeList }).title).toBe('No workshop visit recorded yet.');
  });
  it('is not taken for packing or bike care', () => {
    expect(asksShop('wann ist der service faellig')).toBe(false);
    expect(answerFor('was muss ich fuer die werkstatt packen', { today, trips: [], items: [] }).kind).toBe('pack');
  });
});
