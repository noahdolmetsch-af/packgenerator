# Genaue Achsen auf der Tour-Seite

PR #350 · 27.10.2026 · Auftrag: Noah «Diagramme sollen genaue Werte zeigen … und überall sonst auf der Webseite» (Thread «Tour-Detailseite übersichtlicher machen»)

## Was ist neu
- Geschwindigkeitsprofil: km/h in runden Stufen ab 0 (zum Beispiel 0, 20, 40, 60 km/h) mit Gitterlinie bei jeder Stufe, die Einheit beim obersten Wert. Die Zeit darunter in runden Stufen (0:00, 1:00, 2:00 …) statt in Fünfteln der Fahrzeit.
- Höhenprofil (wenn Strava keine Feindaten geschickt hat): alle runden Höhenstufen mit Linie, statt nur unterster und oberster Wert; km in runden Stufen statt nur 0 und Ende.
- Ruhepuls-Punkte unter «Werte»: beide Achsen in gleichen runden Stufen, etwas Platz um die Punkte.
- Gebaut mit dem gemeinsamen Baustein `src/lib/charts/` (axis.js, GridLines, YTicks), wie alle Diagramme der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Das gezeichnete Landschaftsbild oben (TourLandscape) ist Schmuck ohne Werte und bekommt keine Achse.
- «Gleiche Strecke, andere Tage» schreibt schon die genaue Zeit an jede Säule; bleibt so.
- Das feine Höhenprofil (map/ProfileStrip) hatte schon runde Stufen; unverändert.
- Antippen der Ruhepuls-Punkte für den genauen Wert mit Datum folgt als eigener kleiner PR mit dem Baustein «Zeigen» (#331).

## Entscheide (für decisions.md)
- keine neuen (Regel «Diagramme zeigen genaue Werte» steht schon in decisions.md)

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour-Detailseite übersichtlicher: weiter geparkt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten › eine Fahrt öffnen: Das Geschwindigkeitsprofil zählt in runden Stufen ab 0 km/h, mit einer Linie bei jeder Stufe.
2. Unter «Werte» › «Ruhepuls (Fitbit)»: Beide Achsen der Punkte gehen in gleichen Stufen.
