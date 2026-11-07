# Start ohne Netz: ein zweiter Versuch

Auftrag: Noah 06.11.2026 «1a» (Frage 1 im Etappenbericht 6), Befund E6-010 (Klasse B).

## Was ist neu
- Beim Start ohne Netz blieb der Bildschirm im Test etwa jedes sechste Mal leer («Failed to fetch dynamically imported module» für die Hauptdatei), obwohl die Datei im Offline-Speicher liegt. Die Ursache liegt im Browser beim Holen der Datei und liess sich nicht eingrenzen.
- Jetzt lädt die App sich bei diesem Fehler einmal selbst neu (`src/main.js`). Ein Merker in `sessionStorage` (`pg.bootRetry`) verhindert eine Schleife und wird nach einem gelungenen Start gelöscht.
- Test `tests/e2e/start-neustart.spec.js` (erfundene Seite, die Hauptdatei wird beim ersten Mal blockiert): rot ohne Fix (leerer Bildschirm), grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur ein zweiter Versuch, kein Dauer-Neuladen. Scheitert auch der zweite, steht der Fehler wie bisher in der Konsole.
- Die Ursache selbst bleibt offen; ob es auf deinem Handy auch vorkommt, prüfst du (Bericht, «Nur Noah»).
- Keine neuen Texte, keine neue Funktion: keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: E6-010 behandelt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Flugmodus an, App öffnen: sie öffnet mit Heute.
2. App mehrmals schliessen und neu öffnen: der Bildschirm bleibt nie leer.
