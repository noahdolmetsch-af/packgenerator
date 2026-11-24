# Regeln an einem Ort: docs/regeln.md, kurzes CLAUDE.md, Archiv

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «1a 2a» (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- Neues Dokument `docs/regeln.md`: die eine Quelle für die Arbeitsweise, 30 Regeln (R1–R30), jede mit Datum und Quelle. Neu darin: Stau-Regeln 1–5, Wellen (lokal bauen, kein PR bis «Platz»), «gleiche Seite = ein PR», höchstens 8 offen und davon 5–6 in der Prüfung, Force-Push nur mit Noahs eigener Nachricht, Live-Test und Live-Bilder auf Deutsch, volle Prüfung nur einmal (Option A), Rundgänge 08:00 und 20:00, Abschnitt «So bleibt es aktuell».
- `CLAUDE.md` verweist am Anfang auf `docs/regeln.md` und hält nur noch die Regeln für den Code (Gruppen, Seiten laden später, alles selbst änderbar, Inhalt zuerst, Datenschutz, Dateien jedes PR, Tests).
- Neues `docs/regeln-archiv.md`: die alte Projekt-Anweisung und das alte `CLAUDE.md` wörtlich.
- Neuer Test `tests/regeln-doku.test.js`: jede Regel hat Nummer, Datum und Quelle; `CLAUDE.md` verweist auf die Regeln und hat keinen eigenen Regelblock; keine Versionsnummer in `docs/regeln.md`.
- Nur Doku und ein Doku-Test, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- `CLAUDE.md`: der Block «Current rules» 1–13 und «How we work» → `docs/regeln.md` (Wortlaut der alten Fassung: `docs/regeln-archiv.md`).
- Überholte Regeln («kleine PRs für alles, keine Bündel», «Noah merged selbst», «kein ★» und weitere) stehen nur noch im Archiv.
- `docs/arbeitsweise.md` bleibt als Verlauf; oben steht jetzt ein Hinweis auf `docs/regeln.md`.

## Selbst entschieden
- `CLAUDE.md` bleibt Englisch, `docs/regeln.md` ist Deutsch, weil Noah sie liest.
- Keine «Was ist neu»-Datei in `src/lib/news/`: ein PR ohne sichtbare Änderung legt keine an.
- Ein Verlust, den Noah nicht freigegeben hat, braucht weiter seine Antwort vor dem Merge (R20).
- Das alte Projekt-Gedächtnis wird nicht ins öffentliche Repo kopiert (es enthält persönliche Zahlen); es liegt im Projektordner.
- Die Delete-Regel (Rückgängig 8 Sekunden, `loeschen-rueckgaengig.md`) ist aus dem aktuellen `CLAUDE.md` übernommen.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Regeln an einem Ort, drei Orte ohne Doppel – siehe `docs/decisions/regeln-an-einem-ort.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen und lesen, ob die Regeln stimmen und nichts fehlt.
2. `CLAUDE.md` öffnen: oben steht der Verweis auf `docs/regeln.md`.
