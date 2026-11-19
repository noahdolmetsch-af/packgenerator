# Das Check-Fenster fragt nur nach heute

PR folgt · 17.11.2026 · Auftrag: Noah «1-5a» (Thread «Startseite ruhiger und klarer gestalten»), Frage 2a

## Was ist neu
- Das Fenster mit den Fragen (Wi gaht's?) hiess um 18:32 noch «Morgen-Check», weil der Abend für das Fenster erst um 20:30 beginnt, die Tagesuhr der App ihn aber ab 18:00 zählt. Neu heisst es ab 11 Uhr bis zur Abendrunde «Noch offen von heute Morgen». Dieselben Wörter stehen in den Zeilen auf Heute («Noch offen von heute Morgen · 3 Fragen»).
- Fragen von gestern kommen nicht mehr zurück («Frage von Do., 8. Okt. 20:30»). Eine Frage, die ihre Zeit heute schon hatte, fragt nach heute; eine, deren Zeit heute noch nicht da ist, wartet darauf (`fitNow`, `windowPart` in `src/lib/abfragen.js`).

## Was fällt weg oder rutscht tiefer
- Der Hinweis «Frage von Do., 8. Okt. 20:30» im Fenster fällt weg, weil Fragen von früheren Tagen nicht mehr erscheinen (Noah «2a»). Beantwortet war nichts davon; die Frage kommt heute zu ihrer Zeit wieder.

## Selbst entschieden
- Der Abend-Check beginnt weiter um 20:30 (eigene Einstellung «Feste Runden»); nur der Titel ändert sich, nicht die Zeit der Runde.
- Die Seite «Morgen-Check» (`#/check/morning`) und «Wi gaht's? am Morgen» heissen weiter so: es ist die Seite der Morgenrunde, nicht das Fenster.
- Die Zeilen auf Heute lesen die Uhr beim Zeichnen; sie wechseln auf «Noch offen von heute Morgen» beim nächsten Neuzeichnen, spätestens beim nächsten Laden von Heute.

## Entscheide (für decisions.md)
- 17.11.2026: Das Check-Fenster fragt nur nach heute; Fragen früherer Tage kommen nicht zurück (ersetzt «eine verpasste Frage bleibt stehen» vom 14.10. für Fragen früherer Tage; Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Startseite ruhiger: Schritt 1 von 5 (Check-Fenster); danach Tourkarte, «Woche», Ausrüstung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute nach 11 Uhr öffnen, Morgenfragen offen lassen: das Fenster heisst «Noch offen von heute Morgen».
2. Ab 20:30 heisst es wieder «Abend-Check».
3. Keine Frage mit «Frage von …» eines früheren Tages.
