# Reserve-Router

PR #943 · 05.11.2026 · Auftrag: Noah «2a und b» und «a und b beide möglich?» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Antwortet brouter.de nicht (Fehler, Zeitlimit, ausgelastet), fragt die App **einmal Valhalla** (`valhalla1.openstreetmap.de`, FOSSGIS) und, wenn auch das nicht hilft oder der Weg über 110 km Luftlinie geht, **einmal OSRM** (`routing.openstreetmap.de`). Vorher kam eine Fehlermeldung.
- Nur bei einem Ausfall des Dienstes: «kein Weg», «zu weit» und «offline» gehen nicht weiter. Die anderen Wege der Auswahl (zweiter bis vierter) fragen nie die Reserve, damit die freien Server nicht belastet werden.
- Die Antwort der Reserve steht im gleichen Gedächtnis wie jede andere (10 Minuten), eine Panne löst also keine Fragenflut aus.
- Eine Zeile beim Weg (Karte auf der Live-Karte, Überraschungsrunde, Runde durch einen Ort) sagt, dass eine Reserve geplant hat: der Weg kann abweichen, nimmt kaum Rücksicht auf Strasse, Gravel oder MTB und nennt keine Höhenmeter. Bei Runden steht dann «km · etwa Zeit» ohne «0 Hm».
- Der Hinweis zum Standort nennt die Reserve-Router und sagt, dass sie dieselben Punkte bekommen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gemessen am 05.11.2026 (je eine Teststrecke): beide Reserven sind aus dem Browser erreichbar, schnell, Valhalla nimmt höchstens 150 km Weg. Der Velo-Typ «Mountain» ändert bei Valhalla nur die Zeit, nicht den Weg, der Weg ähnelt BRouter «fastbike», nicht BRouter «mtb». Darum die Warnzeile.
- Eine ausdrückliche Nutzungsregel der FOSSGIS-Server habe ich nicht gefunden: pro Fehler höchstens eine Anfrage je Reserve, nie im Hintergrund ausser bei der bestehenden Neuberechnung abseits der Route (höchstens einmal pro Minute).
- Valhalla-Grenze als Luftlinie 110 km (der Server rechnet Weg, nicht Luftlinie).
- Kein Tempolimit-Merker «brouter.de ist unten, frag gleich die Reserve»: die Antwort aus dem Gedächtnis reicht, und ein Zeitlimit kann auch nur an einer zu langen Strecke liegen.

## Entscheide (für decisions.md)
- 05.11.2026: Reserve-Router sind Valhalla und OSRM von FOSSGIS, nur nach einem Ausfall von brouter.de, nie für Gravel/MTB-Wahl (Noah «2a und b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation: Schritt 2 von 4 gebaut (nach dem Sicherheitsnetz); geplant sind «Wie fährst du?» mit MTB und Gravel, dann Belag.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › «⋯ › Neu planen zu …»: der Hinweis unter der Liste nennt auch die Reserve-Router.
2. Die Reserve zeigt sich nur an einem schlechten Tag: dann trägt die Wegkarte die Zeile «Der gewohnte Velo-Router hat nicht geantwortet».
