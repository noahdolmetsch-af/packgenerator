// «Plan ganze App», der Plan-Wächter (Noah 07.11.2026 «a» auf «Wie stellen wir sicher, dass das umgesetzt wird?»).
// docs/plan-ganze-app.md hält die Schritte des Entwurfs «Die ganze App aus einem Guss» mit ihrem Stand (offen, gebaut, online).
//  P1  Die Tabelle ist vollständig: alle Schritte 0 bis 8, gültiger Stand, PR-Nummer ab «gebaut», Weg ab «online».
//  P2  Ein Schritt, der «online» ist, hat seinen Weg in der App noch (Datei, Text oder Funktion gibt es).
//  P3  Ein Schritt, der einmal «online» war, wird nicht still zurückgesetzt (tests/fixtures/plan-online.json).
// Offene Schritte machen den Test nie rot: er zeigt nur, wie weit der Plan ist («Plan: X von Y online»).
// Liste der erreichten Schritte auffrischen (fügt nur hinzu, entfernt nie):
//   PLAN_AKTUALISIEREN=1 npx vitest run tests/plan.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePlan, wegePunkte, planStand, STANDS } from '../scripts/plan-stand.mjs';
import { FEATURES } from '../src/lib/features.js';

const ROOT = path.resolve(__dirname, '..');
const md = fs.readFileSync(path.join(ROOT, 'docs/plan-ganze-app.md'), 'utf8');
const rows = parsePlan(md);
const FILE = path.resolve(__dirname, 'fixtures/plan-online.json');
const read = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));

if (process.env.PLAN_AKTUALISIEREN) {
  const j = read();
  j.online = [...new Set([...j.online, ...rows.filter((r) => r.stand === 'online').map((r) => r.schritt)])].sort();
  fs.writeFileSync(FILE, `${JSON.stringify(j, null, 2)}\n`);
}

const none = (list, what) => list.length === 0 || expect.fail(`${what}: ${list.join(', ')}`);
const known = read();

describe('P1 · die Plan-Tabelle ist vollständig', () => {
  it('kennt jeden Schritt 0 bis 8 und keinen doppelt', () => {
    const nums = new Set(rows.map((r) => r.schritt.replace(/[a-z]$/, '')));
    none([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !nums.has(String(n))), 'Schritt fehlt im Plan');
    none(rows.filter((r, i) => rows.findIndex((x) => x.schritt === r.schritt) !== i).map((r) => r.schritt), 'Schritt doppelt');
  });

  it('gibt jedem Schritt einen Titel und einen gültigen Stand', () => {
    none(rows.filter((r) => r.titel.length < 5).map((r) => r.schritt), 'Titel fehlt');
    none(rows.filter((r) => !STANDS.includes(r.stand)).map((r) => `${r.schritt} (${r.stand})`), `Stand nicht aus ${STANDS.join('/')}`);
  });

  it('verlangt ab «gebaut» eine PR-Nummer und ab «online» einen Weg', () => {
    none(rows.filter((r) => r.stand !== 'offen' && !/^#\d+$/.test(r.pr)).map((r) => r.schritt), 'PR-Nummer fehlt (Schreibweise #123)');
    none(rows.filter((r) => r.stand === 'online' && wegePunkte(r.weg).length === 0).map((r) => r.schritt), 'online ohne Weg');
  });

  it('zählt den Stand für die Meldung nach dem Merge', () => {
    const s = planStand(md);
    expect(s.total).toBe(rows.length);
    expect(s.line).toBe(`Plan: ${s.online} von ${s.total} online`);
  });
});

describe('P2 · was online ist, hat seinen Weg in der App', () => {
  const ids = FEATURES.map((f) => f.id);
  const online = rows.filter((r) => r.stand === 'online');

  it('findet für jeden Weg die Datei, den Text oder die Funktion', () => {
    const lost = online.flatMap((r) => wegePunkte(r.weg).filter((p) => {
      if (p.art === 'funktion') return !ids.includes(p.id);
      if (p.art === 'datei') return !fs.existsSync(path.join(ROOT, p.datei));
      if (p.art === 'text') return !fs.existsSync(path.join(ROOT, p.datei)) || !fs.readFileSync(path.join(ROOT, p.datei), 'utf8').includes(p.wort);
      return true; // unbekannte Art
    }).map((p) => `${r.schritt}: ${p.art}:${p.datei ?? p.id}${p.wort ? `|${p.wort}` : ''}`));
    none(lost, 'Weg des Plan-Schritts fehlt in der App (zurückgebaut? Dann mit Noah klären, Plan-Datei und fixtures/plan-online.json)');
  });
});

describe('P3 · ein erreichter Schritt wird nicht still zurückgesetzt', () => {
  it('hält jeden einmal erreichten Schritt auf «online», ausser er ist mit Grund abgelöst', () => {
    none(known.online.filter((s) => !known.abgeloest[s] && rows.find((r) => r.schritt === s)?.stand !== 'online'),
      'war online, steht jetzt anders (zurückgesetzt? Unter «abgeloest» mit Grund eintragen, wenn Noah es so will)');
  });

  it('hat für jede Ablösung einen Grund', () => {
    none(Object.entries(known.abgeloest).filter(([, why]) => typeof why !== 'string' || why.length < 15).map(([s]) => s), 'Ablösung ohne Grund');
  });

  it('führt die Liste sortiert und ohne Doppelte, nur mit Schritten aus dem Plan', () => {
    expect(known.online).toEqual([...new Set(known.online)].sort());
    none(known.online.filter((s) => !rows.some((r) => r.schritt === s)), 'Schritt steht nicht (mehr) im Plan');
  });
});
