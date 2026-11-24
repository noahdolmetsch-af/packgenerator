# Gesamttest Runde 2: Seiten und Daten vorbereitet (noch nicht gestartet)

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5», Punkt 4 (Thread «Wackel-Tests zuverlässig machen»)

## Was ist neu
- Nichts in der App. Nur Tests: ein neuer Teil `tests/e2e/gesamttest/alle-seiten.spec.js` öffnet jede Adresse aus dem Code, die Runde 1 nicht kennt (216 von 261, darunter Mein Tag, Kursblick, Zuletzt gelöscht, Anprobe, Gipfelbuch, Challenges, alle Ruhig-, Frei-, Mini- und Werkzeug-Seiten), auf dem Handy (390 und 320) und dem Computer (1366), Deutsch und Englisch, und prüft wie Runde 1: keine Konsolenfehler, nichts schiebt zur Seite, nichts abgeschnitten, kein Wort mitten getrennt, jeder Knopf hat einen Namen, kein Englisch im Deutschen, Ladezeit.
- Neue Testdaten (`aktivLayer` in `tests/fixtures/gesamttest/make.mjs`): 95 Fitbit-Tage, 30 Strava-Fahrten, 138 «Im Flow»-Einträge und 30 Meditationen, 90 Tageschecks, 42 Kilometer-Einträge. Erfunden, nur für Runde 2; Runde 1 und ihre Zählungen bleiben wie sie waren.
- Der neue Teil läuft nur mit `GTP_ALLE=1`. Die Nachtprüfung startet ihn also nicht von selbst; er wird nach Welle 1 und 2 von Hand gestartet.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Liste der Adressen kommt aus dem Code (wie beim Wege-Wächter), nicht aus einer Abschrift: eine neue Seite ist beim nächsten Lauf von selbst dabei. Runde 1 (`pages.spec.js`) bleibt unberührt.
- Abläufe mit Klicks für die neuen Funktionen (Mein Tag abhaken, Zuletzt gelöscht und Rückgängig, Anprobe) sind noch nicht geschrieben: ohne einen Lauf wären die Auswahlen geraten. Sie folgen nach dem ersten Lauf, mit den Auswahlen der vorhandenen Einzel-Tests.
- Dunkle Farben: mit `GTP_DARK=1` (gleiche Prüfungen).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte
1. In GitHub: `build` und `e2e` grün (der neue Teil wird dort übersprungen).
2. Von Hand, später: `GTP_ALLE=1 npx playwright test tests/e2e/gesamttest/alle-seiten.spec.js --project=phone --workers=2`.
