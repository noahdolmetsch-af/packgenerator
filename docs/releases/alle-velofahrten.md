# Alle Velofahrten

PR #? · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Strava-Fahrten, deren km schon im Startwert eines Velos stecken (`inStartKm` in src/lib/kmbook.js: Zustand «removed», Grund «start»), zählen als gefahren: in `withStravaRides` und damit für Jahresziel, «Diese Woche», «Velo im Monat», die Serie und «Du heute».
- Das Jahresziel sagt, was es zählt, und verlinkt die Fahrten, die noch auf «Passt» warten. Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Fahrten im Startwert zählen für Ziele und Serien, aber nicht noch einmal auf den Velo-km (sonst doppelt).
- Wartende Strava-Fahrten zählen erst nach «Passt», wie «Diese Woche»; das Ziel zeigt sie als Link.

## Entscheide (für decisions.md)
- 27.10.2026: Alle Velofahrten (UI-Test 0.205 T5), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T5 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten › «Jahresziele»: Die Velo-km zählen jede Fahrt; darunter steht, was gezählt wird.
2. Heute: «Diese Woche» und «Velo im Monat» zählen dieselben Fahrten.
