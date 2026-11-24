# Test «Ich › Projekt-Ablage» findet die Zeile unter «Mehr»

Auftrag: Koordinator, Main-Fix (rot auf main seit #1681: `paketn.spec.js:60`).

## Was ist neu
- Nichts in der App. «Ich aufräumen» (#1681) hat die Zeile «Projekt-Ablage» unter das zugeklappte «Mehr» gelegt. `tests/e2e/paketn.spec.js` suchte sie offen auf Ich. Jetzt klappt der Test «Mehr» zuerst auf, genau wie `projektablage.spec.js` und `miniapps.spec.js` seit #1681.
- Alle 45 Specs, die Ich öffnen, wurden nach #1681 lokal gelaufen (Handy und Computer): ausser diesem Test fiel keiner wegen der neuen Ich-Seite durch.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wird nicht gelockert: dieselben Prüfungen, nur ein Klick auf «Mehr» davor.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts sichtbar ist.

## Prüfschritte
1. Nichts zu prüfen in der App. In der Prüfung des PR ist `paketn.spec.js` auf Handy und Computer grün.
