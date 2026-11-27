# Haken-Auswertung selbst: Satz nach dem Haken, Art der Sportart, «Dein Tag und deine Woche», «Nach harten Tagen»

PR #1860 · 27.11.2026 · Auftrag: Noah «1b 2a 3b 4a 5b» (Thread «Abhaken auf einen Blick verbessern», die 22 Fragen «App wertet meine Aktivitäten selbst aus»)

## Was ist neu
- **Der Satz nach dem Haken:** auf der Seite Geschafft steht als erste Karte «Was dieser Haken sagt» mit höchstens zwei Zeilen (Serie mit deinem Rekord, lange Pause gegen deinen üblichen Abstand, wie oft diese Woche gegen dein Übliches, Dauer gegen deine übliche, Wochenziel, was du oft dazu abhakst). In der kurzen Meldung nach dem Haken steht die erste Zeile.
- **Art der Sportart:** in jeder Sportart eine Zeile «Art» (Kraft, Ausdauer, Beweglichkeit, Erholung oder keine) und ein Sammelfenster für alle Sportarten auf einmal. Die Arten sind eine Liste in «Listen und Typen».
- **Dein Tag und deine Woche** ganz oben in Auswerten › Woche: dein Tag gegen deinen typischen, die Woche gegen die letzten vier, die Mischung der Arten der letzten 28 Tage, was am längsten ruht, freie Tage, dein aktivster Wochentag und deine Stunde, der Monat gegen die gleichen Tage des Vorjahrs. Fehlen Minuten, werden die Haken gezählt.
- **Nach harten Tagen** unter «Was Bewegung mit dir macht»: Ruhepuls und Schlaf am Tag danach nach einem harten Tag, einem leichteren und einem Tag ohne Bewegung, dazu der übliche Abstand zwischen zwei harten Tagen und, wenn genug Antworten da sind, dein Gefühl («hart» gegen «leicht» oder «gut») gegen den Tag danach.

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. Auf Auswerten › Woche rutscht der Zeitraum-Schalter mit allen Karten eine Karte tiefer; auf Geschafft rutschen die bisherigen Karten eine tiefer.

## Selbst entschieden
- Fertig-Regel: kein neuer Eintrag in `features.js` (Teil von Auswerten › Woche, Geschafft und den Sportarten); der leere Zustand steht in jeder Karte, «Gut zu wissen» entfällt.
- «Dein Tag und deine Woche» steht über dem Zeitraum-Schalter, weil sie von jetzt handelt und dem Schalter nicht folgt.
- Frage 15 (hart gefühlt gegen Nutzen) steht in «Nach harten Tagen»; solange je Art weniger als sechs Tage mit Gefühl da sind, sagt die Karte, wie viele noch fehlen.
- Die Pause einer Sportart zählt nur bis 60 Tage und ab 5 Haken, damit eine aufgegebene Sportart nicht als «ruht am längsten» erscheint.

## Entscheide (eigene Datei `docs/decisions/haken-satz-und-karte.md`)
- 27.11.2026: 1b 2a 3b 4a 5b, «ohne Minuten zählt die Anzahl».

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Sportart auf Aktiv abhaken: die Seite Geschafft zeigt oben «Was dieser Haken sagt».
2. Auswerten › Woche öffnen: ganz oben «Dein Tag und deine Woche»; in der Zeile «Mischung» auf «jetzt wählen» tippen, bei ein paar Sportarten die Art setzen, «Fertig»: die Mischung erscheint.
3. Weiter unten «Nach harten Tagen» (braucht Ruhepuls und Schlaf aus Fitbit).
