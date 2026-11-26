# Test-Landkarte

PR #<Nummer> · 26.11.2026 · Auftrag: Noah «1-8» (Thread «Tests auf den neuen App-Stand bringen», Schritt 1)

Nichts Sichtbares geändert, nur Doku, ein Skript und ein Test.

## Was ist neu
- `docs/tests.md`: eine Seite, die die vier Test-Etagen (Alltagswege, Wächter, Bereichstests, Unit-Tests), die Bereiche der App und den Plan «Tests auf den neuen App-Stand bringen» beschreibt.
- `scripts/test-landkarte.mjs`: ordnet jede Test-Datei einem Bereich und einer Etage zu und zeigt, welche Dateien alte Bauschritt-Namen tragen, feste Wartezeiten haben oder den Quelltext als Text lesen. `node scripts/test-landkarte.mjs` (Tabelle), `--liste` (jede Datei), `--json`.
- `tests/test-landkarte.test.js`: hält die Form: jede Test-Datei ist erfasst, höchstens ein Zehntel bleibt «Sonstiges», jeder Bereich steht in `docs/tests.md`.

## Was fällt weg oder rutscht tiefer
- nichts. Es wird kein Test gelöscht oder verändert.

## Selbst entschieden
- Die Zahlen stehen nicht in `docs/tests.md`, sondern kommen aus dem Skript, damit die Seite nicht mit jedem PR veraltet und keine PRs wegen Zahlen zusammenstossen.
- Die Zuordnung geht zuerst nach dem Dateinamen und sonst nach der Adresse, die eine Datei am häufigsten öffnet. Rund ein Zehntel (vor allem alte Unit-Tests) bleibt «Sonstiges» und wird bei Schritt 4 und 6 zugeordnet.
- Der Test verlangt nur, dass höchstens ein Zehntel «Sonstiges» bleibt (nicht null), damit ein neuer Test eines anderen PR nicht an dieser Landkarte scheitert.

## Entscheide (eigene Datei `docs/decisions/tests-neu-aufsetzen.md`)
- 26.11.2026: ganzer Plan Schritt 1 bis 8 freigegeben (Noah «1-8»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tests auf den neuen App-Stand bringen: Schritt 1 von 8 (Plan in `docs/tests.md`).

## Prüfschritte
1. `node scripts/test-landkarte.mjs` zeigt eine Tabelle je Bereich.
2. `docs/tests.md` nennt jeden Bereich der Tabelle.
