# Haken und Rhythmus: die Haken-Auswertung zieht ins Sportjahr

22.11.2026 · Auftrag: Noah «a, aber sicherstellen, dass keine vergangenen daten verloren gehen» (Thread «Sportjahr und Auswertung aller Sportarten», S5)

## Was ist neu
- Ganz unten im **Sportjahr** steht **«Haken und Rhythmus»**: dieselben Kacheln (Tage mit Haken, Haken, Menge, Ø pro Woche, Minuten, längste und aktuelle Serie, Aktivitäten) und dieselben Auswertungen wie auf der früheren Seite «Haken ausgewertet» (Haken pro Woche, Wochentage, Tageszeit, Verlauf, Raster, erste gegen zweite Hälfte, Bestwerte, pro Monat; «Analysen anpassen» gilt weiter). Sie folgen dem Zeitraum der Seite (Woche, Monat, Jahr, Alles, eigener Zeitraum).
- Eine Liste «Aktivität»: alle oder eine. Bei einer Aktivität zählen wie bisher auch ihre Tourtage und «zählt auch»; die Kachel «Menge» erscheint bei Mengen wie Liegestützen.
- Neu dabei: Strava-Einheiten ohne eigenen Haken und Strava-Sportarten ohne Aktivität (Wandern …); sie stehen in der Liste und in den Zahlen.
- Der Reiter «Haken ausgewertet» heisst jetzt **«Antworten ausgewertet»** und zeigt nur noch die Antworten der Check-Fragen mit einer Zahl (`#/flow/auswertung?what=answers`). Ohne solche Antworten sagt die Seite es und führt zum Sportjahr.
- Die alte Adresse `#/flow/auswertung` (auch mit `?act=<id>`, wie sie «Übergreifende Analyse», die Ringe auf Aktiv und alte Lesezeichen benutzen) führt ins Sportjahr; `?act=` wählt die Aktivität in «Haken und Rhythmus» vor. Dabei bleibt der Zeitraum der Seite; die alten festen 30/90/365 Tage gibt es dort nicht mehr (dafür Woche, Monat, Jahr, Alles).

## Was fällt weg oder rutscht tiefer
- Die eigene Seite «Haken ausgewertet» (`#/flow/auswertung`) fällt weg; ihr Inhalt steht ganz unten im Sportjahr (Noah «a»).
- Der Schalter «Deine Haken / Deine Antworten» fällt weg: die Antworten haben ihren eigenen Reiter.
- Die festen Zeiträume 30 / 90 / 365 Tage: dafür der Zeitraum-Schalter von Auswerten.
- Gespeichert wird nichts anders: kein Datenumbau, kein neues Feld, kein Eintrag wird verändert oder gelöscht.

## Beleg: keine vergangenen Daten gehen verloren
`tests/rhythmus.test.js` spielt eine Backup-Kopie (erfundene Daten im Format von «Ich › Daten und Backup › Backup speichern») in eine zweite Datenbank ein und zählt **Haken vorher / nachher**:
- Alle Aktivitäten: jeder Haken, den die alte Seite zeigte, steht in der neuen Liste; die Kacheln, Wochentage, Tageszeiten und Monate sind Haken für Haken gleich. Mehr wird es nur um Strava-Einheiten ohne Haken.
- Je Aktivität (Beispielzahlen der Prüfdaten): Velo 291 vorher / 293 nachher (die zwei mehr sind Strava-Einheiten ohne Haken), Meditation 345 / 345, Liegestütze 230 / 230, Laufen 99 / 99, Sauna 138 / 138, Tennis 130 / 130. Tourtage, der Arbeitsweg und «zählt auch» sind enthalten.
- Das Lesen verändert nichts in der Kopie (Vorher-Nachher-Vergleich der Haken-Tabelle).

## Selbst entschieden
- Der Weg zurück bleibt offen: die gespeicherten Daten sind unberührt, die alte Seite lässt sich notfalls mit der Seite `TickReview.svelte` aus der Git-Geschichte wiederherstellen.
- «Haken und Rhythmus» liest ALLE Einheiten (nicht nur Bewegung), die Stunden-Zahlen oben im Sportjahr bleiben bei Bewegung. So verschwinden Meditation, Sauna und der Arbeitsweg nicht aus der Ansicht.
- Es werden weiter nur Haken von Aktivitäten gezeigt, die es noch gibt (wie auf der alten Seite); Haken gelöschter Aktivitäten bleiben gespeichert, stehen aber nirgends in der Ansicht.
- Der Reiter «Antworten ausgewertet» bleibt in der Reiter-Reihe von Auswerten (auch ohne Zahlen-Antworten, dann mit erklärendem Leerzustand).
- Fertig-Regel: (1) `f.tickreview` (Antworten) und `f.sportjahr` (Haken und Rhythmus) in `features.js`/`featreg` angepasst, (2) Absprung: der bisherige Link «Alle in …» der Ringe auf Aktiv und «Auch im Sportjahr» in der Übergreifenden Analyse führen jetzt ins Sportjahr, (3) «Gut zu wissen»: Seite nicht in `ON_PAGES`, nichts gebaut, (4) Leerzustände vorhanden, (5) nächster Schritt: Link «Sportjahr» im Leerzustand der Antworten, (6) Zeilen im App-Stand.
- Namen: «Haken und Rhythmus» und «Antworten ausgewertet» in `docs/namen.md` Nr. 33.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › «Jahr», ganz nach unten: «Haken und Rhythmus» mit den Kacheln und den Karten.
2. In der Liste «Aktivität» «Meditation» wählen: nur ihre Haken.
3. Die alte Adresse `…/#/flow/auswertung` aufrufen: sie führt ins Sportjahr; der Reiter «Antworten ausgewertet» zeigt deine Check-Antworten.
