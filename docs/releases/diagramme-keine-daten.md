# Keine Daten statt 0

22.11.2026 · Auftrag: Noah «alle sieben Punkte» (Diagramme besser), Schritt 3 von 7 · `src/lib/charts/nodata.js`, `BarChart.svelte`, `Readout.svelte`, Sportjahr, Rückblick pro Sportart

## Was ist neu
- Ein Balken für eine Zeit, die noch nicht da ist, sagt «Noch nicht». Ein Balken vor deiner ersten Aufzeichnung sagt «Keine Daten in diesem Zeitraum». Beides statt «0 h».
- Das Diagramm startet beim neuesten Balken mit Daten, nicht bei einem Monat in der Zukunft (vorher stand dort «Dezember 2026, 0»).
- In der Tabelle stehen dafür Striche. Ein echter Nullwert (ein Monat nach der ersten Aufzeichnung ohne Training) bleibt eine 0.
- Der Baustein: `cols[i].none` in `BarChart`, jedes andere Balkendiagramm kann es nutzen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur Sportjahr und Rückblick pro Sportart bekommen es jetzt. «Meine Woche» bleibt, weil dort auch kommende Wochen einen Plan zeigen, der nicht verschwinden soll.
- Auf Linien-Diagrammen sind Lücken schon Lücken (keine Linie bei fehlenden Werten).

## Entscheide (für decisions/)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Schritt 3 von 7. Danach Vergleich, Sätze, Weiterführen, Zeitraum je Seite merken.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › Jahr: die Zeile über dem Diagramm zeigt den neuesten Monat mit Daten.
2. Auf einen kommenden Monat zeigen: «Noch nicht» statt «0 min».
3. «Als Tabelle»: kommende Monate zeigen einen Strich.
