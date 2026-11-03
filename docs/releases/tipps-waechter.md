# Wächter: höchstens 3 Tipps

PR #? · 03.11.2026 · Auftrag: Noah «2a 5a» (Thread «Bringe versteckte Funktionen online»)

## Was ist neu
- Roboter-Test `tests/e2e/tippzahl.spec.js` (Handy): startet auf Heute, tippt Links wie ein Mensch und zählt die Tipps bis zur Seite jeder Funktion (HOME in `src/lib/know/heimat.js`). Höchstens 3 Tipps: die Leiste unten und 2 weitere. Ein Link in einem zugeklappten Teil oder Fenster zählt 2. Suche, Quick Links, Katalog, Handbuch und Karte der App zählen nicht als Weg.
- Liste `TAP_GAPS` in `src/lib/know/tipps.js`: die Seiten, die heute noch weiter weg sind. Sie wird nur kürzer (`tests/tippzahl.test.js`).

## Was fällt weg oder rutscht tiefer
- nichts (keine Änderung in der App)

## Selbst entschieden
- Gezählt wird auf dem Handy, dort ist am wenigsten Platz. Der Test läuft mit den Handy-Tests nach dem «ok».
- Der Roboter zählt nur Links. Knöpfe, die ein Fenster öffnen (z. B. Muster-Rennen), zählen nicht; deren Seite braucht einen Link, wenn sie zu weit weg ist.

## Stand im Plan
- Versteckte Funktionen: Schritt 2 (Wächter). Danach «Alles hier» Bereich für Bereich, jede Runde macht `TAP_GAPS` kürzer.

## Prüfschritte
1. Nichts in der App zu prüfen; auf GitHub ist der Test «e2e (phone)» grün.
