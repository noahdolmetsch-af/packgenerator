# Das beste Ausfahrt-Fenster der Woche

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Planen 2a» (Thread «Bauen: Planen 2a und 2b», Ideen-Doc «Ideen für alle Bereiche»)

## Was ist neu
- Planen › Woche sucht das beste freie, trockene Fenster der gezeigten Woche (auch «Nächste Woche»), nicht mehr nur die nächsten 3 Tage (`src/lib/freiezeit/slots.js`, `weekSlot`).
- Es schlägt eine 3-Stunden-Runde vor, wenn 3 Stunden frei und trocken sind, sonst 2 Stunden, mit der Strecke nach deinem Tempo («Hier passt eine 3-Stunden-Runde: etwa 50 km»).
- Der Tag des Fensters trägt ein kleines Velo-Zeichen mit der Zeit (Computer und Handy).
- «Fahrt einplanen» setzt das Fenster als Termin «Ausfahrt» in die Woche, so lang wie das Fenster, mit «Rückgängig».
- Es zählen dein Google-Kalender (wenn an) **und** deine eigenen Termine mit Uhrzeit (ohne Länge: 1 Stunde). Ohne Kalender funktioniert die Karte mit dem Wohnort allein.
- Eigene Termine dürfen jetzt eine Länge haben (`mins`), bisher nur Aufgaben.

## Was fällt weg oder rutscht tiefer
- Die Karte zeigte «die nächsten 3 Tage» und nur eine 2-Stunden-Runde. Neu: die ganze gezeigte Woche, bevorzugt 3 Stunden. Es gibt keinen Weg zurück zu den 3 Tagen; «Jetzt nicht» blendet ein einzelnes Fenster weiter aus.
- Ohne eingeschalteten Kalender war die Karte nur ein Hinweis. Neu: sie arbeitet auch dann.

## Selbst entschieden
- Ein eigener Termin mit Uhrzeit, aber ohne Länge, blockiert 1 Stunde (wie eine Besprechung); ganztägige zählen nicht.
- Das beste Fenster ist das nächste gute; ein späteres gewinnt nur, wenn es klar besser ist (wie bisher, 0,5 Punkte je Tag).
- Keine neue Seite und keine neue Funktion: `f.freeslot` bleibt, Text und Handbuch-Schritte sind angepasst. Teile der Fertig-Regel (Absprung, Wissen) bestehen für die Woche schon.

## Entscheide (für decisions.md)
- 05.11.2026: Das Wetterfenster der Woche gilt für die gezeigte Woche und nutzt auch eigene Termine (Noah «Planen 2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche: Planen 2a ist gebaut. Planen 2b (Wochen-Abschluss am Sonntag) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche öffnen: oben die Karte mit dem besten freien, trockenen Fenster; sein Tag trägt ein kleines Velo-Zeichen.
2. «Fahrt einplanen» antippen: an diesem Tag steht «Ausfahrt»; «Rückgängig» nimmt sie wieder weg.
3. «Nächste Woche» wählen: die Karte sucht in der nächsten Woche (solange die Vorhersage reicht).
