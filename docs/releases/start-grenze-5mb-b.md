# Start-Grenze auf 5,0 MB

PR · 04.11.2026 · Auftrag: Noah «b» (Thread «Erklären und beheben: Start-Grenze bei 98 %»)

## Was ist neu
- Der Aufbau bricht erst ab, wenn der Start über 5,0 MB JavaScript lädt (vorher 4,6 MB). Der Start liegt heute bei 4,52 MB (98 % der alten Grenze, 90 % der neuen).
- Die gelbe Notiz «Start-Grenze fast erreicht» erscheint jetzt ab 4,5 MB statt ab 4,14 MB.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Genau 5,0 MB (eine runde Zahl, wie im älteren PR #824). Dieser PR baut auf dem heutigen `main` auf, weil #824 noch von 4,5 MB ausging und die Warnung (#829) nicht kannte; #824 ist damit überholt.
- Keine «Was ist neu»-Datei und kein Eintrag in `docs/app-stand.md`: die App zeigt nichts Neues, es gibt keine neue Funktion.
- Wie bei den Zahlen vorher: Der Start wird mit grösserer Grenze nicht schneller. Das Nachladen von Handbuch-Texten und «Was ist neu» bleibt ein eigener, späterer Schritt.

## Entscheide (für decisions.md)
- 04.11.2026: Start-Grenze 5,0 MB (Noah «b»), steht in `docs/decisions.md`.

## Stand im Plan
- Tempo: Start-Grenze angehoben; Nachladen der grossen Textteile bleibt offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub unter «Actions» ist «Build and deploy» für diesen Merge grün.
2. Beim Aufbau steht unter Annotations noch die gelbe Notiz «Start-Grenze fast erreicht», jetzt mit «90 %» und «5.0 MB» (4,52 MB liegen knapp über der neuen Schwelle von 4,5 MB). Das ist erwartet.
