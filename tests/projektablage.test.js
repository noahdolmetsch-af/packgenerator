// Paket P7 «Projekt-Ablage»: the list of plans read into ideas, packages, the way and «Für dich jetzt» (src/lib/projekt/ablage.js).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseList, countStates, wayOf, forYou, column, STATES, addOwn, editOwn, dropOwn, moveOwn, ownOf, cmpVersion } from '../src/lib/projekt/ablage.js';
import de from '../src/lib/i18n/de/index.js';

const MD = `# Alle Vorhaben

Stand 19.10.2026, 19:30 UTC. Live ist 0.154.0.

## Nach 0.177: freigegebene Mockup-Pakete

| Paket | Vorhaben | Ziel |
|---|---|---|
| P2 | Skitour (gebaut, 0.178.0) | 1 Schneller packen |
| P5 | Eingang (gebaut, 0.183.0, geparkt) | 5 Alltag |
| P7 | Projekt-Ablage | 5 Alltag |

## 1. Schneller packen

### Gewünscht, noch nicht gebaut

| Vorhaben | Grösse | Nutzen |
|---|---|---|
| Gepackte Teile unten | klein | Du siehst, was fehlt. |

### Ideen, noch nicht entschieden

| Vorhaben | Grösse | Nutzen |
|---|---|---|
| Leihliste für Gäste [H] | mittel | Gäste bekommen Material. |
| Bausteine Teil 2 [H] (prüfen) | gross | Hilft. |

**Gebaut, wartet aufs Zusammenführen:** Akku-Rechner [H (Paket 4)] · Strombudget [H]

<details><summary>Schon live (2)</summary>

Packliste mit Taschen · Eigene Vorlagen

</details>

## 5. Alltag (seit 19.10.2026)

**Im Bau:** Anleitungen überall [Anleitungen]

## Bewusst nicht

Foto-KI für Material · Fotoalbum
`;

describe('Projekt-Ablage: the list of plans', () => {
  const r = parseList(MD);
  it('reads the state, the goals and the packages', () => {
    expect(r.stand).toBe('19.10.2026, 19:30 UTC');
    expect(r.goals).toEqual([{ n: 1, name: 'Schneller packen' }, { n: 5, name: 'Alltag' }]);
    expect(r.packages).toEqual([
      { key: 'P2', name: 'Skitour', goal: 1, version: '0.178.0', built: true, parked: false },
      { key: 'P5', name: 'Eingang', goal: 5, version: '0.183.0', built: true, parked: true },
      { key: 'P7', name: 'Projekt-Ablage', goal: 5, version: null, built: false, parked: false },
    ]);
  });
  it('reads every idea with its goal and state; «Bewusst nicht» stays out', () => {
    expect(countStates(r.ideas)).toEqual({ idea: 2, wish: 1, work: 3, live: 2, total: 8 });
    expect(r.ideas.find((x) => x.title === 'Leihliste für Gäste')).toEqual({ title: 'Leihliste für Gäste', tag: 'H', goal: 1, state: 'idea', size: 'mittel', use: 'Gäste bekommen Material.' });
    expect(r.ideas.find((x) => x.tag === 'H (Paket 4)').title).toBe('Akku-Rechner');
    expect(r.ideas.some((x) => x.title === 'Bausteine Teil 2 (prüfen)')).toBe(true);
    expect(r.ideas.find((x) => x.title === 'Anleitungen überall')).toMatchObject({ goal: 5, state: 'work' });
    expect(r.ideas.some((x) => /Fotoalbum|Foto-KI/.test(x.title))).toBe(false);
    expect(column(r.ideas, 'live', 1).map((x) => x.title)).toEqual(['Packliste mit Taschen', 'Eigene Vorlagen']);
    expect(column(r.ideas, 'live', 5)).toEqual([]);
  });
  it('reads the real list of the repo', () => {
    const real = parseList(readFileSync('docs/vorhaben-liste.md', 'utf8'));
    expect(real.goals.map((g) => g.n)).toEqual([1, 2, 3, 4, 5, 6]);
    const c = countStates(real.ideas);
    expect(c.live).toBeGreaterThan(100);
    expect(c.idea + c.wish + c.work).toBeGreaterThan(10);
    expect(real.packages.map((p) => p.key)).toContain('P7');
  });
  it('builds the way: last releases, now, then what comes', () => {
    const rel = [{ version: '0.184.0', title: 'D' }, { version: '0.183.0', title: 'C' }, { version: '0.182.0', title: 'B' }, { version: '0.181.0', title: 'A' }, { version: '0.180.0', title: 'Z' }];
    const w = wayOf(rel, r.packages, '0.182.0');
    expect(w.map((x) => `${x.kind}:${x.title}`)).toEqual(['done:Z', 'done:A', 'now:B', 'parked:Eingang', 'next:Projekt-Ablage']);
    expect(wayOf(rel, r.packages, '0.184.0').map((x) => x.kind)).toEqual(['done', 'done', 'done', 'now', 'next']);
  });
  it('«Für dich jetzt»: parked packages first, then your points', () => {
    const own = [{ id: 'a', text: 'Fragen beantworten' }, { id: 'b', text: '  ' }];
    const f = forYou(r.packages, own, '0.182.0');
    expect(f.all.map((x) => x.id)).toEqual(['pkg:P5', 'a']);
    expect(forYou(r.packages, own, '0.183.0').all.map((x) => x.id)).toEqual(['a']);
    expect(forYou(r.packages, [1, 2, 3, 4].map((i) => ({ id: String(i), text: `p${i}` })), '0.183.0')).toMatchObject({ more: 1 });
  });
  it('your points: add, change, move and delete', () => {
    let l = addOwn([], ' Erstens ', 'x1');
    l = addOwn(l, 'Zweitens', 'x2');
    l = addOwn(l, '   ', 'x3');
    expect(l).toEqual([{ id: 'x1', text: 'Erstens' }, { id: 'x2', text: 'Zweitens' }]);
    expect(editOwn(l, 'x1', 'Eins')[0].text).toBe('Eins');
    expect(editOwn(l, 'x1', '  ')[0].text).toBe('Erstens');
    expect(moveOwn(l, 1, 0).map((x) => x.id)).toEqual(['x2', 'x1']);
    expect(dropOwn(l, 'x1')).toEqual([{ id: 'x2', text: 'Zweitens' }]);
    expect(ownOf('kaputt')).toEqual([]);
    expect(addOwn([], 'a').length + addOwn([], 'b').length).toBe(2);
  });
  it('compares versions and has German for the states', () => {
    expect(cmpVersion('0.99.0', '0.100.0')).toBe(-1);
    expect(cmpVersion('0.184.0', '0.184.0')).toBe(0);
    for (const s of STATES) expect(de[s.name], s.name).toBeTruthy();
    expect(de['Project shelf']).toBe('Projekt-Ablage');
  });
});
