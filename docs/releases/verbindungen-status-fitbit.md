# Fitbit zeigt, was es gerade tut

Auftrag: Noah «1a 2 fitbit, strava, google dann abgleich und alle anderen 3a» (Thread «Verbessere Status-Meldungen aller Verbindungen»)

## Was ist neu
- Gemeinsame Statuszeile `src/lib/ui/ConnStatus.svelte` (Texte in `src/lib/ui/connstatus.js`, auf #724 aufgebaut): «Fitbit: holt … 12 s. 30 von 90 Tagen geholt.»
- Bei Fehler steht am Ende «Zuletzt erfolgreich geholt: …».
- Ein ganzes Fitbit-Holen endet nach 2 Minuten (Noah «1a»). Was schon da ist, bleibt, die älteren Tage folgen beim nächsten Mal.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die rote Fehlerzeile und «Zuletzt versucht» bleiben, nur «Zuletzt erfolgreich» kommt dazu.
- Die Zeile steht nur auf der Fitbit-Karte (Ich › Fitbit). Heute behält «Stand 07:42».
- Kein Schema, nichts unter api/, keine Daten geändert.

## Stand im Plan
- Status aller Verbindungen: Fitbit (Teil 1). Als Nächstes Strava, Google Kalender/Aufgaben, dann Abgleich und Trello, zuletzt die Übersicht unter Ich › Verbindungen.
