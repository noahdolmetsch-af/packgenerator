# Eine Rechnung für deine Woche

Auftrag: Noah «1a 2a 3a 4a 5a» (22.11.2026, Thread «Alle Sportarten und Erholung», Schritt B) und «a» (drei mittlere PRs, Paket 1 «Eine Rechnung»)

## Was ist neu
- Eine gemeinsame Rechnung `src/lib/weekcalc.js` (nur lesen, nichts wird gespeichert) für die Karte «Deine Woche» auf Heute, den Wochenrückblick, die Wochen-Details und die Beobachtungen. Was sie sonst noch liest (Fahrten, Buch, übliche Dauer, Strava-Tabelle, ignorierte Velos, Fitbit-Tage), holt `src/lib/weeksources.js` an einer Stelle.
- **Stunden** = gemessen (Strava, Timer, getippt) plus «ca.» (übliche Dauer der Sportart) für abgehakte Einheiten ohne Minuten; beides sichtbar getrennt («davon ca. 1 Std.», «Für 2 Einheiten ist die Zeit «ca.»»).
- **Velo-km und Höhenmeter** aus einer Liste von Fahrten (Dateien, gezählte Strava-Fahrten, Strava-Fahrten ohne Buch-Eintrag). Fahrten in «Zum Prüfen» zählen mit und werden genannt (Noah 1a); eine Strava-Fahrt, die zweimal im Buch steht, zählt einmal (`onePerStravaId`, auch in den Kacheln und Zielen auf Heute und in Auswerten).
- **Laufen, Wandern und Ähnliches**: eigene kleine Zahl («Laufen, Wandern und Ähnliches: 8,4 km in 1 Einheit»), nie «Velo».
- **Uhr**: Trainings ohne Haken werden nur genannt («Die Uhr kennt 1 Training (1 Std.), das noch nicht zählt» mit «Zählen?»), nie still gezählt.
- Gleiche Karte, gleicher Rückblick: `tests/weekcalc.test.js` prüft, dass dieselbe Woche überall dieselben Zahlen gibt.

## Was fällt weg oder rutscht tiefer
- nichts. Die alte Zeile «n Aktiv-Einheiten haben keine Minuten notiert» entfällt, weil diese Einheiten jetzt mit «ca.» zählen und das gesagt wird.
- Km zählen im Wochenrückblick nur noch aus Velo-Fahrten; Laufen und Wandern standen bisher darin und stehen jetzt in ihrer eigenen Zeile (Noah «Velo» nur Velo).

## Selbst entschieden
- Schritt D («Im Fokus» und «Letzte 7 Tage» mit Haken, alle Sportarten) und der Rest von E (Sportjahr-Kacheln) folgen in einem eigenen Schritt; dieser PR bringt davon die doppelten Buch-Einträge (Kacheln und Auswerten rechnen jetzt richtig).
- Die ±1 Tage Spielraum beim Buch-Datum (Zeitzone) bleiben wie in `kmbook.js`.
- Nur Eishockey, Tennis, Yoga … mit eigener übliche Dauer zählen als «ca.»; Gym bleibt bei 20 Min bis zum Gym-PR (Noah «Gym 1 h»).
- Aufräumen der doppelten Einträge im Buch (Daten) ist ein eigener PR mit Einzelfreigabe und Backup; hier wird nur beim Lesen einmal gezählt.

## Entscheide (eigene Datei `docs/decisions/wochenrechnung.md`)
- 22.11.2026: Eine Rechnung, Frage 1a/2a, Verpackung in drei mittleren PRs.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: Schritt B erledigt; C, G, H, I, D, E, F, J, K, L folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wochenrückblick: unter den Stunden steht «davon ca. …», wenn Einheiten keine Minuten haben.
2. Darunter eine Zeile mit Fahrten in «Zum Prüfen» und mit Laufen/Wandern.
3. Heute (Sonntagabend): die Karte «Deine Woche» zeigt dieselben km und Stunden.
