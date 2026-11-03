# Velos weiter oben auf Heute

Auftrag: Noah «1a 2a 3a 4a 5a» (03.11.2026, Thread «Untersuchen: Velos-Pflege besser einbauen»), Teil 5a. Teil 6 von 7.

## Was ist neu
- Auf der Standard-Startseite steht der Bereich «Unterwegs und Velos» jetzt über «Deine Woche». Darin kommt die letzte Aktivität von Strava vor den Velos (so war die Reihenfolge schon).
- Nur die Standard-Reihenfolge ändert sich (`SECTIONS` in `src/lib/home/sections.js`).

## Was fällt weg oder rutscht tiefer
- «Deine Woche» (Woche und Balance) rutscht unter «Unterwegs und Velos». Alt: Jetzt › Dein Körper › Deine Woche › Unterwegs und Velos. Neu: Jetzt › Dein Körper › Unterwegs und Velos › Deine Woche.

## Selbst entschieden
- Wer die Reihenfolge der Bereiche selbst geändert hat («Startseite anpassen»), behält seine. Das gilt nur für die Standard-Reihenfolge.
- «Woche» heisst hier der Bereich «Deine Woche», weil die Startseite nach Bereichen geordnet ist; die Kachel «Strava» stand schon vor der Velos-Kachel.
- Kein neues Feature, kein Eintrag in `features.js`.

## Stand im Plan
- Velos-Pflege einbauen: Teil 5a erledigt. Offen: Verschleiss kürzer und Gruppe «Pflege-Werkzeuge» in «Alles hier» (1a).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen und scrollen: «Unterwegs und Velos» (Strava, Velos) kommt vor «Deine Woche».
2. Unter «Startseite anpassen» lassen sich die Bereiche zurückschieben.
