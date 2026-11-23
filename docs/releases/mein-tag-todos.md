# Mein Tag: der Reiter «To-dos» (Schritt 3a)

PR # · 23.11.2026 · Auftrag: Noah «dreimal ja» (11:48, über den Koordinator); Plan `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md` (Thread «Neue Seite «Mein Tag» bauen»)

## Was ist neu
- «Mein Tag» hat zwei Reiter: «Tag» und «To-dos» (Adresse `#/day/todos`).
- Der Reiter zeigt alle offenen To-dos in einer Liste, in den Gruppen von Merken: überfällig, heute, diese Woche, später, ohne Datum. Es sind die To-dos aus Merken und die, die man in «Mein Tag» auf einen Tag legt. Nichts wird kopiert: jedes bleibt dort, wo es wohnt.
- Neues To-do schreiben (Enter), mit dem Kreis abhaken, mit «Heute» auf heute legen, mit einem Tipp auf den Text ändern (Name, Tag) oder löschen. Jede Änderung bietet «Rückgängig» an.
- Einsprung: in Merken steht in der Zeile oben «To-dos in Mein Tag».

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Liste liest die bestehenden Orte (Einstellung `merken` und `week.items`) über die vorhandenen Funktionen (`merkendb.js`, `putWeek`): kein neues Schema, kein Backup-Format, kein `api/`. Eine Backup-Kopie-Prüfung war darum nicht nötig; die Funktionen sind dieselben wie in Merken.
- Wiederholende To-dos und solche mit Kilometer oder Regen als Auslöser stehen nach ihrem Datum (ohne Datum: «Ohne Datum»); Wiederholung, Schritte und Erinnerung ändert man weiter in Merken (Link unter der Liste).
- Wartende To-dos (Merken › «Wartet») bleiben in Merken.
- Gruppen: keine neue Gruppenart (die Gruppen kommen aus der Zeit), darum nichts für `GROUP_PLACES`.
- Notizen als To-dos «nur auf Tipp», Ziehen auf einen Tag und die gemeinsame Abhak-Liste kommen als eigene kleine PRs (3b, 3c).

## Stand im Plan
- «Mein Tag»: Schritt 3a von 6 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» öffnen, «To-dos» tippen.
2. «Garage anrufen» schreiben, Enter: es steht unter «Ohne Datum».
3. «Heute» daneben tippen: es steht unter «Heute». Den Kreis tippen: abgehakt, «Rückgängig» holt es zurück.
