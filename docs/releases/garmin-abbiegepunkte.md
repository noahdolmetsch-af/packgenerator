# Abbiegepunkte für den Garmin

PR #1783 · 23.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5b» (Thread «Live-Navigation», Punkt C)

## Was ist neu
- Der FIT-Kurs für den Garmin Edge 850 und 1040 (Knopf «FIT-Kurs mit n Kurspunkten» bei der Route, unter Verpflegung, auf der Rennkarte) enthält jetzt auch die Abbiegepunkte der Strecke. Der Edge zeigt vor jedem einen Pfeil und «Links abbiegen», «Rechts abbiegen», «Leicht links» …, auch bei ausgeschaltetem Handy.
- Ein Chip «Mit Abbiegepunkten» (an) schaltet sie ab. Darunter steht, wie viele Abbiegepunkte in den Kurs kommen.
- Der Knopf steht jetzt auch, wenn keine Orte geladen sind, sobald die Strecke Abbiegungen hat.
- Nebenbei: Die Zeile «Lieber mit OsmAnd fahren?» auf der Karte «Bereit für unterwegs?» sitzt jetzt wie die zwei Zeilen darüber (Symbol links, Titel und Erklärung untereinander, Knopf rechts). Vorher liefen Titel, Erklärung und Meldung ineinander, weil die Formate nur für die Karte selbst galten; sie stehen jetzt auch in `OsmandHandoff.svelte`.
- Technik: neue Datei `src/lib/live/garminturns.js` (`turnPlaces`, `withTurns`), die Abbiegungen von `turnsOf` gehen als Kurspunkte (`left`, `right`, `slight_*`, `sharp_*`, `u_turn`) durch `toFit`.

## Was fällt weg oder rutscht tiefer
- nichts. Der GPX-Knopf bleibt, der FIT-Kurs mit Orten bleibt (Chip ausschalten gibt dieselbe Datei wie vorher).

## Selbst entschieden
- Die Abbiegepunkte sind vorgewählt: wer den Edge als Navi nutzt, will sie; ein Tipp schaltet sie ab.
- Höchstens 250 Kurspunkte (Grenze von Garmin Connect), Orte zuerst; zu viele Abbiegepunkte: die leichten fallen zuerst weg, die Zeile darunter sagt es.
- Eine Serie von Kurven («5 Kurven auf 1,2 km») und Kreisel haben keinen Typ im FIT und kommen nicht mit; eine Passstrasse mit Kehren meldet der Edge also nicht Kehre für Kehre.
- Der Edge liest Namen bis 15 Zeichen: «Links abbiegen» und «Rechts abbiegen» passen gerade.
- Nicht auf dem Edge getestet (kein Gerät hier): die Datei wird mit einem eigenen FIT-Leser im Test gelesen, wie bei den Orten.

## Entscheide (eigene Datei `docs/decisions/garmin-abbiegepunkte.md`)
- 23.11.2026: Abbiegepunkte im selben FIT-Kurs, Orte zuerst, 250 Punkte

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Verpflegung öffnen, eine Tour mit Route wählen (oder die Route-Karte einer Tour): unter den Stopps steht «FIT-Kurs mit n Kurspunkten» und der Chip «Mit Abbiegepunkten».
2. Chip ausschalten: die Zahl sinkt auf die Orte; wieder einschalten: sie steigt.
3. Den Knopf tippen, die .fit-Datei in den Ordner «NewFiles» des Edge kopieren und als Kurs fahren: vor jeder Abzweigung erscheint ein Pfeil.
