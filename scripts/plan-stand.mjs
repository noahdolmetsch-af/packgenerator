// «Plan ganze App» (Noah 07.11.2026 «a»): liest docs/plan-ganze-app.md und sagt, wie weit der Plan ist.
//   node scripts/plan-stand.mjs   ->   «Plan: 2 von 14 online»
// Die Tabelle hat die Spalten: Schritt | Titel | PR | Stand | Weg. Stand ist «offen», «gebaut», «online» oder «gestrichen» (gestrichen zählt nicht mit).
// Weg sagt, woran man den Schritt in der App erkennt (mehrere mit «;» getrennt):
//   datei:<Pfad>              die Datei gibt es im Repo
//   text:<Pfad>|<Wort>        die Datei enthält das Wort
//   funktion:<Kennung>        die Funktion steht in src/lib/features.js
//   -                         noch kein Weg (nur erlaubt bei «offen»)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLAN_FILE = path.join(ROOT, 'docs/plan-ganze-app.md');
export const STANDS = ['offen', 'gebaut', 'online', 'gestrichen'];

/** Liest die Zeilen der Plan-Tabelle. */
export function parsePlan(md) {
  return md
    .split('\n')
    .filter((l) => /^\|\s*\d+[a-z]?\s*\|/.test(l))
    .map((l) => {
      const c = l.split('|').slice(1, -1).map((s) => s.trim());
      return { schritt: c[0], titel: c[1], pr: c[2], stand: c[3], weg: c[4] ?? '' };
    });
}

/** Zerlegt die Spalte «Weg» in einzelne Prüfpunkte. */
export function wegePunkte(weg) {
  if (!weg || weg === '-') return [];
  return weg.split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
    const i = s.indexOf(':');
    const art = s.slice(0, i);
    const rest = s.slice(i + 1);
    if (art === 'text') {
      const [datei, wort] = rest.split('|');
      return { art, datei, wort };
    }
    return { art, datei: rest, id: rest };
  });
}

export function planStand(md) {
  const rows = parsePlan(md);
  const gilt = rows.filter((r) => r.stand !== 'gestrichen');
  const online = gilt.filter((r) => r.stand === 'online').length;
  return { online, total: gilt.length, line: `Plan: ${online} von ${gilt.length} online` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(planStand(fs.readFileSync(PLAN_FILE, 'utf8')).line);
}
