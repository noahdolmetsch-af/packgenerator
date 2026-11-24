# Seitengrösse: Grenzen für Aktiv und Meine Sportarten angehoben

PR #? · 24.11.2026 · Auftrag: Bündler «Main ist rot» (Stau-Regel 2); Noah 24.11. «lass uns diese vergrössern»

## Was ist neu
- Nichts in der App. Der Wächter `tests/e2e/seitengroesse.spec.js` war auf `main` rot: `#/flow` baute 1756 Elemente (Grenze 1740) und `#/flow/sports` 2335 (Grenze 2310).
- Die beiden Grenzen in `tests/seitengroesse-budget.json` sind neu gesetzt: mit mehr Luft: `#/flow` 2200 und `#/flow/sports` 2900 (rund 25 % über der heutigen Zahl). Noah 24.11.: «lass uns diese vergrössern». Die anderen zwölf Seiten bleiben unverändert.

## Warum
- Die Zahlen lagen schon vor «Meditation und Challenge vorn» (#1653) über der Grenze (1742 und 2321, gemessen vor und nach #1653: gleich); die Zeile von #1653 sitzt nur auf Heute. Der Zuwachs kam in den Mein-Tag-, Training- und Aktionen-PRs der letzten 24 Stunden, die gemeinsame Teile von Aktiv berühren, jeder mit wenigen Elementen.
- Es ist kein Seiten-Längen-Budget für Noah, sondern ein Wächter gegen langsames Öffnen; die Seite ist weiter schnell (Zahl Elemente, nicht Millisekunden).

## Was fällt weg oder rutscht tiefer
Nichts.

## Selbst entschieden
- Nur die zwei roten Seiten angehoben, nicht alle mit `SEITE_UPDATE=1` neu geschrieben (das hätte zehn andere Grenzen ohne Grund verschoben).
- Keine «Was ist neu»-Datei und kein Eintrag in `docs/decisions/` (nichts Sichtbares, keine Entscheidung von Noah).

## Stand im Plan
- Nichts geändert.
