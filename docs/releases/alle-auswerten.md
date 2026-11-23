# Auswerten: Alles, was du angelegt hast

PR folgt · 23.11.2026 · Auftrag: Noah «bei den analysen sollen immer alle angelegten dinge ausgewertet werden» (Thread «Analyse-Seite viel besser machen»), «kannst du damit schon beginnen?»

## Was ist neu
- Auf Auswerten (`#/auswerten`) steht unter «Letzte 7 Tage» eine geschlossene Zeile **«Alles, was du angelegt hast»**. Sie öffnet dieselbe Liste wie im Wochenrückblick, aber für den gewählten Zeitraum (Woche, Monat, Jahr, Alles, eigener Zeitraum): jede Aktivität aus Aktiv mit Mal, Tagen, Ziel pro Woche und gemessener Zeit, auch tägliche Gewohnheiten (Liegestütze, Zähneputzen, Yoga), Erholung und Rituale (Sauna, Meditation …), Sportarten ohne Ziel und solche mit 0 Mal (geschlossene Zeile «n Aktivitäten ohne Mal in diesem Zeitraum»).
- Strava-Einheiten ohne Haken stehen mit «davon n nur von Strava, noch nicht gezählt»; Strava-Sportarten ohne eigene Aktivität in Aktiv als eigene Zeilen.
- Rechnung: `alleRange` in `src/lib/flow/alle-woche.js` (die Wochenliste ruft dieselbe Funktion), Karte `src/lib/flow/AlleWoche.svelte` (mit `period` und `bare`).

## Was fällt weg oder rutscht tiefer
- Nichts. «Im Fokus», die Kacheln und «Letzte 7 Tage» bleiben, wie sie waren; die neue Liste steht geschlossen darunter.

## Selbst entschieden
- Die Liste steht als geschlossene Zeile in `Overview.svelte`, nicht als neue Karte oben (Content first). Sie folgt dem Zeitraum-Schalter.
- «Aktiv › Statistik» (`#/flow/stats/<sport>`) bleibt eine Seite mit Messwerten von Strava und Garmin pro Sportart; Haken ohne Messung zählen dort nicht, sondern hier und im Wochenrückblick.
- Die Liste baut auf PR «Wochenrückblick: Alles, was du angelegt hast» auf (gleiche Rechnung, gleiche Wörter).
- Fertig-Regel: Seite (`docs/app-stand.md`) ergänzt; Absprung, leerer Zustand und nächster Schritt unverändert (die Zeile fehlt, wenn nichts angelegt ist).

## Entscheide
- `docs/decisions/alle-woche.md` (gilt weiter)

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung am Plan.
