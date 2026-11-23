// «Kursblick» Märkte (K6): the titles the person follows, in groups of their own. Pure helpers of src/lib/kurse/maerkte.js.
import { describe, it, expect } from 'vitest';
import {
  STANDARD, standard, lies, ansicht, neuerTitel, aendereTitel, loescheTitel, schiebeTitel, neueGruppe, benenneGruppe, loescheGruppe, schiebeGruppe,
  ergaenzeVorschlaege, fehlendeVorschlaege, symbolNorm, symbolOk, reihenId, gruppenName, titelName, ARTEN,
} from '../src/lib/kurse/maerkte.js';

const tr = (s) => `[${s}]`;
const state = () => standard();

describe('the suggestions', () => {
  it('are five groups: shares, funds, crypto, metals and money', () => {
    expect(STANDARD.gruppen.map((g) => g.id)).toEqual(['aktien', 'fonds', 'krypto', 'metalle', 'geld']);
    expect(STANDARD.titel.filter((x) => x.gruppe === 'aktien').map((x) => x.symbol)).toEqual(['SREN.SW', 'NESN.SW', 'NOVN.SW', 'ROG.SW', 'SCHN.SW', 'ABBN.SW', 'HOLN.SW']);
  });
  it('every title: a symbol Yahoo can read, a known group and kind, a name or a text to translate, nothing twice', () => {
    expect(new Set(STANDARD.titel.map((x) => x.symbol)).size).toBe(STANDARD.titel.length);
    expect(new Set(STANDARD.titel.map((x) => x.id)).size).toBe(STANDARD.titel.length);
    for (const x of STANDARD.titel) {
      expect(symbolOk(x.symbol), x.symbol).toBe(true);
      expect(STANDARD.gruppen.some((g) => g.id === x.gruppe), x.id).toBe(true);
      expect(ARTEN.some((a) => a.key === x.art), x.id).toBe(true);
      expect(!!(x.name || x.std), x.id).toBe(true);
    }
  });
  it('are a copy: changing the state never changes them', () => {
    const s = state();
    s.titel[0].name = 'X';
    expect(STANDARD.titel[0].name).toBe('Swiss Re');
  });
});

describe('reading what was saved', () => {
  it('nothing, or something broken, gives the suggestions', () => {
    for (const v of [null, undefined, 5, 'x', {}, { gruppen: 1, titel: [] }]) expect(lies(v)).toEqual(standard());
  });
  it('keeps good entries and leaves out broken ones; a title without its group is «without group»', () => {
    const s = lies({
      gruppen: [{ id: 'a', name: ' Mine ' }, { id: 'a', name: 'twice' }, { id: 'b' }, { id: 'c', std: 'Shares|kurs' }],
      titel: [
        { id: 't1', name: 'A', symbol: 'a.sw', art: 'bond', gruppe: 'a' },
        { id: 't2', symbol: 'bad symbol', gruppe: 'a' },
        { id: 't1', symbol: 'DUP', gruppe: 'a' },
        { id: 't3', symbol: 'X', gruppe: 'gone' },
      ],
    });
    expect(s.gruppen).toEqual([{ id: 'a', name: 'Mine' }, { id: 'c', std: 'Shares|kurs' }]);
    expect(s.titel).toEqual([
      { id: 't1', name: 'A', symbol: 'A.SW', art: 'other', gruppe: 'a' },
      { id: 't3', name: '', symbol: 'X', art: 'other', gruppe: '' },
    ]);
  });
});

describe('symbols', () => {
  it('are written the way Yahoo writes them', () => {
    expect(symbolNorm('  nesn.sw ')).toBe('NESN.SW');
    expect(reihenId('btc-usd')).toBe('y:BTC-USD');
    expect(symbolOk('^SSMI')).toBe(true);
    expect(symbolOk('GC=F')).toBe(true);
    for (const bad of ['', 'a b', 'a/b', 'x'.repeat(25), '<b>']) expect(symbolOk(bad), bad).toBe(false);
  });
});

