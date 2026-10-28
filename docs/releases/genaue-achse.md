# Genaue Werte in Diagrammen: der gemeinsame Baustein

PR #<offen> · 27.10.2026 · Auftrag: Noah «die Diagramme sollen exakte Daten zeigen, nicht nur Schätzungen anhand ungenauer Skalen am Rand … und überall sonst auf der Webseite» (Thread «Analyse-Tool mit allen Werten»)

## Was ist neu
- Ein gemeinsamer Baustein für alle Diagramme der App:
  - `src/lib/charts/axis.js`: `niceScale(werte, { zero, count, steps })` gibt runde Stufen (0, 25, 50 km; 6 h, 7 h, 8 h), `tickText`, `minuteText`, `fracOf`, `LABEL_MAX`.
  - `src/lib/charts/GridLines.svelte`: feine Gitterlinien an den Stufen, im `<svg>`.
  - `src/lib/charts/YTicks.svelte`: die beschrifteten Stufen neben dem Diagramm, mit Einheit.
- Im Bild ändert sich mit diesem PR noch nichts. Die Analyse-Diagramme und danach die anderen Seiten nutzen ihn in eigenen kleinen PRs.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Beide Enden der Achse liegen auf einer runden Stufe, damit auch oben und unten eine Zahl steht.
- Minuten (Schlaf, Dauer) bekommen Stufen in Stunden («7 h», «7 h 30»).
- Bis 12 Punkte steht die Zahl direkt am Punkt (`LABEL_MAX`).

## Entscheide (für decisions.md)
- 27.10.2026: Diagramme zeigen genaue Werte (Regel für alle Diagramme).

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool und «Diagramme klickbar»: nutzen den Baustein.

## Prüfschritte
- Nichts zu sehen; die Tests prüfen die Stufen (`tests/charts-axis.test.js`).
