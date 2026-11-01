# Wächter-Test: Handy-Gruppen kleiner

Auftrag: Koordinator, 1.11.2026 (Thread «Merge-Stau abbauen und Tests stabilisieren»)

## Was ist neu
- Der Layout-Wächter (`guard.spec.js`) teilt die Seiten in 8 statt 4 Gruppen. Auf dem Handy läuft jede Seite in zwei Breiten, darum liefen die Gruppen in CI ins 120-Sekunden-Limit.
- Jede Gruppe ist nun etwa halb so lang. Das Limit pro Gruppe ist 150 s.

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts in der App sichtbar)

## Selbst entschieden
- Gruppen teilen statt nur das Limit erhöhen: so bleibt es auch bei langsamer CI stabil.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Wackler beheben.

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
