# Umschalter, die gleiten

PR (B15) · 27.10.2026 · Auftrag: Noah «ich möchte b13 bis b24 alle umsetzen. 1a 2a 3a 4a 5a» (Thread «Planen Bausteine B13 bis B24»)

## Was ist neu
- Bei jedem Umschalter (z. B. «12 Monate · 2026 · Alle», «Aktiv · Auswerten») gleitet die weisse Markierung in 0,25 Sekunden zur neuen Wahl, statt zu springen.
- Ein gemeinsamer Baustein (`Seg.svelte`), darum gilt es in der ganzen App.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Markierung wird am gewählten Knopf gemessen, so stimmt sie auch, wenn eine Reihe am kleinen Handy auf zwei Zeilen umbricht.
- Beim Öffnen einer Seite steht sie sofort am richtigen Platz; gleiten nur bei einem Wechsel.
- Runde Auswahl-Chips (Aktiv) bleiben wie sie sind; bei «Bewegung reduzieren» springt die Markierung.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Bausteine B13 bis B24: B15 gebaut; als Nächstes B19 Hochheben beim Sortieren.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick öffnen, oben rechts «Alle» tippen: die weisse Markierung gleitet hinüber.
2. Aktiv: zwischen «Aktiv» und «Auswerten» wechseln: auch hier gleitet sie.
