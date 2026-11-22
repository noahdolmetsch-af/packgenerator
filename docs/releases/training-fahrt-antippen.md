# Training, Fahrt: Diagramme zum Antippen

PR #952 · 05.11.2026 · Auftrag: Noah «ja pr 7» (Thread «Diagramme klickbar machen»), PR 7 von 8, zweiter Teil von «Training» (die Diagramme einer Fahrt)

## Was ist neu
- Sechs Diagramme einer Fahrt laufen über die gemeinsamen Bausteine: «Leistungskurve» (`LoadCurve`), «Trittfrequenz verteilt» (`AnaCadence`), «Leistungsbereiche als Balken» (`AnaPzBars`), «Ähnliche Fahrten» (`AnaSimilar`), «Ausdauer-Check» (`AnaDecouple`) und «Deine Hausrunde über die Zeit» (`AnaHomeloop`).
- Achse mit runden Stufen, genaue Zahlen beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster (Dauer, Bereich, Tag, Fahrt), «Als Tabelle».
- «Ähnliche Fahrten»: beide Achsen mit runden Stufen und feinen Linien, die Zahlen eines Punkts erscheinen beim Zeigen oder Fokussieren, «Als Tabelle» listet die Fahrten. Ein Tipp auf einen Punkt öffnet weiter die Fahrt.
- «Ausdauer-Check»: ein Tag pro Spalte, jede Fahrt ein Punkt, dazu Trend und die 5-%-Linie.

## Was fällt weg oder rutscht tiefer
- nichts. Legenden, Unterschriften, die Sätze und die Tabelle der Hausrunde bleiben.

## Selbst entschieden
- Die Leistungskurve zeigt die sieben Dauern in gleichen Abständen (vorher nach Logarithmus verteilt), damit jede Dauer eine eigene Spalte zum Zeigen hat.
- «Ähnliche Fahrten» ist ein Streudiagramm und bekommt deshalb keinen Zeit-Scrub: Zeigen auf einen Punkt oder Tab-Taste zeigt die Zahlen, Tippen öffnet die Fahrt (kein Zwischenfenster).
- Bei der Hausrunde bleibt die bestehende Tabelle unter dem Diagramm, darum kein zweites «Als Tabelle».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 7 von 8 (Training, Fahrt). Danach Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training, eine Fahrt mit Leistungsmesser öffnen, zu «Leistungskurve» scrollen und auf eine Dauer zeigen.
2. Einen Balken bei «Leistungsbereiche» oder «Trittfrequenz» antippen.
3. «Als Tabelle» über einem der Diagramme antippen.
