// «Kursblick» Verteilung (PR 5): groups with goals, titles sorted into them, values by hand, the value of each group.
import { describe, it, expect } from 'vitest';
import {
  standardVerteilung, lies, gruppenName, neueGruppe, benenneGruppe, loescheGruppe, schiebeGruppe, setzeZiel, setzeSpielraum, gruppeVon, ordneZu,
  neuerHandwert, aendereHandwert, loescheHandwert, wertAus, gruppenWerte, SPIELRAUM_STANDARD,
} from '../src/lib/kurse/verteilung.js';
import { verteilung } from '../src/lib/kurse/signale.js';

const tr = (v) => `T:${v}`;

describe('the state', () => {
  it('nothing saved: the six standard groups with no goal, a band of 5 points', () => {
    const s = lies(null);
    expect(s.gruppen.map((g) => g.id)).toEqual(['gold', 'aktien', 'obligationen', 'krypto', 'immobilien', 'cash']);
    expect(s.gruppen.every((g) => g.ziel === 0)).toBe(true);
    expect(s.spielraum).toBe(SPIELRAUM_STANDARD);
    expect(s).toEqual(standardVerteilung());
  });
  it('broken parts are left out, goals stay between 0 and 100', () => {
    const s = lies({
      gruppen: [{ id: 'gold', ziel: 150 }, { id: 'gold', ziel: 10 }, { id: 'x' }, { id: 'eigen', name: ' Wald ', ziel: -4 }],
      spielraum: 500,
      zuordnung: { 'NESN.SW': 'eigen', 'ABC': 'gone', '!!': 'gold' },
      hand: [{ id: 'h1', name: 'Konto', gruppe: 'cash', wert: 100 }, { id: 'h2', name: '', wert: 1 }, { id: 'h3', name: 'Neg', wert: -1 }],
    });
    expect(s.gruppen).toEqual([{ id: 'gold', ziel: 100, std: 'Gold' }, { id: 'eigen', ziel: 0, name: 'Wald' }]);
    expect(s.spielraum).toBe(50);
    expect(s.zuordnung).toEqual({ 'NESN.SW': 'eigen' });
    expect(s.hand).toEqual([{ id: 'h1', name: 'Konto', gruppe: '', wert: 100 }]); // «cash» is not one of these groups any more
  });
});

describe('groups', () => {
  it('add: a name is needed, the same name twice is refused (also a translated standard name)', () => {
    const s = standardVerteilung();
    expect(neueGruppe(s, '  ', tr).error).toBe('name');
    expect(neueGruppe(s, 't:gold', tr).error).toBe('dup');
    const r = neueGruppe(s, 'Wald', tr, 'g1');
    expect(r.gruppe).toEqual({ id: 'g1', name: 'Wald', ziel: 0 });
    expect(r.state.gruppen.at(-1).id).toBe('g1');
  });
  it('rename: empty brings a standard group back to its own name, an own group needs one', () => {
    let s = neueGruppe(standardVerteilung(), 'Wald', tr, 'g1').state;
    s = benenneGruppe(s, 'aktien', 'Weltweit', tr).state;
    expect(gruppenName(s.gruppen.find((g) => g.id === 'aktien'), tr)).toBe('Weltweit');
    s = benenneGruppe(s, 'aktien', '', tr).state;
    expect(gruppenName(s.gruppen.find((g) => g.id === 'aktien'), tr)).toBe('T:Stocks and funds');
    expect(benenneGruppe(s, 'g1', '', tr).error).toBe('name');
    expect(benenneGruppe(s, 'g1', 't:gold', tr).error).toBe('dup');
  });
  it('delete: titles and values by hand go to another group, or to «No group»; nothing is deleted with it', () => {
    let s = standardVerteilung();
    s = ordneZu(s, 'NESN.SW', 'aktien');
    s = ordneZu(s, 'ROG.SW', 'aktien');
    s = neuerHandwert(s, { name: 'Fonds', gruppe: 'aktien', wert: 500 }, 'h1').state;
    const nach = loescheGruppe(s, 'aktien', 'cash');
    expect(nach.gruppen.some((g) => g.id === 'aktien')).toBe(false);
    expect(nach.zuordnung).toEqual({ 'NESN.SW': 'cash', 'ROG.SW': 'cash' });
    expect(nach.hand[0].gruppe).toBe('cash');
    const ohne = loescheGruppe(s, 'aktien');
    expect(ohne.zuordnung).toEqual({});
    expect(ohne.hand).toEqual([{ id: 'h1', name: 'Fonds', gruppe: '', wert: 500 }]);
    expect(loescheGruppe(s, 'aktien', 'aktien').hand[0].gruppe).toBe(''); // into itself makes no sense
  });
  it('order, goal and band', () => {
    let s = standardVerteilung();
    expect(schiebeGruppe(s, 'gold', -1)).toBe(s);
    expect(schiebeGruppe(s, 'gold', 1).gruppen[1].id).toBe('gold');
    s = setzeZiel(s, 'gold', 120);
    expect(s.gruppen[0].ziel).toBe(100);
    s = setzeZiel(s, 'gold', 'x');
    expect(s.gruppen[0].ziel).toBe(0);
    expect(setzeSpielraum(s, 8).spielraum).toBe(8);
    expect(setzeSpielraum(s, -3).spielraum).toBe(SPIELRAUM_STANDARD);
    expect(setzeSpielraum(s, 99).spielraum).toBe(50);
  });
});

