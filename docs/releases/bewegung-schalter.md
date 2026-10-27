# Du bestimmst, wie viel sich bewegt

PR (E8) · 27.10.2026 · Auftrag: Noah «ich möchte b13 bis b24 alle umsetzen. 1a 2a 3a 4a 5a» (5a: alle Ideen E1 bis E8; Thread «Planen Bausteine B13 bis B24»)

## Was ist neu
- Ich › Darstellung › Bedienung › **Bewegung**: Voll, Ruhig oder Aus.
- Voll (wie bisher): alles gleitet, grosse Momente mit Farbregen. Ruhig: kleine Bewegungen, kein Farbregen. Aus: nichts gleitet oder bewegt sich, wie «Bewegung reduzieren» am Gerät.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile «Bewegung» steht in «Bedienung» über «Handschuh-Modus».

## Selbst entschieden
- Voll ist der Start, damit sich für dich nichts ändert, bis du wählst.
- Ein kleines Stylesheet aus `theme.svelte.js` setzt «Aus» und «Ruhig» um, damit `app.css` gleich bleibt.
- Die deutschen Texte des Schalters stehen in der «Was ist neu»-Datei (`src/lib/news/bewegung-schalter.js`), so braucht `de/index.js` keine neue Zeile und offene PRs geraten nicht in Konflikt.
- `motionStill()` für spätere Bausteine (Lottie, Zahlen), die per Skript bewegen.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Bausteine B13 bis B24: E8 gebaut; als Nächstes B13 Wischen und B20 langes Drücken.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Darstellung öffnen, unter Bedienung bei «Bewegung» «Aus» wählen.
2. Etwas löschen: die Meldung unten erscheint ohne Gleiten. Danach wieder «Voll» wählen.
