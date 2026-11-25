# Schmale Handys: Wörter bleiben ganz

PR #? · 25.11.2026 · Auftrag: Noah «Alle B und C weitergeben» (Gesamttest Runde 2, Befunde C3 und C6, `/mnt/project-files/design/gesamttest/befunde-runde2.md`)

## Was ist neu
- **C3, Analyse:** In Auswerten › Analyse brach «Vergleiche» bei 320 px in «Vergleich / e» um. Auf sehr schmalen Handys (unter 360 px) sind die Reiter etwas schmaler geschnitten und kleiner geschrieben, ein Wort bricht nie mehr innen (`src/pages/Analyse.svelte`).
- **C3, Sportseiten:** Der Reiter «Höhenmeter» (neben Distanz, Zeit, Kalorien) brach in einer Spalte von 72 px um. Jede Spalte ist jetzt mindestens so breit wie ihr längstes Wort; reicht der Platz nicht, scrollt die Reihe seitwärts (`src/pages/flow/Stats.svelte`).
- **C6, Trainingswoche:** Lange Wörter in Einheiten-Namen trennen an einer Silbe mit Bindestrich statt Buchstabe für Buchstabe (`hyphens: auto`, wie schon bei den Taschennamen am Velo; `src/pages/flow/TrainingWeek.svelte`).
- Neuer Test `tests/e2e/schmal-analyse-320.spec.js` prüft bei 320 und 390 px acht Seiten (Analyse, Wert, Auswerten, Körperwerte Herz/Schlaf, Sportseite, Fahrten, Training): kein Wort bricht innen, nichts ist ohne «…» abgeschnitten, die Namen der unteren Leiste sind ganz.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Untere Leiste:** «Auswerten» ist in der Leiste bei 320 px schon ganz (Regel für Handys unter 360 px steht seit früher in `PlaceBar.svelte`); der Befund stammt von einer älteren Version. Der neue Test hält das fest.
- **C6 «ohne … abgeschnitten»:** Mit erfundenen langen Namen fand der Test auf Analyse, Wert, Auswerten, Körperwerte, Fahrten nichts, das ohne «…» abgeschnitten wird. Die Namen der Kacheln brechen um, sie werden nicht abgeschnitten. Gefunden und behoben wurde nur der Silbenumbruch in der Trainingswoche. Falls Noah einen konkreten Namen sieht, der abgeschnitten ist, bitte Ort nennen.
- Die Einheiten-Namen in der Trainingswoche brechen bewusst um statt auf «…» zu enden (UI-Test Training, Fund 7); das bleibt.
