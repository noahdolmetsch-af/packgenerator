// «Kursblick» Mein Bestand (K12, K14): positions, profit and loss, dividends, splits. Invented numbers only, no private data.
import { describe, it, expect } from 'vitest';
import {
  lies, neuerPosten, aenderePosten, loeschePosten, schiebePosten, neuesEreignis, loescheEreignis, mengeJetzt, dividenden, bewerte, summe,
  zahlEin, waehrungVon, kursId, postenName, BESTAND_KEY,
} from '../src/lib/kurse/bestand.js';

const leer = () => lies(null);
const mit = (...ds) => ds.reduce((st, d, i) => neuerPosten(st, d, `p${i}`).state, leer());
const T = { art: 'titel', symbol: 'abc.sw', menge: '10', einstand: '1000' };

describe('what was typed', () => {
  it('reads Swiss and German ways of writing a number', () => {
    expect(zahlEin("1'250.50")).toBe(1250.5);
    expect(zahlEin('1250,5')).toBe(1250.5);
    expect(zahlEin(' 3 ')).toBe(3);
    expect(zahlEin('')).toBeNull();
    expect(zahlEin('abc')).toBeNull();
    expect(zahlEin('1e5')).toBeNull();
  });
  it('keeps the setting key', () => expect(BESTAND_KEY).toBe('kurse.bestand'));
});

describe('reading and saving', () => {
  it('nothing saved is an empty holding; broken entries are left out', () => {
    expect(lies(null)).toEqual({ posten: [] });
    expect(lies({ posten: 'x' })).toEqual({ posten: [] });
    const s = lies({ posten: [{ id: 'a', art: 'titel', symbol: 'ok.sw', menge: 2 }, { id: 'a', art: 'gold', menge: 5 }, { id: 'b', art: 'titel', symbol: 'no good', menge: 1 }, { id: 'c', art: 'zzz' }, { art: 'gold', menge: 1 }] });
    expect(s.posten.map((p) => p.id)).toEqual(['a']);
    expect(s.posten[0].symbol).toBe('OK.SW');
  });
  it('a saved state reads back the same', () => {
    let st = mit(T, { art: 'gold', menge: '100', gekauft: '2024-03-01' }, { art: 'hand', name: 'Mein Sparkonto', wert: '5000', stand: '2026-11-01' });
    st = neuesEreignis(st, 'p0', { typ: 'dividende', tag: '2025-05-01', betrag: '12,50' }, 'e1').state;
    expect(lies(JSON.parse(JSON.stringify(st)))).toEqual(st);
  });
});

describe('add, change, delete, move', () => {
  it('adds a title with a cleaned symbol and refuses wrong fields', () => {
    const r = neuerPosten(leer(), T, 'p1');
    expect(r.posten).toMatchObject({ id: 'p1', art: 'titel', symbol: 'ABC.SW', menge: 10, einstand: 1000, ereignisse: [] });
    expect(neuerPosten(leer(), { ...T, symbol: 'no good' }).error).toBe('symbol');
    expect(neuerPosten(leer(), { ...T, menge: '0' }).error).toBe('menge');
    expect(neuerPosten(leer(), { ...T, einstand: 'x' }).error).toBe('einstand');
    expect(neuerPosten(leer(), { ...T, gekauft: '1.2.2024' }).error).toBe('tag');
    expect(neuerPosten(leer(), { art: 'hand', wert: '5' }).error).toBe('name');
    expect(neuerPosten(leer(), { art: 'hand', name: 'x', wert: '' }).error).toBe('wert');
    expect(neuerPosten(leer(), { art: 'gold', menge: '50' }).posten.symbol).toBe('');
  });
  it('the price paid can stay empty', () => {
    expect(neuerPosten(leer(), { ...T, einstand: '' }).posten.einstand).toBeNull();
  });
  it('changes a position and keeps its kind and its events', () => {
    let st = mit(T);
    st = neuesEreignis(st, 'p0', { typ: 'dividende', tag: '2025-05-01', betrag: 10 }, 'e1').state;
    const r = aenderePosten(st, 'p0', { menge: '12', art: 'gold', name: 'Meine Aktie' });
    expect(r.state.posten[0]).toMatchObject({ art: 'titel', menge: 12, name: 'Meine Aktie' });
    expect(r.state.posten[0].ereignisse).toHaveLength(1);
    expect(aenderePosten(st, 'nope', {}).error).toBe('gone');
    expect(aenderePosten(st, 'p0', { menge: '-1' }).error).toBe('menge');
  });
  it('deletes and moves; a move at the end changes nothing', () => {
    const st = mit(T, { art: 'gold', menge: 5 }, { art: 'gold', menge: 6 });
    expect(loeschePosten(st, 'p1').posten.map((p) => p.id)).toEqual(['p0', 'p2']);
    expect(schiebePosten(st, 'p2', -1).posten.map((p) => p.id)).toEqual(['p0', 'p2', 'p1']);
    expect(schiebePosten(st, 'p0', -1)).toBe(st);
    expect(schiebePosten(st, 'p2', 1)).toBe(st);
  });
});

