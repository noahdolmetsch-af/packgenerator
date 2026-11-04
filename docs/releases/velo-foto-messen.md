# Foto der Kette beim Messen

Auftrag: Noah «1a 2a 3a 4a 5a» (03.11.2026, Thread «Untersuchen: Velos-Pflege besser einbauen»), Teil 3a. Teil 3 von 7.

## Was ist neu
- Im Fenster «Kette messen» steht unter der Skala «Foto der Kette» mit «Foto machen» (am Computer «Foto wählen»). Das Foto kommt mit Datum und km zu «Verschleiss-Fotos» und liegt dort neben den alten; danach erscheint «Foto gespeichert.» mit einem Link dorthin.
- Das Speichern eines Fotos steht jetzt an einer Stelle (`addWearShot` in `griffdb.js`); die Seite «Verschleiss-Fotos» nutzt dieselbe.

## Was fällt weg oder rutscht tiefer
- nichts. «Verschleiss-Fotos» bleibt unverändert und in «Mehr für das Velo».

## Selbst entschieden
- Das Foto wird sofort gespeichert, unabhängig von «Speichern» des gemessenen Werts (so geht es nicht verloren, wenn du das Fenster schliesst). Löschen geht auf der Seite «Verschleiss-Fotos».
- «Nach dem Ersetzen eines Teils» kommt nicht in diesen PR (dort ist die Stelle ein eigener Dialog); das wäre ein späterer kleiner Schritt.

## Stand im Plan
- Velos-Pflege einbauen: Teil 3a «Foto beim Messen» erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › «Kette messen»: unter der Skala «Foto der Kette».
2. Ein Foto machen: «Foto gespeichert.» mit Link; dort ist das Foto bei «Kette».
