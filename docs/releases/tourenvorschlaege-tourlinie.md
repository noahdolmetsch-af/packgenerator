# Tourenvorschläge: Tourlinie und Kartengrund

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «die tourlinie auf der tourdetailseite ist kaum zu erkennen. mehr kartenvarianten wären sinnvoll» (Thread «100 kluge MTB-Touren vorschlagen»).

## Was ist neu
- **Tourlinie:** auf der Seite einer vorgeschlagenen Tour ist die Linie dick (7 statt 4 Punkte), orange und mit breitem weissem Rand; Start und Ziel sind grösser; alle 1, 5, 10 oder 20 km (je nach Länge) steht eine Zahl auf der Linie. Die Karte ist höher (420 statt 320).
- **Kartengrund sichtbar:** unter der Karte eine Wahl: Automatisch, Landeskarte, Winterkarte, Luftbild, OpenStreetMap, Velokarte, OpenTopoMap. Das ist dieselbe Wahl wie im kleinen Ebenen-Knopf der Karte, nur gut zu sehen.

## Was fällt weg oder rutscht tiefer
- nichts (der kleine Ebenen-Knopf bleibt)

## Selbst entschieden
- Die km-Zahlen kommen aus der Linie der Tour (Luftlinie zwischen den Punkten, darum können sie leicht von der Tourlänge abweichen).
- Die Marken stehen nur auf den Tourenvorschlägen; die Tourkarte anderer Seiten ist unverändert.
- Weitere Ebenen (SchweizMobil-Mountainbike-Routen, Hangneigung über 30°) und die echte Karte auf der Übersicht folgen als eigene PRs.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-tourlinie.md`)
- 23.11.2026: kräftige Linie nur hier; der Kartengrund gilt für die ganze App.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge › eine Tour öffnen: die Linie auf der Karte ist dick und orange und hat Zahlen.
2. Unter der Karte «Luftbild» antippen: die Karte wechselt; «Automatisch» antippen: zurück.
3. Am Handy: die Wahl bricht um und passt in die Breite.
