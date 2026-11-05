# Erfolgsrezepte

PR #885 · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 5 von 6

## Was ist neu
- Auf der Tour-Seite einer Velotour mit geschriebenem Rückblick steht die Karte «Ein Tag, der geklappt hat?» mit «Als Rezept speichern» (`src/lib/touren/tour/RecipeCard.svelte`). Das Formular hat Name, Frühstück, Startzeit, Verpflegung unterwegs und Tempo; Startzeit und Tempo kommen aus der Fahrt, wenn sie sie hat. Nichts wird von selbst gespeichert.
- Unter Vorlagen (`#/pack/templates`, ganz unten) stehen alle Erfolgsrezepte (`src/lib/rezept/Recipes.svelte`): ändern, umbenennen, löschen mit Rückgängig.
- In Planen einer nächsten Velotour legt ein Tipp ein Rezept daneben (`src/lib/pack/RecipePick.svelte`, Feld `recipeId` an der Tour); ein zweiter Tipp nimmt es weg. Ohne Rezept gibt es die Karte nicht.
- Die Rezepte stehen im Einstellungs-Eintrag `recipes`, ohne neue Tabelle; sie gehen mit der Sicherung mit.
- Rechenregeln in `src/lib/rezept.js`, Test `tests/rezept.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Rezepte stehen neben den Vorlagen, nicht in den Vorlagen: eine Vorlage ist eine Packliste, ein Rezept sind Gewohnheiten (Essen, Start, Tempo).
- Ein Rezept braucht einen Namen und mindestens einen Teil; die Texte sind bis 120 Zeichen lang, die Startzeit wird als HH:MM gelesen.
- Nur beschreiben, nie erklären: die App hält fest, was du schreibst, und sagt nie, warum es geklappt hat.
- Nur Velotouren, wie bei den anderen Karten dieser Reihe.
- Fertig-Regel: Seite (`f.recipes` in `src/lib/featreg/erfolgsrezepte.js`), Absprung (die Karte auf der Tour-Seite und der Link «Alle Rezepte: Vorlagen»), Gut zu wissen (`wissen/packen.js`), leerer Zustand (Satz mit Link zu den Touren), Als Nächstes (Planen bietet das Rezept an), Zeile in `docs/app-stand.md`.

## Stand im Plan
- Persönliches Lernen: Idee 5 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Die Tour-Seite einer Tour mit geschriebenem Rückblick öffnen: «Als Rezept speichern» tippen, ein Frühstück schreiben, speichern.
2. Vorlagen öffnen: das Rezept steht ganz unten mit deinem Text.
3. In Planen einer Velotour das Rezept tippen: seine Zeilen stehen daneben.
