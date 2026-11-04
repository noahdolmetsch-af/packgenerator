# Die Velo-Klingel wackelt

PR folgt · 03.11.2026 · Auftrag: Noah «b» (alle 5 Ideen von «Paket C: Das Velo lebt»; Thread «Durchgehen: offene Fragen einzeln»), Idee 17

## Was ist neu
- Heute › «Heute fällig»: Der Chip «Pflegepunkte fällig» trägt eine kleine Klingel, die einmal wackelt (rund 0,7 s, eine halbe Sekunde nach dem Erscheinen).
- Kein Ton. Mit «Bewegung reduzieren» am Gerät steht die Klingel still.

## Was fällt weg oder rutscht tiefer
- Das Werkzeug-Symbol im Chip «Pflegepunkte fällig» ist jetzt eine Klingel (gleicher Ort, gleicher Link, gleicher Text).

## Selbst entschieden
- Ort: der Pflege-Chip in «Heute fällig», weil dort die Erinnerung zur Velopflege steht (z. B. «Kette ölen» zählt zu den Pflegepunkten).
- Der Ton aus der Idee («nur, wenn man will») ist nicht gebaut, damit nichts unerwartet klingelt; kann später als Wahl dazukommen.
- Wackelt nur einmal beim Erscheinen, nicht bei jedem Neuzeichnen.
- Keine neue Funktion im Sinn der Fertig-Regel, daher kein `features.js`-Eintrag.
- `docs/app-stand.md` liegt noch nicht in `main`; die Zeile kommt dazu, sobald die Datei da ist.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Neuer Schwung» / Velo-Momente: Idee 17 gebaut (ohne Ton).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, während bei einem Velo Pflege fällig ist: in «Heute fällig» wackelt die Klingel einmal.
2. «Bewegung reduzieren» am Gerät einschalten und neu laden: die Klingel steht still.
