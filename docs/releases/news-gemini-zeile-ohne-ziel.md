# Neuigkeiten: eine Gemini-Zeile zeigt auf einen Schalter, den es nicht mehr gibt

22.11.2026 · Auftrag: Bündler (PR 1345 rot in «Ausprobieren», Teil 9); Thread «Prüfungen so einrichten, dass main grün bleibt»

## Was ist neu
- Die alte Neuigkeit «Freie Sätze in der Suche» (`src/lib/news/suche-gemini-befehl.js`) hatte eine Zeile («Nur der Satz, der Tag und die Namen deiner Velos und Touren gehen an Gemini»), die auf den Schalter «Gemini versteht Sätze» zeigte. Den Schalter hat «KI entfernen, Schritt 4» (#1404) entfernt. Der Test «Ausprobieren» (Teil 9, volle Prüfung) fand dort «nichts leuchtet auf /me/suche» und war rot, jedes Mal, wenn ein PR alle Zeilen tippt (zum Beispiel bei PR 1345) und im Nachtlauf.
- Die Zeile hat jetzt kein Ziel mehr (`go: null`) und bleibt als Text in der Liste. Sie wird nicht mehr zu einer Stelle geführt.

## Was fällt weg oder rutscht tiefer
- Ein Tipp auf diese eine alte Zeile in «Was ist neu» führt nicht mehr zu «Ich › Suche». Dort gibt es den Schalter nicht mehr, vorher leuchtete nichts auf.

## Selbst entschieden
- Nur diese eine Zeile geändert; die erste Zeile derselben Neuigkeit hat zusätzlich einen Hinweis («Ich › Suche, der Schalter …») und besteht den Test.
- Kein Test gelockert: der Test fand einen echten toten Verweis.
- Keine sichtbare Änderung ausser dem eben genannten Tipp.

## Prüfschritte (nach dem Merge)
1. Der Nachtlauf zeigt «Ausprobieren» Teil 9 grün, und PR 1345 läuft in Teil 1 ohne diesen Fehler.
