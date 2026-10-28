# Tour-Bereitschaft als ein Diagramm

PR #? · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Diagramme klickbar machen»), PR 4 von 8 (K4, Antwort 4a)

## Was ist neu
- «Form und Erholung» › Tour-Bereitschaft (`src/lib/flow/form/FormTour.svelte`, `tourtage.js`): ein Diagramm von 7 Tagen vor der Tour bis zum letzten Tourtag. Achse mit runden Stufen, dein Normal als Streifen, «Start» bei Tag 1, die Tourtage hell hinterlegt.
- Die letzten Touren liegen gestrichelt über denselben Tagen; jede ist ein Schalter. Tage, die noch kommen, sind offene Kreise.
- Zeigen oder Pfeiltasten: der Tag in der Zeile darüber, für alle Touren. Tippen oder Enter: das Fenster mit Datum, Ruhepuls gegen dein Normal und Schlaf jeder Tour; «Tag davor» / «Nächster Tag». «Als Tabelle»: die Tage als Zeilen.
- «Verlauf»: Touren liegen als helle Streifen hinter Fitness und Müdigkeit; das Fenster eines Tourtages nennt die Tour.

## Was fällt weg oder rutscht tiefer
- Die Säulen pro Tourtag und die Zeile «Ruhepuls der letzten 7 Tage: …» werden zum Diagramm (alter Weg: Säulen und Zahlenzeile → neuer Weg: dieselben Zahlen an den Punkten und im Diagramm).
- Die Liste «Deine letzten Touren: Ruhepuls pro Tag» wird zu Linien im selben Diagramm; die Zahlen stehen im Fenster und in «Als Tabelle».

## Selbst entschieden
- Ohne Wahl zeigt die Zeile über dem Diagramm heute (vor der Tour) oder den heutigen Tourtag.
- Die Seite «Form» ist damit aus der Liste der offenen Diagramme.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 4 von 8. Danach Training, Körperwerte, Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Form und Erholung › Tour-Bereitschaft: ein Diagramm mit «Start» und −7 bis −1.
2. Einen Tag antippen: das Fenster zeigt den Ruhepuls dieser und früherer Touren.
3. Im «Verlauf» liegt eine vergangene Tour als heller Streifen.
