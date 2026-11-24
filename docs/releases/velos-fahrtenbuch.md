# Velos: Fahrten-Buch und Inspektion vorn

PR (offen) · 24.11.2026 · Auftrag: Noah 24.11.2026 «K1-K9 und Veloinspektion und Logbuch nach vorne holen» (Sitemap, Aufgabe «Velos und Material», K1)

## Was ist neu
- Direkt unter den Velo-Karten stehen zwei Zeilen für das gewählte Velo: **«Fahrten-Buch»** («Jeder km zählt · 3'100 km») und **«Inspektion starten»** (Kurzcheck, mit «letzter Check: vor n Tagen» oder «noch kein Check»).
- Das Fahrten-Buch hat eine eigene Seite: `#/bikes?tab=care&view=km`, der gleiche Block wie in Pflege › Mehr, nur ohne «Mehr» zu öffnen (`KmBookPage.svelte`, wird erst beim Öffnen geladen).

## Was fällt weg oder rutscht tiefer
- nichts. Das Fahrten-Buch in Pflege › Mehr bleibt, die Inspektion in der Pflege auch; die neuen Zeilen sind ein zusätzlicher, kürzerer Weg.

## Beitrag zu den Hauptzielen
- **Klarheit:** zwei Dinge, die man am Velo oft braucht, stehen dort, wo man die Velos sieht.
- **Auffindbarkeit:** das Fahrten-Buch war zwei Tipps tief; die Inspektion vor einer Tour steht vorn, auch wenn sie noch nie benutzt wurde.
- **Leitfaden:** «das Velo im Griff haben» (Touren und Velo).

## Selbst entschieden
- Die Zeilen gelten für das **gewählte** Velo (die Karte mit dem Rand; ohne Wahl das erste).
- «Inspektion starten» öffnet den Kurzcheck (`level=quick`), nicht die Übersicht der Inspektionen.
- Kein neuer Eintrag in `features.js`: das Fahrten-Buch ist dieselbe Funktion wie in Pflege, hier nur mit eigener Adresse; sie steht als Zeile in `docs/app-stand.md`.
- Der «Weiter zu»-Absprung auf der Pflege-Seite wird nicht doppelt gebaut (Auftrag).

## Entscheide
- `docs/decisions/velos-fahrtenbuch.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
