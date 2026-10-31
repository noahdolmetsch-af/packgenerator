# Test für Strava-Ticks hängt nicht mehr am heutigen Datum

PR #468 · 31.10.2026 · Auftrag: Noah «freigabe für alle» (Thread «Mini-Tools zum Teilen mit Leuten planen»)

## Was ist neu
- Nichts Sichtbares. Der Test `tests/stravaticks.test.js` rechnete mit dem echten Heute; ab 31.10. lag sein Beispieltag ausserhalb der «letzten Tage» und er schlug rot an. Er nutzt jetzt das gleiche eingefrorene Datum wie der Rest des Tests. `setSport` nimmt dafür ein optionales `now` (ohne Angabe wie bisher).
- Wichtig: Dieser Test hat den Pages-Lauf auf `main` blockiert (Fair auslosen, #457, war deshalb noch nicht online).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Fix liegt in der PR «Wann muss ich losfahren», weil nur ein Branch erlaubt ist und diese PR sonst ebenfalls rot bleibt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Die Seite lädt wie vorher; Pages-Lauf auf `main` ist grün.
2. Aktiv › Verbindungen: Sportart-Tabelle zeigt weiter die gewählten Aktivitäten.
