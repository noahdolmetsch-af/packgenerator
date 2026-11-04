# Wächter «3 Tipps von Heute»: «#/live» zurück in TAP_GAPS

PR (diese Änderung) · 04.11.2026 · Der Wächter `tippzahl.spec` war nach #751 auf main rot; keine sichtbare Änderung in der App.

## Was ist neu
- nichts in der App. In `src/lib/know/tipps.js` steht «#/live» wieder in `TAP_GAPS`: Von Heute aus ist die Live-Karte weiter als 3 Tipps entfernt (der Wächter meldet «Further than 3 taps»).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Mein Entfernen der Zeile in #751 war falsch. Die Zeile bleibt, bis ein Link zur Live-Karte auf einer Bereichsseite von Heute aus steht; das wäre ein eigener PR.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- unverändert.

## Prüfschritte
1. CI: `e2e (phone)` Teil 4 mit `tippzahl.spec.js` ist grün.
