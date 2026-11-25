# Touren: Die Zähler fangen nicht mehr bei null an

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Befund E2-003

## Was ist neu
- Touren › Übersicht: Die Zeile «N geplant · N gefahren in 12 Monaten» las beim Öffnen kurz «0 gefahren» und sprang dann auf die echte Zahl. Mit grossen Datenmengen dauerte das 1 bis 2 Sekunden. Jetzt erscheint die Zeile erst, wenn die Zahlen stimmen. Auf dem Handy gilt dasselbe für die Zeile «Mit Packliste» («0 Touren»).
- Ursache: Die Zeile las aus zwei Abfragen. Die schnelle (Touren) liess sie erscheinen, die langsame (Rückblick-Daten) lieferte erst später die Zahlen.

## Was fällt weg oder rutscht tiefer
- nichts. (Die Zeile erscheint einen Moment später, dafür gleich richtig.)

## Selbst entschieden
- Nur die zwei Stellen mit der gleichen Ursache in `Trips.svelte`.
- Regressionstest `tests/e2e/touren-zaehler-laden.spec.js` (erfundene Daten) zeichnet jeden Text der Zeile beim Laden auf; vorher rot («0 gefahren»), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Befund E2-003 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: Die Zeile unter dem Titel zeigt gleich die echten Zahlen, kein «0 gefahren».
2. Auf dem Handy: Die Zeile «Mit Packliste» zeigt kein «0 Touren» vor den echten Zahlen.
