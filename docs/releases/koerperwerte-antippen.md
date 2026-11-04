# Körperwerte und Sportseiten: Diagramme zum Antippen

PR #831 · 04.11.2026 · Auftrag: Noah «1-5 a» (Thread «Diagramme klickbar machen»), PR 5 von 8 (Körperwerte; Training folgt als eigener PR)

## Was ist neu
- Alle Diagramme der Seite «Körperwerte» und der Sportseiten (`src/pages/flow/Stats.svelte`): Balken (Strecke, Zeit, Höhenmeter, Kalorien, Schlaf, Zonen) als `BarChart`, Linien (Ruhepuls und höchster Puls, Werte pro Tag, Blutdruck, Velo-km des Jahres) als neues gemeinsames `LineChart` (`src/lib/charts/LineChart.svelte`).
- Achse mit runden Stufen und feinen Linien, Zahl an jedem Punkt bei wenigen Punkten, ein Tag ohne Wert bleibt eine Lücke.
- Zeigen oder Pfeiltasten: die genauen Zahlen des Tages in der Zeile über dem Diagramm. Tippen oder Enter: Fenster mit dem Tag (bei Sportseiten mit den Fahrten des Tages), «Tag davor» / «Nächster Tag».
- «Als Tabelle» für jedes Diagramm. Die Punkte von «Puls nach Temperatur» sind antippbar (Zahlen, Link zur Fahrt) und haben eine Tabelle.

## Was fällt weg oder rutscht tiefer
- nichts. Die alten Balken und Linien sind durch dieselben Daten im neuen Diagramm ersetzt; Legende, Summen und Tageslisten bleiben.

## Selbst entschieden
- Schlaf wird auf der Achse in Stunden gezeigt (vorher auch), Zeit der Sportseiten ebenfalls in Stunden.
- Die Liste der offenen Diagramme (`src/lib/charts/rules.js`) verliert diese Seite.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 5 von 8. Danach Training (Woche und Fahrt), Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Körperwerte (oder eine Sportseite): auf einen Tag zeigen, die Zahlen stehen über dem Diagramm.
2. Einen Tag antippen: das Fenster zeigt den Tag, «Tag davor» führt weiter.
3. «Als Tabelle» antippen: dieselben Zahlen als Zeilen.
