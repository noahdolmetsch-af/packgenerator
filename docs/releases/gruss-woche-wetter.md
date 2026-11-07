# Gruss «Wi gahts?» C: Wetter im Kopf und «Letzte 7 Tage»

PR (Nummer folgt) · 07.11.2026 · Auftrag: Noah «alle umsetzen» (Thread «Planen: Tagescheck mit Fragen»), seine frühere Antwort 4a (Wetter im Kopf), Prüfliste `tagescheck/gruss-pruefliste.md`. Dritter von vier PRs (nach A #912, B #1047).

## Was ist neu
- Hinter «Mehr» steht eine dritte Gruppe «Wetter im Kopf»: Sunnig, Wolkig, Näbel, Gwitter, Rägeboge. Beliebig viele zugleich; wie alle anderen Knöpfe unter «Knöpfe anpassen» umbenennen, ausblenden, löschen und ordnen. Die Antworten gehen in dieselbe Frage «Und süsch?» (`hallo.gefuehl`) im einen Verlauf.
- Im Fenster steht unter den fünf Gesichtern «Letzte 7 Tage»: sieben Punkte, heute rechts. Ein Punkt ist gefüllt, wenn an dem Tag ein Gesicht gewählt wurde (etwas blasser bei «Müed», voller bei «Super», nur zum Lesen); ein Tag ohne Antwort ist ein leerer Ring. Darunter «N von 7 Tagen beantwortet». Der Punkt von heute füllt sich beim ersten Tipp.
- Nur Beobachtung: eine Farbe, kein Gut/Schlecht, keine Serie, kein Zähler für Verpasstes.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Wetter im Kopf ist eine Gruppe in derselben Frage wie die Gefühle (kein eigenes Fenster, kein eigener Verlauf); so bleibt alles in «Deine Abfragen».
- Eine schon gespeicherte Knopf-Liste (aus B) bekommt die Gruppe «Wetter im Kopf» genau einmal am Ende dazu (Revision 2 der Einstellung `hello.buttons`); wer sie löscht, bekommt sie nicht zurück.
- Die Punkte zeigen nur die Gesichter (`hallo.gaht`), nicht die Gefühle oder das Wetter.
- Die Helligkeit der Punkte folgt dem Wert des Gesichts, keine Farbe und keine Linie dazwischen.
- Kein Eintrag in `features.js`: Teil des Grusses; `app-stand.md` nennt es in der Zeile «Heute».

## Entscheide (für decisions.md)
- 05.11.2026: Wetter im Kopf wird als Gruppe im Gruss gebaut (Noah 4a); «Letzte 7 Tage» als Beobachtung ohne Wertung.

## Stand im Plan (roadmap.md / vorhaben.md)
- Gruss-Ausbau: Schritt C von D.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, Gruss antippen: unter den fünf Gesichtern «Letzte 7 Tage».
2. Ein Gesicht tippen: der Punkt von heute füllt sich.
3. «Mehr»: «Wetter im Kopf», «Näbel» und «Rägeboge» wählen.
