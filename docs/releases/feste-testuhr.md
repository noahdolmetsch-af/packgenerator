# Feste Uhrzeit für die Browser-Tests

PR #280 · 28.10.2026 · Auftrag: Noah 26.10.2026 «1a» (Vorschlag T2, Thread «Verschlanken App, Tests und Speicher»); freigegeben 28.10.2026 («Freigeben»)

## Was ist neu
- In der App nichts Sichtbares. Jeder Browser-Test läuft so, als wäre es 12:00 Uhr in Zürich am echten Tag (`tests/e2e/clock.js`). Tests, die mittags grün sind, werden am Abend nicht mehr rot, weil Heute abends anders aussieht.
- Ein Test, der selber eine Uhr stellt (`page.clock`), behält seine.
- Der Wächter `tests/clock-fixture.test.js` prüft, dass jede Testdatei die feste Uhr nimmt oder selber eine stellt.
- CLAUDE.md Regel 8: während ein PR wartet, gleich mit dem nächsten geplanten Schritt weiterarbeiten (Noah 27.10.2026 00:14 UTC).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Zeit wird nur verschoben, nicht mit `page.clock` gefälscht: gefälschte Timer störten einige Seiten.
- `E2E_REAL_CLOCK=1` schaltet die feste Uhr für eine Fehlersuche aus.
- Neue Testdateien schreiben `import { test, expect } from './clock.js'`.

## Entscheide (für decisions.md)
- 27.10.2026: Browser-Tests mit fester Uhrzeit 12:00 Zürich (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken, Tests: T1 (Browser-Paket) und T2 (feste Uhr) erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App: sie sieht gleich aus wie vorher.
