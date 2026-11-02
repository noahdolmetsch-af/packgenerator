# Letzter offener Laden vor der Nacht

PR (diese Änderung) · 02.11.2026 · Noah «4a» der Liste «Ursprünglich geplant» und «mit Einkaufsliste das wichtigste Feature» (Ziel 6 «Lange Fahrten unterwegs verstehen»)

## Was ist neu
- Karte «Letzter offener Laden vor der Nacht» im Teil «Stopps» der Live-Karte (nur mit Route): der letzte Laden oder die letzte Tankstelle, die du bei deinem Tempo vor Sonnenuntergang und noch offen erreichst, mit km, Ankunft und Schliesszeit.
- Ist schon dunkel oder bleibt vor der Nacht kein offener Laden: der nächste Laden vor dir, mit Hinweis.
- Ein Laden ohne bekannte Öffnungszeiten zählt, sagt aber «Nicht sicher»; ein Laden mit bekannten Zeiten gewinnt.
- Rechnung in `src/lib/live/lastshop.js` (getestet in `tests/lastshop.test.js`), Orte und Öffnungszeiten wie bisher aus den geladenen Stopps (OpenStreetMap).

## Was fällt weg oder rutscht tiefer
- nichts. Die Stoppliste rutscht um die neue Karte nach unten.

## Selbst entschieden
- «Nacht» heisst Sonnenuntergang des heutigen Tages am eigenen Ort.
- Läden und Tankstellen zählen beide; Tankstellen erscheinen mit ihrem Namen.
- Die Einkaufsliste baut ein anderer Thread; hier gibt es noch keinen Absprung dorthin.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben «Letzter offener Laden vor der Nacht mit Einkaufsliste» (vorhaben-liste.md): der Laden-Teil ist da, die Einkaufsliste folgt vom anderen Thread. Danach Nacht-Blatt und drei Ziel-Stufen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Route starten, Panel öffnen: unter «Stopps» steht die Karte mit einem Laden.
2. «Navigieren» auf der Karte tippen: Google Maps oder OsmAnd öffnet sich.
