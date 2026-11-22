# Tempo pro Velo zählt nur echte Fahrten

22.11.2026 · Fehlermeldung von Noah: «Canyon Lux: Trail 25.3 km/h · 236 Fahrten, aber erst vor ein paar Wochen gekauft». Strava zeigt für das Canyon Lux nur 13 Fahrten.

## Was ist neu
- «Pro Velo und Untergrund» (Touren › Rückblick) zählt eine Fahrt nur noch für ein Velo, wenn sie bei diesem Velo in den km zählt oder in dessen Startwert liegt.
- Fahrten, die noch in «Zum Prüfen» warten, hängen nur am **vorgeschlagenen** Velo. Sie zählten bisher trotzdem mit. Jetzt zählen sie erst, wenn du das Velo bestätigst. Entfernte Fahrten zählen auch nicht mehr.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zahlen im Raster werden kleiner und stimmen jetzt mit den Fahrten beim Velo überein. Das gilt auch für die Tempo-Schätzung einer Tour (sie nutzt dasselbe Raster).

## Selbst entschieden
- Fahrten im Startwert eines Velos zählen weiter (sie wurden auf diesem Velo gefahren).
- Die Zahl «Deine Regel» (alle Fahrten) bleibt wie sie war, nur die Zuordnung zu einem Velo ändert sich.
- Keine Datenänderung: es wird nur anders gelesen.

## Ursache
`tempoRides` (`src/lib/review/werte.js`) nahm das Velo einer Strava-Fahrt aus dem Ledger-Eintrag, ohne dessen Zustand zu prüfen. Unklare Fahrten werden aber als «open» mit dem vorgeschlagenen Velo gespeichert (`importEntries`), «removed» behält sein Velo ebenfalls.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › «Pro Velo und Untergrund»: beim Canyon Lux steht eine Zahl nahe an den 13 Fahrten von Strava, nicht mehr 236.
2. Velos › Canyon Lux: die Zahl der Fahrten dort passt zum Raster (Fahrten in «Zum Prüfen» fehlen im Raster).
