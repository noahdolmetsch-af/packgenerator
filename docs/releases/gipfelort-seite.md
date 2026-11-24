# Eine Seite für jeden Gipfel

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «alle 1-5 zusammen» (Thread «Gipfelbuch ausbauen»), Idee 3 von 5

## Was ist neu
- Jeder Ort im Gipfelbuch hat eine eigene Seite `#/flow/gipfelbuch/<id>` (Gipfelbuch › Ort antippen › «Seite dieses Ortes öffnen»).
- Oben: Besuche, erstes Mal, schnellste Zeit hoch. Darunter alle Besuche, neueste zuerst: Datum, Herkunft (Strava-Fahrt, Fahrt aus einer Datei, von Hand), Höhenmeter, Temperatur und Regen, Zeit hoch.
- «Zeit hoch» kommt aus den Steigungen der Strava-Fahrt, deren Name den Ortsnamen enthält. Die schnellste ist markiert.
- Temperatur: die Werte von Strava; sonst auf Tipp «Wetter dieses Tages holen» (Open-Meteo, nur bei Orten mit Koordinaten).
- Fotos: die der Strava-Fahrt und eigene (bis 3 pro Besuch, auf dem Gerät verkleinert, mit Kreuz zum Entfernen und Rückgängig). Eine Notiz je Besuch.
- Besuch entfernen mit Rückgängig. Der letzte Besuch eines Ortes bleibt; dann gibt es «Ort entfernen».
- Die Sammel-Wand öffnet einen Ort auf dieser Seite.
- Unbekannter Ort (zum Beispiel entfernt): die Seite sagt es und führt zurück ins Gipfelbuch.

## Was fällt weg oder rutscht tiefer
- nichts. Die Detail-Karte im Gipfelbuch bleibt; sie hat eine Zeile mehr («Seite dieses Ortes öffnen»).

## Selbst entschieden
- Eigene Fotos stehen in einer eigenen Einstellung `gipfelbuch-fotos`, nicht im Buch: das Buch bleibt klein und schnell. Kein neues Dexie-Schema, nur eine Zeile in der bestehenden Tabelle `settings`.
- Besuche haben neu optional `note` und `wx`. Alte Besuche ohne diese Felder bleiben unverändert gültig.
- Die Zeit hoch gibt es nur bei Strava-Fahrten mit gespeicherten Steigungen und passendem Namen; ohne Treffer steht nichts, keine Schätzung.
- «Fertig-Regel»: Seite = Eintrag `f.gipfelbuch` in `features.js` (Text, Handbuch, Worte); Absprung = Link in der Detail-Karte und in der Sammel-Wand; Gut zu wissen = bestehender Satz von `f.gipfelbuch`; leerer Zustand = Seite eines unbekannten Ortes; als Nächstes = Zeile «Als Nächstes» (alle Orte, Neuland, Sammel-Wand); App-Stand = Gipfelbuch-Zeile ergänzt.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Gipfelbuch ausbauen in vier kleinen PRs (Seite pro Ort, Sammlungen und Erkennen, Karte mit Lücken, «Welcher Berg ruft?») – `docs/decisions/gipfelort-seite.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Gipfelbuch ausbauen: Idee 3 von 5 online, die anderen folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Gipfelbuch öffnen, einen Ort antippen, «Seite dieses Ortes öffnen» tippen.
2. Bei einem Besuch «Notiz dazu»: ein paar Worte schreiben, speichern, Seite neu laden: die Notiz steht noch da.
3. Bei einem Besuch «Foto hinzufügen»: ein Bild wählen; das Kreuz nimmt es weg, «Rückgängig» holt es zurück.
4. Sammel-Wand › «Zuletzt dazugekommen»: ein Ort öffnet seine eigene Seite.
