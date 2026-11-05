# Schneefallgrenze jeden Tag

Auftrag: Noah «idee: schneefallgrenze auf wetter app direkt aktuell täglich anzeigen und auf home screen (in Meter über Meer)», Antworten «1b, wenn nicht verfügbar wird a angezeigt, 2a 3a 4a 5a» (Thread «Zeige Schneefallgrenze im Wetter»).

## Was ist neu
- Wetterseite, Karte «Heute»: «Schneefallgrenze 1’800 m ü. M.» jetzt, dazu der Tiefst- und Höchstwert des Tages und sechs Zeitpunkte (6, 9, 12, 15, 18, 21 Uhr).
- Heute: eine ruhige Zeile für den Wohnort, jeden Tag (auch ohne Tour). Tippen öffnet die Wetterseite.
- Hinweis «Schnee bei dir möglich», wenn die Grenze bis in die eigene Höhe sinkt. Standard ist die Höhe des Ortes, einstellbar unter «Schneefallgrenze einstellen».
- Dort lässt sich auch die Zeile auf Heute ausschalten.
- Ohne Netz erscheint der zuletzt gemerkte Wert mit «Stand» und Uhrzeit (bis 24 Stunden, wie bei allem Wetter).
- Quelle: Open-Meteos eigener Wert «snowfall_height», wo das Wettermodell ihn hat; sonst Nullgradgrenze minus 300 m (wie Karte und Skitouren). Die Seite sagt, welcher Fall gilt. Keine neue Abfrage, der Wert reist in der bestehenden Wetterantwort mit.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Von hier lässt sich Open-Meteo nicht erreichen: «snowfall_height» ist deshalb nur mit Test-Daten geprüft. Fehlt der Wert, gilt die Regel Nullgradgrenze minus 300 m, stundenweise.
- Werte auf 100 m gerundet (es ist eine Vorhersage). Hinweis bei Grenze bis 100 m über der eigenen Höhe, weil gerundet wird.
- Einstellungen (eigene Höhe, Zeile auf Heute) sind normale, mitgesicherte Einstellungen, nicht nur für dieses Gerät.
- Seite für einen anderen Ort (Suche): Hinweis nutzt dessen Höhe, ausser du hast eine eigene gesetzt.
- Keine neue Funktion in `features.js`: es gehört zu «Wetter für eine Fahrt» (`f.weather`), nur die Suchwörter sind ergänzt. Absprung ist die Heute-Zeile.
- Eine leere Ansicht gibt es nicht: ohne Wohnort oder ohne Wert fehlt die Zeile (die Wetterseite sagt schon, dass ein Wohnort fehlt).

## Entscheide (für decisions.md)
- 04.11.2026: Schneefallgrenze zeigt Open-Meteos eigenen Wert, sonst Nullgradgrenze minus 300 m (Noah «1b»); auf Heute immer, für den Wohnort (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Schneefallgrenze ergänzt. Die Wetterseite wird in einem eigenen Thread neu geplant.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter › Karte «Heute»: «Schneefallgrenze … m ü. M.» und sechs Zeitpunkte. Darunter steht, woher der Wert kommt.
2. Heute: eine graue Zeile «Schneefallgrenze …» unter der Wetterzeile; ein Tipp öffnet die Wetterseite.
3. Wetter › «Schneefallgrenze einstellen»: Haken bei «auf Heute zeigen» wegnehmen, die Zeile verschwindet auf Heute.
4. Flugmodus an, Wetterseite öffnen: der letzte Wert bleibt, auf Heute mit «Stand».
