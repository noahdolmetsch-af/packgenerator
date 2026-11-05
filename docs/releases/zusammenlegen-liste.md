# Zusammenlegen: Die Vorschläge stehen wieder untereinander

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Befund E2-004

## Was ist neu
- Material › Teil öffnen › Mehr › «Zusammenlegen mit …»: Die Liste der Vorschläge (und der Suchtreffer) war auf etwa 26 px Breite zusammengedrückt. Namen, «Vorschlag» und Gewicht liefen auf Handy und Computer ineinander, die Zeilen lagen nebeneinander statt untereinander. Jetzt steht jede Zeile in voller Breite untereinander.
- Ursache: Das Kästchen vor jeder Zeile und die Liste hatten denselben Klassennamen («box»); die Liste bekam den Stil des Kästchens (22 px breit). Das Kästchen heisst jetzt «tick».

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Umbenennung in `MergeSheet.svelte`; Aussehen und Verhalten bleiben sonst gleich.
- Regressionstest `tests/e2e/zusammenlegen-liste.spec.js` (erfundene Daten): prüft Breite der Liste und dass die Zeilen untereinander im Fenster liegen; vorher rot, nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Befund E2-004 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material öffnen, ein Teil antippen, «Mehr» › «Zusammenlegen mit …»: Die Vorschläge stehen untereinander, jede Zeile mit Kästchen, Name, Hinweis und Gewicht.
2. Im Suchfeld ein Teil suchen: Auch die Treffer stehen in vollen Zeilen.
