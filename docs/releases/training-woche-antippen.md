# Training, Wochen: Diagramme zum Antippen

PR #859 · 04.11.2026 · Auftrag: Noah «ja PR 6» (Thread «Diagramme klickbar machen»), PR 6 von 8, erster Teil von «Training» (die vier Wochen-Analysen; Fahrt folgt)

## Was ist neu
- Die vier Diagramme von Aktiv › Training › Woche › «Analysen über die Wochen» (`AnaWLoad`, `AnaForm`, `AnaPCurve`, `AnaEff`) laufen über die gemeinsamen Bausteine (`BarChart`, `LineChart`): Achse mit runden Stufen und feinen Linien, genaue Zahlen beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster, «Als Tabelle».
- «Belastung pro Woche»: Fenster mit der Woche und ihren Aktivitäten (je ein Link). «Fitness, Müdigkeit und Form»: die drei Zahlen jeder Woche. «Leistungskurve»: beide Bestwerte je Dauer mit dem Tag, von dem sie stammen. «Effizienz»: ein Tag pro Spalte, jede Fahrt ein Punkt, dazu der Trend.
- `LineChart` kann jetzt auch Punkte ohne Linie und Linien nur mit Punkten (`line: false`, `dots: true`).

## Was fällt weg oder rutscht tiefer
- nichts. Legenden, Unterschriften, die Summe «Form = Fitness − Müdigkeit» und das Ausblenden der Karten bleiben.

## Selbst entschieden
- Die Leistungskurve zeigt die fünf Dauern in gleichen Abständen (vorher nach Logarithmus verteilt), damit jede Dauer eine eigene Spalte zum Zeigen hat.
- Die aktuelle Woche ist weiter heller (45 %), ohne eigenen Klassennamen im Test.
- `tests/charts-rules.test.js` kennt jetzt auch `LineChart` als gemeinsamen Baustein.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 6 von 8 (Training, Wochen). Danach Training Fahrt, Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training › Woche, zu «Belastung pro Woche» scrollen und auf einen Balken zeigen.
2. Eine Woche antippen: das Fenster zeigt ihre Aktivitäten.
3. «Als Tabelle» über einem der vier Diagramme antippen.
