# Velokarte: Ein langer Typ bricht nicht mehr mitten im Wort um

PR #1016 · 06.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Antwort «4a»), Thread «Durchklicken Etappe 4: Velos und Alltag»

## Was ist neu
- Velos (Handy), kleine Velokarte: Ein langer Velotyp aus einem Import, zum Beispiel «A/B (Quelle)», brach mitten im Wort um («Fahrrad-fahren»). Jetzt bricht er nach dem Schrägstrich um und wird nach zwei Zeilen mit «…» gekürzt. Die gewählte Karte zeigt alles. Der volle Text steht beim Schweben als Hinweis.
- Ursache: Nach einem Schrägstrich erlaubt der Browser keinen Umbruch; ohne Platz brach `overflow-wrap` mitten im Wort um.

## Was fällt weg oder rutscht tiefer
- nichts. Ein sehr langer Typ ist auf nicht gewählten Karten nach zwei Zeilen gekürzt, vorher lief er über mehrere Zeilen.

## Selbst entschieden
- Der Velo-Name bleibt wie er war (auf dem Handy eine Zeile mit «…», auf dem Computer mehrere Zeilen). Gekürzt wird nur die Zeile mit Typ und Kilometern, dort lag das Problem.
- Regressionstest `tests/e2e/velokarte-langer-typ.spec.js` (erfundener Typ): vorher rot, nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Klasse-D-Idee 4 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos auf dem Handy öffnen: Bei Velos mit langem Typ (aus Strava) bricht kein Wort mehr mitten im Wort.
2. Ein anderes Velo antippen: Die gewählte Karte zeigt den ganzen Typ.
