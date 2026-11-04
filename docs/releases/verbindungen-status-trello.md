# Trello zeigt, was es gerade tut

Auftrag: Noah «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a» (Thread «Verbessere Status-Meldungen aller Verbindungen»)

## Was ist neu
- In der Box «Trello» (Planen › Merken) steht beim Abgleich die gemeinsame Zeile: «Trello: holt … 12 s.»
- Bei Fehler endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».
- Jeder Aufruf ohne Antwort endet nach 60 s («Trello hat nicht rechtzeitig geantwortet. Was auf diesem Gerät ist, bleibt.»). Dauert schon das Lesen des Boards über 2 Minuten, wird nichts nach Trello geschrieben.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Das 2-Minuten-Limit gilt nur vor dem Schreiben nach Trello. Ein schon begonnener Schreibaufruf wird nur durch die 60 s des einzelnen Aufrufs begrenzt, so wie bisher bei einem Netzfehler.
- Kein Schema, nichts unter api/, keine Daten geändert.

## Stand im Plan
- Status aller Verbindungen: Fitbit, Strava, Google, Trello und Abgleich fertig. Als Nächstes die Übersicht unter Ich › Verbindungen.
