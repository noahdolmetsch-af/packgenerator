# Sportjahr: Alles, was du angelegt hast

PR folgt · 23.11.2026 · Auftrag: Noah «bei den analysen sollen immer alle angelegten dinge ausgewertet werden» (Thread «Analyse-Seite viel besser machen»)

## Was ist neu
- Im Sportjahr (`#/auswerten/sportjahr`) steht unter «Erholung und Rituale» eine geschlossene Zeile **«Alles, was du angelegt hast»**: jede Aktivität aus Aktiv im gewählten Zeitraum mit Mal, Tagen, Ziel pro Woche und gemessener Zeit, auch tägliche Gewohnheiten (Liegestütze, Zähneputzen, Yoga), Sportarten ohne Ziel und solche mit 0 Mal (geschlossene Zeile «n Aktivitäten ohne Mal in diesem Zeitraum»). Strava-Einheiten ohne Haken stehen mit «noch nicht gezählt».
- Gleiche Rechnung und gleiche Karte wie im Wochenrückblick und auf Auswerten (`alleRange` in `src/lib/flow/alle-woche.js`, `src/lib/flow/AlleWoche.svelte`).

## Was fällt weg oder rutscht tiefer
- Nichts. Die Stunden, Diagramme, Rekorde und «Erholung und Rituale» bleiben, wie sie waren; die Zeit-Rechnung (nur Bewegung, ohne Mengen wie Liegestütze) ändert sich nicht, die neue Liste zählt Mal, nicht Stunden.

## Selbst entschieden
- Die Liste steht geschlossen unten, nicht oben (Content first), und folgt dem Zeitraum-Schalter.
- Sie liest jeden Haken wie «Haken und Rhythmus» (der Zeitraum «Alles» beginnt beim ersten aller Haken).
- Baut auf den PRs «Wochenrückblick» und «Auswerten» auf (gleiche Karte).
- Fertig-Regel: `docs/app-stand.md` ergänzt; Absprung, leerer Zustand und nächster Schritt unverändert (die Zeile fehlt, wenn nichts angelegt ist).

## Entscheide
- `docs/decisions/alle-sportjahr.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung am Plan.
