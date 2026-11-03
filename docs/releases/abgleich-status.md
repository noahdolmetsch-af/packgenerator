# Abgleich-Status

Auftrag: Noah 03.11.2026: «Gleicht ab …» hing lange auf dem Handy. «Die Meldung verbessern: erfolgreich, wann zuletzt, abgebrochen, andere sinnvolle Hinweise.»

## Was ist neu
- Beim Abgleichen: «Gleicht ab … 12 s. Bisher 40 geholt.» (oder geschickt). Nach 2 Minuten der Hinweis, die App neu zu öffnen.
- Nach einem Fehler: Grund und «Zuletzt erfolgreich abgeglichen: …» (oder «Noch nie erfolgreich»).
- Neue Meldung «Der Server hat nicht rechtzeitig geantwortet».
- Ein Aufruf ohne Antwort endet nach 90 Sekunden, statt für immer zu hängen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- 90 Sekunden als Zeitlimit pro Aufruf (ein Abruf bis 3 MB im Mobilnetz).
- Kein Schema-Wechsel, keine Datenänderung, nichts unter api/.
- Der Ort bleibt die Statuszeile im Block «Handy und Computer»; keine Meldung ausserhalb von Ich › Daten und Backup (Regel 24.10.).

## Prüfschritte (nach dem Merge)
1. Ich › Daten und Backup › Handy und Computer › «Jetzt abgleichen»: Zeile mit Zeit und Zähler.
2. Danach: «Zuletzt synchronisiert …» mit Datum.
