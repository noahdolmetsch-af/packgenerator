# Notizen: Ein Doppeltipp auf «Speichern» legt nur eine Notiz an

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Thread «Durchklicken Etappe 4: Velos und Alltag»), Befund E4-004

## Was ist neu
- Planen › Notizen: Tippte man bei «Neue Notiz» zweimal schnell auf «Speichern», entstanden zwei gleiche Notizen. Jetzt gilt nur der erste Tipp.
- Ursache: Das Speichern wartet auf die Datenbank. Der zweite Tipp lief in dieser Zeit noch einmal durch, bevor das Feld geleert war. Gleiche Ursache wie E4-003 (Merken), andere Seite.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur das Formular «Neue Notiz» (`src/pages/Notes.svelte`). Andere Fenster der App stehen im Etappenbericht als «prüfen».
- Regressionstest `tests/e2e/notiz-doppeltipp.spec.js` (erfundene Daten): vorher rot (zwei Notizen), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Befund E4-004 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen, etwas schreiben, zweimal schnell «Speichern» tippen: Die Notiz steht nur einmal in der Liste.
