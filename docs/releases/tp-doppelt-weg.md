# Jede TrainingPeaks-Einheit nur noch einmal

PR (Nummer folgt) · 27.11.2026 · Auftrag: Noah «training peaks einträge dreifach vorhanden. und nicht sicher ob wirklich alle sessions korrekt gezogen werden. bitte prüfen» (Thread «TrainingPeaks-Einheiten korrekt übernehmen»)

## Was ist neu
- Eine TrainingPeaks-Einheit hat jetzt eine feste Nummer aus Tag, Titel und Platz unter gleich benannten Einträgen des Tages. Bisher war es die eigene Nummer (UID) von TrainingPeaks; die ändert sich bei jedem Abruf (zwei Sicherungen vom 23. und 24.11. zeigen es). Eine Einheit, die die App nicht mehr als «ihre letzte» erkannte (abgehakt, von Hand geändert, vom anderen Gerät übernommen, oder zwei Abrufe gleichzeitig), blieb stehen, und der nächste Abruf legte eine neue Kopie daneben.
- Bestehende Kopien werden beim nächsten Abruf (oder beim Einlesen der .ics-Datei) zu einer zusammengeführt. Ein Haken bleibt, eine von dir geänderte Kopie (andere Dauer, andere Zeit) bleibt und wird beim nächsten Abruf nicht zurückgesetzt. Auch Kopien vor dem Abruffenster (vergangene Tage) werden zusammengeführt.
- Zwei Abrufe gleichzeitig (App öffnen und zurückkommen) laufen hintereinander statt durcheinander.
- Eine geänderte Startzeit einer Einheit zählt jetzt auch als «von dir geändert» und bleibt.
- Die Karte «TrainingPeaks-Plan» nennt einmal, wie viele doppelte Einträge zusammengeführt wurden.

## Was fällt weg oder rutscht tiefer
- nichts. Eine Kopie mit eigenem Inhalt wird nie gelöscht.

## Selbst entschieden
- Feste Nummer aus Tag und Titel statt UID (die UID ist nicht stabil). Eine in TrainingPeaks umbenannte Einheit gilt als neue; die alte verschwindet, wenn du sie nicht angefasst hast.
- Nur die Kopien mit gleichem Inhalt werden zusammengeführt. Ein Tag mit zwei gleich benannten Einheiten bleibt bei zwei.
- «CTS Test» steht mit 8 statt 54 Minuten in der App; Noah: «CTS test ignorieren», daher nicht angefasst.
- Der Fall «Zwift – Drift Intervals+» am Fr 27.11. (schon gefahren, zählt über Strava) ist keine geplante Einheit mehr im Feed und wird nicht geändert.
- Nichts Neues über dem Inhalt (Content first): eine Zeile in der bestehenden Karte, kein neuer Block. «Absprung», «Gut zu wissen» und «Leerer Zustand» ändern sich nicht (keine neue Funktion).

## Entscheide (eigene Datei `docs/decisions/tp-doppelt-weg.md`)
- 27.11.2026: Einheiten von TrainingPeaks werden an Tag und Titel erkannt, nicht an der UID.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Reparatur zu Klarheit und Verlässlichkeit im Training)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen › TrainingPeaks-Plan › «Neu abrufen»: die Zeile nennt, wie viele doppelte Einträge zusammengeführt wurden.
2. Training › Meine Woche, Mo 23.11.: «K3 kontrolliert (Base)» steht einmal. Ein abgehaktes Training ist noch abgehakt.
3. Noch einmal «Neu abrufen»: keine neuen Doppelten.