describe('titles', () => {
  it('gold is in «Gold» unless sorted elsewhere; others are not sorted until the person does', () => {
    let s = standardVerteilung();
    expect(gruppeVon(s, 'gold')).toBe('gold');
    expect(gruppeVon(s, 'NESN.SW')).toBe('');
    s = ordneZu(s, 'NESN.SW', 'aktien');
    expect(gruppeVon(s, 'NESN.SW')).toBe('aktien');
    s = ordneZu(s, 'NESN.SW', '');
    expect(gruppeVon(s, 'NESN.SW')).toBe('');
    s = loescheGruppe(s, 'gold');
    expect(gruppeVon(s, 'gold')).toBe('');
  });
});

describe('values by hand', () => {
  it('a value is read from what is typed', () => {
    expect(wertAus('12 500')).toBe(12500);
    expect(wertAus("12'500.50")).toBe(12500.5);
    expect(wertAus('12500,5')).toBe(12500.5);
    expect(wertAus('-3')).toBeNull();
    expect(wertAus('abc')).toBeNull();
    expect(wertAus('')).toBeNull();
  });
  it('add, change and delete; a name and a value are needed', () => {
    const s = standardVerteilung();
    expect(neuerHandwert(s, { name: '', wert: 5 }).error).toBe('name');
    expect(neuerHandwert(s, { name: 'Konto', wert: 'x' }).error).toBe('wert');
    const r = neuerHandwert(s, { name: 'Konto', gruppe: 'cash', wert: '1 200' }, 'h1');
    expect(r.hand).toEqual({ id: 'h1', name: 'Konto', gruppe: 'cash', wert: 1200 });
    const c = aendereHandwert(r.state, 'h1', { name: 'Sparkonto', gruppe: 'nope', wert: 900 });
    expect(c.state.hand).toEqual([{ id: 'h1', name: 'Sparkonto', gruppe: '', wert: 900 }]);
    expect(aendereHandwert(r.state, 'zz', { name: 'a', wert: 1 }).error).toBe('gone');
    expect(loescheHandwert(r.state, 'h1').hand).toEqual([]);
  });
});

describe('the value of each group', () => {
  it('positions by group plus values by hand; a title without a price is named, not guessed', () => {
    let s = ordneZu(standardVerteilung(), 'NESN.SW', 'aktien');
    s = neuerHandwert(s, { name: 'Konto', gruppe: 'cash', wert: 1000 }, 'h1').state;
    const r = gruppenWerte(s, [{ titel: 'gold', wert: 3000 }, { titel: 'NESN.SW', wert: 5000 }, { titel: 'ROG.SW', wert: 700 }, { titel: 'ABC', wert: null }]);
    expect(r.werte).toEqual({ gold: 3000, aktien: 5000, '': 700, cash: 1000 });
    expect(r.fehlt).toEqual(['ABC']);
  });
  it('works with the split of signale.js: gold 3000 of 9700 against a goal of 20 % is above the band', () => {
    let s = setzeZiel(standardVerteilung(), 'gold', 20);
    s = setzeSpielraum(s, 5);
    const { werte } = gruppenWerte(s, [{ titel: 'gold', wert: 3000 }, { titel: 'NESN.SW', wert: 6700 }]);
    const v = verteilung([...s.gruppen, { id: '', ziel: 0 }], werte, s.spielraum); // «not sorted yet» counts for the total, with no goal
    const g = v.gruppen.find((x) => x.id === 'gold');
    expect(Math.round(g.jetzt)).toBe(31);
    expect(g.ok).toBe(false);
    expect(Math.round(g.diff)).toBe(1060);
  });
});
