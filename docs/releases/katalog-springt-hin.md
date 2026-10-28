# Der Katalog zeigt die Stelle

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «c und d zusammen» (Thread «332 Use Cases sichtbar machen»), Teil c, Schritt 1

## Was ist neu
- Ein Tipp auf eine Funktion in «Was die App alles kann» öffnet ihre Seite wie bisher und springt dann genau an die Stelle: Er öffnet nötigenfalls ein Fenster oder eine Falte, scrollt hin und lässt die Stelle kurz aufleuchten.
- Zuerst für 7 Funktionen: Andere Tour wechseln, Startliste pro Sportart, Velos vergleichen für eine Tour, Doppelte zusammenlegen, Notiz-Formate, Englische Namen auf Deutsch, Alte Fitbit-Daten.
- Der Mechanismus steht in `src/lib/know/spot.js` (SPOT, showSpot, light). Der Thread «Ausprobieren-Knopf bei Neuigkeiten» nutzt ihn später auch.

## Was fällt weg oder rutscht tiefer
- nichts. Die Seiten bleiben, wie sie sind.

## Selbst entschieden
- Das Aufleuchten ist ein ruhiger grüner Ring, zweimal; wer weniger Bewegung eingestellt hat, sieht den Ring ohne Animation.
- «Liste teilen oder drucken» bleibt ohne Sprung: Der Tipp öffnet schon heute direkt das Drucken.
- Die übrigen Funktionen folgen in kleinen PRs; Funktionen ohne festen Ort bekommen eine Zeile im Katalog (Teil d).

## Entscheide (für decisions.md)
- 27.10.2026: Der Katalog springt zur Stelle und markiert sie, statt neue Zeilen auf den Seiten (Noah «c und d zusammen»).

## Stand im Plan (roadmap.md / vorhaben.md)
- 332 Use Cases sichtbar: 7 von 26 Namens-Lücken springen jetzt an ihre Stelle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne «Was die App alles kann» und suche «Velos vergleichen für eine Tour».
2. Tippe auf den Eintrag: Die Tour öffnet sich, das Velo-Fenster geht auf und «Velos vergleichen» leuchtet kurz auf.
3. Suche «Alte Fitbit-Daten» und tippe darauf: Verbindungen öffnet sich, die Seite scrollt zu «Alte Fitbit-Daten», der Titel leuchtet auf.
