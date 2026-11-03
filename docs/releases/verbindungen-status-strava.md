# Strava zeigt, was es gerade tut

Auftrag: Noah «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a» (Thread «Verbessere Status-Meldungen aller Verbindungen»)

## Was ist neu
- Die gemeinsame Zeile `ConnStatus` (aus dem Fitbit-PR) steht auch auf der Strava-Seite: «Strava: holt … 12 s. 40 Fahrten bisher erhalten.»
- Bei Fehler endet die rote Zeile mit «Zuletzt erfolgreich geholt: …».
- Jeder Aufruf ohne Antwort endet nach 60 s, ein ganzes Holen nach 2 Minuten (Meldung «Strava hat nicht rechtzeitig geantwortet. Es wurde nichts verändert.»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Bei Zeitablauf wird nichts gespeichert (auch lastSync nicht). Sonst würde ein halb geholtes erstes Mal später nur noch die letzten Tage holen und alte Fahrten fehlen.
- Kein Schema, nichts unter api/, keine Daten geändert.

## Stand im Plan
- Status aller Verbindungen: Fitbit und Strava fertig. Als Nächstes Google Kalender/Aufgaben, dann Abgleich, Trello und die Übersicht.
