# Woche: Einen Termin entfernen lässt sich zurücknehmen

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Thread «Durchklicken Etappe 4: Velos und Alltag»), Befund E4-005

## Was ist neu
- Planen › Woche: Das × bei einem eigenen Termin oder einer Aufgabe löschte sofort und ohne Meldung. Jetzt steht ««Name» gelöscht.» mit «Rückgängig» (4 Sekunden), wie überall sonst in der App. Rückgängig legt nur diesen Eintrag zurück und lässt andere Änderungen in der Zwischenzeit stehen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Kein Nachfragefenster vorab: Der Eintrag ist klein und mit Rückgängig sofort zurück (Regel «löschen mit Rückgängig»).
- Regressionstest `tests/e2e/termin-entfernen-rueckgaengig.spec.js` (erfundene Daten): vorher rot, nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Befund E4-005 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche › «Termin», etwas schreiben, speichern, dann das × neben dem Termin tippen: Er ist weg, unten erscheint «Rückgängig».
2. «Rückgängig» tippen: Der Termin steht wieder da.
