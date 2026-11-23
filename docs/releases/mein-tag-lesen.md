# Mein Tag: der Tag als Zeitleiste (Schritt 1, nur lesen)

PR # · 23.11.2026 · Auftrag: Noah «ja», «freigabe», «1a 2a 3a» (Thread «Neue Seite «Mein Tag» bauen»)

Plan: `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md`, klickbarer Entwurf (erfundene Daten): https://claude.ai/artifact/GjcNwetrcFwdw8No3MKmvm

## Was ist neu
- Neue Seite `#/day` (und `#/day/YYYY-MM-DD`), als Chip «Mein Tag» neben «Woche» unter Planen.
- Ein Tag als Zeitleiste von 06:00 bis 23:00 (weiter, wenn ein Eintrag früher oder später liegt). Sie liest die Einträge von `buildWeek` (`src/lib/woche.js`): Trainingsplan, Aktiv-Termine, Kalender, Google, Spielerplus, Touren, Ferien, eigene Termine, To-dos und Velo-Service. Es gibt keine zweite Rechnung und nichts wird doppelt gespeichert.
- Einträge ohne Uhrzeit stehen in der Zeile «Ohne Zeit» über der Zeitleiste. Ferien und Tourtage stehen als Streifen darüber.
- Tageswahl (Mo bis So mit Punkt, wenn etwas ansteht), Vortag, Folgetag, «Zurück zu heute», Wetter des Tages in Worten.
- Ein Tipp auf einen Eintrag öffnet ihn dort, wo er lebt (Training, Kalender, Touren). Eigene Einträge öffnen die Woche.
- Überschneidende Einträge stehen nebeneinander.
- Rechnung der Zeitleiste: `src/lib/tag/timeline.js` (Tests `tests/tag-timeline.test.js`).

## Was fällt weg oder rutscht tiefer
- nichts. Die Seite kommt dazu; Woche, Heute und Abhaken bleiben, wie sie sind.

## Selbst entschieden
- Ein Eintrag ohne bekannte Länge (ein Kalendertermin hat nur einen Start) bekommt die übliche Länge (Termin 60 Min, Einheit 60 Min, To-do 30 Min) und zeigt dann nur die Startzeit, nie eine erfundene Endzeit.
- Einheiten des Trainingsplans haben heute keine Uhrzeit: sie stehen unter «Ohne Zeit». Zeiten für sie kommen mit dem Ziehen (Schritt 2) in einer eigenen Einstellung.
- Wetter nur als Wort für den Tag (wie in der Woche); Wetter pro Stunde, die 90-Min-Zeile und «Plan mir den Tag» folgen in späteren Schritten.
- «Mein Tag» steht als Chip unter dem Reiter «Woche» (der Absprung); eine Zeile «Passt hier» gibt es nicht, weil dort schon vier Funktionen stehen (Wächter: höchstens 4); die Seite der Woche selbst bleibt unberührt (PR «Heute und Woche aufräumen» bleibt unabhängig).
- Keine Datenänderung: kein Schema, kein Backup-Format, keine neue Einstellung, kein `api/`.

## Stand im Plan
- «Mein Tag»: Schritt 1 von 6 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche öffnen, auf den Chip «Mein Tag» tippen: heute als Zeitleiste.
2. Oben einen anderen Tag wählen: seine Einträge stehen mit der Zeit da; «Zurück zu heute» geht zurück.
3. Einen Eintrag antippen: er öffnet sich dort, wo er lebt.
