# «Wie war's?» als Liste

PR · 27.11.2026 · Auftrag: Noah «1a 2a 3b» (Thread «Wie war's? nach Fitbit-Aktivität reparieren»)

## Was ist neu
- Die Karte «Wie war's?» auf Aktiv (`FeelAsk.svelte`) zeigt alle offenen Trainings der letzten 3 Tage (Strava und Fitbit gemischt, das neuere zuerst) als Liste, zuerst drei, dazu «n weitere zeigen».
- Nach jeder Antwort und nach «Später» steht 8 Sekunden eine Meldung mit «Rückgängig» (Strava stellt die Felder der Aktivität wieder her, Fitbit die Einstellung `training.healthfeel`).
- Antworten zu Rad-Trainings der Uhr zählen in Auswerten bei «Gefühlte Anstrengung der Fahrten» (`fitFeelByDay`, `ctx.fitFeel`).
- Neue reine Funktionen `feelAllToAsk` und `healthAllToAsk`; `feelToAsk` und `healthToAsk` geben wie bisher das erste.

## Was fällt weg oder rutscht tiefer
- Die Karte zeigt nicht mehr nur eines; mit mehr als drei offenen Trainings stehen die übrigen hinter «n weitere zeigen».

## Selbst entschieden
- 3 Zeilen sichtbar, der Rest auf Tipp (Inhalt zuerst, Karte nicht höher als der Bildschirm).
- Fitbit-Antworten zählen nicht im Wochenplan-Vergleich (dort sind Fitbit-Trainings keine Aktivitäten).
- Die zwei e2e-Tests mit zwei offenen Trainings sind auf die Liste umgestellt (eine Zeile statt «eine Karte nach der anderen»), nichts gelockert.

## Entscheide (eigene Datei `docs/decisions/wiewars-liste.md`)
- 27.11.2026: «1a 2a 3b», siehe dort.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf «Woche» (Aktiv): mit mehreren offenen Trainings steht die Liste.
2. Tippe bei einem «gut»: «Gespeichert: «gut»» mit «Rückgängig»; «Rückgängig» bringt es zurück.
