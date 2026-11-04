# Routinen unter Erholung

PR #? · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» plus Zusatzidee 4 (Thread «Untersuchen: Aktiv und Auswerten besser einbauen»), Schritt 6 von 9

## Was ist neu
- Die Seite «Das tut mir gut» (`#/routine`) gehört jetzt zu Aktiv › Erholung: der Tab «Erholung» leuchtet, der Pfad oben heisst «‹ Aktiv › Erholung › Das tut mir gut».
- Unter «Erholung abhaken» steht neben dem Link «Deine tägliche Liste» der Stand von heute («n von m heute abgehakt»). Ohne Liste steht wie bisher der kurze Satz.

## Was fällt weg oder rutscht tiefer
- Die Seite liegt nicht mehr im Ort Heute: wer sie über die Kachel auf Heute öffnet, sieht sie in Aktiv (Pfad «‹ Erholung»). Der Link auf Heute bleibt, die Adresse auch.

## Selbst entschieden
- Der Link auf Erholung war schon da (Paket «Neue Wege hinein», #733); dieser PR ergänzt den Stand von heute und den Ort.
- Kein neuer Eintrag in `features.js` (`f.routine` gibt es schon); die Zeile in `docs/app-stand.md` nennt den Ort.

## Stand im Plan
- Aktiv und Auswerten: Schritt 6 (Routinen in Erholung) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Erholung öffnen: neben «Deine tägliche Liste» steht «n von m heute abgehakt».
2. Den Link tippen: die Liste öffnet sich, der Tab «Erholung» leuchtet.
3. Auf Heute die Kachel «Das tut mir gut» › «Liste ändern» tippen: dieselbe Seite.
