# Mein Tag: Test «Planen: drei Reiter» an den neuen Chip angepasst

PR # · 23.11.2026 · Auftrag: Bündler (Test auf main rot seit PR 1542)

## Was ist neu
- Nichts in der App. Der Test `planen-drei-reiter.spec.js` erwartet unter «Planen › Woche» jetzt drei Chips (Woche, Mein Tag, Termine) statt zwei.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Chip «Mein Tag» bleibt, wo er ist (Noah wollte «Mein Tag» neben der Woche sehen, und er ersetzt später Woche und Kalender); nur die Zahl im Test wird angepasst, weil die Oberfläche mit Absicht gewachsen ist.
- Andere Tests zählen diese Chips nicht (geprüft).

## Prüfschritte
1. Keine sichtbare Änderung. Der Test `planen-drei-reiter` läuft grün (Handy und Computer).
