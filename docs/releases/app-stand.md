# Fester App-Stand

PR (Nummer folgt) · 03.11.2026 · Auftrag: Noah «1-5 a» (Thread «Entwerfen: Fester App-Stand für alle Threads»)

## Was ist neu
- `docs/app-stand.md`: die eine Liste, was die App kann (12 Bereiche mit Name, echtem Link und einem Satz), dazu Orte, Datenablage und Verbindungen. Grundlage ist Noahs Dokument «Was die App kann», abgeglichen mit `features.js` und der echten Seite.
- `tests/appstand.test.js`: wird rot bei einem toten Link, einer doppelten Funktion, einer Versionsnummer in der Datei oder einer Funktion aus `features.js`, die unter keiner Zeile steht.
- `CLAUDE.md`: jede Sitzung liest `docs/app-stand.md` vor jeder Abfrage; neuer Punkt 6 in der Fertig-Regel (neue Seite oder Funktionsgruppe bekommt ihre Zeile).
- Hinweise «Verlauf, aktuell steht es im App-Stand» in `docs/status.md`, `docs/projektstand.md`, `docs/README.md` und im Handbuch.
- `docs/handbuch.md` neu erzeugt (`node tools/handbuch.mjs`): sie nannte noch 193 statt 455 Funktionen.

## Was fällt weg oder rutscht tiefer
- nichts (reine Doku, Test und Regel; die App ändert sich nicht).

## Selbst entschieden
- Keine Versionsnummer und keine Zählung in der Datei (Regel 13), sonst ändert jeder PR dieselbe Zeile und offene PRs geraten in Konflikt.
- 16 Zeilen für Funktionen aus `features.js`, die im Dokument fehlten (Werkzeugkasten, Freie Zeit, Chronik, Stopps in der Nähe, Fitbit …), stehen als Abschnitt 12 «Beim Abgleich ergänzt».
- Zeilen, die der Screenshot verdeckte, sind mit † markiert und aus `features.js` ergänzt.
- Kopie im Projektordner und Archivierung von `HANDOVER2.md` und `PROJECT-INSTRUCTIONS2.md` liegen ausserhalb des Repos und erledigt der Thread nach dem Merge.

## Entscheide (für decisions.md)
- 03.11.2026: `docs/app-stand.md` ist die feste Grundlage für alle Threads; Hauptdatei auf GitHub, Kopie im Projektordner (Noah «1-5 a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne auf GitHub `docs/app-stand.md`: oben steht die Regel «vor jeder Abfrage lesen», darunter 12 Bereiche.
2. Tippe in der App auf Ich › Karte der App: die Funktionen stimmen mit den Bereichen überein.
