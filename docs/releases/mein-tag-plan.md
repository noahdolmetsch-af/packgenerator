# Mein Tag: «Tag planen lassen» (Schritt 4b)

PR # · 23.11.2026 · Auftrag: Noah «ja» (11:48), Plan `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md`, Punkt 4

## Was ist neu
- Auf «Mein Tag» (Reiter «Tag») steht neben «Eintrag hinzufügen» die Taste «Tag planen lassen», wenn der Tag eigene Einträge ohne Zeit hat. Ein Fenster schlägt für jeden eine freie Lücke vor, mit Grund («Frei nach …»), Luft nach den anderen Blöcken für den Weg und nie über der Mittagszeit (12–13 Uhr). Heute beginnt der Vorschlag nach der aktuellen Zeit.
- «Leichter» legt nur die Hälfte ein und lässt mehr Luft, «Härter» legt alle ein mit wenig Luft und einem längeren Tag. Jede Zeile lässt sich abwählen. Erst «Übernehmen» speichert die Zeiten, mit «Rückgängig».
- Hinweise: Regen bei einer Sporteinheit, ein voller Tag (mehr als 6 Stunden belegt), später Tag. Es sind Regeln, keine KI.
- Neue Rechnung `planDay` in `src/lib/tag/plan.js` (mit Tests).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Vorschlag betrifft nur eigene Einträge (`week.items`: Termine und To-dos ohne Zeit). Trainings und Kalendereinträge ohne Zeit bekommen noch keinen Vorschlag: dafür braucht es eine Zeit-Einstellung pro Sportart (eine Datenänderung, mit Backup-Kopie-Test); das kommt als eigener Schritt.
- Die Taste erscheint nur, wenn es etwas zu planen gibt, und nicht für vergangene Tage (eine Hauptsache pro Bildschirm).
- Kein neues Schema, kein Backup-Format, kein `api/`. Keine neue Funktion in `features.js`: es ist ein Teil von «Mein Tag» (`f.meintag`).

## Beitrag zu den Zielen (Noah 18:09)
- Klarheit: die Taste steht nur da, wo sie etwas bewirkt, und das Fenster sagt zu jeder Zeile den Grund.
- Auffindbarkeit: der Vorschlag steht direkt über der Zeitleiste, nicht in einem Menü.

## Stand im Plan
- «Mein Tag»: Schritt 4 (Plan mir den Tag) gebaut für eigene Einträge; Trainings-Zeiten folgen. Danach Schritt 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» an einem Tag mit einem Eintrag ohne Zeit öffnen, «Tag planen lassen» tippen.
2. Jeder Eintrag hat eine Zeit und einen Grund; «Leichter» und «Härter» ändern den Vorschlag.
3. «Übernehmen» tippen: die Einträge stehen in der Zeitleiste; «Rückgängig» nimmt sie zurück.
