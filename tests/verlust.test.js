// «Vereinfachen ohne Verlust», Schritt 1, der Verlust-Wächter (Noah 07.11.2026 «1a 2a 3a 4b 5a», Entwurf «Vereinfachen ohne Verlust»).
// Wer die App vereinfacht (Basis und Mehr, Einfach / Voll, ein Zuhause je Funktion), darf keine Funktion verlieren:
//  R1  Keine bekannte Funktion verschwindet. tests/fixtures/funktionen.json hält ihre Kennungen; wer eine entfernt oder
//      umbenennt, trägt sie mit Grund unter «abgeloest» ein (das sieht Noah im PR). Neue Funktionen sind frei.
//  R2  Versteckt heisst auffindbar. Jede Funktion steht in der Karte der App, die Suche findet sie über ihren Namen
//      (Englisch und Deutsch), und sie führt auf eine Seite oder Aktion, die die App kennt. Wer eine Funktion hinter
//      «Mehr» oder in «Einfach» ausblendet, trägt sie unter «versteckt» ein, mit dem Weg dorthin («wo»).
// Die Liste der Kennungen auffrischen (fügt nur hinzu, entfernt nie):
//   VERLUST_AKTUALISIEREN=1 npx vitest run tests/verlust.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { FEATURES, featureHref, findFeatures } from '../src/lib/features.js';
import { TIP } from '../src/lib/tips.js';
import { buildMap } from '../src/lib/appmap.js';
import { pageOf } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

const FILE = path.resolve(__dirname, 'fixtures/funktionen.json');
const read = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const IDS = FEATURES.map((f) => f.id);
const tr = (s) => DE[s] ?? s;

if (process.env.VERLUST_AKTUALISIEREN) {
  const j = read();
  j.ids = [...new Set([...j.ids, ...IDS])].sort();
  fs.writeFileSync(FILE, `${JSON.stringify(j, null, 2)}\n`);
}

const known = read();
const none = (list, what) => list.length === 0 || expect.fail(`${what}: ${list.join(', ')}`);

describe('R1 · keine Funktion geht verloren', () => {
  it('hält jede bekannte Kennung noch im Katalog, ausser sie ist mit Grund abgelöst', () => {
    none(known.ids.filter((id) => !IDS.includes(id) && !known.abgeloest[id]),
      'Funktion fehlt im Katalog (tests/fixtures/funktionen.json: unter «abgeloest» mit Grund eintragen, wenn Absicht)');
  });

  it('hat für jede Ablösung einen Grund und keine Ablösung, die es noch gibt', () => {
    none(Object.entries(known.abgeloest).filter(([, why]) => typeof why !== 'string' || why.length < 15).map(([id]) => id), 'Ablösung ohne Grund');
    none(Object.keys(known.abgeloest).filter((id) => IDS.includes(id)), 'als abgelöst eingetragen, aber noch im Katalog (Eintrag streichen)');
    none(Object.keys(known.abgeloest).filter((id) => !known.ids.includes(id)), 'abgelöst, aber nicht in der Liste der Kennungen');
  });

  it('führt die Liste der Kennungen sortiert und ohne Doppelte', () => {
    expect(known.ids).toEqual([...new Set(known.ids)].sort());
    expect(known.ids.length).toBeGreaterThan(400);
  });
});

describe('R2 · versteckt heisst auffindbar', () => {
  const map = buildMap();
  const onMap = map.flatMap((g) => g.items.map((i) => i.id));

  it('zeigt jede Funktion genau einmal in der Karte der App', () => {
    none(IDS.filter((id) => !onMap.includes(id)), 'nicht in der Karte der App');
    none(onMap.filter((id, i) => onMap.indexOf(id) !== i), 'mehrfach in der Karte der App');
  });

  it('findet jede Funktion über ihren englischen Namen in der Suche', () => {
    none(FEATURES.filter((f) => !findFeatures(f.title).some((h) => h.featureId === f.id)).map((f) => f.id), 'Suche findet sie nicht');
  });

  it('findet jede Funktion über ihren deutschen Namen in der Suche', () => {
    none(FEATURES.filter((f) => !DE[f.title]).map((f) => f.id), 'Name nicht auf Deutsch');
    none(FEATURES.filter((f) => !findFeatures(DE[f.title], tr).some((h) => h.featureId === f.id)).map((f) => f.id), 'Suche findet sie auf Deutsch nicht');
  });

  it('führt jede Funktion auf eine Seite oder Aktion, die die App kennt', () => {
    const bad = FEATURES.filter((f) => {
      const href = featureHref(f, { bikeId: 'bike-1' });
      if (href) return href !== '#/' && pageOf(href) === 'home'; // eine Adresse, die sonst nirgends hinführt, landet auf Heute
      return !(f.run || TIP[f.tip]?.go?.run);
    });
    none(bad.map((f) => `${f.id} ${featureHref(f) ?? '(kein Ziel)'}`), 'führt nirgends hin');
  });

  it('verlangt für jede versteckte Funktion den Weg dorthin', () => {
    for (const [id, v] of Object.entries(known.versteckt)) {
      expect(IDS, `versteckt: ${id} gibt es nicht`).toContain(id);
      expect(typeof v.wo === 'string' && v.wo.includes('›'), `versteckt: ${id} braucht «wo» wie «Packen › Mehr › Vorher und am Abend»`).toBe(true);
      expect(v.wo, `versteckt: ${id} «wo» ist kein Platzhalter`).not.toMatch(/\.\.\.|…|TODO/);
    }
  });
});
