# Merken: Ein Doppeltipp auf «Speichern» legt nur einmal an

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Thread «Durchklicken Etappe 4: Velos und Alltag»), Befund E4-003

## Was ist neu
- Planen › Merken: Tippte man im Fenster «To-do» zweimal schnell auf «Speichern», wurde das To-do doppelt angelegt, und die Konsole meldete einen Fehler («Cannot read properties of null»). Jetzt gilt nur der erste Tipp. Dieselbe Absicherung steht in den Fenstern Geburtstag, Pflanze und Liste und bei «Löschen»; nachgestellt (vorher rot) ist der Fehler beim To-do.
- Ursache: Das Speichern wartet auf die Datenbank. Der zweite Tipp lief in dieser Zeit noch einmal durch, bevor das Fenster zu war.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die drei Fenster-Dateien in `src/lib/merken/` (To-do, Geburtstag und Pflanze, Liste): gleiche Ursache, gleiche Änderung. Andere Fenster der App sind im Etappenbericht als «prüfen» vermerkt und nicht geändert.
- Regressionstest `tests/e2e/doppelklick-speichern.spec.js` (erfundene Daten): vorher rot (zwei Zeilen), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Befund E4-003 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Merken › «To-do hinzufügen», etwas schreiben, zweimal schnell «Speichern» tippen: Das To-do steht nur einmal in der Liste.
2. Dasselbe bei «Neue Liste» (Liste anlegen): nur eine neue Liste.
