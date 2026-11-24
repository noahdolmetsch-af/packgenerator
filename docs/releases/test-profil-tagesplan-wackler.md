# Test «Unterwegs: Profil der Etappe» wackelt nicht mehr

Auftrag: Koordinator, Main-Fix (roter Lauf in PR 1614 und 1629).

## Was ist neu
- Nichts in der App. Der Test `tests/e2e/hoehenprofil-tagesplan.spec.js` hat auf einem langsamen Läufer manchmal gescheitert: Nach dem Tippen stand kurz «km», dann zeichnete sich die Seite neu und die Zeile zeigte wieder «Ganze Strecke». Jetzt wird das Tippen wiederholt, bis «km», «Steigung» und «%» zugleich dastehen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wird nicht gelockert: er prüft weiter dieselben drei Dinge, nur in einem Wiederholschritt.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts sichtbar ist.

## Prüfschritte
1. Nichts zu prüfen in der App. In der Prüfung des PR ist `hoehenprofil-tagesplan` grün.
