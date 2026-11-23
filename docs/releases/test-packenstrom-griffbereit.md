# Test «Neues Teil beim Packen»: ein Regenteil steht auch in der Zeile «Griffbereit»

23.11.2026 · nur Testcode

- `tests/e2e/packenstrom.spec.js` suchte den Namen des neuen Regenteils mit `.first()` und traf seit «Griffbereit» die geschlossene Zeile der Karte «Bereit zur Abfahrt?» (unsichtbar). Der Test sucht jetzt die sichtbare Stelle.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Der Test wurde angepasst, nicht das Verhalten: ein Regen- oder Essensteil darf in der Karte genannt werden.
