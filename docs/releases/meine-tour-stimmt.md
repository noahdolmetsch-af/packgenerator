# «Meine Tour» stimmt: Form, Pflege, Verpflegung und Fahrt fliessen ein

PR folgt · 10.11.2026 · Auftrag: Noah «2a» (Folge von Plan-Schritt 2a; Thread «Bauen: Karte «Meine Tour» auf Heute»)

## Was ist neu
- Heute und der Tour-Pfad gaben der Regel `tourStand` nur Datum und Rückblick mit. Form, Velopflege, Verpflegung und Fahrt galten als «unbekannt», also offen: «Körper» war immer der nächste Schritt, «Dein Moment» sagte «Weiter packen». Jetzt liest die neue Datei `src/lib/tourpfad/kontext.js` diese Fakten einmal aus der Datenbank und gibt sie beiden Orten gleich mit.
- Form: aus der Bereitschaft des Tages (rest = niedrig, easy = ok, sonst gut); ohne Daten bleibt sie unbekannt. Velopflege: die fälligen Punkte des Velos der Tour (`bikeCare`); ohne Angaben unbekannt. Verpflegung: die Tour hat eigene Verpflegungs-Zahlen. Fahrt: eine Fahrt ist der Tour zugeordnet. Längste Fahrt: für den Hinweis «Körper und Tour».
- Es wird nichts gespeichert; ein Fehler beim Lesen lässt alles unbekannt (der Pfad wie vorher).

## Was fällt weg oder rutscht tiefer
- nichts. Der nächste Schritt kann sich ändern (oft «Packen» statt «Körper»), das ist der Zweck.

## Selbst entschieden
- **Reise-Auswahl nicht eingespeist:** die Optionen («travel.choices») gehören zu keiner Tour; «gewählt» liesse sich für diese Tour nicht sagen. Die Zeile «Anreise» liest weiter nur `trip.arrival`.
- **Einmal lesen, nicht live:** Heute und Tour-Pfad laden die Fakten beim Öffnen (und bei einer anderen Tour). Eine Änderung zeigt sich beim nächsten Öffnen. Das Laden ist träge (`import()`), nur bei einer geplanten Tour.
- **Unbekannt bleibt offen:** nur ein Wissen macht eine Zeile «erledigt», nie das Fehlen von Daten.
- **Bild-Vergleich:** gleiche Karte wie in 2a; nur der Satz «Als Nächstes» ändert sich.
- Fertig-Regel: keine neue Seite, kein neuer Eintrag in `features.js`; App-Stand: Zeilen «Meine Tour» und «Tour-Pfad» ergänzt.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Schritt 2a bleibt online; 2b nicht angefasst).
