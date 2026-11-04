# Alle Verbindungen in einer Liste

Auftrag: Noah «3a» (Thread «Verbessere Status-Meldungen aller Verbindungen»)

## Was ist neu
- Ich › Verbindungen zeigt unter jeder Verbindung (Strava, Fitbit, Google Kalender/Aufgaben, Trello) die gemeinsame Statuszeile, solange ein Holen läuft: «Strava: holt … 12 s.»
- Ist das letzte Holen gescheitert, steht der Grund in einem Satz und «Zuletzt erfolgreich geholt: …».
- Trello hat eine eigene Zeile in der Liste.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Grund ist ein kurzer Satz für alle gleich (`reasonLine`); die genaue Meldung steht weiter auf der Seite der Verbindung.
- Mail und Seetemperatur bekommen keine Fehlerzeile: Mail holt nur auf Tipp, die Seetemperatur braucht keine Anmeldung.
- Strava und Google zeigen den Fehler nur bis zum Neuladen der App (er liegt nur im Speicher); Fitbit behält ihn, weil dort der letzte Versuch gespeichert wird.
- Kein Schema, nichts unter api/, keine Daten geändert.

## Stand im Plan
- Status aller Verbindungen: fertig (Fitbit, Strava, Google, Trello, Abgleich, Übersicht). Offen bleibt nur, dass Strava, Google und Trello ihren letzten Fehlversuch dauerhaft merken, falls Noah das will.
