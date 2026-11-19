# «Heute abhaken»: eine Hilfezeile statt zwei

PR folgt · 18.11.2026 · Auftrag: Noah «c» (Thread «UI-Test der Seite Flow», Fund 8, zweiter Teil)

## Was ist neu
- Unter den Kacheln von «Heute abhaken» (Aktiv › Heute) steht eine Zeile: «Tippen hakt ab · lange drücken oder •••: Dauer, Ort, Stoppuhr · Meditation antippen: starten oder abhaken.» Vorher waren es zwei Zeilen, und die erste («Tippen hakt ab») stimmte für Meditation nicht.
- Auf Heute (Karte «Im Flow») ändert sich nichts; dort gibt es keine zweite Zeile.

## Was fällt weg oder rutscht tiefer
- Die zweite, einzelne Zeile «Meditation antippen: starten oder abhaken.» fällt weg; ihr Text steht jetzt am Ende der ersten Zeile.

## Selbst entschieden
- Der Text ist derselbe wie vorher, nur zusammengelegt (kein neuer deutscher Text).
- Beobachtung, kein Teil dieses PR: die Seite Aktiv lädt die Datei der Meditations-Hilfen weiterhin selbst, weil sonst bei ganz neuen Daten die zweite Grundausstattung (Spaziergang) erst später angelegt wird. Eine solche Abhängigkeit von der Lade-Reihenfolge ist empfindlich; ich schlage vor, sie später gesondert anzuschauen.
- Teil 3 von Fund 8 («•••» grösser) folgt als eigener PR; Fund 9 (Seitenleiste) lasse ich weg, weil PR 1284 sie umbaut.
- Kein Datenformat geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Heute › «Heute abhaken»: unter den Kacheln steht eine Hilfezeile, die auch Meditation nennt.
2. Darunter steht keine zweite Zeile mit demselben Sinn.
