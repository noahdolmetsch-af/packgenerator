# Challenges: Erinnerung aufs Handy für eigene Challenges

Auftrag: Noah 22.11.2026 (Challenges im Vordergrund; «Erinnerung für eigene Challenges» war geplant). Thread «Challenges in den Vordergrund stellen».

## Was ist neu
- Im Fenster einer eigenen Challenge steht das freiwillige Feld «Zeit der Erinnerung aufs Handy». Mit einer Zeit kommt jeden Tag zu dieser Zeit eine Mitteilung, solange die Challenge läuft. Ein Tag, der das Ziel schon erreicht hat, sendet keine.
- Neuer Schalter «Eigene Challenges» unter Ich › Erinnerungen aufs Handy (Gruppe «Alltag»). Er geht von selbst an, wenn du eine Zeit setzt (der Browser fragt einmal nach Mitteilungen); abschalten kannst du ihn dort.
- Nach jedem Abhaken oder Ändern bekommt das Handy seine neue Liste (wie bei «Draussen»).

## Was fällt weg oder rutscht tiefer
- Nichts. Ohne Zeit sendet eine eigene Challenge nichts, wie bisher.

## Selbst entschieden
- Die Zeit sitzt in jeder Challenge selbst (`remindAt`, leer = keine Erinnerung), nicht in einer Sammel-Einstellung: jede Challenge kann ihre eigene Zeit haben.
- Kein neues Datenformat und kein Dexie-Schema: ein freiwilliges Feld in der bestehenden Einstellung `tagesziele`; ältere Challenges ohne Feld laufen weiter ohne Erinnerung. Backup und Sync tragen das Feld wie bisher mit.
- Misslingt das Einschalten (Browser ohne Mitteilungen, Server nicht erreichbar), wird die Challenge trotzdem gespeichert und eine Meldung sagt, warum keine Erinnerung kommt.
- Draussen behält seine eigene Erinnerung (Karte auf Heute, 16:00).
- Fertig-Regel: keine neue Seite; Zeile «Challenges» in `docs/app-stand.md` und der Schalter in der Liste der Erinnerungen.
