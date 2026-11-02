# Kochen nach dem Training

PR #(folgt) · 30.10.2026 · Auftrag: Noah «a» (Bezug zum Training zuerst, 29.10.2026), Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»

## Was ist neu
- Auf der Kochen-Seite steht eine kleine Karte, wenn du heute oder gestern Velo gefahren bist (mindestens 20 km): «Du bist heute 40 km gefahren». Darunter die Gruppen «Protein-Bomben», nach 60 km oder mehr auch «Carbs». Ein Tipp öffnet die Gruppe in der Liste.
- Die Karte liest die Fahrten, die schon in der App sind (`src/lib/kochen/training.js`), und speichert nichts. «Heute ausblenden» schliesst sie.

## Was fällt weg oder rutscht tiefer
- nichts. Ohne Fahrt sieht die Seite aus wie vorher; mit einer Fahrt rutscht «Alle Rezepte» um die Karte tiefer.

## Selbst entschieden
- Schwellen: ab 20 km zählt eine Fahrt, ab 60 km kommen Carbs dazu. Beides ist eine Konstante und leicht zu ändern.
- Nur Fahrten (Velo), keine anderen Sportarten; Gruppen werden über die Standardgruppe erkannt: hast du «Carbs» gelöscht oder ersetzt, fehlt der Knopf, ohne Fehler.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kochen (Ziel 5 Alltag): Bezug zum Training gebaut. Später: Link zur Suche im Online-Shop.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Fahrt von 40 km für heute anlegen (Touren oder Velos).
2. Planen › Alltag › Kochen: die Karte «Du bist heute 40 km gefahren» steht über «Alle Rezepte».
3. «Protein-Bomben» tippen: die Liste zeigt diese Gruppe.
