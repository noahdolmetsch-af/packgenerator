# Browser-Tests: festes Datum

Auftrag: Noah «1a» (1.11.2026, Thread «Merge-Stau abbauen und Tests stabilisieren»)

## Was ist neu
- Alle Browser-Tests laufen auf einem festen Tag: ein Mittwoch, 12 Uhr (Zürich), zwischen dem 15. und 21. des echten Monats. Vorher: «heute um 12 Uhr».
- So kippt kein Test mehr am Monatsende oder Monatsanfang (wie am 1.11. beim Eingang «Abgelegt»).
- Neuer Einheitstest in `tests/clock-fixture.test.js` prüft den Tag (Wochentag 3, Datum 15–21, 12 Uhr).

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts in der App sichtbar)

## Selbst entschieden
- Mitte des Monats statt immer «der 15.»: so ist der Wochentag immer gleich (Mittwoch), und Wochen-Logik bleibt stabil.
- `E2E_REAL_CLOCK=1` schaltet die feste Uhr weiterhin ab.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Punkt 1a erledigt.

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
