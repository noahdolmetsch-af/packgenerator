# Kleine Bildschirme passen besser

Auftrag: Noah 05.11.2026, Durchklick Etappe 6 (Querschnitt, 320 px), Befunde E6-002 bis E6-004, E6-007 und E6-008 (Klasse C, gleiche Art: ein Element ist breiter als die Zeile).

## Was ist neu
- **E6-002 Packtag:** der Hauptknopf «Fertig gepackt» endete bei 320 px in «Fertig ge…». Er bricht jetzt in zwei Zeilen um und zeigt den Text ganz.
- **E6-003 Analyse:** die Auswahl «+ Wert» war so breit wie der längste Wert in der Liste und machte die Seite bei 320 px 30 px zu breit. Sie bleibt in der Bildschirmbreite.
- **E6-004 Zeilen mit vielen Knöpfen:** Zeitzonen (Griff, Name, Zeit, Pfeile, Umbenennen, Löschen) und die änderbaren Zeilen im Rennen (Papierkram, Material, Routinen, danach) setzen die Knöpfe bei Platzmangel in eine zweite Zeile. Vorher standen die Namen auf dem Handy (auch bei 390 px) Buchstabe für Buchstabe untereinander.
- **E6-007 Analyse, Balkenbeschriftung:** ein langer Name über dem Diagramm «Km pro Velo» (ein Velo mit sehr langem Namen) machte die Seite bis zu 489 px breit. Der Name wird jetzt mit «…» gekürzt und bleibt im Diagramm.
- **E6-008 Rennen-Check:** in den änderbaren Zeilen stand «Ersatzschläuche» bei 390 px noch in zwei Zeilen; der Name bekommt jetzt mehr Platz (die Knöpfe rutschen früher in die zweite Zeile).
- Regressionstest `tests/e2e/etappe6-320.spec.js` (Handy, erfundene Daten): rot ohne Fix, grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts. Auf dem Computer und bei genug Platz sehen alle Zeilen aus wie vorher.

## Selbst entschieden
- Der Umbruch gilt nur für diese Zeilen (`.zones`, `.rc-edit`, die Namen über dem Analyse-Diagramm), nicht für alle Listen: so ändert sich nichts an anderen Seiten.
- Keine neuen Texte und keine neue Funktion: keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: E6-002 bis E6-004, E6-007 und E6-008 behoben; der Rest steht im Etappenbericht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rennen › Vorbereiten › Papierkram: Name ganz, Knöpfe in einer Zeile darunter (Handy).
2. Packtag auf dem Handy: Hauptknopf unten zeigt «Fertig gepackt» ganz.
3. Ich › Werkzeugkasten › Zeitzonen: Seite verschiebt sich nicht seitlich.
