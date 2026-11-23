# Tourenvorschläge: Zahlen beim Hovern

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «mouseover soll gleich wichtigste daten wie km, zeit und höhenmeter zeigen auf der karte» (Thread «100 kluge MTB-Touren vorschlagen»).

## Was ist neu
- Die Maus über einem Punkt der Karte (oder der Tastaturfokus darauf) zeigt eine kleine Karte: Titel, km, Zeit in deinem Tempo, Höhenmeter, Kondition und Technik, dazu «Tour öffnen».
- Die Linie dieser Tour wird dick und kräftig, die anderen werden blass.
- Am Handy zeigt der erste Tipp auf einen Punkt die Karte, der zweite öffnet die Tour; ein Tipp daneben schliesst sie.

## Was fällt weg oder rutscht tiefer
- Am Handy öffnet der erste Tipp auf einen Punkt die Tour nicht mehr sofort, sondern zeigt zuerst die Zahlen. Am Computer öffnet der Klick wie bisher die Tour.

## Selbst entschieden
- Die Karte erscheint über dem Punkt (unter dem Punkt, wenn oben kein Platz ist) und bleibt immer in der Karte.
- Keine neue Funktion im Sinn der Fertig-Regel: Seite, Absprung und App-Stand unverändert.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-hover.md`)
- 23.11.2026: Zeit im eigenen Tempo; am Handy zwei Tipps.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge › «Karte», mit der Maus auf einen Punkt zeigen: eine Karte mit km, Zeit und Höhenmetern.
2. Wegbewegen: die Karte verschwindet. Klicken: die Tour öffnet sich.
3. Am Handy: einmal tippen zeigt die Karte, nochmals tippen öffnet die Tour.