describe('adding, changing, moving and deleting a title', () => {
  it('adds right after the last title of its group, with its kind and group', () => {
    const s = { ...state(), gruppen: [...state().gruppen, { id: 'g2', name: 'Coins' }] };
    const a = neuerTitel(s, { name: ' Coin ', symbol: 'xrp-usd', art: 'crypto', gruppe: 'g2' }, 'n1');
    expect(a.state.titel.at(-1)).toEqual({ id: 'n1', name: 'Coin', symbol: 'XRP-USD', art: 'crypto', gruppe: 'g2' });
    const b = neuerTitel(a.state, { symbol: 'ada-usd', art: 'crypto', gruppe: 'aktien' }, 'n2');
    expect(b.state.titel.map((x) => x.id).slice(6, 9)).toEqual(['std-holn', 'n2', 'std-cssmi']);
  });
  it('refuses a bad or an already followed symbol, and falls back for a strange kind or group', () => {
    expect(neuerTitel(state(), { symbol: 'a b' }).error).toBe('symbol');
    expect(neuerTitel(state(), { symbol: 'nesn.sw' }).error).toBe('dup');
    const x = neuerTitel(state(), { symbol: 'zzz', art: 'bond', gruppe: 'nope' }, 'n').titel;
    expect([x.art, x.gruppe]).toEqual(['other', '']);
  });
  it('changes name, symbol, kind and group; never to a symbol that is taken', () => {
    const s = state();
    const r = aendereTitel(s, 'std-nesn', { name: 'Nestlé SA', art: 'fund', gruppe: '' }).state.titel.find((x) => x.id === 'std-nesn');
    expect(r).toMatchObject({ name: 'Nestlé SA', art: 'fund', gruppe: '', symbol: 'NESN.SW' });
    expect(aendereTitel(s, 'std-nesn', { symbol: 'roG.sw' }).error).toBe('dup');
    expect(aendereTitel(s, 'std-nesn', { symbol: '??' }).error).toBe('symbol');
    expect(aendereTitel(s, 'std-nesn', { symbol: 'nesn.sw' }).state.titel[1].symbol).toBe('NESN.SW');
    expect(aendereTitel(s, 'nope', { name: 'x' }).error).toBe('gone');
  });
  it('moves one place within its group and stops at the ends', () => {
    const s = state();
    expect(schiebeTitel(s, 'std-nesn', -1).titel.slice(0, 2).map((x) => x.id)).toEqual(['std-nesn', 'std-sren']);
    expect(schiebeTitel(s, 'std-sren', -1)).toBe(s);
    expect(schiebeTitel(s, 'std-holn', 1)).toBe(s);
    const two = { ...s, gruppen: [...s.gruppen, { id: 'g2', name: 'B' }], titel: [...s.titel, { id: 'b1', name: '', symbol: 'B1', art: 'other', gruppe: 'g2' }, { id: 'b2', name: '', symbol: 'B2', art: 'other', gruppe: 'g2' }] };
    expect(schiebeTitel(two, 'b2', -1).titel.slice(-2).map((x) => x.id)).toEqual(['b2', 'b1']);
  });
  it('deletes only that title', () => {
    expect(loescheTitel(state(), 'std-abbn').titel.map((x) => x.id)).not.toContain('std-abbn');
    expect(loescheTitel(state(), 'std-abbn').titel).toHaveLength(STANDARD.titel.length - 1);
  });
});

