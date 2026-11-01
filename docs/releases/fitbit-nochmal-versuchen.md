# Fitbit-Abruf hängt nicht mehr

Auftrag: Noah, Screenshots 1.11.2026 (Thread «Fix Fitbit holt keine Daten»)

## Was ist neu
- Der Abruf fragt den Server in Fenstern von 30 Tagen (vorher 90 Tage in einer Anfrage, die auf dem Server minutenlang dauern konnte).
- Jede Anfrage bricht nach 40 Sekunden ab (Code `timeout`); die Karte zeigt eine Meldung und den Knopf «Nochmal versuchen».
- Was schon angekommen ist, wird sofort gespeichert; «fertig» (FILL_V) gilt erst, wenn alle Fenster liefen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- 30-Tage-Fenster und 40 s Limit; Server (`api/`) unverändert.
- Ursache ist aus dem Code gefolgert (FILL_V 4 holt einmal 90 Tage mit ~25 Google-Aufrufen nacheinander), nicht aus Server-Logs belegt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › «Jetzt holen».
2. Der Knopf endet; Werte erscheinen oder eine Meldung mit «Nochmal versuchen».
