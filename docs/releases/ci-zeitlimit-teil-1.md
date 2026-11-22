# Handy-Prüfung: Zeitlimit eines Teils von 50 auf 70 Minuten

22.11.2026 · Auftrag: Koordinator, nach dem Training-Thread (PR #1345 wurde zweimal bei 50 Minuten abgebrochen, ohne dass ein Test rot war)

## Was ist neu
- In `.github/workflows/deploy.yml` darf jeder der fünf Handy-Teile (`e2e-part`) jetzt 70 statt 50 Minuten laufen.
- Befund: Teil 1 (die frühen Dateien: a11y, behind und andere langsame) brauchte bei viel Betrieb 43 bis 47 Minuten, bei leerer Prüfung etwa 25. Die anderen vier Teile brauchten 31 bis 37 Minuten. Playwright 1.65 kann Teile nur nach Anzahl der Tests schneiden, nicht nach Dauer, darum bleibt Teil 1 der längste.

## Was fällt weg oder rutscht tiefer
- nichts. Ein hängender Teil gibt seinen Rechner erst nach 70 statt 50 Minuten frei.

## Selbst entschieden
- Zeitlimit statt Teile aufteilen: mehr Teile würden pro PR mehr Aufgaben gleichzeitig in die Warteschlange stellen (GitHub lässt nur etwa 20 Jobs auf einmal laufen), das wäre mit der 5-PR-Regel schlechter.
- Keine App-Änderung, nichts Sichtbares, kein «Was ist neu»-Eintrag.

## Prüfschritte (nach dem Merge)
1. Ein PR mit Handy-Prüfung (Label `ok`): Teil 1 endet grün, auch wenn er länger als 50 Minuten braucht.
