# Experimente: einfacheres Formular und fairerer Vergleich

PR folgt · 05.11.2026 · Auftrag: Noah «a» (04.11. 21:53, Thread «Plane Persönliches Lernen für Touren»), Idee 2 Teil 2 von 6

## Was ist neu
- **Fahrt gegen Fahrt statt Tag gegen Tag.** Misst ein Versuch einen Fahrt-Wert (gefühlte Anstrengung, Kadenz, Tempo, Watt pro Kilo), vergleicht die Karte die einzelnen Fahrten: die Fahrten während des Versuchs mit den Fahrten in den gleich vielen Tagen davor (`src/lib/ruhig/versuch-fahrt.js`).
- **Nur ähnliche Fahrten.** Es zählen nur Fahrten, deren Länge höchstens das 1,5-Fache (oder ein Drittel weniger) der mittleren Fahrt beträgt und deren Höhenmeter nahe an der mittleren Fahrt liegen (150 m oder 60 % Spielraum, je nachdem was mehr ist). Die Karte sagt, wie viele Fahrten passen («8 von 11 Fahrten sind sich ähnlich»).
- **Jede Fahrt ein Punkt.** Unter dem Satz stehen die Fahrten davor und währenddessen als Punkte auf derselben Skala, der Mittelwert als Strich (`RideDots.svelte`). Ein Satz sagt dasselbe in Worten.
- **Erst ab fünf Fahrten je Seite ein Urteil.** Vorher steht «Noch zu wenige Fahrten …» mit der aktuellen Zahl je Seite; die Punkte sieht man trotzdem.
- **Einfacheres Formular** (Noah 05.11. 15:14 «a»). Oben stehen vier einfache Fragen zum Antippen: «Fühlen sich meine Fahrten leichter an?», «Trete ich schneller?», «Fahre ich schneller?», «Habe ich mehr Watt pro Kilo?», dazu «Etwas anderes». Ein Tipp füllt Frage, Wert und 14 Tage aus (bei «leichter» auch die Kadenz daneben). Du schreibst nur noch, was du änderst, mit einem Beispiel als Hinweis («z. B. Auf jeder Fahrt 5 Umdrehungen pro Minute schneller treten»). Startdatum, Dauer, der Wert und «Kadenz gleich mitzeigen» stehen unter «Mehr Einstellungen». Ein Satz oben erklärt, was ein Versuch ist.

## Was fällt weg oder rutscht tiefer
- Die zweite Liste «Zusätzlich vergleichen mit» im Formular fällt weg. Neu: das Häkchen «Kadenz gleich mitzeigen». Andere zweite Werte als die Kadenz lassen sich nicht mehr neu wählen; schon gespeicherte Versuche mit einem anderen zweiten Wert zeigen ihn weiter.
- Startdatum, Dauer und die Liste «Mit einem Wert messen» rutschen unter «Mehr Einstellungen» (ein Tipp mehr). Das Beispiel «Fahre ich mit höherer Kadenz angenehmer?» ist durch «Fühlen sich meine Fahrten leichter an?» ersetzt; die anderen drei Beispiele bleiben.
- Fahrt-Werte werden nicht mehr als Tagesmittel der Tage gerechnet, sondern Fahrt für Fahrt. Die Karten anderer Werte (Schlaf, Ruhepuls …) bleiben, wie sie sind.

## Selbst entschieden
- Die Ähnlichkeit hängt an der mittleren Fahrt beider Seiten zusammen (nicht an einer festen Zahl), damit sie bei kurzen wie bei langen Fahrern passt. Fahrten ohne Kilometer zählen nie. Fehlen bei einer Fahrt die Höhenmeter, zählt nur die Länge.
- Die Zahl «mindestens fünf» (`MIN_RIDES`) und die Toleranzen (`KM_FACTOR`, `HM_FLOOR`, `HM_SHARE`) stehen oben in der Datei und lassen sich dort ändern.
- «Klar» heisst wie bisher: der Unterschied der Mittel ist grösser als das Doppelte der Streuung.
- Nur beschreiben, nie erklären: «höher», «tiefer» oder «kein klarer Unterschied», dazu «Ein Hinweis, kein Beweis».
- Kein Schema- und kein Backup-Format geändert: die gespeicherten Versuche (`metric`, `also`) bleiben gleich.
- Fertig-Regel: erweitert eine bestehende Funktion («Eigene Experimente»), darum keine neue Funktions-ID; Seite, Absprung, Gut zu wissen und leerer Zustand bestehen.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Persönliches Lernen: Idee 2 fertig (Teil 1 Fahrt-Werte, Teil 2 Vergleich), Noah «a».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Ruhig › Versuche: «Fühlen sich meine Fahrten leichter an?» antippen.
2. Frage ist eingetragen, im Feld «Was du änderst» steht ein Beispiel als Hinweis; unter «Mehr Einstellungen» sind 14 Tage und das Häkchen «Kadenz gleich mitzeigen» gesetzt.
3. Auf der Karte eines laufenden Versuchs: wie viele Fahrten passen, für jede Fahrt ein Punkt, und erst ab fünf Fahrten je Seite ein Satz.
