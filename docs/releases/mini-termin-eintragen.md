# Antworten eintragen

PR · 01.11.2026 · Auftrag: Noah «2a» (Thread «Umfrage-Antworten in der App ansehen»)

## Was ist neu
- «Wer kann wann»: Knopf «Antwort eintragen». Name, pro Tag Geht / Vielleicht / Geht nicht, Notiz. Fehlende Namen aus «Wen hast du gefragt?» kann man antippen.
- Jede Zeile hat einen Stift zum Ändern. Eine Antwort vom Server ändern legt eine eigene Kopie an, die Originalantwort wird auf deiner Liste ersetzt.
- «Antwort löschen» fragt zuerst und hat Rückgängig.
- Alles bleibt auf diesem Gerät (`manual`, `hide` an der Frage in db.settings «mini-tools»). Die Person sieht es nicht und bekommt keine Nachricht. Kein neues Schema, kein api/.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine geänderte Server-Antwort wird lokal ersetzt, nicht auf dem Server geändert (die Antwort ist nur für den Ersteller lesbar, der Server kann sie nicht lesen).
- Eigene «Du»-Zeile bleibt wie bisher.

## Stand im Plan
- Ergebnisseite Termin finden: Schritt 2 von 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Termin-Frage öffnen, «Antwort eintragen», Name und Antworten, «Speichern»: Zeile und «Bester Tag» ändern sich.
2. Stift der Zeile: ändern. «Antwort löschen» und «Rückgängig».
