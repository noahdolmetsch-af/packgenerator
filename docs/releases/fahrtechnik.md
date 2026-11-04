# Fahrtechnik-Tagebuch

PR #872 · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 3 von 6

## Was ist neu
- Im Rückblick (offen und gespeichert) steht unter «Wie anstrengend war es?» die Karte «Was hast du geübt?»: Spitzkehren, Bremsdosierung, steile Anstiege, schnelle Abfahrten, nasse Strasse, Schotter, Fahren in der Gruppe, Wiegetritt. Ein Tipp hakt ab, ein zweiter nimmt weg; unter jeder abgehakten steht «Ging gut» / «Noch unsicher» (`src/lib/tourenc/SkillPick.svelte`).
- Neue Seite «Fahrtechnik-Tagebuch» unter Touren › Rückblick (`#/debrief/technik`, `src/lib/technik/Technik.svelte`): pro Technik, wie oft du daran gearbeitet hast, das letzte Mal und wie es ging; dazu «Das will ich üben» und ein Übungsort.
- Die Techniken sind eine App-Liste (Ich › Listen und Typen): umbenennen, ergänzen, ausblenden, löschen.
- Die Antworten stehen im Feld `skills` am Rückblick, Wunsch und Ort in einem Einstellungs-Eintrag `fahrtechnik`; keine neue Tabelle, alles geht mit der Sicherung mit.
- Rechenregeln in `src/lib/technik.js`, Test `tests/technik.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die acht Vorschläge sind meine Auswahl aus deinen Beispielen (Spitzkehren, Bremsdosierung, steile Anstiege …) plus vier übliche; alles änderbar.
- Wünsche stehen im Tagebuch oben; im Rückblick steht bei einer gewünschten Technik «das wolltest du üben» und sie steht zuerst.
- Der Übungsort ist ein freier Text bis 60 Zeichen.
- Nur beschreiben, nie erklären: die Seite sagt, was abgehakt wurde, nie warum eine Technik schwer ist.
- Fertig-Regel: Seite (`f.technik` in `src/lib/featreg/fahrtechnik.js`), Absprung (Link in der Karte und eine Zeile unter «Mehr» im Rückblick), Gut zu wissen (nicht nötig: die Seite steht nicht in `ON_PAGES`), leerer Zustand (Empty-Karte mit Link zu den Rückblicken), Als Nächstes (der Link in der Karte führt zum Tagebuch), Zeile in `docs/app-stand.md`.

## Stand im Plan
- Persönliches Lernen: Idee 3 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Den Rückblick einer Fahrt öffnen: unter «Was hast du geübt?» «Spitzkehren» abhaken und «Noch unsicher» tippen.
2. Touren › Rückblick › Fahrtechnik-Tagebuch: bei «Spitzkehren» steht «1-mal geübt».
3. «Das will ich üben» tippen und einen Ort schreiben; er bleibt nach dem Verlassen der Seite.
