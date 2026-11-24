# Mein Tag: «Tag planen lassen» an jedem Tag, mit Trainings und Kalender (Schritt 4c)

PR # · 23.11.2026 · Auftrag: Noah 21:13 (Fehler am Abend: «0 Einträge übernehmen»; Trainings und Kalender wurden nicht geplant; Taste fehlte an anderen Tagen)

## Was ist neu
- Die Taste «Tag planen lassen» steht an jedem Tag ab heute, nicht nur wenn eigene Einträge ohne Zeit da sind.
- Der Vorschlag plant auch Trainings, Aufgaben und Kalendertermine ohne Zeit. Kalendertermine sind nicht vorgewählt (oft ganztägig), man hakt sie an, wenn man sie planen will.
- Am Abend (oder wenn der Tag voll ist) schiebt der Vorschlag eigene Einträge auf morgen, mit dem Grund «Auf morgen verschoben: heute ist kein Platz mehr». Die Lücken von morgen werden berücksichtigt. Trainings und Kalender behalten ihren Tag und bleiben ohne Zeit, wenn heute nichts mehr passt.
- Die Zeit für Trainings, Aufgaben und Kalendertermine liegt als eigene Schicht in der Einstellung `week.times` (`'<Eintrag>@<Tag>': 'HH:MM'`); die Einträge selbst ändern sich nicht. `buildWeek` legt die Zeit darüber (`planned: true`), darum zeigen Woche und Mein Tag dieselbe Zeit.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Für vergangene Tage steht die Taste nicht (es gibt nichts mehr zu planen).
- Die Zeit-Schicht ist eine neue Einstellung im bestehenden Speicher `settings`: kein neues Dexie-Schema, kein neues Backup-Format, kein `api/`. Das Backup nimmt alle Einstellungen mit; der Live-Test läuft mit einer Kopie eines Backups mit erfundenen Daten. Zeiten älter als 60 Tage werden beim Speichern entfernt.
- Eine Zeit lässt sich über «Rückgängig» zurücknehmen; ein eigenes Entfernen für Trainings-Zeiten folgt mit dem Wochenplan (Frage an Noah).

## Beitrag zu den Zielen (Noah 18:09)
- Klarheit: die Taste ist an jedem Tag am selben Ort; jede Zeile nennt ihren Grund, auch «auf morgen».
- Auffindbarkeit: Planen steht direkt über der Zeitleiste, an jedem Tag.

## Stand im Plan
- «Mein Tag» Schritt 4 fertig; als Nächstes Ist/Soll zum Wochenplan mit Noah (a/b-Fragen), dann Schritt 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» öffnen, morgen wählen: die Taste «Tag planen lassen» steht da.
2. Tippen: Einträge ohne Zeit (auch Training) haben eine Zeit und einen Grund; einen Kalendertermin anhaken plant ihn mit.
3. «Übernehmen»: sie stehen in der Zeitleiste; «Rückgängig» nimmt sie zurück. Am Abend steht bei eigenen Einträgen «Auf morgen verschoben».
