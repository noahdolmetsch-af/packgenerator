# Mein Tag: Zeitleiste ab «jetzt», leerer Tag ruhig, letzter Reiter (4a + 5a)

PR # · 23.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (21:15) zur Prüfung von Heute und Mein Tag, Bericht `/mnt/project-files/notes/impeccable-heute-mein-tag-2026-11-23/bericht.md`, Fund 2, 3, 4

## Was ist neu
- Heute beginnt die Zeitleiste eine Stunde vor «jetzt» (nicht mehr um 06:00). Frühere Stunden sind einmal hochscrollen entfernt; ein früherer Eintrag zieht den Beginn immer vor sich (nichts fällt weg). Andere Tage beginnen wie bisher um 06:00.
- «jetzt» steht rechts an der Linie, nicht mehr über der Stundenzahl.
- Ein leerer Tag zeigt nur seine Meldung mit «Woche öffnen»; die Stunden stehen hinter einer zugeklappten Zeile «Zeitleiste zeigen».
- Der Hilfesatz «Was du in der Woche planst …» steht nur noch unter «Tag», nicht unter «To-dos» und «Abhaken» (er war dort nicht der Seite entsprechend).
- «Mein Tag» öffnet mit dem zuletzt benutzten Reiter (Tag, To-dos oder Abhaken). Gemerkt nur auf diesem Gerät (`localStorage` `pg.tag.tab`); eine Tagesadresse (`#/day/2026-…`) zeigt immer «Tag». «Zurück zu heute» führt jetzt zu `#/day/<heute>`.

## Was fällt weg oder rutscht tiefer
- Die Stunden 06:00 bis eine Stunde vor «jetzt» sind heute einmal hochscrollen entfernt (Einträge dort zeigen den Beginn früher an).
- Die leeren Stunden eines leeren Tags stehen hinter «Zeitleiste zeigen».
- Der Hilfesatz unter «To-dos» und «Abhaken» fällt weg (stand dort nicht passend).

## Selbst entschieden
- «jetzt» rechts statt links: links liegt die Stundenzahl; rechts liegt es über der Linie und verdeckt höchstens den Rand eines Blocks.
- Reiter-Gedächtnis nur im Browser, keine Datenänderung, kein Backup betroffen.
- Texte («Was jetzt?»-Satz, «Heute» unter «Heute 2», Uhrzeit im To-dos-Reiter) und der schlanke Kopf kommen als eigene PRs.

## Beitrag zu den Zielen (Noah 18:09)
- Klarheit: heute sieht man sofort die Stunde, in der man ist; ein leerer Tag zeigt nur, was er sagt.
- Auffindbarkeit: das Häufige (Abhaken) steht beim nächsten Öffnen vorne, wenn man es zuletzt benutzt hat.

## Stand im Plan
- «Mein Tag» Prüfung (impeccable) Fund 2 bis 4 erledigt; als Nächstes Texte, dann Kopf.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» heute: die Stunden beginnen kurz vor «jetzt».
2. Einen leeren Tag wählen: Meldung und «Zeitleiste zeigen».
3. «Abhaken» tippen, wegnavigieren, «Mein Tag» wieder öffnen: es öffnet auf «Abhaken».
