# CI: PRs ohne App-Änderung laufen nur ihre eigenen Tests

Auftrag: Noah «4a» (1.11.2026, Thread «Merge-Stau abbauen und Tests stabilisieren»)

## Was ist neu
- `scripts/ci-scope.mjs` prüft, welche Dateien ein PR ändert.
- Nur Doku, News-Dateien, ganze Testdateien (`*.spec.js`, `tests/*.test.js`): die Handy-Tests laufen nur mit den eigenen geänderten Testdateien (in Teil 1), die anderen 4 Teile machen nichts. Nur Doku/News: keine Handy-Tests.
- Alles andere (App-Code, gemeinsame Test-Hilfen wie `clock.js`/`lib.js`, Workflows) läuft wie bisher in allen 5 Teilen.
- «e2e (phone)» bleibt als Pflicht-Check grün, wenn die Teile durchlaufen.

## Was fällt weg oder rutscht tiefer
- nichts in der App. In der CI: Test-/Doku-PRs laufen nicht mehr alle 5 Handy-Teile.

## Selbst entschieden
- Gemeinsame Test-Hilfen zählen als «alles», weil sie alle Tests betreffen.
- Im Zweifel (keine Dateiliste) läuft alles.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Punkt 4a erledigt.

## Prüfschritte
Nichts Sichtbares. Dieser PR ändert einen Workflow, darum läuft er selbst noch alles.
