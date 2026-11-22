# Test sn6plus: Knopfhöhen in einem Schritt messen

PR (Tests/CI) · 6.11.2026 · Auftrag: Koordinator (Thread «Stabilize slow mobile test sn6plus»)

## Was ist neu
- Nichts in der App. Der Handy-Test `tests/e2e/sn6plus.spec.js` («Funktionen von oben») misst die Höhe aller rund 380 Knöpfe in «Neu seit deinem letzten Besuch» jetzt in einem einzigen Aufruf (`evaluateAll`) statt mit einem `boundingBox()` pro Knopf.
- Die Aussage bleibt gleich: jeder Knopf ist mindestens 44 px hoch.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Der Test lief auf langsamen Runnern ins 90-Sekunden-Limit (rot bei #984 und #989, unabhängig von diesen PRs). Das Limit bleibt unverändert, nur die Messung ist schneller.
- Diese Doku-Datei kommt dazu, weil jeder PR seine Release-Datei hat (Regel 12), auch ohne App-Änderung. Keine News-Datei, weil nichts sichtbar ist.

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Test-Tempo: unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub Actions: «e2e (phone)» läuft für sn6plus grün und ohne Zeitlimit.
