# Wenn ein Dienst nicht da ist

PR folgt · 03.11.2026 · Auftrag: Noah «1a danach 3 und 4», «4a nur der ruhige Hinweis überall» (Thread «Finden: Was wir übersehen haben»)

## Was ist neu
- Gemeinsamer Satz ««Wetter» ist gerade nicht erreichbar. Du kannst trotzdem weiterarbeiten.» (`src/lib/ausfall.js`). Er erscheint, wenn der Dienst nicht antwortet (kein Netz, Serverfehler 5xx, zu viele Anfragen).
- Eingebaut: Wetter-Vorhersage und Ortssuche (`weather.js`, `ride.js`; die Orts-Suchfelder auf Heute, Wohnort-Fenster, Mini-Orte, Webcams, Umleiten, Tour-Route) und Strava («keine Verbindung» und Serverfehler).
- Die letzte gespeicherte Vorhersage blieb schon bisher sichtbar, wenn das Netz fehlt; das bleibt.

## Was fällt weg oder rutscht tiefer
- Die Meldungen «Forecast failed (500)», «No connection. Place search needs the internet.» und «Strava: keine Verbindung zum Server» fallen weg, an ihrer Stelle steht der gemeinsame Satz.

## Selbst entschieden
- Nur der ruhige Hinweis (4a), kein voller Offline-Plan pro Funktion.
- Die KI-Funktionen (Helfer) hatten schon ruhige Sätze («Alles andere funktioniert wie gewohnt») und bleiben unverändert.
- Weitere Dienste (Trello, Fitbit, Lake, Gemini-Hilfen) noch nicht umgestellt; sie zeigen ihre eigenen Hinweise. Auf Zuruf nachziehbar.
- Fehler, die kein Ausfall sind (z. B. 400), behalten ihre eigene Meldung.

## Entscheide (für decisions.md)
- 03.11.2026: Ein Dienst-Ausfall wird überall mit demselben ruhigen Satz gesagt (`src/lib/ausfall.js`).

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 4 (Ausfall-Hinweis) gebaut für Wetter und Strava.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy in den Flugmodus, auf Heute einen Wohnort suchen: «Wetter ist gerade nicht erreichbar…».
2. Flugmodus aus: die Suche geht wieder.
