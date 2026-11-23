import { describe, it, expect } from 'vitest';
import {
  JOURNAL_KEY, lies, titelKey, neuesDepot, aendereDepot, loescheDepot, schiebeDepot, pruefeEintrag, neuerEintrag, aendereEintrag, loescheEintrag,
  rechne, bestandAm, geordnet, nurTitel, echteEintraege, symbole, bewerteRechnung, verlauf, eroeffnungAus, uebernehmen, standardJournal,
} from '../src/lib/kurse/journal.js';
import { lies as liesBestand, neuerPosten, neuesEreignis, mengeJetzt } from '../src/lib/kurse/bestand.js';

/** Invented numbers only. */
const leer = () => standardJournal();
function mit(eintraege, art = 'echt') {
  let s = neuesDepot(leer(), { name: 'Test', art }, 'd1').state;
  let i = 0;
  for (const e of eintraege) {
    const r = neuerEintrag(s, 'd1', e, `e${++i}`);
    if (r.error) throw new Error(`${e.art} ${e.tag}: ${r.error}`);
    s = r.state;
  }
  return s;
}
const kauf = (tag, menge, preis, gebuehr = 0, titel = 'gold') => ({ art: 'kauf', titel, tag, menge, preis, gebuehr });
const verkauf = (tag, menge, preis, gebuehr = 0, titel = 'gold') => ({ art: 'verkauf', titel, tag, menge, preis, gebuehr });

