# Rückblick: die kleinen Balken zum Antippen

PR 14 (#1206) · 08.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme antippbar und genau machen»), Rückblick, `MiniBars`

## Was ist neu
- `MiniBars.svelte` (die kleinen Balken) ist jetzt das ganze Diagramm in der Karte (Noah «A», 08.11.2026), auf `BarChart`: Achse ab 0, Zahl auf jedem Balken, Datum darunter, der Durchschnitt als gestrichelte Linie mit Zahl, Zeigen nennt Tour und Datum mit Wert, Tippen öffnet ein Fenster (Wert, Durchschnitt, «Der davor» / «Der danach»), «Als Tabelle» listet die Touren, neueste zuerst.
- Das gilt an drei Orten: «Relative Effort» und «Belastung» in «Puls und Leistung», «Touren im Vergleich» (Rückblick) und «Dein Tempo». Die Listen der Balken tragen jetzt Name und Datum der Tour oder Fahrt (`name`, `date`).
- Der Wächter `charts-rules` zählt `MiniBars.svelte` zu den fertigen Diagrammen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Diagramme sind grösser (150 px hoch, Kacheln mindestens 280 px breit, vorher 140/170 px); in «Puls und Leistung» steht das Diagramm unter der Zahl statt daneben.

## Selbst entschieden
- Eine Tour ohne Wert hat keinen Balken (vorher ein dünner grauer Strich); Zeigen und Tabelle zeigen «–».
- Bei mehr als 8 Balken steht das Datum unter jedem zweiten.
- «Tempo, flach bis hügelig» ist nach Steigung sortiert, nicht nach Datum; die Daten darunter stehen deshalb nicht in Reihenfolge.
- Ein Schritt pro PR; `InZahlen` folgt einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 14 (Rückblick, kleine Balken). Danach `InZahlen`, Unterwegs, Rennen, Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick › Dein Tempo (ab fünf Fahrten): auf einen Balken von «Geschwindigkeit pro Fahrt» zeigen, Fahrt und km/h stehen darüber.
2. Einen Balken antippen: Fenster mit Wert und Durchschnitt, «Der davor» / «Der danach» blättern.
3. «Als Tabelle» antippen: die Fahrten mit ihren Werten, neueste zuerst. Ebenso bei «Relative Effort» in «Puls und Leistung».
