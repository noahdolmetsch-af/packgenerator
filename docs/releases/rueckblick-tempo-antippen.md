# Rückblick: «Tempo über die Monate» zum Antippen

PR 11 · 07.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme klickbar machen»), PR 11, Rückblick (Teil 1)

## Was ist neu
- «Tempo über die Monate» (`PaceMonths`, Rückblick › Dein Tempo) nutzt jetzt `BarChart`: Achse in km/h mit runden Stufen, genaue Zahlen beim Zeigen oder mit den Pfeiltasten (km/h, Fahrten, Ø Puls), Tippen öffnet ein Fenster mit allen Werten des Monats (Tempo, Fahrten, Puls, Leistung, Zeit in den Zonen), «Als Tabelle» listet alle Monate, neuester zuerst. Spalten ohne Werte fehlen in der Tabelle.

## Was fällt weg oder rutscht tiefer
- Die Punkte des Ø-Pulses unter den Balken sind kein eigenes Diagramm mehr; der Ø-Puls steht jetzt beim Zeigen über dem Diagramm, im Fenster und in der Tabelle. Das waagrechte Wischen entfällt.
- Bei mehr als 12 Monaten stehen die Zahlen nicht mehr auf jedem Balken (sonst überlappen sie auf dem Handy), sie stehen beim Zeigen darüber.

## Selbst entschieden
- Die kleinen Balken der zweiten Karte «Puls und Leistung pro Monat» bleiben (sie zeigen den neuesten Wert, die Tabelle hat alle Monate). Ein zweiter Schritt kann sie auch zu Diagrammen machen.
- Ein Schritt pro PR: die übrigen Rückblick-Diagramme (`HeartPower`, `MiniBars`, `InZahlen`, `Rueckblick` im Tagebuch) kommen einzeln.
- Die Monatsnamen in der Tabelle sind kurz («Okt. 26»), damit sie auf dem Handy passen.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 11 (Rückblick: Tempo pro Monat). Danach übrige Rückblick-Diagramme, Unterwegs, Rennen, Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick › Dein Tempo, zu «Tempo über die Monate» scrollen und auf einen Balken zeigen: Monat, km/h, Fahrten und Puls stehen darüber.
2. Einen Monat antippen: ein Fenster zeigt alle Werte, «Monat davor» und «Nächster Monat» blättern.
3. «Als Tabelle» antippen: alle Monate, neuester zuerst.
