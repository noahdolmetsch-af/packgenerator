# Abgleich bleibt nicht mehr hängen

Auftrag: Noah 03.11.2026, «datenabgleich zwischen computer und smartphone funktioniert nicht richtig … fehlt 1 velo (canyon lux)».

## Was ist neu
- Kann das Handy einen einzelnen Eintrag nicht speichern (zum Beispiel Speicher voll), wird er übersprungen. Alle anderen Einträge kommen an.
- Ich › Daten und Backup › Handy und Computer nennt den Eintrag. Nach 30 Minuten holt der Abgleich ihn von selbst nochmals.
- Ein volles Handy meldet «kein Platz mehr» statt «Serverfehler».

## Was fällt weg oder rutscht tiefer
- nichts

## Ursache (geprüft mit Test `tests/sync-bad-record.test.js`)
Vorher brach die ganze Runde beim ersten nicht speicherbaren Eintrag ab. Alles dahinter kam nie an, bei jedem Versuch am gleichen Punkt. Die Meldung sagte nur «Serverfehler».

## Selbst entschieden
- Wiederholung nach 30 Minuten, damit das Handy-Netz nicht jede Runde belastet wird.
- Keine Daten gelöscht oder überschrieben; kein Schema-Wechsel.

## Nicht in diesem PR
- Datenverlust des Handys nach Updates (vermutlich löscht der Browser den Seitenspeicher): offen, siehe Bericht im Thread.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › Handy und Computer › «Jetzt abgleichen»: «Fertig» erscheint.
2. Fehlt auf dem Handy noch etwas, steht eine Zeile mit dem Namen des Eintrags da.
