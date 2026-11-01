// «Frag die App» (Noah 15.10.2026 «1 beides 2a und b 3 a und b»): the free answers from own data.
// Fictional data only.
import './setup/de.js'; // this test needs the German texts
import { describe, it, expect, afterEach } from 'vitest';
import { lang } from '../src/lib/i18n.svelte.js';
import de from '../src/lib/i18n/de/index.js';
import { answerFor, periodOf, rideSums, itemFor, nextTrip, lastTrip, EXAMPLES } from '../src/lib/assistent/answers.js';
import { nextSaturday, cleanPlan, readPlan, planRows } from '../src/lib/assistent/plan.js';

const P = 'test_data_gtp_';
const today = '2026-10-15'; // a Thursday
const book = [
  { id: 'r1', date: '2026-10-13', km: 42.4, hm: 610, state: 'counted' },
  { id: 'r2', date: '2026-10-02', km: 80, hm: 1200, state: 'counted' },
  { id: 'r3', date: '2026-09-28', km: 55, hm: 900, state: 'counted' },
  { id: 'r4', date: '2026-10-14', km: 999, state: 'removed' },
];
const items = [
  { id: 'i1', name: `${P} Tent`, nameDe: `${P} Zelt`, weightG: 980, defaultBag: 'seat' },
  { id: 'i2', name: `${P} Stove`, nameDe: `${P} Kocher`, weightG: null },
  { id: 'i3', name: `${P} Old tent`, nameDe: `${P} Altes Zelt`, ownership: 'gone' },
];
const trips = [
  { id: 't1', title: `${P} Jura`, startDate: '2026-10-18', days: 2, entries: [{ itemId: 'i1', packed: true }, { itemId: 'i2' }] },
  { id: 't2', title: `${P} Albula`, startDate: '2026-10-04', days: 1, finished: true },
  { id: 't3', title: `${P} Später`, startDate: '2026-11-01', days: 1 },
];
const care = [{ bikeName: `${P} Grau`, href: '#/bikes?tab=care&bike=b1', rows: [{ name: 'Chain', detail: 'worn' }] }, { bikeName: `${P} Blau`, rows: [] }];
const learnings = [{ id: 'l1', rule: `${P} Bei Regen Überschuhe mitnehmen` }, { id: 'l2', rule: `${P} alt`, archived: true }];
const data = { today, book, items, trips, care, learnings };

afterEach(() => (lang.v = 'en'));

