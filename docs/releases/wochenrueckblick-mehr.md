# Wochenrückblick: korrigiert und voller

PR folgt · 01.11.2026 · Auftrag: Noah «1a 2a 3c 4a 5c» (Thread «Verbessern Wochenrückblick: Fehler und mehr Daten»)

## Was ist neu
- **Fehler behoben (im Code geprüft):**
  - «0 h, 100 % weniger» trotz 2 Einheiten: Stunden zählen jetzt Strava **plus** die Minuten aus Aktiv (ohne Doppelte). Hat eine Aktiv-Einheit keine Minuten, steht das unter den fünf Zahlen, statt still 0 zu rechnen.
  - Die laufende Woche wird mit den **gleichen Tagen** der Vorwochen verglichen (Mo bis heute), nicht mit einer ganzen Woche. Das gilt für die fünf Zahlen, die Sätze und die Beobachtungen.
  - Sind Tage aktiv, aber nichts gemessen, erscheint kein «100 % weniger» mehr.
  - Die 3 Beobachtungen werden erst nach Sonntag festgehalten (am Sonntag selbst aus den heutigen Daten). Eine Woche, die eine ältere Version schon am Sonntagmorgen festhielt, wird einmal neu gerechnet.
  - «Blick nach vorn» sagt in der laufenden Woche nicht mehr «ruhigere Woche», sondern nennt die übliche Woche.
  - Bei den kleinen Diagrammen steht bei **jedem** Balken der genaue Wert.
- **Alle Zahlen dahinter:** jede Beobachtung öffnet eine Seite (`#/flow/review/obs?kind=…&w=…`) mit Diagramm, Tabelle, «So wurde es gerechnet» und Link zu Analyse.
- **Neue Kacheln:** Körper diese Woche (Ruhepuls, HRV, Schlaf, Schritte, Aktivzonenminuten, je gegen die gleichen Tage der Vorwoche), Zeit in den Pulszonen, Km pro Velo, Wetter und Termine pro Tag.
- **Meine Notiz und mein Ziel:** eine Notiz pro Woche und ein Ziel für die nächste Woche (abhakbar), alles änder- und löschbar mit Undo.
- **Zwei neue Beobachtungsarten:** Körperwerte (Ruhepuls, HRV oder Schritte) und Wetter und Bewegung (aktiv an trockenen gegen Regentage).

## Was fällt weg oder rutscht tiefer
- nichts. Die Seite wird länger (neue Kacheln und Notiz); Noah hat keine Längenvorgabe (Regel 6).
- Die alte Zeile «Stunden, km und Hm von Strava» wird zu «Stunden: Strava plus Aktiv-Minuten».

## Selbst entschieden
- Neue Daten liegen im bestehenden Settings-Eintrag `weeknotes` (kommt mit ins Backup, kein Dexie-Schema geändert).
- Wetter und Termine kommen aus den schon gespeicherten Tageswerten (`dayWeather`, `dayEvents`); ohne Wohnort gibt es die Kachel nicht.
- Km pro Velo nennt das Velo, das Strava bei der Fahrt notiert hat (Strava-Gear), nicht die App-Zuordnung.
- Keine neue Funktions-ID: die Texte von `f.weekreview` und `f.observations` wurden erweitert.
- Aktiv-Einheiten mit Minuten zählen nur, wenn es am gleichen Tag keine Strava-Aktivität der gleichen Art gibt (wie bisher bei «Einheiten»).

## Entscheide (für decisions.md)
- 01.11.2026: Laufende Woche = gleiche Tage der Vorwochen (Noah «4a»). Beobachtungen bleiben erst nach der Woche fest.
- 01.11.2026: Stunden = Strava + Aktiv-Minuten (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «im Alltag unterstützen»: Wochenrückblick vertieft; keine Planänderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Woche › Wochenrückblick: «Stunden» ist nicht mehr 0:00, wenn du in Aktiv Minuten notiert hast; die Zeile darunter nennt «die gleichen Tage der Woche davor».
2. Bei den 3 Beobachtungen auf «Alle Zahlen dahinter» tippen: Diagramm, Zahlen, «So wurde es gerechnet».
3. Weiter unten: «Körper diese Woche», «Wetter und Termine», «Meine Notiz und mein Ziel» (Notiz schreiben, Ziel für nächste Woche setzen, löschen und Undo).