describe('dividends and splits', () => {
  const st0 = mit({ ...T, gekauft: '2024-01-15' });
  it('a split multiplies the pieces from its day on; one before the purchase does not count', () => {
    let st = neuesEreignis(st0, 'p0', { typ: 'split', tag: '2025-06-01', faktor: '2' }, 'e1').state;
    expect(mengeJetzt(st.posten[0])).toBe(20);
    st = neuesEreignis(st, 'p0', { typ: 'split', tag: '2023-06-01', faktor: '5' }, 'e2').state;
    expect(mengeJetzt(st.posten[0])).toBe(20);
    st = neuesEreignis(st, 'p0', { typ: 'split', tag: '2026-02-01', faktor: '0.1' }, 'e3').state;
    expect(mengeJetzt(st.posten[0])).toBeCloseTo(2, 9); // a reverse split 10:1
    expect(st.posten[0].ereignisse.map((e) => e.id)).toEqual(['e2', 'e1', 'e3']); // by day
  });
  it('without a purchase day every split counts', () => {
    const st = neuesEreignis(mit(T), 'p0', { typ: 'split', tag: '2020-01-01', faktor: 3 }, 'e1').state;
    expect(mengeJetzt(st.posten[0])).toBe(30);
  });
  it('adds up the dividends and refuses nonsense', () => {
    let st = neuesEreignis(st0, 'p0', { typ: 'dividende', tag: '2025-05-01', betrag: '30' }, 'e1').state;
    st = neuesEreignis(st, 'p0', { typ: 'dividende', tag: '2026-05-01', betrag: '32.5' }, 'e2').state;
    expect(dividenden(st.posten[0])).toBe(62.5);
    expect(neuesEreignis(st, 'p0', { typ: 'dividende', tag: '2026-05-01', betrag: '0' }).error).toBe('betrag');
    expect(neuesEreignis(st, 'p0', { typ: 'split', tag: '2026-05-01', faktor: '1' }).error).toBe('faktor');
    expect(neuesEreignis(st, 'p0', { typ: 'split', tag: 'gestern', faktor: '2' }).error).toBe('tag');
    expect(neuesEreignis(st, 'p0', { typ: 'zins', tag: '2026-05-01' }).error).toBe('typ');
    expect(neuesEreignis(st, 'nope', { typ: 'split', tag: '2026-05-01', faktor: '2' }).error).toBe('gone');
  });
  it('deletes an event', () => {
    let st = neuesEreignis(st0, 'p0', { typ: 'dividende', tag: '2025-05-01', betrag: '30' }, 'e1').state;
    st = loescheEreignis(st, 'p0', 'e1');
    expect(st.posten[0].ereignisse).toEqual([]);
  });
});

describe('currencies', () => {
  it('names the rate to ask for', () => {
    expect(waehrungVon('USD')).toEqual({ code: 'USD', mult: 1 });
    expect(waehrungVon('GBp')).toEqual({ code: 'GBP', mult: 0.01 });
    expect(waehrungVon('', 'ABC.SW')).toEqual({ code: 'CHF', mult: 1 });
    expect(waehrungVon('', 'XYZ')).toBeNull();
    expect(waehrungVon('Francs')).toBeNull();
    expect(kursId('CHF')).toBeNull();
    expect(kursId('USD')).toBe('usdchf');
    expect(kursId('EUR')).toBe('y:EURCHF=X');
  });
});

