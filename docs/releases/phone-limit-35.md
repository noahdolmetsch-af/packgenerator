# Handy-Tests: Zeitlimit 35 statt 45 Minuten

PR # · 05.11.2026 · Auftrag: Noah «3a» (Thread «Verbessern: GitHub-Warteschlange und Tests»)

Nichts in der App ändert sich: nur die CI (`.github/workflows/deploy.yml`).

## Was ist neu
- Ein Handy-Test-Teil (`e2e-part`) wird nach 35 statt 45 Minuten abgebrochen. Ein hängender Teil gibt seinen von 20 GitHub-Rechnern 10 Minuten früher frei, damit die Warteschlange schneller kürzer wird.
- Gemessen am 05.11.2026 (20 grüne Teile): Median unter 2 Min bei leeren Teilen, die langsamsten 26, 25 und 23 Min. 35 Min lassen also gut 9 Min Reserve. Eine Grenze von 25 Min hätte grüne Läufe rot gemacht.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- 35 statt der vorgeschlagenen 25 Min, weil die Messung zeigt, dass grüne Teile bis 26 Min brauchen (im Vorschlag stand 13 Min, das war zu knapp geschätzt).
- Nur der PR-Lauf (`deploy.yml`) ändert sich; die nächtliche Volle Prüfung bleibt bei 45.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Einen PR mit Label `ok` öffnen: die Handy-Teile laufen wie bisher grün durch.
2. In `deploy.yml` steht bei `e2e-part` `timeout-minutes: 35`.
