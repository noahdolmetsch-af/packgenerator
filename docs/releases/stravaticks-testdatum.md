# Test: Strava-Häkchen rechnet mit dem Tag des Tests

PR folgt · 31.10.2026 · Auftrag: Noah «Zwischenstand?» / «überall fortfahren» (Reparatur, damit die Prüfung der PRs wieder grün ist)

## Was ist neu
- Nichts Sichtbares. `tests/stravaticks.test.js` war ab dem 31.10.2026 rot (auch auf main), weil eine Aktivität vom 17.10. aus den letzten 14 Tagen fiel: `setSport` nahm den heutigen Tag statt des festen Tages des Tests.
- `setSport` nimmt jetzt optional den Zeitpunkt mit (`now`), wie `applyTicks`. Die App ruft es unverändert auf.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wurde nicht gelockert: er prüft dasselbe, nur mit dem festen Tag.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte
Nichts zu sehen. `npm test` ist grün.
