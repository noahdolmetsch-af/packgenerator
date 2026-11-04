# Schweizer Berge statt Everest

PR (noch offen) · 03.11.2026 · Auftrag: Noah «E und F» (Paket E, Idee 25, Thread «Bauen: Touren als Sammlung»)

## Was ist neu
- Vergangene Touren: neben «um die Erde» und «Everest» eine dritte Karte, die die Höhenmeter des gewählten Zeitraums in einem Schweizer Berg zählt, z. B. «1.2× Säntis», mit Balken und «Noch n m bis zum 2. Mal Säntis».
- Der Berg passt sich selbst an (der höchste, den die Höhenmeter mindestens einmal erreichen). Unter «Vergleichen mit» lässt er sich ändern; die Wahl bleibt gemerkt (Einstellung `far.mountain`, mit im Backup).
- Berge: Üetliberg 870 m, Rigi 1798 m, Pilatus 2128 m, Säntis 2502 m, Eiger 3967 m, Matterhorn 4478 m, Dufourspitze 4634 m (`src/lib/pageinfo/berge.js`).

## Was fällt weg oder rutscht tiefer
- nichts. Erde und Everest bleiben; die drei Karten stehen nebeneinander (Handy untereinander).

## Selbst entschieden
- Zusätzlich zum Everest, nicht statt: wie in Noahs Idee «zusätzlich zum Everest».
- Ort: dort, wo der Everest schon steht (Vergangene Touren, gewählter Zeitraum). Eine Wochen-Zeile in Aktiv («diese Woche») gibt es nicht: Aktiv zeigt den Everest nicht.
- Zählung wie beim Everest: abgerundet auf eine Dezimale, damit nichts zu früh versprochen wird.
- Bergnamen sind Eigennamen und gehen nicht durch `t()`. Die Karte hängt am Schalter «Nur nützliche Tipps» wie Erde und Everest.
- Kein neuer Eintrag in `features.js`: Erweiterung von «Alle Tipps» (Erde und Everest); nur die Suchwörter (Säntis, Berge, Matterhorn) kamen dazu.
- Kein Schema, kein Backup-Format (neue Einstellung `far.mountain` wie jede andere Einstellung).

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Ideen Bewegung: Idee 25 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Vergangene Touren: neben Erde und Everest steht die Karte mit dem Berg.
2. Unter «Vergleichen mit» einen anderen Berg wählen: die Karte zählt neu und merkt sich die Wahl.
