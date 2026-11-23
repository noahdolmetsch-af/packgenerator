# Knapper Seitenkopf bei Auswerten

Auftrag: Noah «1-5 a» (Thread «App an Mein-Tag-Design angleichen»), Bericht https://claude.ai/artifact/7XRsEHDQLkmU2nKDw97NBB, Frage 3a. Schritt 4 von 6 des Design-Abgleichs.

## Was ist neu
- `AuswertenStart.svelte`: unter dem Titel steht ein kurzer Satz («Form, Körperwerte, Fahrten und was du abgehakt hast.») statt zwei Sätzen. Die Wege «Sportjahr ›» und «Heute abhaken ›» stehen in einer Zeile. Am Handy spart das mehrere Zeilen, die Zahlen kommen höher.

## Was fällt weg oder rutscht tiefer
- Der zweite Satz «Zum Abhaken geht es zu «Heute abhaken»» ist jetzt der Link «Heute abhaken ›» in der Zeile darunter (gleicher Weg, kürzer).
- «Sportjahr: alles, was du gemacht hast, in Stunden, nach Sportart» heisst jetzt «Sportjahr ›»; die Seite selbst erklärt, was drin ist.

## Selbst entschieden
- Die Hilfezeile «Was du hier tun kannst» bleibt eine geschlossene Zeile, wie bisher (Noah 22.11.2026).
- Die anderen Seiten (Training, Touren, Velos, Wetter) folgen je als eigener PR.

## Entscheide
- keine neuen (siehe `docs/decisions/umschalter-gewaehlt-gefuellt.md`, Punkt «Knapper Seitenkopf»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Design-Abgleich Mein Tag: Schritt 4 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Übersicht: unter dem Titel ein kurzer Satz und eine Zeile mit «Sportjahr ›» und «Heute abhaken ›».
2. «Sportjahr ›» öffnet das Sportjahr, «Heute abhaken ›» die Seite Aktiv.
3. Am Handy: die Hilfezeile und der Umschalter «Woche · Monat · Jahr · Alles» stehen höher als vorher.
