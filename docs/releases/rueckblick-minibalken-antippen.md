# Rückblick: die kleinen Balken zum Antippen

PR 14 (#1206) · 08.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme antippbar und genau machen»), Rückblick, `MiniBars`

## Was ist neu
- `MiniBars.svelte` (die kleinen Balken) nutzt jetzt `BarChart`: Achse ab 0, Zahl auf jedem Balken, genauer Wert einer Tour oder Fahrt beim Zeigen, Tippen öffnet ein Fenster (Wert, Durchschnitt, «Der davor» / «Der danach»), «Als Tabelle» listet die Touren, neueste zuerst. Der Durchschnitt bleibt die gestrichelte Linie.
- Das gilt an drei Orten: «Relative Effort» und «Belastung» in «Puls und Leistung», «Touren im Vergleich» (Rückblick) und «Dein Tempo». Die Listen der Balken tragen jetzt den Namen der Tour oder Fahrt (`name`).
- Der Wächter `charts-rules` zählt `MiniBars.svelte` zu den fertigen Diagrammen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Balken sind etwas höher und haben eine Achse; die Kacheln ändern sich sonst nicht.

## Selbst entschieden
- Eine Tour ohne Wert hat keinen Balken (vorher ein dünner grauer Strich); im Zeigen und in der Tabelle steht «–».
- Die neueste Tour bleibt in der Aktionsfarbe.
- Ein Schritt pro PR; `InZahlen` kommt einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 14 (Rückblick, kleine Balken). Danach `InZahlen`, Unterwegs, Rennen, Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick › Dein Tempo (ab fünf Fahrten): auf einen Balken von «Geschwindigkeit pro Fahrt» zeigen, Fahrt und km/h stehen darüber.
2. Einen Balken antippen: Fenster mit Wert und Durchschnitt, «Der davor» / «Der danach» blättern.
3. «Als Tabelle» antippen: die Fahrten mit ihren Werten, neueste zuerst. Ebenso bei «Relative Effort» in «Puls und Leistung».
