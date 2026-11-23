# Abbiegehinweise vom Router

PR · 23.11.2026 · Auftrag: Noah «2a» (Thread «Live-Navigation mit OsmAnd und Google vergleichen»)

## Was ist neu
- Auf einem Weg, den der Router brouter.de geplant hat («Neu planen zu …», «Dorthin planen», Weg zurück auf die Strecke), kommen die Abbiegehinweise vom Router: echte Abzweigungen, leicht oder scharf, und Kreisel mit «Ausfahrt Nr.» (Pfeil, Stimme, Liste «Schritt für Schritt»).
- Die Anfrage an brouter.de bekommt dafür den Zusatz `timode=2`; die Antwort enthält die «voicehints» (Befehle laut BRouter-Quelltext `VoiceHint.java`). Neue Datei `src/lib/live/brouterturns.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Eine eigene GPX-Strecke und die Reserve-Router (Valhalla, OSRM, ohne Hinweise) behalten die Hinweise aus der Form der Linie (`turns.js`).

## Selbst entschieden
- Ein Weg ohne «voicehints» in der Antwort nutzt die Linienform wie bisher.
- Zwei Hinweise auf demselben Meter: der erste zählt (die Liste ist nach km geschlüsselt).
- Strassennamen sind nicht dabei: brouter.de liefert sie in den Hinweisen nicht mit. Das bleibt offen.
- Kein Backup nötig: kein Datenformat, keine Datenbank und nichts in `api/` ändert sich (der Weg wird wie bisher gemerkt, mit einer Liste mehr).

## Entscheide
- Kein eigener Entscheid; der Auftrag steht im Vergleich «Live-Karte gegen OsmAnd, Google und Garmin» (Weg A).

## Stand im Plan (roadmap.md / vorhaben.md)
- Live-Navigation: Weg B (Übergabe an OsmAnd) und Weg C (Garmin-Datei mit Abbiegepunkten) folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte öffnen, Fahrt starten, einen Ort wählen und «Dorthin planen» tippen.
2. Auf die erste Abzweigung zufahren: der grosse Pfeil nennt die Richtung.
3. Bei einem Kreisel auf dem Weg steht «Kreisel: N. Ausfahrt».
