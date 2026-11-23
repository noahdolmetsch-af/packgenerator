# Wackel-Tests: echte Zeit für Specs ohne feste Seitenuhr

23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen»)

- Specs, die `test` aus `@playwright/test` holen, die Seitenuhr nicht festsetzen und «heute» im Testcode rechnen, holen die Zeit aus `tests/e2e/realtime.js` (`RealDate`, `realNow`), nicht aus `Date`. Grund: `clock.js` lässt `Date` im Arbeiter nach jedem Fixture-Test auf dem Testtag stehen; das war die Ursache der Wackler in `live-speichern` und `pf` (rot im Nachtlauf, grün im frischen Arbeiter beim Wiederholen).
- Ein Wackler wird durch Warten auf das, worauf der Test wirklich wartet, behoben (Chips da, Schreiben fertig), nie durch längere Fristen oder Neustart.
- Vorschlag, nicht entschieden: `clock.js` gibt die Verschiebung nur Specs, die `clock.js` laden, und nicht den rund 170 anderen. Das würde `tests/clock-fixture.test.js` («ein Spec liest den Testtag») ändern; braucht Noahs ok.
