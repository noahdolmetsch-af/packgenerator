# Dauer nachtragen und Zählen?: Ort in «Was ist neu» (Reparatur)

22.11.2026 · Auftrag: Bündler-Befund aus PR 1416 (Thread «Bauen: Sportjahr und Auswertung aller Sportarten»)

## Was ist neu
- Die Neuigkeit «Dauer nachtragen» sagt jetzt in Worten, wo die Liste steht (Aktiv › Meine Aktivitäten), und dass sie nur erscheint, solange es Haken ohne gemessene Zeit gibt. Vorher fand der «Ausprobieren»-Test das Ziel nicht, wenn keine solchen Haken da waren. Dasselbe gilt für die Neuigkeit «Zählen?» (Fitbit-Trainings, K4): ihre Karte erscheint nur, wenn die Uhr Trainings ohne Haken kennt. Nichts am Verhalten der App ändert sich.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Fix steht nur im Text der Neuigkeit (`where`), nicht im Code der Liste. Die Liste soll weiter ganz fehlen, wenn nichts nachzutragen ist.

## Prüfschritte (nach dem Merge)
1. Ich › Was ist neu › «Dauer nachtragen» › «Ausprobieren»: ohne Haken ohne Zeit steht der Ort als Satz, mit solchen Haken leuchtet die Liste.
