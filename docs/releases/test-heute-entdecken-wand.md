# Test: Heute-Wand ohne die Kachel «Entdecken»

Nur Testcode. Folge von «Heute entdecken» (Noah 23.11.2026 «2b», PR 1604).

## Was ist neu
- Die Tests `wasneu-design`, `kachel-wand` und `heute-neu` rechnen die erwartete Wand aus der Liste der fertigen Kacheln. Die alte Kachel «Entdecken» steht seit «Heute entdecken» nicht mehr auf der Wand (sie ist die Zeile unter den Chips), also fällt sie auch aus der erwarteten Liste.

## Was fällt weg oder rutscht tiefer
- nichts (kein App-Code geändert).

## Selbst entschieden
- Kein Test gelockert: dieselbe Reihenfolge der Wand wird geprüft, nur ohne die Kachel, die absichtlich nicht mehr dort steht.
- `v0471.spec.js` (a, Handy: Tippfläche 43,99 statt 44 px) wurde auch rot gemeldet. Mit dem Stand von `main` läuft der Test lokal auf Handy und Computer grün; er öffnet die Tourseite, nicht Heute, der Wert ist ein Rundungswert. Wenn er in der CI wieder rot wird, folgt eine eigene Korrektur.

## Entscheide
- keine

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: nur Tests ändern sich. e2e-part 5 auf `main` ist wieder grün.
