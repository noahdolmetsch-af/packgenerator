# Abkürzungen ohne zerrissene Wörter

PR #899 · 05.11.2026 · Auftrag: Noah «ETAPPE 1» (Frontend-Durchklick, Thread «Durchklicken Etappe 1: Heute und Ich»)

Fund E1-006 (Klasse C, Ansicht). In der Kachel «Deine Abkürzungen» auf Heute brach ein Knopf mit einem langen Wort («Werkzeugkasten») auf dem Computer mitten im Wort. Der Knopf hatte innen 124 px, das Wort braucht 127 px. Die Spalten sind jetzt mindestens 168 px breit (vorher 150 px), und `hyphens: auto` trennt bei noch längeren Wörtern an einer Silbe. Test `tests/e2e/heute-abkuerzung-wort.spec.js` (erfundene Daten, schlägt auf dem Computer vorher fehl).

## Was ist neu
- Breitere Abkürzungs-Knöpfe auf Heute; auf dem Computer 6 statt 7 Knöpfe pro Reihe.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Breiter statt kleinere Schrift: die Schrift bleibt wie in den anderen Kacheln.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
