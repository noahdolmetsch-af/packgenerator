# Impeccable-Nachtbericht: die ganze App jede Nacht messen

PR 1807 · 26.11.2026 · Auftrag: Noah «1-8» (Thread «Tests auf den neuen App-Stand bringen», Schritt 7 des Test-Plans)

## Was ist neu
- Nichts Sichtbares geändert, nur Test und Nachtlauf: Jede Nacht um 03:40 UTC (04:40 in Zürich im Winter) öffnet ein Roboter **jede Adresse aus `docs/app-stand.md`** am Handy (390×844), am Laptop (1440×800) und am Computer (1440×900), nur mit den erfundenen Daten (`tests/fixtures/gesamttest`).
- Er misst: lädt die Seite, Fehlerseite, Fehler im Browser, schiebt die Seite seitlich, abgeschnittene Knöpfe, englischer Text mit deutscher Entsprechung, sehr lange Seiten (über 9000 px) und kleine Tippflächen (nur gezählt).
- **Kein Rot:** Ein Fund macht den Lauf nie rot, es gibt kein Issue und keine Mail. Der Bericht (`bericht.md`, Klassen A, C und D) steht in der Zusammenfassung des Laufs und als Artefakt «impeccable-bericht» (3 Tage). Der Koordinator liest ihn in der Morgenrunde.
- Neue Dateien: `tests/e2e/impeccable/sweep.spec.js`, `scripts/impeccable-bericht.mjs`, `.github/workflows/impeccable-nacht.yml`, `tests/impeccable-bericht.test.js`. `playwright.config.js` lässt den Sweep nur mit `IMPECCABLE=1` laufen (ein PR startet ihn nie).
- Die Skripte stammen aus dem täglichen impeccable-Test der Live-App, nutzen aber die Messfunktionen des Repos (`sideways`, `cutOff`, `untranslated`) statt eigener Kopien.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Klasse B** («die Hauptsache steht zu tief») wird nicht gemessen: Das ist ein Urteil des Auges und ergab bei der Messung vom 25.11. viele Fehlalarme. Es bleibt beim täglichen impeccable-Test der Live-App.
- **Kontrast** wird nicht gemessen (am 25.11. unzuverlässig bei farbigen Schaltern).
- **Kein Vergleich zum Vortag** im Repo: Die Artefakte leben nur 3 Tage und der Lauf soll einfach bleiben; den Vergleich «neu, behoben, gleich» macht weiter der tägliche Test.
- Der Sweep läuft gegen den **frisch gebauten Stand** (wie die anderen Nachtläufe), nicht gegen die Live-Seite; er braucht darum kein Netz zu fremden Diensten.
- Eigene Datei für den Workflow statt Erweiterung von `volle-pruefung.yml`, damit der bestehende Nachtlauf unberührt bleibt.

## Entscheide (eigene Datei `docs/decisions/impeccable-nachtbericht.md`)
- 26.11.2026: Sweep als nächtlicher Bericht ins Repo, ohne Rot (Noah «1-8»); Verweis, Text steht in der eigenen Datei.

## Stand im Plan (roadmap.md / vorhaben.md)
- Test-Plan Schritt 7 (Nachtbericht der ganzen App): umgesetzt, sobald der PR gemergt ist.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub › Actions › «Impeccable-Nachtbericht» › «Run workflow» drücken (einmal von Hand).
2. Nach etwa 30 bis 60 Minuten: im Lauf unten den Bericht in der Zusammenfassung lesen (Funde A, C, D) und prüfen, dass der Lauf grün ist, auch wenn es Funde gibt.
3. Am nächsten Morgen: Der Lauf von 04:40 ist da und das Artefakt «impeccable-bericht» enthält `bericht.md`.
