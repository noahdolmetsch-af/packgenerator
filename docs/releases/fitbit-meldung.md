# Gesundheitswerte sagen, wann sie geholt sind

PR folgt · 1.11.2026 · Auftrag: Noah 1.11.2026 («dasselbe für Fitbit, Google, Strava», Antwort «a»)

## Was ist neu
- Nach «Jetzt holen» in der Karte Gesundheitsdaten (`src/lib/health/HealthCard.svelte`) steht «Fertig: N Tage geholt» oder «Fertig: nichts Neues»; Fehler wie bisher.
- Strava zeigt schon «N neue Fahrten geholt / Keine neuen Fahrten» (nichts zu ändern).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Zahl aus `syncHealth().changed`; Server und Holen unverändert.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Rückmeldung nach dem Holen: Sync (#533), Strava vorhanden, Gesundheit jetzt; Google (Kalender, Mail), Trello, Inbox folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten › Gesundheitsdaten: «Jetzt holen» tippen.
2. Danach steht «Fertig: …» unter der Liste.
