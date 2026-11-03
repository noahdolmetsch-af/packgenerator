# Wackler behoben: «Was ist neu» tippt auf die Pins-Zeile

PR folgt · 03.11.2026 · Auftrag: Noah «5a» (wacklige Tests, Ursache beheben; Thread «Finden: Was wir übersehen haben»)

## Was ist neu
- Die Ursache des Wacklers in `tests/e2e/ausprobieren.spec.js` (Zeile «Open quickly: your pins on Today…», «lit but not on screen») gefunden: Tippt man schnell auf eine zweite Zeile von «Was ist neu», wartete der Lauf der ersten noch auf sein Element und leuchtete es später auf, mitten auf der Seite der zweiten Zeile. Der Test (und jeder Nutzer) sah dann zwei leuchtende Stellen, eine weit ausserhalb des Bildschirms.
- Behebung in `src/lib/know/spot.js`: `showSteps` merkt sich den neuesten Lauf; ein älterer Lauf bricht ab, sobald ein neuer beginnt.
- Neuer Test `tests/spot-run.test.js`: schlägt ohne die Behebung fehl, mit ihr läuft er durch.

## Was fällt weg oder rutscht tiefer
- nichts (nichts Sichtbares ausser: schnelles Antippen mehrerer Zeilen leuchtet nur noch die letzte auf)

## Selbst entschieden
- Nichts am Test gelockert oder übersprungen; die Ursache liegt in der App, nicht im Test.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 5 (wacklige Tests), erster Mini-PR: ausprobieren.spec. Weitere Wackler (Guard Phone-Gruppen u. a.) einzeln.

## Prüfschritte (nach dem Merge)
1. Ich › Was ist neu: zwei Zeilen kurz nacheinander antippen: nur die zweite leuchtet.
