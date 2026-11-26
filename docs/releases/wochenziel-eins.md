# Ein Wochenziel statt zwei

PR #NNNN · 26.11.2026 · Auftrag: Noah «Ja» auf «ohne etwas zu verlieren» (Thread «Wochenplan-Vorschläge verlässlich machen»)

## Was ist neu
- Ist ein Wochenplan gespeichert, zählen dessen Stunden als Ziel der Woche: im Rückblick und bei «Diese Woche … von … Std.» auf Training › Woche, in den Wochenseiten (Woche, Tag, Woche planen) und in «Geschafft» (`weekHours` in `src/lib/training/wochenplan.js`). Ohne Wochenplan zählt das Trainingsziel, solange sein Tag nicht vorbei ist.
- Ein Trainingsziel mit vergangenem Tag steht als «endete am …» statt «noch 0 Wochen» und zählt nicht mehr. Es bleibt gespeichert.
- Die Karte «Dein Trainingsziel» sagt «… Std. pro Woche · aus deinem Wochenplan», und das Formular erklärt, dass die Stunden des Wochenplans zählen.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zahl im Trainingsziel (zum Beispiel 10 Std.) bleibt gespeichert und gilt wieder in Wochen ohne Wochenplan.

## Selbst entschieden
- Der Wochenplan geht vor dem Trainingsziel, weil er der Plan ist, den man sieht und abhakt.
- Die alte «Woche vorschlagen»-Logik (`SuggestWeek.svelte`) bleibt: erscheint nur ohne Wochenplan, Noahs Tageslimits und Gewohnheiten sind leer, das Entfernen träfe 19 Testdateien. Ein Umzug der Tageslimits («freier Tag») in den Wochenplan nur auf Noahs Wunsch.
- Kein neuer Schlüssel, kein Schema, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/wochenziel-eins.md`)
- 26.11.2026: ein Stundenziel, Wochenplan zuerst, vergangenes Ziel zählt nicht mehr (Noah «Ja»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Woche: unter «Dein Trainingsziel» steht «… Std. pro Woche · aus deinem Wochenplan» und, bei vergangenem Tag, «endete am …».
2. «Geschafft» nach einem Abhaken: «von 15 h Wochenziel» entspricht dem Wochenplan.
