# Test-Uhr bleibt zwischen Testdateien auf dem Testtag

Auftrag: Koordinator (dringend), Thread «Merge-Stau abbauen und Tests stabilisieren»

## Was ist neu
- `tests/e2e/clock.js`: Nach jedem Test geht die Uhr zurück auf den Testtag (Mittwoch Mitte Monat), nicht mehr auf 0 (echte Zeit).
- Grund: Eine Testdatei baut Daten oben im File («morgen», «gestern»), wenn sie geladen wird. Das geschieht im selben Prozess nach dem letzten Test der Datei davor. Dort stand die Uhr auf 0, die Seite aber auf dem Testtag. Folge: Tour «morgen» lag für die Seite in der Vergangenheit (inspektion), Wetter-Kacheln fehlten (heute-einzeln). Teil 2 war dadurch bei fast allen PRs rot.

- `shiftContext(context)` in `clock.js`: Specs, die in `beforeAll` einen eigenen Browser-Kontext öffnen (impeccable-touren, impeccable2-touren, Gesamttest-Seiten), bekamen die feste Uhr nicht, ihre Daten waren aber für den Testtag gebaut. `prepare()` in `gesamttest/lib.js` ruft sie jetzt auf.

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts sichtbar)

## Selbst entschieden
- Mit `E2E_REAL_CLOCK=1` bleibt die echte Zeit.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Nachbesserung zu 1a (festes Datum).

## Prüfschritte
Nichts Sichtbar. CI Teil 2 muss grün werden.
