# Auch Handy-Erinnerungen ruhen

Auftrag: Noah «bauen alles» (Thread «Klären Ruhige Ansicht»), Schritt 6 von 7

## Was ist neu
- Läuft eine Ruhige Ansicht mit Zeit (15/30/60 Min.), werden Handy-Erinnerungen in dieser Zeit kurz hinter das Ende geschoben (eine Minute auseinander, gleiche Reihenfolge). Nichts geht verloren.
- Warnungen für Wetter, Eis, Licht, Regen, Essen und Luft (`SAFETY_PREFIXES`) kommen immer pünktlich.
- «Fertig» oder «Noch 15 Min.» sendet die Liste neu: Erinnerungen gehen zurück auf ihre eigene Zeit.
- Ohne Zeit («Bis ich Fertig tippe») wird nichts gehalten, es gibt kein Ende, auf das man warten könnte.

## Was fällt weg oder rutscht tiefer
- nichts. Nur verschoben, solange die Ruhige Ansicht mit Zeit läuft.

## Selbst entschieden
- Verschoben statt gestrichen, damit keine Erinnerung verloren geht.
- Die Liste fürs Handy wird nur gesendet, wenn Handy-Erinnerungen an sind (sonst tut der Aufruf nichts). Kein neues Datenformat, kein neues File unter `api/`.

## Stand im Plan
- Ruhige Ansicht: Schritt 6 von 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ruhige Ansicht mit «30 Min.» starten: Die Karte sagt «Handy-Erinnerungen warten bis zum Ende».
