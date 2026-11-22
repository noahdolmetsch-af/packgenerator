# Jede Sportart behält ihre Farbe

22.11.2026 · Auftrag: Noah «1a» (feste Farbe pro Sportart), Schritt 2 von 7 der Diagramme · `src/lib/charts/sportcolors.js`, Sportjahr, Rückblick pro Sportart

## Was ist neu
- Eine Sportart hat in den Diagrammen immer dieselbe Farbe, nicht mehr die nach ihrem Rang im Zeitraum (vorher wechselte Velo die Farbe, wenn man mehr lief).
- Feste Farben: Velo, Laufen, Wandern und Gehen, Tennis, Eishockey, Schwimmen, Ski. Jede andere Sportart bekommt aus ihrem Namen eine feste Farbe (zwei davon können dieselbe haben).
- Der Rückblick pro Sportart färbt seine Balken in der Farbe der Sportart (vorher immer Grün).

## Was fällt weg oder rutscht tiefer
- nichts. Die Farben im Sportjahr ändern sich für manche Sportarten einmalig.

## Selbst entschieden
- Nur diese zwei Seiten färben nach Sportart; andere Diagramme färben nach Bedeutung (Zonen, Schichten) und bleiben.
- Die Palette ist neu: feste Farben statt der Farben des Farbschemas (im Schema «Wald» war Laufen kaum von Velo zu unterscheiden); mehr als sieben Sportarten gibt es weiter als «Andere» (grau).
- Die sieben Farben sind feste Werte (Türkis, Rotorange, Gelb, Blau, Violett, Cyan, Rosa), in jedem Farbschema gleich; die Legende nennt den Namen.

## Entscheide (für decisions/)
- keine neuen (Noahs «1a» steht in der Spezifikation).

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Schritt 2 von 7. Danach «Keine Daten», Vergleich, Sätze, Weiterführen, Zeitraum je Seite merken.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › Jahr und dann Monat: Velo hat in beiden dieselbe Farbe.
2. Eine Sportart antippen (Rückblick): ihre Balken haben ihre Farbe.
