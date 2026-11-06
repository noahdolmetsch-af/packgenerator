# Tour-Kopf bei Zoom 200 %

Auftrag: Noah 05.11.2026, Durchklick Etappe 6 (Querschnitt, Zoom 200 %), Befund E6-009 (Klasse C).

## Was ist neu
- Der Kopf einer laufenden Tour (Unterwegs, Planen, Touren): bei Browser-Zoom 200 % auf einem 1440 × 900 Bildschirm (also 720 × 450) schrumpfte der Name neben den Knöpfen auf eine Spalte von wenigen Buchstaben und stand Buchstabe für Buchstabe untereinander. Der Name hat jetzt eine Mindestbreite; die Knöpfe rutschen in eine eigene Zeile.
- Dasselbe galt für ein Handy quer und jedes Fenster unter 500 px Höhe.
- Test `tests/e2e/zoom-tourkopf.spec.js` (Computer, erfundene Daten): rot ohne Fix, grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts. Bei normaler Höhe ändert sich nichts; in niedrigen Fenstern steht der Name in seiner Zeile, die Knöpfe darunter.

## Selbst entschieden
- Nur der Kopf der Tour, nicht alle Köpfe.
- Keine neuen Texte, keine neue Funktion: keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: E6-009 behoben; der Rest steht im Etappenbericht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Browser auf 200 % zoomen (Strg und +), Unterwegs mit laufender Tour öffnen: der Name steht in Wörtern.
2. Zoom zurück auf 100 %: der Kopf sieht aus wie vorher.
