# Mein Tag: Einträge ergänzen, ändern, löschen und ziehen (Schritt 2)

PR # · 23.11.2026 · Auftrag: Noah «ja», «freigabe»; Plan `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md` (Thread «Neue Seite «Mein Tag» bauen»)

## Was ist neu
- «Eintrag hinzufügen» auf «Mein Tag»: ein Termin oder To-do mit Name, Tag, Zeit und Länge (Einstellung `week.items`, dieselbe Liste wie in der Woche).
- Ein Tipp auf einen eigenen Eintrag öffnet ein kleines Fenster: ändern oder löschen (mit «Rückgängig»). Andere Einträge (Training, Kalender, Touren) öffnen sich weiter dort, wo sie leben.
- Ziehen: am Griff eines eigenen Eintrags auf eine andere Zeit (Viertelstunden) oder auf den Tag-Chip oben (die Zeit bleibt); am unteren Rand die Länge. Jede Änderung bietet «Rückgängig» an. Mit der Tastatur: Pfeil hoch/runter verschiebt um eine Viertelstunde, mit Umschalt ändert sich die Länge.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Gezogen wird nur an einem Griff (rechts oben) und am unteren Rand, nicht am ganzen Block: ein Tipp auf den Block öffnet das Fenster, und die Seite lässt sich am Handy weiter scrollen.
- Zeiten für Einheiten des Trainingsplans und «Ziehen aus Ohne Zeit auf die Zeitleiste» kommen mit den To-dos (Schritt 3), weil sie eine neue Einstellung brauchen.
- Datenänderung im weiteren Sinn: Schritt 2 schreibt Nutzerdaten, aber nur die bestehende Einstellung `week.items` in derselben Form wie die Woche (`cleanItem`); kein neues Schema, kein Backup-Format, kein `api/`.
- Backup-Kopie-Prüfung (23.11.2026): die Kopie des Backups von Noah vom 23.11. 04:47 (nicht im Repo) wurde nur gelesen. Alle 9 Einträge von `week.items` kommen durch `itemsOf` unverändert (keiner fällt weg), und eine Änderung von Zeit und Dauer an jedem lässt Id, Name, Art, Tag und Haken gleich. Es wurde nichts in die App geschrieben.

## Stand im Plan
- «Mein Tag»: Schritt 2 von 6 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» öffnen, «Eintrag hinzufügen» tippen, Name und Zeit eintragen, speichern.
2. Den Griff des neuen Eintrags eine Stunde nach unten ziehen; «Rückgängig» tippen.
3. Den Eintrag antippen und löschen; «Rückgängig» holt ihn zurück.