describe('value, profit and loss', () => {
  const p = (d, ereignisse = []) => ({ ...lies({ posten: [{ id: 'x', ...d, ereignisse }] }).posten[0] });
  it('a title: pieces × price × rate', () => {
    const b = bewerte(p({ art: 'titel', symbol: 'ABC.SW', menge: 10, einstand: 1000 }), { preis: 120, kurs: 1 });
    expect(b).toMatchObject({ wert: 1200, gewinn: 200, pct: 20, grund: '' });
    const usd = bewerte(p({ art: 'titel', symbol: 'ABC', menge: 2, einstand: 150 }), { preis: 100, kurs: 0.8 });
    expect(usd.wert).toBeCloseTo(160, 9);
    expect(usd.gewinn).toBeCloseTo(10, 9);
  });
  it('a split changes the value; dividends only show «with dividends»', () => {
    const b = bewerte(p({ art: 'titel', symbol: 'ABC.SW', menge: 10, einstand: 1000, gekauft: '2024-01-01' }, [{ id: 's', typ: 'split', tag: '2025-01-01', faktor: 2 }, { id: 'd', typ: 'dividende', tag: '2025-06-01', betrag: 50 }]), { preis: 60, kurs: 1 });
    expect(b.wert).toBe(1200);
    expect(b.gewinn).toBe(200);
    expect(b.mitDiv).toEqual({ gewinn: 250, pct: 25 });
  });
  it('gold: grams of the kilogram price', () => {
    const b = bewerte(p({ art: 'gold', menge: 250, einstand: 20000 }), { goldKg: 100000 });
    expect(b).toMatchObject({ wert: 25000, gewinn: 5000, pct: 25 });
  });
  it('a value by hand, with or without a price paid', () => {
    expect(bewerte(p({ art: 'hand', name: 'Mein Sparkonto', wert: 8000, einstand: 7500 }))).toMatchObject({ wert: 8000, gewinn: 500 });
    expect(bewerte(p({ art: 'hand', name: 'Mein Sparkonto', wert: 8000 }))).toMatchObject({ wert: 8000, gewinn: null, pct: null });
  });
  it('says why a value is not known and never makes one up', () => {
    const t = p({ art: 'titel', symbol: 'ABC', menge: 1 });
    expect(bewerte(t, {})).toMatchObject({ wert: null, grund: 'preis' });
    expect(bewerte(t, { preis: 5 })).toMatchObject({ wert: null, grund: 'kurs' });
    expect(bewerte(p({ art: 'gold', menge: 5 }), {})).toMatchObject({ wert: null, grund: 'preis' });
    expect(bewerte(p({ art: 'titel', symbol: 'ABC' }), { preis: 1, kurs: 1 })).toMatchObject({ wert: null, grund: 'menge' });
  });
  it('a loss is negative', () => {
    expect(bewerte(p({ art: 'titel', symbol: 'ABC.SW', menge: 10, einstand: 1000 }), { preis: 80, kurs: 1 })).toMatchObject({ gewinn: -200, pct: -20 });
  });
});

describe('the whole holding', () => {
  it('adds the values; profit counts only positions with a price paid', () => {
    const s = summe([
      { wert: 1200, einstand: 1000, gewinn: 200, dividenden: 50 },
      { wert: 8000, einstand: null, gewinn: null, dividenden: 0 },
      { wert: null, einstand: 500, gewinn: null, dividenden: 0 },
      { wert: 900, einstand: 1000, gewinn: -100, dividenden: 0 },
    ]);
    expect(s).toMatchObject({ wert: 10100, einstand: 2000, gewinn: 100, offen: 1, ohneEinstand: 1 });
    expect(s.pct).toBeCloseTo(5, 9);
    expect(s.mitDiv.gewinn).toBe(150);
  });
  it('an empty holding is zero without a percentage', () => {
    expect(summe([])).toMatchObject({ wert: 0, gewinn: 0, pct: null, offen: 0 });
  });
});

describe('names', () => {
  it('own name, then the kind, then the server name, then the symbol', () => {
    const tr = (v) => `«${v}»`;
    expect(postenName({ name: 'Mein Titel', art: 'titel' }, '', tr)).toBe('Mein Titel');
    expect(postenName({ name: '', art: 'gold' }, '', tr)).toBe('«Gold»');
    expect(postenName({ name: '', art: 'titel', symbol: 'ABC' }, 'ABC Corp', tr)).toBe('ABC Corp');
    expect(postenName({ name: '', art: 'titel', symbol: 'ABC' }, '', tr)).toBe('ABC');
  });
});
