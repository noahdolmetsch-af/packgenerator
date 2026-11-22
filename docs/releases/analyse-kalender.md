# Analyse: Kalender und Achsen aufgeräumt

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «6 ja» (Thread «UI-Test Analyse-Seite: Design und Verständlichkeit»)

## Was ist neu
- **Kalender «Jeder Tag ein Feld»:** alle Felder gleich gross (24 bis 40 Pixel, so gross, wie die Breite erlaubt). Vorher waren die Spalten über die ganze Karte gezogen, mit grossen Lücken bei 30 Tagen, und die Wochentage standen neben den falschen Zeilen.
- **Wochentage und Monate** stehen genau auf ihrer Zeile und Spalte.
- **Lange Zeiträume am Handy:** der Kalender beginnt bei den neuesten Wochen, ältere sind einen Wisch entfernt; die Wochentage bleiben links stehen.
- **Legende:** «weniger ▢▢▢▢ mehr» unter dem Kalender.
- **Achsen von Anzahlen** (Haken pro Woche, Einheiten, Vergleich) haben nur ganze Zahlen, nie «0,5».

## Was fällt weg oder rutscht tiefer
- nichts (die Felder bei 90 Tagen am Handy sind 24 px gross, dafür wischt man den Kalender, statt dass sie winzig werden)

## Selbst entschieden
- 24 px ist die kleinste Feldgrösse (Mindestgrösse für Tippflächen); darunter wird gewischt, nicht kleiner gemacht.
- «Anzahl» heisst: Werte mit der Einheit «×» und alle Aktiv-Haken. Pulswerte, km usw. behalten ihre Achsen.
- Die Karte mit den Zahlen oben (Kacheln, Mittelwerte) bleibt unberührt; die baut der Thread «Analyse-Überblick und Filter-Karte».

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Übersicht, Karte «Jeder Tag ein Feld»: alle Felder gleich gross, die Wochentage links auf der richtigen Zeile, unten die Legende.
2. Zeitraum «90 Tage» am Handy: rechts die neuesten Wochen; wische den Kalender, um ältere zu sehen.
3. Karte «Verlauf»: die Achse zeigt nur ganze Zahlen.
