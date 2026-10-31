# CI: Liste der gescheiterten und wackeligen Tests

PR #… · 31.10.2026 · Auftrag: Noah «1a», «kannst du damit schon beginnen» (Thread «Merge-Stau abbauen und Tests stabilisieren»)

Nichts davon ist in der App sichtbar.

## Was ist neu
- Jeder Handy-Teil und der Wächter am Computer schreiben am Ende in die Zusammenfassung des Laufs (Actions › Lauf › Summary), welche Tests gescheitert sind oder erst beim zweiten Versuch grün wurden («flaky»), mit Datei, Zeile, Name und Handy/Computer.
- Warum: Heute raten wir, welche Tests unzuverlässig sind. Nach ein paar PRs steht in den Läufen, welche wirklich öfter fallen, und die kann man gezielt reparieren.
- `scripts/test-summary.mjs`, Test `tests/test-summary.test.js`; Playwright schreibt in CI zusätzlich `pw-report.json` (nicht in Git).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Das Skript scheitert nie und ändert das Ergebnis des Laufs nicht.
- Kein Umbau der Wiederholungen oder der Anzahl Teile; zuerst Daten.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Thema «Merge-Stau»: Handy-Flakes: Daten sammeln, danach gezielt beheben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu prüfen.
2. Auf GitHub unter Actions einen Lauf öffnen, unten «Summary»: ist ein Test gescheitert oder wackelig, steht er dort mit Namen.
