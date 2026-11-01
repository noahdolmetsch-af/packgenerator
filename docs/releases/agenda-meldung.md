# Agenda sagt, wann sie geholt ist

PR folgt · 1.11.2026 · Auftrag: Noah 1.11.2026 («dasselbe für Fitbit, Google, Strava», Antwort «a»)

## Was ist neu
- Nach «Jetzt holen» in der Agenda (`src/pages/Agenda.svelte`) steht «Fertig: Termine und Aufgaben sind von Google auf dem neuesten Stand»; Fehler wie bisher.
- Mail zeigt beim Aktualisieren die Liste selbst als Ergebnis; dort ist keine zusätzliche Zeile nötig.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ohne Zahl, weil `fetchNow` der Agenda nur Erfolg oder Fehler meldet; Holen und Server unverändert.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Rückmeldung nach dem Holen: Sync, Gesundheit, Agenda; Trello und Inbox folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Agenda öffnen, «Jetzt holen» tippen.
2. Oben steht «Fertig: …».