describe('groups', () => {
  it('names: own name, or the translated standard name', () => {
    expect(gruppenName({ id: 'a', name: 'Mine', std: 'Shares|kurs' }, tr)).toBe('Mine');
    expect(gruppenName({ id: 'a', std: 'Shares|kurs' }, tr)).toBe('[Shares|kurs]');
    expect(titelName({ name: 'N', symbol: 'S' }, 'Answer')).toBe('N');
    expect(titelName({ name: '', symbol: 'S' }, 'Answer')).toBe('Answer');
    expect(titelName({ name: '', symbol: 'S' })).toBe('S');
    expect(titelName({ std: 'Silver|kurs', symbol: 'SI=F' }, 'Answer', tr)).toBe('[Silver|kurs]');
    expect(titelName({ name: 'Mein Silber', std: 'Silver|kurs', symbol: 'SI=F' }, '', tr)).toBe('Mein Silber');
  });
  it('adds a group; no empty name and no second one of the same name', () => {
    const s = state();
    const r = neueGruppe(s, ' Coins ', tr, 'g2');
    expect(r.state.gruppen.at(-1)).toEqual({ id: 'g2', name: 'Coins' });
    expect(neueGruppe(s, '  ', tr).error).toBe('name');
    expect(neueGruppe(r.state, 'coins', tr).error).toBe('dup');
    expect(neueGruppe(s, '[shares|kurs]', tr).error).toBe('dup');
  });
  it('renames; empty brings a standard group back to its name, an own group needs a name', () => {
    const s = state();
    const r = benenneGruppe(s, 'aktien', 'Meine Aktien', tr).state;
    expect(r.gruppen[0]).toEqual({ id: 'aktien', std: 'Shares|kurs', name: 'Meine Aktien' });
    expect(benenneGruppe(r, 'aktien', '', tr).state.gruppen[0]).toEqual({ id: 'aktien', std: 'Shares|kurs' });
    const own = neueGruppe(s, 'X', tr, 'g2').state;
    expect(benenneGruppe(own, 'g2', '', tr).error).toBe('name');
    expect(benenneGruppe(own, 'g2', 'Shares|kurs', tr).error).toBeUndefined();
    expect(benenneGruppe(own, 'g2', '[Shares|kurs]', tr).error).toBe('dup');
    expect(benenneGruppe(own, 'nope', 'Y', tr).error).toBe('gone');
  });
  it('deleting hands the titles on, to another group or to «without group»; no title is deleted', () => {
    const s = neueGruppe(state(), 'B', tr, 'g2').state;
    const a = loescheGruppe(s, 'aktien', 'g2');
    expect(a.gruppen.map((g) => g.id)).toEqual(['fonds', 'krypto', 'metalle', 'geld', 'g2']);
    expect(a.titel).toHaveLength(STANDARD.titel.length);
    expect(a.titel.filter((x) => x.gruppe === 'g2').map((x) => x.symbol)).toEqual(STANDARD.titel.filter((x) => x.gruppe === 'aktien').map((x) => x.symbol));
    const b = loescheGruppe(s, 'aktien');
    expect(b.titel.filter((x) => x.gruppe === '')).toHaveLength(7);
    expect(loescheGruppe(s, 'aktien', 'aktien').titel.filter((x) => x.gruppe === '')).toHaveLength(7);
    expect(ansicht(b).at(-1)).toMatchObject({ id: '' });
    expect(ansicht(b).at(-1).titel).toHaveLength(7);
  });
  it('moves one place in the list of groups', () => {
    const s = neueGruppe(state(), 'B', tr, 'g2').state;
    expect(schiebeGruppe(s, 'g2', -1).gruppen.map((g) => g.id).slice(-2)).toEqual(['g2', 'geld']);
    expect(schiebeGruppe(s, 'aktien', -1)).toBe(s);
  });
});

describe('the view', () => {
  it('lists the groups in order, each with its titles, and the ones without group last', () => {
    const s = neueGruppe(state(), 'B', tr, 'g2').state;
    const v = ansicht(aendereTitel(s, 'std-sren', { gruppe: '' }).state);
    expect(v.map((g) => [g.id, g.titel.length])).toEqual([['aktien', 6], ['fonds', 4], ['krypto', 2], ['metalle', 9], ['geld', 3], ['g2', 0], ['', 1]]);
  });
});

describe('restoring the suggestions', () => {
  it('brings back only the missing ones and keeps what the person changed', () => {
    let s = state();
    s = loescheTitel(s, 'std-rog');
    s = aendereTitel(s, 'std-nesn', { name: 'Mein Nestlé' }).state;
    expect(fehlendeVorschlaege(s)).toBe(1);
    const r = ergaenzeVorschlaege(s);
    expect(r.titel.find((x) => x.symbol === 'NESN.SW').name).toBe('Mein Nestlé');
    expect(r.titel.map((x) => x.symbol)).toContain('ROG.SW');
    expect(fehlendeVorschlaege(r)).toBe(0);
    expect(r.titel).toHaveLength(STANDARD.titel.length);
  });
  it('also brings back the group, and a title the person moved elsewhere counts as there', () => {
    let s = loescheGruppe(state(), 'aktien');
    expect(fehlendeVorschlaege(s)).toBe(1);
    s = ergaenzeVorschlaege(s);
    expect(s.gruppen.map((g) => g.id)).toContain('aktien');
    expect(s.titel).toHaveLength(STANDARD.titel.length);
    expect(fehlendeVorschlaege(s)).toBe(0);
  });
});

describe('the kinds', () => {
  it('have an English name each and no key twice', () => {
    expect(new Set(ARTEN.map((a) => a.key)).size).toBe(ARTEN.length);
    for (const a of ARTEN) expect(a.name).toBeTruthy();
  });
});
