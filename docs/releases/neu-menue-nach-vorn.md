# Das Neu-Menü beginnt mit dem, was du am meisten brauchst

Auftrag: Noah «1-5a» (Nutzersicht Punkt 4) und «5a» (Aufgabe «Häufiges nach vorn», Thread «Versteckte Inhalte auffindbar machen»); Entscheid Koordinator: «Wiegen» und «Tour planen nach oben» in einem PR für das Neu-Menü.

## Was ist neu
- **Reihenfolge im Neu-Menü:** «Tour planen» und «Schnellstart» (Gruppe «Touren») stehen zuerst, danach «Merken» (To-do, Liste), «Check», Material, Velos, Aktiv und Notiz.
- **«Taschen wiegen»:** neue Zeile in der Gruppe «Touren», ein Tipp von jeder Seite führt in die erste Tasche, die noch keine gewogene Zahl hat (`#/pack?weigh`, abgesprochen mit dem Packen-Besitzer; `BagWeigh`).
- **Textfeld und Notfall am Ende:** das Textfeld («Tippe, was du behalten willst …») und die Notfall-Zeile stehen jetzt am Ende des Menüs. Der Notfall bleibt rot, ist aber kleiner (44 px statt 56 px hoch).

## Was fällt weg oder rutscht tiefer
- Das Textfeld und der Notfall standen ganz oben im Menü, jetzt ganz unten (ein Wisch mehr). «Tour planen» stand an fünfter Stelle, jetzt an erster. Sonst nichts; alle Zeilen, `data-new-*`-Marken und Wege bleiben.

## Selbst entschieden
- «Wiegen» bedeutet hier das Wiegen der gepackten Taschen am Starttag (so steht es in `docs/app-stand.md`, «Taschen am Starttag wiegen»); es führt über `#/pack?weigh` in die erste noch nicht gewogene Tasche. Der Knopf in der Packliste selbst gehört dem Packen-Besitzer.
- Der letzte Satz von Nutzersicht Punkt 4, das Tourfenster mit «Mehr Angaben» («Wann, Wie lange, Velo oben»), ist nicht in diesem PR: er betrifft das Tourfenster, nicht das Menü, und bleibt ein eigener kleiner PR.
- Keine Datenänderung: kein Dexie-Schema, kein Backup-Format, kein `api/`, kein Sync.

## Entscheide (eigene Datei `docs/decisions/neu-menue-nach-vorn.md`)
- 23.11.2026: «Taschen wiegen» im Neu-Menü, Reihenfolge nach Nutzersicht Punkt 4.

## Stand im Plan
- Häufiges nach vorn: Wiegen (5a) im Neu-Menü gebaut, «Tour planen» ganz oben; der Knopf in der Packliste folgt beim Packen-Besitzer.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Plus-Knopf antippen: ganz oben «Tour planen» und «Schnellstart», dann «Taschen wiegen».
2. «Taschen wiegen» antippen: die erste Tasche ohne gewogene Zahl öffnet zum Wiegen.
3. Im Menü ans Ende scrollen: das Textfeld und die rote, kleinere Notfall-Zeile stehen dort.