describe('titles and reading', () => {
  it('knows gold and symbols', () => {
    expect(titelKey('Gold')).toBe('gold');
    expect(titelKey(' nesn.sw ')).toBe('NESN.SW');
    expect(titelKey('')).toBeNull();
    expect(titelKey('a b')).toBeNull();
  });
  it('reads nothing or rubbish as an empty state', () => {
    expect(lies(null)).toEqual({ depots: [] });
    expect(lies({ depots: 'x' })).toEqual({ depots: [] });
    expect(standardJournal()).toEqual({ depots: [] });
  });
  it('leaves out broken depots and entries and keeps the good ones', () => {
    const s = lies({ depots: [
      { id: 'd1', name: ' Mein Depot ', art: 'echt', eintraege: [
        { id: 'a', art: 'kauf', titel: 'gold', tag: '2025-01-02', menge: 10, preis: 90, gebuehr: 5 },
        { id: 'a', art: 'kauf', titel: 'gold', tag: '2025-01-03', menge: 1, preis: 90 }, // same id
        { id: 'b', art: 'kauf', titel: 'gold', tag: '2025-13-40', menge: 1, preis: 90 }, // no day
        { id: 'c', art: 'kauf', titel: 'gold', tag: '2025-01-02', menge: 0, preis: 90 },
        { id: 'd', art: 'kauf', titel: 'bad symbol', tag: '2025-01-02', menge: 1, preis: 90 },
        { id: 'e', art: 'split', titel: 'abc.sw', tag: '2025-05-01', faktor: 1 },
        { id: 'f', art: 'split', titel: 'abc.sw', tag: '2025-05-01', faktor: 2 },
        { id: 'g', art: 'dividende', titel: 'abc.sw', tag: '2025-05-01', betrag: 12 },
        { id: 'h', art: 'kauf', titel: 'gold', tag: '2025-02-01', menge: 2, preis: 80, gebuehr: -3 },
        { id: 'i', art: 'wasauchimmer', titel: 'gold', tag: '2025-02-01' },
      ] },
      { id: 'd1', name: 'doppelt', eintraege: [] },
      { id: '', name: 'ohne id' },
      { id: 'd2', name: 'Übung', art: 'komisch', eintraege: 'x' },
    ] });
    expect(s.depots.map((d) => [d.id, d.name, d.art])).toEqual([['d1', 'Mein Depot', 'echt'], ['d2', 'Übung', 'echt']]);
    expect(s.depots[0].eintraege.map((e) => e.id)).toEqual(['a', 'f', 'g', 'h']);
    expect(s.depots[0].eintraege[1].titel).toBe('ABC.SW');
    expect(s.depots[0].eintraege[3].gebuehr).toBe(0);
  });
  it('a saved state reads back unchanged', () => {
    const s = mit([kauf('2025-01-02', 10, 90, 5), verkauf('2025-03-03', 4, 100, 2), { art: 'dividende', titel: 'gold', tag: '2025-04-01', betrag: 7 }]);
    expect(lies(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(JOURNAL_KEY).toBe('kurse.journal');
  });
});

describe('depots', () => {
  it('adds, renames, changes the kind, moves and deletes', () => {
    let s = neuesDepot(leer(), { name: ' Echt ', art: 'echt' }, 'a').state;
    s = neuesDepot(s, { name: 'ETF-Test', art: 'uebung' }, 'b').state;
    expect(s.depots.map((d) => [d.name, d.art])).toEqual([['Echt', 'echt'], ['ETF-Test', 'uebung']]);
    expect(neuesDepot(s, { name: '  ' }).error).toBe('name');
    s = aendereDepot(s, 'b', { name: 'Gold-Test' }).state;
    s = aendereDepot(s, 'b', { art: 'echt' }).state;
    expect(s.depots[1]).toMatchObject({ name: 'Gold-Test', art: 'echt' });
    expect(aendereDepot(s, 'b', { name: '' }).error).toBe('name');
    expect(aendereDepot(s, 'x', { name: 'y' }).error).toBe('gone');
    s = schiebeDepot(s, 'b', -1);
    expect(s.depots.map((d) => d.id)).toEqual(['b', 'a']);
    expect(schiebeDepot(s, 'b', -1)).toBe(s);
    s = loescheDepot(s, 'a');
    expect(s.depots.map((d) => d.id)).toEqual(['b']);
  });
  it('moves the entries to another portfolio when one is chosen, else they go with it', () => {
    let s = neuesDepot(leer(), { name: 'Eins' }, 'a').state;
    s = neuesDepot(s, { name: 'Zwei' }, 'b').state;
    s = neuerEintrag(s, 'a', kauf('2025-01-02', 10, 100), 'e1').state;
    s = neuerEintrag(s, 'b', kauf('2025-02-02', 5, 100), 'e2').state;
    const dahin = loescheDepot(s, 'a', 'b');
    expect(dahin.depots.map((d) => d.id)).toEqual(['b']);
    expect(dahin.depots[0].eintraege.map((e) => e.id)).toEqual(['e2', 'e1']);
    expect(loescheDepot(s, 'a').depots[0].eintraege.map((e) => e.id)).toEqual(['e2']);
    expect(loescheDepot(s, 'a', 'a').depots.map((d) => d.id)).toEqual(['b']); // to itself or to a gone one: just deleted
    expect(loescheDepot(s, 'a', 'gone').depots[0].eintraege).toHaveLength(1);
  });
});

describe('entries', () => {
  it('checks what was typed', () => {
    expect(pruefeEintrag(kauf('2025-01-02', '1\'250.5', '90,5', '9.90')).eintrag).toMatchObject({ menge: 1250.5, preis: 90.5, gebuehr: 9.9, titel: 'gold' });
    expect(pruefeEintrag({ ...kauf('2025-01-02', 1, 1), gebuehr: '' }).eintrag.gebuehr).toBe(0);
    expect(pruefeEintrag({ art: 'x' }).error).toBe('art');
    expect(pruefeEintrag({ art: 'kauf', titel: 'a b', tag: '2025-01-02' }).error).toBe('titel');
    expect(pruefeEintrag({ ...kauf('gestern', 1, 1) }).error).toBe('tag');
    expect(pruefeEintrag(kauf('2025-01-02', 0, 1)).error).toBe('menge');
    expect(pruefeEintrag(kauf('2025-01-02', 1, 0)).error).toBe('preis');
    expect(pruefeEintrag(kauf('2025-01-02', 1, 1, -1)).error).toBe('gebuehr');
    expect(pruefeEintrag({ art: 'dividende', titel: 'gold', tag: '2025-01-02', betrag: 0 }).error).toBe('betrag');
    expect(pruefeEintrag({ art: 'split', titel: 'gold', tag: '2025-01-02', faktor: 1 }).error).toBe('faktor');
  });
  it('adds, changes and deletes entries', () => {
    let s = mit([kauf('2025-01-02', 10, 90)]);
    const r = neuerEintrag(s, 'd1', kauf('2025-02-03', 5, 95, 3), 'x');
    s = r.state;
    expect(s.depots[0].eintraege).toHaveLength(2);
    expect(neuerEintrag(s, 'nix', kauf('2025-02-03', 5, 95)).error).toBe('gone');
    expect(neuerEintrag(s, 'd1', kauf('2025-02-03', 0, 95)).error).toBe('menge');
    s = aendereEintrag(s, 'd1', 'x', { menge: '6', preis: '96' }).state;
    expect(s.depots[0].eintraege[1]).toMatchObject({ id: 'x', menge: 6, preis: 96, gebuehr: 3 });
    expect(aendereEintrag(s, 'd1', 'nix', {}).error).toBe('gone');
    expect(aendereEintrag(s, 'd1', 'x', { menge: '-1' }).error).toBe('menge');
    s = loescheEintrag(s, 'd1', 'x');
    expect(s.depots[0].eintraege.map((e) => e.id)).toEqual(['e1']);
  });
  it('refuses a sale of more than was held that day, but never blocks a delete', () => {
    let s = mit([kauf('2025-01-02', 10, 90)]);
    const zuviel = neuerEintrag(s, 'd1', verkauf('2025-02-03', 11, 100));
    expect(zuviel).toMatchObject({ error: 'zuviel', gehalten: 10 });
    expect(neuerEintrag(s, 'd1', verkauf('2025-01-01', 1, 100)).error).toBe('zuviel'); // before the purchase
    s = neuerEintrag(s, 'd1', verkauf('2025-02-03', 10, 100), 'v').state;
    expect(aendereEintrag(s, 'd1', 'v', { menge: 12 }).error).toBe('zuviel');
    s = loescheEintrag(s, 'd1', 'e1'); // the purchase goes: the sale stays, flagged
    expect(s.depots[0].eintraege).toHaveLength(1);
    expect(Object.keys(rechne(s.depots[0].eintraege).zuviel)).toEqual(['v']);
  });
  it('a change keeps the «Eröffnung» mark and drops «ohneTag» when the day is set', () => {
    let s = lies({ depots: [{ id: 'd1', name: 'x', art: 'echt', eintraege: [{ id: 'k', art: 'kauf', titel: 'gold', tag: '2026-11-23', menge: 5, preis: 90, gebuehr: 0, eroeffnung: true, ohneTag: true, quelle: 'p1' }] }] });
    s = aendereEintrag(s, 'd1', 'k', { menge: 6 }).state;
    expect(s.depots[0].eintraege[0]).toMatchObject({ eroeffnung: true, ohneTag: true, quelle: 'p1', menge: 6 });
    s = aendereEintrag(s, 'd1', 'k', { tag: '2024-02-01' }).state;
    expect(s.depots[0].eintraege[0].ohneTag).toBeUndefined();
    expect(s.depots[0].eintraege[0].eroeffnung).toBe(true);
  });
});

describe('working out a list of entries', () => {
  it('orders by day: a split first, then buys, sales, dividends', () => {
    const es = [
      { id: 'a', art: 'dividende', titel: 'X', tag: '2025-01-02', betrag: 1 },
      { id: 'b', art: 'verkauf', titel: 'X', tag: '2025-01-02', menge: 1, preis: 1, gebuehr: 0 },
      { id: 'c', art: 'kauf', titel: 'X', tag: '2025-01-02', menge: 1, preis: 1, gebuehr: 0 },
      { id: 'd', art: 'split', titel: 'X', tag: '2025-01-02', faktor: 2 },
      { id: 'e', art: 'kauf', titel: 'X', tag: '2025-01-01', menge: 1, preis: 1, gebuehr: 0 },
    ];
    expect(geordnet(es).map((e) => e.id)).toEqual(['e', 'd', 'c', 'b', 'a']);
  });
  it('buys with fees and sells at the average price', () => {
    const r = rechne(mit([kauf('2025-01-02', 10, 90, 10), kauf('2025-02-03', 10, 110, 10), verkauf('2025-03-03', 5, 120, 5)]).depots[0].eintraege);
    // cost: 910 + 1110 = 2020 for 20 -> average 101; sold 5: cost 505, proceeds 600 - 5 = 595
    expect(r.eingesetzt).toBe(2020);
    expect(r.erloes).toBe(595);
    expect(r.realisiert).toBeCloseTo(90, 9);
    expect(r.gebuehren).toBe(25);
    expect(r.positionen.gold.menge).toBe(15);
    expect(r.positionen.gold.kosten).toBeCloseTo(1515, 9);
  });
  it('counts a split from its day on, not for a purchase on the same day or later', () => {
    const r = rechne([
      { id: 'a', art: 'kauf', titel: 'X', tag: '2025-01-01', menge: 10, preis: 100, gebuehr: 0 },
      { id: 'b', art: 'split', titel: 'X', tag: '2025-06-01', faktor: 2 },
      { id: 'c', art: 'kauf', titel: 'X', tag: '2025-06-01', menge: 5, preis: 55, gebuehr: 0 },
    ]);
    expect(r.positionen.X.menge).toBe(25);
    expect(r.positionen.X.kosten).toBe(1000 + 275);
  });
  it('adds up dividends and sells everything cleanly', () => {
    const r = rechne([
      { id: 'a', art: 'kauf', titel: 'X', tag: '2025-01-01', menge: 3, preis: 10, gebuehr: 0 },
      { id: 'b', art: 'dividende', titel: 'X', tag: '2025-02-01', betrag: 4 },
      { id: 'c', art: 'verkauf', titel: 'X', tag: '2025-03-01', menge: 3, preis: 12, gebuehr: 0 },
    ]);
    expect(r.dividenden).toBe(4);
    expect(r.positionen.X).toEqual({ menge: 0, kosten: 0 });
    expect(r.realisiert).toBe(6);
  });
  it('knows what was held at the end of a day, and filters by title or by real depots', () => {
    const es = mit([kauf('2025-01-02', 10, 90), kauf('2025-01-03', 2, 50, 0, 'ABC.SW'), verkauf('2025-02-03', 4, 100)]).depots[0].eintraege;
    expect(bestandAm(es, '2025-01-02')).toEqual({ gold: 10 });
    expect(bestandAm(es, '2025-02-03')).toEqual({ gold: 6, 'ABC.SW': 2 });
    expect(bestandAm(es, '2024-12-31')).toEqual({});
    expect(nurTitel(es, 'ABC.SW')).toHaveLength(1);
    expect(nurTitel(es, '')).toHaveLength(3);
    let s = mit([kauf('2025-01-02', 1, 1)]);
    s = neuesDepot(s, { name: 'Übung', art: 'uebung' }, 'u').state;
    s = neuerEintrag(s, 'u', kauf('2025-01-02', 100, 1, 0, 'XYZ'), 'u1').state;
    expect(echteEintraege(s)).toHaveLength(1);
    expect(symbole(s)).toEqual(['XYZ']);
  });
});

describe('value and course', () => {
  const es = () => mit([kauf('2025-01-02', 10, 90, 10), verkauf('2025-03-03', 4, 100, 0), { art: 'dividende', titel: 'gold', tag: '2025-04-01', betrag: 20 }]).depots[0].eintraege;
  it('values the positions and the whole', () => {
    const b = bewerteRechnung(rechne(es()), { gold: 110 });
    // 6 left: cost 910 * 6/10 = 546, value 660; sale 400 - 0; dividends 20; bought 910
    expect(b.wert).toBe(660);
    expect(b.offenGewinn).toBeCloseTo(114, 9);
    expect(b.realisiert).toBeCloseTo(400 - 364, 9);
    expect(b.gesamt).toBeCloseTo(660 + 400 + 20 - 910, 9);
    expect(b.gesamtPct).toBeCloseTo(((660 + 400 + 20 - 910) / 910) * 100, 9);
    expect(b.positionen[0]).toMatchObject({ titel: 'gold', menge: 6 });
    expect(b.positionen[0].schnitt).toBeCloseTo(91, 9);
  });
  it('guesses nothing: a held title without a price makes the total «not known»', () => {
    const b = bewerteRechnung(rechne(es()), {});
    expect(b.fehlt).toEqual(['gold']);
    expect(b.gesamt).toBeNull();
    expect(b.gesamtPct).toBeNull();
    expect(b.wert).toBe(0);
  });
  it('makes the course of value and net payment over the days', () => {
    const tage = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-03-03', '2025-03-04'];
    const preise = { '2025-01-02': 90, '2025-01-03': null, '2025-03-03': 100, '2025-03-04': 105 };
    const v = verlauf(es(), tage, (t, d) => preise[d] ?? null);
    expect(v.tage).toEqual(tage.slice(1));
    expect(v.wert[0]).toBe(900);
    expect(v.wert[1]).toBe(900); // no price that day: the last known one is kept
    expect(v.netto).toEqual([910, 910, 510, 510]);
    expect(v.wert[3]).toBe(6 * 105);
    expect(verlauf([], tage, () => 1)).toBeNull();
    expect(verlauf(es(), [], () => 1)).toBeNull();
    expect(verlauf(es(), ['2024-01-01'], () => 1)).toBeNull();
  });
});

describe('taking over «Meine Zahlen»', () => {
  function bestand() {
    let b = neuerPosten(liesBestand(null), { art: 'titel', symbol: 'abc.sw', menge: '10', einstand: '1000', gekauft: '2024-02-01' }, 'p1').state;
    b = neuerPosten(b, { art: 'gold', menge: '50', einstand: '4500', gekauft: '2022-03-01' }, 'p2').state;
    b = neuerPosten(b, { art: 'hand', name: 'Mein Sparkonto', wert: '5000', stand: '2026-11-01' }, 'p3').state;
    b = neuerPosten(b, { art: 'titel', symbol: 'xyz', menge: '4', einstand: '', gekauft: '' }, 'p4').state;
    b = neuerPosten(b, { art: 'titel', symbol: 'old.sw', menge: '20', einstand: '600', gekauft: '' }, 'p5').state;
    b = neuesEreignis(b, 'p1', { typ: 'dividende', tag: '2025-05-01', betrag: '30' }, 'e1').state;
    b = neuesEreignis(b, 'p1', { typ: 'split', tag: '2025-09-01', faktor: '2' }, 'e2').state;
    b = neuesEreignis(b, 'p5', { typ: 'split', tag: '2025-01-15', faktor: '3' }, 'e3').state;
    return b;
  }
  let k = 0;
  const idFn = (p) => `${p}${++k}`;
  it('turns positions into «Eröffnung» entries and names what it leaves', () => {
    const r = eroeffnungAus(bestand(), '2026-11-23', idFn);
    expect(r.uebersprungen).toEqual([{ id: 'p3', grund: 'hand' }, { id: 'p4', grund: 'einstand' }]);
    const kaufe = r.eintraege.filter((e) => e.art === 'kauf');
    expect(kaufe.map((e) => [e.titel, e.tag, e.menge, e.preis, e.ohneTag ?? false])).toEqual([
      ['ABC.SW', '2024-02-01', 10, 100, false],
      ['gold', '2022-03-01', 50, 90, false],
      ['OLD.SW', '2025-01-14', 20, 30, true],
    ]);
    expect(r.eintraege.every((e) => e.eroeffnung === true)).toBe(true);
    expect(r.eintraege.filter((e) => e.art === 'dividende')).toHaveLength(1);
    expect(r.eintraege.filter((e) => e.art === 'split')).toHaveLength(2);
  });
  it('gives the same pieces as «Meine Zahlen» does (splits only from the purchase day on)', () => {
    const b = bestand();
    const { eintraege } = eroeffnungAus(b, '2026-11-23', idFn);
    const r = rechne(eintraege);
    for (const p of b.posten) {
      if (p.art === 'hand' || !(p.einstand > 0)) continue;
      const titel = p.art === 'gold' ? 'gold' : p.symbol;
      expect(r.positionen[titel].menge).toBeCloseTo(mengeJetzt(p), 9);
    }
    expect(r.dividenden).toBe(30);
    expect(r.positionen['ABC.SW'].kosten).toBeCloseTo(1000, 9);
  });
  it('takes over into a new real depot, reads the originals only, and does not double on a second go', () => {
    const b = bestand();
    const vorher = JSON.stringify(b);
    const a = uebernehmen(leer(), b, '2026-11-23', { name: 'Mein Depot', idFn });
    expect(JSON.stringify(b)).toBe(vorher);
    expect(a.state.depots).toHaveLength(1);
    expect(a.state.depots[0]).toMatchObject({ name: 'Mein Depot', art: 'echt' });
    expect(a.neu).toBe(6);
    expect(lies(JSON.parse(JSON.stringify(a.state)))).toEqual(a.state);
    const again = uebernehmen(a.state, b, '2026-11-23', { depotId: a.depotId, idFn });
    expect(again.neu).toBe(0);
    expect(again.state.depots[0].eintraege).toHaveLength(a.state.depots[0].eintraege.length);
    // a position added later is taken over alone
    const b2 = neuerPosten(b, { art: 'titel', symbol: 'new.sw', menge: '1', einstand: '50', gekauft: '2026-01-02' }, 'p9').state;
    expect(uebernehmen(a.state, b2, '2026-11-23', { depotId: a.depotId, idFn }).neu).toBe(1);
    // a practice depot is never the target
    const u = neuesDepot(leer(), { name: 'Üb', art: 'uebung' }, 'u').state;
    const c = uebernehmen(u, b, '2026-11-23', { depotId: 'u', name: 'Neu', idFn });
    expect(c.state.depots).toHaveLength(2);
    expect(c.state.depots[0].eintraege).toHaveLength(0);
  });
  it('an empty or missing holding takes over nothing', () => {
    expect(eroeffnungAus(null, '2026-11-23')).toEqual({ eintraege: [], uebersprungen: [] });
    expect(uebernehmen(leer(), liesBestand(null), '2026-11-23', { idFn }).neu).toBe(0);
  });
});