describe('periods and sums', () => {
  it('reads week, month, last month and year in calendar days', () => {
    expect(periodOf('diese woche', today)).toMatchObject({ from: '2026-10-12', to: today });
    expect(periodOf('letzte woche', today)).toMatchObject({ from: '2026-10-05', to: '2026-10-11' });
    expect(periodOf('monat', today)).toMatchObject({ from: '2026-10-01', to: today });
    expect(periodOf('letzten monat', today)).toMatchObject({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodOf('jahr', today)).toMatchObject({ from: '2026-01-01' });
    expect(periodOf('kette', today)).toBeNull();
  });
  it('sums km and climbing, removed rides do not count', () => {
    expect(rideSums(book, { from: '2026-10-01', to: today })).toEqual({ n: 2, km: 122, hm: 1810 });
  });
});

describe('answerFor', () => {
  it('km this month / this week', () => {
    expect(answerFor('Wie viele km diesen Monat?', data)).toMatchObject({ kind: 'stats', title: 'this month: 122 km in 2 rides.' });
    expect(answerFor('km diese woche', data).title).toContain('42 km in 1 ride');
    expect(answerFor('km gestern', data).title).toBe('No rides yesterday.');
  });
  it('what is due on the bikes', () => {
    const a = answerFor('Was ist an meinen Velos fällig?', data);
    expect(a).toMatchObject({ kind: 'care', lines: [`${P} Grau: Chain, worn`], link: { href: '#/bikes?tab=care&bike=b1' } });
    expect(answerFor('was ist fällig', { ...data, care: [] }).title).toBe('Nothing is due on your bikes.');
  });
  it('what is still to pack for the next trip', () => {
    const a = answerFor('Was fehlt noch beim Packen?', data);
    expect(a).toMatchObject({ kind: 'pack', link: { tripId: 't1' } });
    expect(a.title).toBe(`1 thing still to pack for ${P} Jura.`);
    expect(a.lines[0]).toBe(`${P} Stove`);
  });
  it('the next and the last trip', () => {
    expect(nextTrip(trips, today).id).toBe('t1');
    expect(lastTrip(trips, today).id).toBe('t2');
    expect(answerFor('Wann ist meine nächste Tour?', data).title).toBe(`Your next trip: ${P} Jura.`);
    expect(answerFor('letzte tour', data).lines[0]).toContain('4.10.2026');
  });
  it('weight and bag of one item (gone items are left out)', () => {
    expect(itemFor('wie schwer ist mein zelt', items).id).toBe('i1');
    const a = answerFor('Wie schwer ist mein Zelt?', data);
    expect(a.title).toBe(`${P} Tent weighs 980 g.`);
    expect(a.lines).toEqual(['Bag: Seat pack / Tailfin']);
    expect(answerFor('Wie schwer ist der Kocher?', data).title).toBe(`${P} Stove is not weighed yet.`);
  });
  it('learnings on a topic, without archived ones', () => {
    const a = answerFor('Was habe ich zu Regen gelernt?', data);
    expect(a.lines).toEqual([`${P} Bei Regen Überschuhe mitnehmen`]);
  });
  it('no rule: null (the search shows the rest)', () => {
    expect(answerFor('Welche Farbe hat der Himmel?', data)).toBeNull();
    expect(answerFor('ab', data)).toBeNull();
  });
  it('German with German on, and every example has a German text', () => {
    lang.v = 'de';
    expect(answerFor('km monat', data).title).toBe('diesen Monat: 122 km in 2 Fahrten.');
    for (const e of EXAMPLES) expect(de[e], e).toBeTruthy();
  });
});

describe('«Hilf mir planen» (plan.js)', () => {
  const bikes = [{ id: 'b1', name: `${P} Grau` }, { id: 'b2', name: `${P} Blau` }];
  it('next Saturday as the default start, checked answers', () => {
    expect(nextSaturday(today)).toBe('2026-10-17');
    expect(nextSaturday('2026-10-17')).toBe('2026-10-17');
    expect(cleanPlan({ days: 0 }, { today, bikes })).toEqual({ startDate: '2026-10-17', days: 1, area: 'bikepacking', night: 'none', bikeId: 'b1' });
    expect(cleanPlan({ startDate: '2026-10-24', days: 3, night: 'tent', bikeId: 'b2' }, { today, bikes })).toMatchObject({ days: 3, night: 'tent', bikeId: 'b2' });
    expect(cleanPlan({ area: 'ski', bikeId: 'b2' }, { today, bikes }).bikeId).toBeNull();
  });
  it('reads only a good prefill', () => {
    expect(readPlan('{"startDate":"2026-10-24","days":2}')).toMatchObject({ days: 2 });
    expect(readPlan('nope')).toBeNull();
    expect(readPlan(null)).toBeNull();
  });
  it('the plan: when, list, bike with what is due, learnings, weather', () => {
    const plan = cleanPlan({ startDate: '2026-10-24', days: 2, night: 'hotel', bikeId: 'b1' }, { today, bikes });
    const rows = planRows(plan, { items: [{ id: 'i1', domains: ['bikepacking'], ownership: 'owned' }], bikes, care: { rows: [{ name: 'Chain', detail: 'worn' }] }, learnings });
    expect(rows.map((r) => r.key)).toEqual(['when', 'list', 'bike', 'learn', 'weather']);
    expect(rows[0].lines[0]).toBe('24.10.2026–25.10.2026 · 2 days · Cycling · Hotel/hut');
    expect(rows[2]).toMatchObject({ tone: 'due', lines: ['Chain, worn'] });
    expect(rows[3].lines).toEqual([`${P} Bei Regen Überschuhe mitnehmen`]);
  });
});
