# Test PF16 (Backup-Rundlauf) kennt das «Zuletzt geöffnet» der Quick Links

Auftrag: Koordinator (Thread «Merge-Stau abbauen und Tests stabilisieren»), Handy-Test PF16 rot auf main. Nichts Sichtbares in der App.

## Was ist neu
- `tests/e2e/pf.spec.js`: Der Backup-Vergleich lässt die Einstellung `quickLinks.used.*` weg, wie schon den Tipps-Speicher `tips`.
- Ursache: Seit #481 («zuletzt geöffnet») merken sich die Quick Links jede geöffnete Seite. PF16 öffnet nach der Momentaufnahme «Daten und Backup», also kam dort ein Eintrag dazu und «settings» war nicht mehr gleich. Nicht #483, sondern #481.
- Die App ist in Ordnung: Das Besuchsprotokoll ist kein Datensatz, der nach dem Backup identisch zurückkommen muss.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Test wird nicht gelockert, sondern nur das Besuchsprotokoll ausgenommen. Alle anderen Tabellen und Einstellungen werden weiter exakt verglichen.
- pinmarks.spec.js (f.autosync) läuft lokal auf main grün (3 von 3 Handy-Fälle). Der rote CI-Lauf war ein Wackler, keine Änderung nötig.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Tests stabilisieren: PF16 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App prüfen. Der Handy-Test PF16 ist danach grün.
