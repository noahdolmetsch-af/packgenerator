# Test «Höhenprofil: Kachel in Touren» wartet auf die Liste

Auftrag: Koordinator, Main-Fix (rot auf main: `hoehenprofil.spec.js:21`, Gemini-PR 1640 wartet darauf).

## Was ist neu
- Nichts in der App. Der Test `tests/e2e/hoehenprofil.spec.js` zählte den Knopf «Alle 7 geplanten Touren» sofort nach dem Öffnen von Touren. Die Liste «Geplant» füllt sich erst nach dem ersten Zeichnen, die Zahl war 0, der Knopf wurde nicht angetippt, und die vierte Tour mit Profil blieb zugeklappt. Jetzt wartet der Test erst auf die erste Karte und tippt dann den Knopf.
- Das Mini-Profil auf der Kachel (#1660 und früher) ist in der App unverändert da.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wird nicht gelockert: dieselben Prüfungen, nur ein Warteschritt davor.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts sichtbar ist.

## Prüfschritte
1. Nichts zu prüfen in der App. In der Prüfung des PR ist `hoehenprofil.spec.js` auf Handy und Computer grün.
