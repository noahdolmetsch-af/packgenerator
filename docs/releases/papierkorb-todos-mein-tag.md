# «Zuletzt gelöscht» für To-dos und Mein Tag

Auftrag: Noah «1a» (23.11.2026, Thread «Zuletzt gelöscht und weitere Bausteine»), Folge von `docs/releases/zuletzt-geloescht.md`

## Was ist neu
- Ein gelöschtes To-do (Mein Tag › To-dos und Merken, auch Geburtstag und Pflanze) und ein gelöschter Eintrag in Mein Tag / Woche warten 30 Tage unter Ich › Daten › «Zuletzt gelöscht».
- Zwei neue Arten im Filter: «To-dos» und «Mein Tag». «Zurück» legt den Eintrag ans Ende seiner Liste; gibt es schon einen mit gleicher Nummer, bleibt der bestehende.
- ⌘Z / Strg Z nimmt auch diese Löschungen zurück; «Rückgängig» gleich nach dem Löschen nimmt den Papierkorb-Eintrag wieder weg.
- Technik: Diese Daten liegen als Liste in einem Einstellungs-Eintrag (`merken`, `week.items`), nicht in einer Tabelle. Der Papierkorb-Eintrag hält darum das einzelne Stück (`trashItem`, Zeile `@list`); die Tabelle `trash` und die Sicherung ändern sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts. Rückgängig mit 8 Sekunden bleibt wie es war.

## Selbst entschieden
- Die Erinnerung zu einer Idee (Ideen › «Erinnern») wird nur weggenommen, nicht gelöscht: kein Papierkorb-Eintrag (`removeTodo(…, { trash: false })`).
- Erledigte To-dos, die die App selbst aufräumt, und Wochen-Einträge, die nach 60 Tagen verfallen, kommen nicht in den Papierkorb (es sind keine Löschungen des Nutzers).
- Die Ziel-Listen «Training» und «Ferien» der Woche sind noch nicht angeschlossen (eigene Löschwege, kommen als nächste kleine PR bei Bedarf).
- Keine Änderung am Speicher oder an der Sicherung; trotzdem liegt Noahs Sicherung vom 23.11.2026 bereit.

## Entscheide (eigene Datei `docs/decisions/papierkorb-todos-mein-tag.md`)
- 24.11.2026: To-dos und Mein-Tag-Einträge kommen in «Zuletzt gelöscht».

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Mein Tag › To-dos: ein To-do antippen, löschen; Ich › Daten › «Zuletzt gelöscht» öffnen: es steht dort als «To-dos».
2. «Zurück» tippen: es ist wieder in der Liste.
3. Einen Eintrag in Mein Tag löschen und genauso zurückholen.
