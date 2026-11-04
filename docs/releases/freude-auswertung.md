# Freude als Auswertung

PR #865 · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 6 von 6

## Was ist neu
- Im Rückblick (offen und gespeichert) steht unter «Wie anstrengend war es?» die Karte «Was hat es gut gemacht?» mit vier kleinen Skalen: Fahrspass, Natur, Flow, Gesellschaft. Jede geht von 1 bis 5, jede ist freiwillig, ein zweiter Tipp auf die gewählte Zahl nimmt sie weg (`src/lib/tourenc/JoyPick.svelte`).
- Neue Seite «Was hat es gut gemacht?» unter Touren › Rückblick (`#/debrief/freude`, `src/lib/freude/Freude.svelte`): die Mittelwerte der vier als Balken und jede Tour mit ihren Antworten; ohne Antwort sagt sie warum und führt zu den Rückblicken.
- Ab drei Touren mit Antworten sagt auch die Karte im Rückblick eine Zeile, welche der vier im Schnitt am höchsten war («Bei 4 Touren war «Natur» im Schnitt am höchsten (4,5 von 5)»). Nur zählen, nie erklären.
- Die Antworten stehen im Feld `joy` am Rückblick, ohne neue Tabelle; sie gehen mit der Sicherung mit.
- Rechenregeln in `src/lib/freude.js`, Test `tests/freude.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Statt Schieber vier Zahlenreihen 1 bis 5: ein Schieber kann «nicht beantwortet» nicht ausdrücken, und Tippflächen von 44 px sind auf dem Handy sicherer.
- Gleichstand an der Spitze: die Zeile sagt «keines der vier sticht heraus», sie wählt nichts aus.
- Die Mindestzahl 3 und die Skala 1 bis 5 sind Vorschläge im Code (`MIN_TOURS`, `MAX`).
- Fertig-Regel: Seite (`f.joy` in `src/lib/featreg/freude-auswertung.js`), Absprung (Link in der Karte und eine Zeile unter «Mehr» im Rückblick), Gut zu wissen (`wissen/zurueck.js`, falls die Seite später in `ON_PAGES` kommt), leerer Zustand (Empty-Karte auf der Seite), Als Nächstes (nicht nötig: der Rückblick geht weiter), Zeile in `docs/app-stand.md`.

## Stand im Plan
- Persönliches Lernen: Idee 6 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Den Rückblick einer Tour öffnen: unter «Was hat es gut gemacht?» bei Fahrspass eine 4 tippen, sie bleibt markiert.
2. Die 4 noch einmal tippen: die Antwort ist weg.
3. Touren › Rückblick › «Was hat es gut gemacht?»: deine Antwort steht in den Mittelwerten und in der Tourenliste.
