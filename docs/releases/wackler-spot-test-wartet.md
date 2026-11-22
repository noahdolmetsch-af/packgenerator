# Wackel-Test «Sprung zur Funktion» (spot.spec): der Test wartet auf «im Bild»

22.11.2026 · Auftrag: Bündler (blockiert 1345: «f.starters: lit up but not on screen» zweimal in Teil 4); Noah «ja» zu «jeden Tag einen Wackel-Test reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

## Was ist neu
- Nur der Test ändert sich: `tests/e2e/spot.spec.js` misst «die angeleuchtete Stelle ist im Bild» nicht mehr in der ersten Millisekunde nach dem Aufleuchten, sondern fragt bis zu 6 Sekunden lang nach (alle 0,1 bis 0,4 Sekunden). Auf einem langsamen Gerät kommen nach dem Sprung noch Karten herein und schieben die Stelle kurz aus dem Bild.
- Nachgestellt unter Last (12 Läufe gleichzeitig, vier Rechnerkerne): vorher 3 von 12 rot («f.starters» und «f.blockeffect: lit up but not on screen»), nachher 12 von 12 grün.

## Was fällt weg oder rutscht tiefer
- nichts. Keine App-Änderung.

## Selbst entschieden
- Der Test wurde nicht gelockert: er verlangt weiter, dass die Stelle im Bild ist, er gibt ihr nur Zeit. Bleibt die Stelle wirklich draussen, schlägt er nach 6 Sekunden weiter fehl.
- Die App-Reparatur (`light()` schaut dreimal nach) liegt weiter bereit (Branch `claude/wackler-spot`) und braucht Noahs ok, weil sie App-Code ändert. Sie ist nur nötig, wenn die Stelle auch nach 6 Sekunden noch draussen wäre. Sie wird nach diesem PR neu auf main aufgesetzt.
- Keine «Was ist neu»-Datei: nichts Sichtbares.

## Prüfschritte (nach dem Merge)
1. In der Nachtprüfung steht «Sprung zur Funktion» nicht mehr in der Wackel-Liste.
