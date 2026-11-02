# Wer hat geantwortet

PR · 01.11.2026 · Auftrag: Noah «1a» (Thread «Umfrage-Antworten in der App ansehen»)

## Was ist neu
- Ergebnisseite «Termin finden»: oben die Karte «Wen hast du gefragt?». Namen eintippen (auch mehrere mit Komma), Chips zeigen «hat geantwortet» oder «fehlt noch», dazu ein Fortschrittsbalken.
- Wer antwortet, aber nicht auf der Liste steht, erscheint als «nicht auf deiner Liste» und zählt weiter in der Tabelle.
- «Erinnern»: schreibt eine Nachricht an die Fehlenden für den Gruppenchat (WhatsApp-Link, du sendest selbst).
- Namen entfernen mit Rückgängig. Gespeichert in `invited` der Frage (db.settings «mini-tools»), kein neues Schema.

## Was fällt weg oder rutscht tiefer
- nichts. «Bester Tag» und «Wer kann wann» rutschen um die neue Karte tiefer.

## Selbst entschieden
- Name gilt als geantwortet bei gleichem Namen, Gross/Klein egal.
- Nur für «Termin finden» in diesem Schritt; Umfrage und Anmeldeliste folgen, wenn du es willst.

## Stand im Plan
- Ergebnisseite Termin finden: Schritt 1 von 5 (Eintragen/Ändern, Termin festlegen, Ersteller-Hinweis, «neu»-Zahl folgen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Mini-Tools › eine Termin-Frage öffnen: oben «Wen hast du gefragt?».
2. Zwei Namen eintippen: beide «fehlt noch». Hat jemand geantwortet: «hat geantwortet».
