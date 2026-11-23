# Eine Rechnung für deine Woche

22.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a», «mehr Infos 1a 2a 3 gym normalfall 1h sonst a 4b 5a» und «a» (Thread «Alle Sportarten und Erholung»)

- Karte «Deine Woche», Wochenrückblick und Vergleiche rechnen gleich (`src/lib/weekcalc.js`); gezählt wird, was angeschlossen ist, nichts doppelt.
- Frage 1a: Strava-Fahrten, die in «Zum Prüfen» warten, zählen bei km und Höhenmetern und werden genannt. Frage 2a: Kilometer zählen immer, Stunden nur, was gemessen ist plus «ca.» (übliche Dauer), beides sichtbar getrennt.
- «Velo» heisst nur Velo-km; Laufen und Wandern haben eine eigene kleine Zahl. Die Uhr (Fitbit) wird nur genannt («Zählen?»), nie still gezählt. Tägliche Gewohnheiten, der Weg zur Arbeit, Reisetage und der TrainingPeaks-Plan bleiben draussen.
- Gym-Normalfall künftig 1 h (ersetzt 20 min eGym), sonst die Dauer der Uhr als Tipp; Gruss-Gesichter werden als Skalenfrage `spass.stimmung` gespeichert (alte `hallo.gaht` bleiben lesbar); Erholung (Sauna, Kaltwasser …) zählt nie als Sport-Stunden. Diese Teile folgen in ihren eigenen PRs.
- Verpackung: drei mittlere PRs (1 Eine Rechnung, 2 Rhythmus und Vergleiche, 3 Neue Karten); A (Strava-Aufräumen), I, Gym 1 h, Gruss-Gesichter und F einzeln mit Einzelfreigabe. Das weicht von CLAUDE.md Regel 2 («kleine PRs, keine Bündel») ab, auf Noahs ausdrücklichen Wunsch («a», 22:01).
