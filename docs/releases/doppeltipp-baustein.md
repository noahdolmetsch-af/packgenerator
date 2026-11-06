# Speichern gilt einmal, in jedem Fenster

PR #<Nummer> · 06.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Antwort «5a»), Thread «Durchklicken Etappe 4: Velos und Alltag»

## Was ist neu
- Ein zweiter Tipp auf denselben «Speichern»-Knopf innerhalb von 0,45 Sekunden tut nichts mehr. Das gilt für alle Fenster und Formulare der App auf einmal (`src/lib/ui/doubletap.js`, eingehängt in `src/main.js`), nicht nur für Merken und Notizen.
- Betroffen sind nur Knöpfe, die ein Formular abschicken (`type="submit"`) und der Hauptknopf («hi») in einem Fenster oder Formular. «+»/«−»-Knöpfe, Reiter und alle anderen Knöpfe bleiben wie sie sind.

## Was fällt weg oder rutscht tiefer
- nichts. Wer absichtlich zweimal innerhalb von 0,45 Sekunden auf denselben Speichern-Knopf tippt, bekommt einmal gespeichert (das war nie gewollt).

## Selbst entschieden
- Ein globaler Fänger statt Umbau von über 200 Fenstern. `once()` in `ui/ask.js` bleibt für Arbeit, die sich auch nach 0,45 Sekunden nicht überlappen darf. Die Einzel-Absicherungen aus E4-003 (#976) und E4-004 (#984) bleiben als zweites Netz.
- Test `tests/doubletap.test.js` (Regel) und `tests/e2e/doppeltipp-baustein.spec.js` (Notiz und To-do mit Doppeltipp, erfundene Daten): vorher rot, nachher grün.

## Entscheide (für decisions.md)
- Doppeltipp-Schutz: ein gemeinsamer Baustein (Noah 06.11.2026 «5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Klasse-D-Idee 5 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen, etwas schreiben, zweimal schnell «Speichern» tippen: Die Notiz steht nur einmal in der Liste.
2. Planen › Merken › «To-do hinzufügen», zweimal schnell «Speichern»: das To-do steht einmal da.
