# Kleider-Frage im Rückblick: Prüfungen angepasst

PR #1783 · 23.11.2026 · Auftrag: Bündler (zwei E2E-Prüfungen auf main rot nach dem Merge von «Zwiebel für Morgen und Mittag»)

## Was ist neu
- nichts Sichtbares. Zwei Prüfungen (`tabs.spec.js`, `areas.spec.js`) erwarteten noch vier Antwort-Gruppen unter «Wie war es?», mit «Kleidung» an zweiter Stelle. Seit dem letzten PR steht «Wie war die Kleidung?» als eigener Abschnitt rechts; unter «Wie war es?» bleiben drei Gruppen (Wetter, Essen, Taschen).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Absicht der Prüfung hat sich geändert, sie wurde nicht gelockert: die Kleider-Frage wird weiter geprüft (sichtbar, am Anfang unbeantwortet).
- Kein Schema, kein Backup, kein Sync, kein api/.

## Prüfschritte
1. Rückblick einer Tour öffnen: «Wie war die Kleidung?» steht rechts, keine Antwort gewählt.
2. «Mehr» › «Wie war es?» öffnen: Wetter, Essen, Taschen; keine Kleidung.
