# Geschätzt und erlebt

PR #849 · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 1 von 6

## Was ist neu
- In Planen fragt eine Velotour, die noch nicht gefahren ist: «Wie anstrengend wird es?» mit einer Zahl von 1 bis 10 (Feld `expectEffort` an der Tour, `src/lib/pack/ExpectPick.svelte`). Ein zweiter Tipp auf dieselbe Zahl nimmt die Schätzung weg (mit Rückgängig).
- Auf der Tour-Seite steht nach der Fahrt «Geschätzt und erlebt» (`src/lib/touren/tour/ExpectCard.svelte`): Schätzung und Erleben nebeneinander, ein ruhiger Satz («2 Punkte anstrengender, als du geschätzt hast») und ab drei Touren, ob deine Schätzungen im Schnitt eher in eine Richtung gehen.
- Fehlt die Antwort auf «Wie anstrengend war deine Fahrt?», fragt die Karte sie mit denselben zehn Knöpfen wie in Aktiv › Training. «Erlebt» ist immer diese Antwort (eigene oder von Strava).
- Rechenregeln in `src/lib/erwartung.js`, Test `tests/erwartung.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur Velotouren (die Skala «Wie anstrengend war die Fahrt?» gibt es nur für Velofahrten).
- Keine neue Tabelle, keine Datenbank-Stufe: die Schätzung ist ein Feld an der Tour und geht mit der Sicherung mit.
- Eine bereits gefahrene Tour zeigt die Schätzung nur zum Lesen; nachträglich schätzen geht nicht (sonst wäre es keine Schätzung mehr). Ohne Schätzung gibt es keine Karte.
- «Ungefähr so wie geschätzt» heisst: weniger als 1 Punkt Unterschied. Die Richtung über mehrere Touren braucht mindestens 3 Touren mit Schätzung und Antwort.
- Nur beschreiben, nie erklären: unter dem Vergleich steht, dass wenige Touren wenig sagen und Wetter, Schlaf und Strecke jedes Mal anders sind.
- Fertig-Regel: Seite (`f.expectfelt` in `src/lib/featreg/erwartung-erlebnis.js`), Absprung (die Karte steht in Planen selbst), Gut zu wissen (`wissen/packen.js`), leerer Zustand (die Karte der Tour-Seite fragt zuerst nach der Antwort), Als Nächstes («Als Nächstes: der Rückblick»), Zeile in `docs/app-stand.md`.

## Stand im Plan
- Persönliches Lernen: Idee 1 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Velotour in Planen öffnen: unter «Wie anstrengend wird es?» eine Zahl tippen, sie bleibt markiert; dieselbe Zahl noch einmal tippen nimmt sie weg.
2. Nach einer Fahrt die Tour-Seite öffnen: «Geschätzt» und «Erlebt» stehen nebeneinander.
3. Fehlt «Erlebt», eine Zahl unter «Wie anstrengend war es wirklich?» tippen.
