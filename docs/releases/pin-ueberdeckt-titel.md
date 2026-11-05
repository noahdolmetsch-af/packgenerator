# Pin deckt Titel nicht mehr zu

PR #898 · 05.11.2026 · Auftrag: Noah «ETAPPE 1» (Frontend-Durchklick, Thread «Durchklicken Etappe 1: Heute und Ich»)

Fund E1-005 (Klasse C, Ansicht). Auf dem Handy sass der Knopf «An Quick Links anpinnen» bei langen Seitentiteln (zum Beispiel «Termine und Aufgaben») auf den letzten Buchstaben des Titels. `placePin` (`src/lib/quick/pinmarks.js`) bekommt jetzt die Textzeilen des Titels und nimmt die erste Stelle, an der der Punkt keine Zeile berührt. Gefunden mit der Testdatei (erfundene Daten), kein Wert aus echten Daten.

## Was ist neu
- Der Pin rutscht bei langen Titeln neben oder über den Titel. Die Stelle bei kurzen Titeln bleibt wie bisher.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Dritte Stelle «über der Karte rechts» als letzter Ausweg; fehlt jede freie Stelle, wird der Pin wie bisher nicht gezeigt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
