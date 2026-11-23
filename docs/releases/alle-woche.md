# Wochenrückblick: Alles, was du angelegt hast

PR folgt · 23.11.2026 · Auftrag: Noah «bei den analysen sollen immer alle angelegten dinge ausgewertet werden» (Thread «Analyse-Seite viel besser machen»)

## Was ist neu
- Die Karte **«Alles, was du angelegt hast»** im Wochenrückblick (Aktiv › Woche › Wochenrückblick) zeigt jede Aktivität aus Aktiv mit ihren Mal der Woche, den Tagen, dem Ziel pro Woche und der gemessenen Zeit: auch tägliche Gewohnheiten (Liegestütze, Zähneputzen, Yoga, Stretching), Sportarten ohne Ziel (Eishockey, Klettern) und Aktivitäten mit 0 Mal.
- Strava-Sportarten ohne eigene Aktivität in Aktiv (Schwimmen, Wandern …) stehen als eigene Zeilen «Von Strava, ohne eigene Aktivität in Aktiv».
- Eine Strava-Einheit ohne Haken ist sichtbar, mit «davon n nur von Strava, noch nicht gezählt»; sie zählt für kein Ziel.
- Aktivitäten ohne Mal und ohne Ziel stehen in einer geschlossenen Zeile «n Aktivitäten ohne Mal diese Woche».
- Rechnung in `src/lib/flow/alle-woche.js`, gleiche Einheiten wie die Stunden-Rechnung (`einheiten.js`, jede Strava-Aktivität einmal).

## Was fällt weg oder rutscht tiefer
- Die einzelne Karte «Erholung und Rituale» ist keine eigene Karte mehr: ihre Zeilen (Sauna, Meditation, Freunde …, mit Ziel, Tagen und gemessener Zeit) stehen als Gruppe «Erholung und Rituale» in der neuen Karte, an derselben Stelle der Seite. Im Sportjahr bleibt die Karte wie sie war.
- Sonst nichts.

## Selbst entschieden
- Eine Aktivität mit Zählmenge (Liegestütze, 10 pro Tippen) zeigt das Ziel in Mal pro Woche, nicht in Stück.
- Das Mal pro Aktivität zeigt nur gemessene Zeit, nie die übliche Dauer («ca.»), wie bei den Ritualen; die Stunden oben bleiben, wie sie waren.
- Die fünf Zahlen, die Wochenkarte und die Vergleiche bleiben unverändert (Hinweis des Wochenrückblick-Threads).
- Pausierte Aktivitäten stehen nicht in der Liste; Fahrten zur Arbeit und Reisetage zählen wie in der Wochenrechnung nicht.
- Fertig-Regel: Seite und Hilfetext bestehen (Wochenrückblick), `docs/app-stand.md` ergänzt; Absprung, leerer Zustand und nächster Schritt unverändert.
- Noch offen: Aktiv › Statistik und die weiteren Seiten (je ein PR, siehe Entscheid).

## Entscheide
- `docs/decisions/alle-woche.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung am Plan.
