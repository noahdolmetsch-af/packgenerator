# Test PF16: die Vorhersage kommt von selbst, der Test wartet nicht auf den Knopf

PR #? · 21.11.2026 · Auftrag: Noah «a» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

Kein sichtbarer Unterschied in der App, nur ein Test.

## Was ist neu
- `tests/e2e/pf.spec.js` (PF16): Liegt die Tour in Reichweite (heute), holt die App die Vorhersage von selbst, sobald die Route den Startort liefert (`TripRoute.svelte`); der Knopf «Vorhersage holen» wird dabei durch «Aktualisieren» ersetzt. Der Test wollte den Knopf klicken und wartete 90 Sekunden auf einen Knopf, der schon weg war. Das fiel erst auf, seit die Test-Uhr die echte Zeit liest (#1319); vorher lag die Tour wegen der verschobenen Uhr nicht in Reichweite. Jetzt klickt der Test den Knopf nur, wenn die Vorhersage nicht von selbst kam; geprüft wird weiter, dass die Vorhersage an der Tour gespeichert ist.
- Ich hatte Noah zuerst geschrieben, «Vorhersage holen» lasse sich nicht anklicken, das sei ein App-Fehler. Das war falsch: die App verhält sich richtig.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Prüfung (Vorhersage gespeichert) bleibt gleich streng; nur der Weg dorthin ist beides erlaubt (von selbst oder per Knopf).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- main bleibt grün: `pf.spec.js` PF16 wieder grün.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im nächsten Nachtlauf (Actions › «Volle Prüfung») steht `pf.spec.js` PF16 nicht mehr unter «Neu rot».
